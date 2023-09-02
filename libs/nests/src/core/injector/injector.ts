import { Reflect } from "../../../deps.ts";
import {
	OPTIONAL_DEPS_METADATA,
	OPTIONAL_PROPERTY_DEPS_METADATA,
	PARAMTYPES_METADATA,
	PROPERTY_DEPS_METADATA,
	SELF_DECLARED_DEPS_METADATA,
} from "../../domain/constants.ts";
import { Controller, Injectable, InjectionToken } from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { clc } from "../../utils/color.ts";
import { isFunction, isNil, isObject, isString, isSymbol, isUndefined } from "../../utils/data.ts";
import { UnknownDependenciesException } from "../../utils/errors.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppModule } from "./app-module.ts";
import { AppContainer } from "./container.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";
import { SettlementSignal } from "./settlement-signal.ts";

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

type SelfParameters = { index: number; param: any };

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
			throw new Error(`Provider[${token.toString()}] not found`);
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

	public async loadInstance<T>(
		wrapper: ProviderWrapper<T>,
		collection: Map<InjectionToken, ProviderWrapper>,
		moduleRef: AppModule,
		inquirer?: ProviderWrapper,
	) {
		if (wrapper.isPending) {
			const settlementSignal = wrapper.settlementSignal;
			if (inquirer && settlementSignal?.isCycle(inquirer.id)) {
				throw new Error(`"CircularDependencyException - ${wrapper.name}"`);
			}

			return wrapper.donePromise!.then((err?: unknown) => {
				if (err) {
					throw err;
				}
			});
		}

		const settlementSignal = this.applySettlementSignal(wrapper, wrapper);
		const token = wrapper.token || wrapper.name;

		const targetWrapper = collection.get(token!);
		if (isUndefined(targetWrapper)) {
			throw new Error(
				`Runtime exception while loading instance ${wrapper.name}`,
			);
		}
		if (targetWrapper.isResolved) {
			return settlementSignal.complete();
		}
		try {
			const t0 = this.getNowTimestamp();
			const callback = async (instances: unknown[]) => {
				const properties = await this.resolveProperties(
					wrapper,
					moduleRef,
					wrapper,
					inquirer,
				);
				const instance = this.instantiateClass(
					instances,
					wrapper,
					targetWrapper,
				);
				this.applyProperties(instance, properties);
				wrapper.initTime = this.getNowTimestamp() - t0;
				settlementSignal.complete();
			};
			await this.resolveConstructorParams<T>(
				wrapper,
				moduleRef,
				callback,
				wrapper,
				inquirer,
			);
		} catch (err) {
			settlementSignal.error(err);
			throw err;
		}
	}

	public async loadInjectable<T = any>(
		wrapper: ProviderWrapper<T>,
		moduleRef: AppModule,
		inquirer?: ProviderWrapper,
	) {
		const injectables = this.container.getInjectables();
		await this.loadInstance<T>(
			wrapper,
			injectables,
			moduleRef,
			inquirer,
		);
	}

	public async loadProvider(
		wrapper: ProviderWrapper<Injectable>,
		moduleRef: AppModule,
		inquirer?: ProviderWrapper,
	) {
		const providers = this.container.getProviders();
		await this.loadInstance(
			wrapper,
			providers,
			moduleRef,
			inquirer,
		);
	}

	public async loadController(
		wrapper: ProviderWrapper<Controller>,
		moduleRef: AppModule,
	) {
		const controllers = this.container.getControllers();
		await this.loadInstance<Controller>(
			wrapper,
			controllers,
			moduleRef,
			wrapper,
		);
	}

	public applySettlementSignal<T>(
		instancePerContext: ProviderWrapper<T>,
		host: ProviderWrapper<T>,
	) {
		const settlementSignal = new SettlementSignal();
		instancePerContext.donePromise = settlementSignal.asPromise();
		instancePerContext.isPending = true;
		host.settlementSignal = settlementSignal;

		return settlementSignal;
	}

	public async resolveConstructorParams<T>(
		wrapper: ProviderWrapper<T>,
		moduleRef: AppModule,
		callback: (args: unknown[]) => void,
		inquirer?: ProviderWrapper,
		parentInquirer?: ProviderWrapper,
	) {
		const [dependencies, optionalDependenciesIds] = this.getClassDependencies(wrapper);

		let isResolved = true;
		const resolveParam = async (param: unknown, index: number) => {
			try {
				if (this.isInquirer(param, parentInquirer)) {
					return parentInquirer && parentInquirer.instance;
				}
				const paramWrapper = await this.resolveSingleParam<T>(
					wrapper,
					param,
					{ index, dependencies },
					moduleRef,
					index,
					inquirer,
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
		const instances = await Promise.all(dependencies.map(resolveParam));
		isResolved && (await callback(instances));
	}

	public getClassDependencies<T>(
		wrapper: ProviderWrapper<T>,
	): [InjectorDependency[], number[]] {
		const ctorRef = wrapper.metatype as Type<any>;
		return [
			this.reflectConstructorParams(ctorRef),
			this.reflectOptionalParams(ctorRef),
		];
	}

	public reflectConstructorParams<T>(type: Type<T>): any[] {
		const paramTypes = [
			...(Reflect.getMetadata(PARAMTYPES_METADATA, type) || []),
		];
		const selfParams = this.reflectSelfParams<T>(type);

		selfParams.forEach(({ index, param }) => (paramTypes[index] = param));
		return paramTypes;
	}

	public reflectOptionalParams<T>(type: Type<T>): any[] {
		return Reflect.getMetadata(OPTIONAL_DEPS_METADATA, type) || [];
	}

	public reflectSelfParams<T>(type: Type<T>): SelfParameters[] {
		return Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, type) || [];
	}

	public async resolveSingleParam<T>(
		wrapper: ProviderWrapper<T>,
		param: Type<any> | string | symbol | any,
		dependencyContext: InjectorDependencyContext,
		moduleRef: AppModule,
		keyOrIndex: symbol | string | number,
		inquirer?: ProviderWrapper,
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
			inquirer,
		);
	}

	public resolveParamToken<T>(
		wrapper: ProviderWrapper<T>,
		param: Type<any> | string | symbol | any,
	) {
		return param;
	}

	public async resolveComponentInstance<T>(
		moduleRef: AppModule,
		token: InjectionToken,
		dependencyContext: InjectorDependencyContext,
		wrapper: ProviderWrapper<T>,
		keyOrIndex: symbol | string | number,
		inquirer?: ProviderWrapper,
	): Promise<ProviderWrapper> {
		this.printResolvingDependenciesLog(token, inquirer);
		this.printLookingForProviderLog(token, moduleRef);
		const providers = this.container.getProviders();
		const instanceWrapper = await this.lookupComponent(
			providers,
			moduleRef,
			{ ...dependencyContext, name: token },
			wrapper,
			keyOrIndex,
			inquirer,
		);

		return this.resolveComponentHost(
			moduleRef,
			instanceWrapper,
			inquirer,
		);
	}

	public async resolveComponentHost<T>(
		moduleRef: AppModule,
		instanceWrapper: ProviderWrapper<T>,
		inquirer?: ProviderWrapper,
	): Promise<ProviderWrapper> {
		if (!instanceWrapper.isResolved) {
			await this.loadProvider(
				instanceWrapper,
				moduleRef,
				inquirer,
			);
		}

		return instanceWrapper;
	}

	public async lookupComponent<T = any>(
		providers: Map<Function | string | symbol, ProviderWrapper>,
		moduleRef: AppModule,
		dependencyContext: InjectorDependencyContext,
		wrapper: ProviderWrapper<T>,
		keyOrIndex: symbol | string | number,
		inquirer?: ProviderWrapper,
	): Promise<ProviderWrapper<T>> {
		const token = wrapper.token || wrapper.name;
		const { name } = dependencyContext;
		if (wrapper && token === name) {
			throw new UnknownDependenciesException(
				wrapper.name,
			);
		}
		if (!name) {
			throw new UnknownDependenciesException(
				"Dependency context must have a name",
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

	public async resolveProperties<T>(
		wrapper: ProviderWrapper<T>,
		moduleRef: AppModule,
		inquirer?: ProviderWrapper,
		parentInquirer?: ProviderWrapper,
	): Promise<PropertyDependency[]> {
		const properties = this.reflectProperties(
			wrapper.metatype as Type<any>,
		);
		const instances = await Promise.all(
			properties.map(async (item: PropertyDependency) => {
				try {
					const dependencyContext = {
						key: item.key,
						name: item.name,
					};
					if (this.isInquirer(item.name, parentInquirer)) {
						return parentInquirer && parentInquirer.instance;
					}
					const paramWrapper = await this.resolveSingleParam<T>(
						wrapper,
						item.name,
						dependencyContext,
						moduleRef,
						item.key,
						inquirer,
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
			}),
		);
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
	): Promise<T> {
		const { metatype, name } = wrapper;
		this.logger.debug(`instantiating ${clc.yellow(name!.toString())}`);

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
		}${clc.magentaBright(" in the ")}${clc.yellow(dependentName)}${
			clc.magentaBright(
				` provider ${isAlias ? "(alias)" : ""}`,
			)
		}`;

		this.logger.debug(messageToPrint);
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
		this.logger.debug(clc.magentaBright(
			`Looking for ${clc.cyanBright(tokenName)} ${clc.magentaBright("in")} ${
				clc.yellow(moduleRefName)
			}`,
		));
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

		this.logger.debug(clc.magentaBright(
			`Found ${clc.cyanBright(tokenName)} ${clc.magentaBright("in")} ${
				clc.yellow(moduleRefName)
			}`,
		));
	}

	private isDebugMode(): boolean {
		return debug || !!Deno.env.get("DEBUG");
	}

	private getNowTimestamp() {
		return performance.now();
	}

	private isInquirer(
		param: unknown,
		parentInquirer: ProviderWrapper | undefined,
	) {
		return param === "INQUIRER" && parentInquirer;
	}
}
