import { Reflect } from "../../../deps.ts";
import { MODULE_METADATA } from "../../domain/constants.ts";
import { Injectable, Provider } from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { isNil } from "../../utils/data.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppContainer } from "./container.ts";

// https://github.com/nestjs/nest/blob/master/packages/core/scanner.ts#L74
export class Scanner {
	private logger = new Logger(Scanner.name);

	constructor(
		private readonly container: AppContainer,
	) {
	}

	scan(entryModule: Type<any>) {
		this.scanModuleForDependencies(entryModule);
	}

	private scanModuleForDependencies(module: Type<any>) {
		this.logger.debug(`Scanning module ${module.name}`);
		this.reflectProviders(module);

	}

	private reflectProviders(module: Type<any>) {
		const providers = [
			...this.reflectMetadata(MODULE_METADATA.PROVIDERS, module),
		];
		providers.forEach((provider) => {
			this.logger.debug(`discovered provider ${provider.name}`);
			this.insertProvider(provider);
            this.reflectDynamicMetadata(provider);
        });
	}

    public reflectDynamicMetadata(cls: Type<Injectable>, token: string) {
        if (!cls || !cls.prototype) {
            return;
        }
        this.reflectParamInjectables(cls, token, ROUTE_ARGS_METADATA);
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
                    pipes: Array<Type<PipeTransform> | PipeTransform>;
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
                        injectable,
                        token,
                        component,
                        'pipe',
                        methodKey,
                    ),
                );
        });
    }

    public isCustomProvider(
        provider: Provider,
    ): provider is
        | ClassProvider
        | ValueProvider
        | FactoryProvider
        | ExistingProvider {
        return provider && !isNil((provider as any).provide);
    }

	private insertProvider(provider: Type<Provider>) {
        this.container.getAppModule().addProvider(provider);
	}

	private reflectMetadata<T = any>(
		metadataKey: string,
		target: Type<any>,
	): T[] {
		return Reflect.getMetadata(metadataKey, target) || [];
	}
}
