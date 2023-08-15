import { Reflect } from "../../../deps.ts";
import {
    OPTIONAL_DEPS_METADATA,
    OPTIONAL_PROPERTY_DEPS_METADATA,
    PARAMTYPES_METADATA,
    PROPERTY_DEPS_METADATA,
    SELF_DECLARED_DEPS_METADATA,
} from "../../domain/constants.ts";
import { Injectable, InjectionToken } from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { clc } from "../../utils/color.ts";
import { isFunction, isNil, isObject, isString, isSymbol, isUndefined } from "../../utils/data.ts";
import { UnknownDependenciesException } from "../../utils/errors.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppModule } from "./app-module.ts";
import { AppContainer } from "./container.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";

const debug = true;
/**
 * The type of an injectable dependency
 */
export type InjectorDependency = InjectionToken;

/**
 * The property-based dependency
 */
export interface PropertyDependency {
    key: symbol | string;
    name: InjectorDependency;
    isOptional?: boolean;
    instance?: any;
}

/**
 * Context of a dependency which gets injected by the injector
 */
export interface InjectorDependencyContext {
    /**
     * The name of the property key (property-based injection)
     */
    key?: string | symbol;
    /**
     * The function itself, the name of the function, or injection token.
     */
    name?: Function | string | symbol;
    /**
     * The index of the dependency which gets injected
     * from the dependencies array
     */
    index?: number;
    /**
     * The dependency array which gets injected
     */
    dependencies?: InjectorDependency[];
}

type SelfParameters = { index: number, param: any };

export class Injector {
    private logger = new Logger("Injector");

    constructor(private readonly container: AppContainer) {
    }

    public loadPrototype<T>(
        { token }: ProviderWrapper<T>,
        collection: Map<InjectionToken, ProviderWrapper>,
    ) {
        if (!collection) {
            return;
        }
        const target = collection.get(token);
        if (!target) {
            throw new Error(`Provider[${ token.toString() }] not found`);
        }
        const instance = target.createPrototype();
        if (instance) {
            const wrapper = new ProviderWrapper({
                ...target,
                instance,
            });
            collection.set(token, wrapper);
        }
    }

    public loadInstance<T>(
        wrapper: ProviderWrapper<T>,
        collection: Map<InjectionToken, ProviderWrapper>,
        moduleRef: AppModule,
    ) {
        const token = wrapper.token || wrapper.name;
        const targetWrapper = collection.get(token!);
        if (isUndefined(targetWrapper)) {
            throw new Error(
                `Runtime exception while loading instance ${ wrapper.name }`,
            );
        }
        if (targetWrapper.isResolved) {
            return;
        }
        const t0 = this.getNowTimestamp();
        const callback = (instances: unknown[]) => {
            const properties = this.resolveProperties(
                wrapper,
                moduleRef,
            );
            const instance = this.instantiateClass(
                instances,
                wrapper,
                targetWrapper,
            );
            this.applyProperties(instance, properties);
            wrapper.initTime = this.getNowTimestamp() - t0;
        };
        this.resolveConstructorParams<T>(
            wrapper,
            moduleRef,
            callback,
        );
    }

    public loadInjectable<T = any>(
        wrapper: ProviderWrapper<T>,
        moduleRef: AppModule,
    ) {
        const injectables = this.container.getInjectables();
        this.loadInstance(
            wrapper,
            injectables,
            moduleRef,
        );
    }

    public loadProvider(
        wrapper: ProviderWrapper<Injectable>,
        moduleRef: AppModule,
    ) {
        const providers = this.container.getProviders();
        this.loadInstance(
            wrapper,
            providers,
            moduleRef,
        );
    }

    public resolveConstructorParams<T>(
        wrapper: ProviderWrapper<T>,
        moduleRef: AppModule,
        callback: (args: unknown[]) => void,
    ) {
        const [ dependencies, optionalDependenciesIds ] = this.getClassDependencies(wrapper);

        let isResolved = true;
        const resolveParam = (param: unknown, index: number) => {
            try {
                const paramWrapper = this.resolveSingleParam<T>(
                    wrapper,
                    param,
                    { index, dependencies },
                    moduleRef,
                    index,
                );

                if (!paramWrapper.isResolved) {
                    isResolved = false;
                }
                return paramWrapper?.instance;
            } catch (err) {
                const isOptional = optionalDependenciesIds.includes(index);
                if (!isOptional) {
                    throw err;
                }
                return undefined;
            }
        };
        const instances = dependencies.map(resolveParam);
        isResolved && (callback(instances));
    }

    public getClassDependencies<T>(
        wrapper: ProviderWrapper<T>,
    ): [ InjectorDependency[], number[] ] {
        const ctorRef = wrapper.metatype as Type<any>;
        return [
            this.reflectConstructorParams(ctorRef),
            this.reflectOptionalParams(ctorRef),
        ];
    }

    public reflectConstructorParams<T>(type: Type<T>): any[] {
        const paramtypes = [
            ...(Reflect.getMetadata(PARAMTYPES_METADATA, type) || []),
        ];
        const selfParams = this.reflectSelfParams<T>(type);

        selfParams.forEach(({ index, param }) => (paramtypes[index] = param));
        return paramtypes;
    }

    public reflectOptionalParams<T>(type: Type<T>): any[] {
        return Reflect.getMetadata(OPTIONAL_DEPS_METADATA, type) || [];
    }

    public reflectSelfParams<T>(type: Type<T>): SelfParameters[] {
        return Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, type) || [];
    }

    public resolveSingleParam<T>(
        wrapper: ProviderWrapper<T>,
        param: Type<any> | string | symbol | any,
        dependencyContext: InjectorDependencyContext,
        moduleRef: AppModule,
        keyOrIndex: symbol | string | number,
    ) {
        if (isUndefined(param)) {
            this.logger.log(
                "NesTs encountered an undefined dependency. This may be due to a circular import or a missing dependency declaration.",
            );
            throw new UnknownDependenciesException(wrapper.name);
        }
        const token = this.resolveParamToken(wrapper, param);
        return this.resolveComponentInstance<T>(
            moduleRef,
            token,
            dependencyContext,
            wrapper,
            keyOrIndex,
        );
    }

    public resolveParamToken<T>(
        wrapper: ProviderWrapper<T>,
        param: Type<any> | string | symbol | any,
    ) {
        return param;
    }

    public resolveComponentInstance<T>(
        moduleRef: AppModule,
        token: InjectionToken,
        dependencyContext: InjectorDependencyContext,
        wrapper: ProviderWrapper<T>,
        keyOrIndex: symbol | string | number,
    ): ProviderWrapper {
        this.printResolvingDependenciesLog(token);
        this.printLookingForProviderLog(token, moduleRef);
        const providers = this.container.getProviders();
        const instanceWrapper = this.lookupComponent(
            providers,
            moduleRef,
            { ...dependencyContext, name: token },
            wrapper,
            keyOrIndex,
        );

        return this.resolveComponentHost(
            moduleRef,
            instanceWrapper,
        );
    }

    public resolveComponentHost<T>(
        moduleRef: AppModule,
        instanceWrapper: ProviderWrapper<T>,
    ): ProviderWrapper {
        if (!instanceWrapper.isResolved) {
            this.loadProvider(
                instanceWrapper,
                moduleRef,
            );
        }

        return instanceWrapper;
    }

    public lookupComponent<T = any>(
        providers: Map<Function | string | symbol, ProviderWrapper>,
        moduleRef: AppModule,
        dependencyContext: InjectorDependencyContext,
        wrapper: ProviderWrapper<T>,
        keyOrIndex: symbol | string | number,
    ): ProviderWrapper<T> {
        const token = wrapper.token || wrapper.name;
        const { name } = dependencyContext;
        if (wrapper && token === name) {
            throw new UnknownDependenciesException(
                wrapper.name,
            );
        }
        if (!name) {
            throw new UnknownDependenciesException(
                'Dependency context must have a name'
            );
        }
        if (providers.has(name)) {
            const instanceWrapper = providers.get(name)!;
            this.printFoundInModuleLog(name, moduleRef);
            this.addDependencyMetadata(keyOrIndex, wrapper, instanceWrapper);
            return instanceWrapper;
        }
        throw new UnknownDependenciesException(
            wrapper.name,
        );
    }

    public resolveProperties<T>(
        wrapper: ProviderWrapper<T>,
        moduleRef: AppModule,
    ): PropertyDependency[] {
        const properties = this.reflectProperties(
            wrapper.metatype as Type<any>,
        );
        const instances = properties.map((item: PropertyDependency) => {
            try {
                const dependencyContext = {
                    key: item.key,
                    name: item.name,
                };
                const paramWrapper = this.resolveSingleParam<T>(
                    wrapper,
                    item.name,
                    dependencyContext,
                    moduleRef,
                    item.key,
                );
                if (!paramWrapper) {
                    return undefined;
                }
                return paramWrapper.instance;
            } catch (err) {
                if (!item.isOptional) {
                    throw err;
                }
                return undefined;
            }
        });
        return properties.map((item: PropertyDependency, index: number) => ({
            ...item,
            instance: instances[index],
        }));
    }

    public reflectProperties<T>(type: Type<T>): PropertyDependency[] {
        const properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, type) ||
            [];
        const optionalKeys: string[] = Reflect.getMetadata(OPTIONAL_PROPERTY_DEPS_METADATA, type) ||
            [];

        return properties.map((item: any) => ({
            ...item,
            name: item.type,
            isOptional: optionalKeys.includes(item.key),
        }));
    }

    public applyProperties<T = any>(
        instance: T,
        properties: PropertyDependency[],
    ): void {
        if (!isObject(instance)) {
            return undefined;
        }

        // de-optimized from the prev used "iterare" npm package
        properties
            .filter((prop) => !isNil(prop.instance))
            .forEach((prop) => ((instance as any)[prop.key] = prop.instance));
    }

    public instantiateClass<T = any>(
        instances: any[],
        wrapper: ProviderWrapper,
        targetMetatype: ProviderWrapper,
    ): T {
        const { metatype, name } = wrapper;
        this.logger.debug(`instantiating ${ name!.toString() }`);

        targetMetatype.instance = new (metatype as Type<any>)(...instances);
        targetMetatype.isResolved = true;
        return targetMetatype.instance;
    }

    protected addDependencyMetadata(
        keyOrIndex: symbol | string | number,
        hostWrapper: ProviderWrapper,
        instanceWrapper: ProviderWrapper,
    ) {
        if (isSymbol(keyOrIndex) || isString(keyOrIndex)) {
            hostWrapper.addPropertiesMetadata(keyOrIndex, instanceWrapper);
        } else {
            hostWrapper.addCtorMetadata(keyOrIndex, instanceWrapper);
        }
    }

    private getTokenName(token: InjectionToken): string {
        return isFunction(token) ? (token as Function).name : token.toString();
    }

    private printResolvingDependenciesLog(
        token: InjectionToken,
        inquirer?: ProviderWrapper,
    ): void {
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const dependentName = (inquirer?.name && inquirer.name.toString?.()) ??
            "unknown";
        const isAlias = dependentName === tokenName;

        const messageToPrint = `Resolving dependency ${
            clc.cyanBright(
                tokenName,
            )
        }${ clc.green(" in the ") }${ clc.yellow(dependentName) }${
            clc.green(
                ` provider ${ isAlias ? "(alias)" : "" }`,
            )
        }`;

        this.logger.log(messageToPrint);
    }

    private printLookingForProviderLog(
        token: InjectionToken,
        moduleRef: AppModule,
    ): void {
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const moduleRefName = moduleRef?.name ?? "unknown";
        this.logger.log(
            `Looking for ${ clc.cyanBright(tokenName) }${
                clc.green(
                    " in ",
                )
            }${ clc.magentaBright(moduleRefName) }`,
        );
    }

    private printFoundInModuleLog(
        token: InjectionToken,
        moduleRef: AppModule,
    ): void {
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const moduleRefName = moduleRef?.name ?? "unknown";
        this.logger.log(
            `Found ${ clc.cyanBright(tokenName) }${
                clc.green(
                    " in ",
                )
            }${ clc.magentaBright(moduleRefName) }`,
        );
    }

    private isDebugMode(): boolean {
        return debug || !!Deno.env.get("DEBUG");
    }

    private getNowTimestamp() {
        return performance.now();
    }
}
