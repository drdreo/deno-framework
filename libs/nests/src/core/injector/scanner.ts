import { Reflect } from "../../../deps.ts";
import { MODULE_METADATA, ROUTE_ARGS_METADATA } from "../../domain/constants.ts";
import { Injectable, Provider } from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { isFunction } from "../../utils/data.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppContainer } from "./container.ts";
import { MetadataScanner } from "./metadata-scanner.ts";

// https://github.com/nestjs/nest/blob/master/packages/core/scanner.ts#L74
export class DependenciesScanner {
	private logger = new Logger(DependenciesScanner.name);

	constructor(
		private readonly container: AppContainer,
        private readonly metadataScanner: MetadataScanner,
    ) {
	}

    scan(entryModule: Type<any>) {
		this.scanModuleForDependencies(entryModule);
	}

	private scanModuleForDependencies(module: Type<any>) {
		this.logger.debug(`Scanning module ${module.name}`);
		this.reflectProviders(module);
	}

    public reflectParamInjectables(
        component: Type<Injectable>,
        token: string,
        metadataKey: string,
    ) {
        const paramsMethods = this.metadataScanner.getAllMethodNames(
            component.prototype,
        );

        paramsMethods.forEach(methodKey => {
            const metadata: Record<
                string,
                {
                    index: number;
                    data: unknown;
                    pipes: Array<Type<any>>;
                }
            > = Reflect.getMetadata(metadataKey, component, methodKey);

            if (!metadata) {
                return;
            }

            const params = Object.values(metadata);
            params
                .map(item => item.pipes)
                .flat(1)
                .forEach(injectable =>
                    this.insertInjectable(
                        injectable
                    ),
                );
        });
    }

    public reflectDynamicMetadata(cls: Type<Injectable>, token: string) {
        if (!cls || !cls.prototype) {
            return;
        }

        this.reflectParamInjectables(cls, token, ROUTE_ARGS_METADATA);
    }

	private reflectProviders(module: Type<any>) {
		const providers = [
			...this.reflectMetadata(MODULE_METADATA.PROVIDERS, module),
		];
		providers.forEach((provider) => {
			this.logger.debug(`discovered provider ${provider.name ?? provider.provide}`);
			this.insertProvider(provider);
            this.reflectDynamicMetadata(provider, provider);
        });
	}

	private insertProvider(provider: Type<Provider>) {
        this.container.getAppModule().addProvider(provider);
	}

    private insertInjectable(injectable: Type<Injectable>) {
        if (!isFunction(injectable)) {
            throw new Error("Injectable is not a function");
        }
        this.container.getAppModule().addInjectable(injectable);
    }

	private reflectMetadata<T = any>(
		metadataKey: string,
		target: Type<any>,
	): T[] {
		return Reflect.getMetadata(metadataKey, target) || [];
	}
}
