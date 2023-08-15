import { Injectable, InjectionToken } from "../../domain/provider.ts";
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

    public createInstancesOfDependencies() {
        const module = this.container.getAppModule();
        this.createPrototypes();

        try {
            this.createInstances(module);
        } catch (err) {
            throw err;
        }
    }

    private createPrototypes() {
        const providers = this.container.getProviders();
        this.createPrototypesOfProviders(providers);
        const injectables = this.container.getInjectables();
        this.createPrototypesOfInjectables(injectables);
        // this.createPrototypesOfControllers(moduleRef);
    }

    private createInstances(module: AppModule) {
        const providers = this.container.getProviders();
        this.createInstancesOfProviders(providers, module);
        const injectables = this.container.getInjectables();
        this.createInstancesOfInjectables(injectables);
        // await this.createInstancesOfControllers(moduleRef);

        const { name } = module;
        this.isModuleWhitelisted(name) &&
        this.logger.log(`${ name } dependencies initialized`);
    }

    private createPrototypesOfProviders(
        providers: Map<InjectionToken, ProviderWrapper>,
    ) {
        providers.forEach((wrapper) => this.injector.loadPrototype<Injectable>(wrapper, providers));
    }

    private createInstancesOfProviders(
        providers: Map<InjectionToken, ProviderWrapper>,
        moduleRef: AppModule,
    ) {
        providers.forEach((provider) => {
            this.injector.loadProvider(provider, moduleRef);
        });
    }

    private createPrototypesOfInjectables(injectables: Map<InjectionToken, ProviderWrapper>) {
        injectables.forEach(wrapper =>
            this.injector.loadPrototype(wrapper, injectables),
        );
    }

    private createInstancesOfInjectables(injectables: Map<InjectionToken, ProviderWrapper>, moduleRef: AppModule) {
        injectables.forEach(injectable => {
            this.injector.loadInjectable(injectable, moduleRef);
        });
    }

    // private createPrototypesOfControllers(moduleRef: Module) {
    //     const { controllers } = moduleRef;
    //     controllers.forEach(wrapper =>
    //         this.injector.loadPrototype<Controller>(wrapper, controllers),
    //     );
    // }
    //
    // private async createInstancesOfControllers(moduleRef: Module) {
    //     const { controllers } = moduleRef;
    //     const wrappers = [ ...controllers.values() ];
    //     await Promise.all(
    //         wrappers.map(async item => {
    //             await this.injector.loadController(item, moduleRef);
    //         }),
    //     );
    // }


    private isModuleWhitelisted(name: string): boolean {
        return name !== AppModule.name;
    }
}
