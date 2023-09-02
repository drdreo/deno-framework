import { Controller, Injectable, InjectionToken } from "../../domain/provider.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppModule } from "./app-module.ts";
import { AppContainer } from "./container.ts";
import { Injector } from "./injector.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";

export class InstanceLoader {
	private logger = new Logger(InstanceLoader.name);

	constructor(
		protected readonly container: AppContainer,
		protected readonly injector: Injector,
	) {
	}

	public async createInstancesOfDependencies() {
		const module = this.container.getAppModule();
		this.createPrototypes();

		try {
			await this.createInstances(module);
		} catch (err) {
			throw err;
		}
	}

	private createPrototypes() {
		const providers = this.container.getProviders();
		this.createPrototypesOfProviders(providers);
		const injectables = this.container.getInjectables();
		this.createPrototypesOfInjectables(injectables);
		const controllers = this.container.getControllers();
		this.createPrototypesOfControllers(controllers);
	}

	private async createInstances(module: AppModule) {
		const providers = this.container.getProviders();
		await this.createInstancesOfProviders(providers, module);

		const injectables = this.container.getInjectables();
		await this.createInstancesOfInjectables(injectables, module);

		const controllers = this.container.getControllers();
		await this.createInstancesOfControllers(controllers, module);

		const { name } = module;
		this.isModuleWhitelisted(name) &&
			this.logger.log(`${name} dependencies initialized`);
	}

	private createPrototypesOfProviders(
		providers: Map<InjectionToken, ProviderWrapper>,
	) {
		providers.forEach((wrapper) => this.injector.loadPrototype<Injectable>(wrapper, providers));
	}

	private async createInstancesOfProviders(
		providers: Map<InjectionToken, ProviderWrapper>,
		moduleRef: AppModule,
	) {
		const wrappers = [...providers.values()];

		await Promise.all(
			wrappers.map(async (item) => {
				await this.injector.loadProvider(item, moduleRef);
			}),
		);
	}

	private createPrototypesOfInjectables(injectables: Map<InjectionToken, ProviderWrapper>) {
		injectables.forEach((wrapper) => this.injector.loadPrototype(wrapper, injectables));
	}

	private async createInstancesOfInjectables(
		injectables: Map<InjectionToken, ProviderWrapper>,
		moduleRef: AppModule,
	) {
		const wrappers = [...injectables.values()];
		await Promise.all(
			wrappers.map(async (item) => {
				await this.injector.loadInjectable(item, moduleRef);
			}),
		);
	}

	private createPrototypesOfControllers(controllers: Map<InjectionToken, ProviderWrapper>) {
		controllers.forEach((wrapper) =>
			this.injector.loadPrototype<Controller>(wrapper, controllers)
		);
	}

	private async createInstancesOfControllers(
		controllers: Map<InjectionToken, ProviderWrapper>,
		moduleRef: AppModule,
	) {
		const wrappers = [...controllers.values()];
		await Promise.all(
			wrappers.map(async (item) => {
				await this.injector.loadController(item, moduleRef);
			}),
		);
	}

	private isModuleWhitelisted(name: string): boolean {
		return name !== AppModule.name;
	}
}
