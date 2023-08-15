import {
	ClassProvider,
	Injectable,
	InjectionToken,
	Provider,
	ValueProvider,
} from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { isNil, isObject, isUndefined } from "../../utils/data.ts";
import { UuidFactory } from "../../utils/uuid-factory.ts";
import { AppContainer } from "./container.ts";
import { InstanceWrapper } from "./instance-wrapper.ts";

// https://github.com/nestjs/nest/blob/master/packages/core/injector/module.ts

export class AppModule {
	private readonly id: string;
	private token?: string;

	private providers = new Map<
		InjectionToken,
		InstanceWrapper<Injectable>
	>();
	private injectables = new Map<
		InjectionToken,
		InstanceWrapper<Injectable>
	>();
	// private middlewares = new Map<
	//     InjectionToken,
	//     InstanceWrapper<Injectable>
	// >();
	// private controllers = new Map<
	//     InjectionToken,
	//     InstanceWrapper<Controller>
	// >();

	get name() {
		return this.metatype.name;
	}

	constructor(
		private readonly metatype: Type<any>,
		private readonly container: AppContainer,
	) {
		// this.addCoreProviders();
		this.id = this.generateUuid();
	}

	public addInjectable<T extends Injectable>(
		injectable: Provider,
		host?: Type<T>,
	) {
		if (this.isCustomProvider(injectable)) {
			return this.addCustomProvider(injectable);
		}
		let instanceWrapper = this.injectables.get(injectable);
		if (!instanceWrapper) {
			instanceWrapper = new InstanceWrapper({
				token: injectable,
				name: injectable.name,
				metatype: injectable,
				instance: null,
				isResolved: false,
				// host: this,
			});
			this.injectables.set(injectable, instanceWrapper);
		}
		// if (host) {
		//     const hostWrapper = this.controllers.get(host) ||
		//         this.providers.get(host);
		//     hostWrapper && hostWrapper.addEnhancerMetadata(instanceWrapper);
		// }
		return instanceWrapper;
	}

	public addProvider(provider: Provider): Provider | InjectionToken {
		if (this.isCustomProvider(provider)) {
			return this.addCustomProvider(provider);
		}

		this.providers.set(
			provider,
			new InstanceWrapper({
				token: provider,
				name: (provider as Type<Injectable>).name,
				metatype: provider as Type<Injectable>,
				instance: null,
				isResolved: false,
			}),
		);

		return provider as Type<Injectable>;
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
		if (this.isCustomClass(provider)) {
			this.addCustomClass(provider);
		} else if (this.isCustomValue(provider)) {
			this.addCustomValue(provider);
		}
		return provider.provide;
	}

	public isCustomClass(provider: any): provider is ClassProvider {
		return !isUndefined((provider as ClassProvider).useClass);
	}

	public isCustomValue(provider: any): provider is ValueProvider {
		return (
			isObject(provider) &&
			Object.prototype.hasOwnProperty.call(provider, "useValue")
		);
	}

	public addCustomClass(provider: ClassProvider) {
		const { useClass } = provider;

		const token = provider.provide;
		this.providers.set(
			token,
			new InstanceWrapper({
				token,
				name: useClass?.name,
				metatype: useClass,
				instance: null,
				isResolved: false,
				// host: this,
			}),
		);
	}

	public addCustomValue(provider: ValueProvider) {
		const { useValue: value, provide: providerToken } = provider;
		this.providers.set(
			providerToken,
			new InstanceWrapper({
				token: providerToken,
				name: (providerToken as Function)?.name ||
					providerToken.toString(),
				metatype: undefined,
				instance: value,
				isResolved: true,
				// host: this,
			}),
		);
	}

	private generateUuid(): string {
		const prefix = "M_";
		const key = this.name?.toString() ?? this.token?.toString();
		return UuidFactory.get(`${prefix}_${key}`);
	}
}
