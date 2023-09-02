import {
	ClassProvider,
	Controller,
	Injectable,
	Provider,
	ValueProvider,
} from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { isNil } from "../../utils/data.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { UuidFactory } from "../../utils/uuid-factory.ts";
import { AppContainer } from "./container.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";
import { isCustomClass, isCustomValue } from "./provider.utils.ts";

// https://github.com/nestjs/nest/blob/master/packages/core/injector/module.ts

interface ModuleMetadata {
	providers: Provider[];
	// controllers: Type<Controller>[];
}

export class AppModule {
	private readonly id: string;
	private logger = new Logger(AppModule.name);

	constructor(private readonly container: AppContainer) {
		this.id = this.generateModuleUuid();
	}

	get name() {
		return AppModule.name;
	}

	public addProvider(provider: Provider) {
		if (this.isCustomProvider(provider)) {
			return this.addCustomProvider(provider);
		}

		this.container.addProvider(
			provider,
			new ProviderWrapper({
				token: provider,
				name: (provider as Type<Injectable>).name,
				metatype: provider as Type<Injectable>,
				instance: undefined,
				isResolved: false,
			}),
		);
	}

	public isCustomProvider(provider: Provider): provider is
		| ClassProvider
		| ValueProvider {
		return !isNil(
			(
				provider as
					| ClassProvider
					| ValueProvider
			).provide,
		);
	}

	public addCustomProvider(provider: ClassProvider | ValueProvider) {
		if (isCustomClass(provider)) {
			this.addCustomClass(provider);
		} else if (isCustomValue(provider)) {
			this.addCustomValue(provider);
		}
		return provider.provide;
	}

	public addCustomClass(provider: ClassProvider) {
		const { useClass } = provider;

		const token = provider.provide;
		this.container.addProvider(
			token,
			new ProviderWrapper({
				token,
				name: useClass.name,
				metatype: useClass,
				instance: undefined,
				isResolved: false,
			}),
		);
	}

	public addCustomValue(provider: ValueProvider) {
		const { useValue: value, provide: providerToken } = provider;
		this.container.addProvider(
			providerToken,
			new ProviderWrapper({
				token: providerToken,
				name: (providerToken as Function)?.name || providerToken.toString(),
				metatype: undefined,
				instance: value,
				isResolved: true,
			}),
		);
	}

	public addInjectable(injectable: Provider) {
		if (this.isCustomProvider(injectable)) {
			return;
		}

		this.container.addInjectable(
			injectable,
			new ProviderWrapper({
				token: injectable,
				name: (injectable as Type<Injectable>).name,
				metatype: injectable as Type<Injectable>,
				instance: undefined,
				isResolved: false,
			}),
		);
	}

	public addController(controller: Type<Controller>) {
		this.container.addController(
			controller,
			new ProviderWrapper({
				token: controller,
				name: controller.name,
				metatype: controller,
				instance: undefined,
				isResolved: false,
			}),
		);
	}

	private generateModuleUuid(): string {
		const prefix = "M_";
		const key = this.name?.toString();
		return UuidFactory.get(`${prefix}_${key}`);
	}
}
