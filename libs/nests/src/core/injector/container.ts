import { Controller, Injectable, InjectionToken } from "../../domain/provider.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppModule } from "./app-module.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";

export class AppContainer {
	private appModule?: AppModule;
	private logger = new Logger(AppContainer.name);
	private providers = new Map<
		InjectionToken,
		ProviderWrapper<Injectable>
	>();

	private injectables = new Map<
		InjectionToken,
		ProviderWrapper<Injectable>
	>();

	private readonly controllers = new Map<
		InjectionToken,
		ProviderWrapper<Controller>
	>();

	get<T>(token: InjectionToken): T {
		const provider = this.providers.get(token);
		if (!provider) {
			throw new Error(`No provider found for ${token.toString()}!`);
		}
		return provider.instance as T;
	}

	addProvider(token: InjectionToken, provider: ProviderWrapper) {
		this.providers.set(token, provider);
	}

	addInjectable(token: InjectionToken, provider: ProviderWrapper) {
		this.injectables.set(token, provider);
	}

	addController(token: InjectionToken, provider: ProviderWrapper) {
		this.controllers.set(token, provider);
	}

	reset() {
		this.logger.verbose("resetting app container");
		this.providers.clear();
		this.injectables.clear();
	}

	setAppModule(appModule: AppModule) {
		this.appModule = appModule;
	}

	getAppModule() {
		const module = this.appModule;

		if (!module) {
			throw new Error("App module not registered yet");
		}
		return module;
	}

	getProviders(): Map<InjectionToken, ProviderWrapper> {
		return this.providers;
	}

	getInjectables(): Map<InjectionToken, ProviderWrapper> {
		return this.injectables;
	}

	getControllers(): Map<InjectionToken, ProviderWrapper> {
		return this.controllers;
	}
}
