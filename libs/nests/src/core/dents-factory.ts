import { Application as HttpApplication } from "../../deps.ts";
import { isUndefined } from "../utils/data.ts";
import { Logger } from "../utils/logger/logger.service.ts";
import { DestsApplication } from "./application.ts";
import { MetadataScanner } from "./discover/metadata-scanner.ts";
import { DependenciesScanner } from "./discover/scanner.ts";
import { AppModule } from "./injector/app-module.ts";
import { AppContainer } from "./injector/container.ts";
import { Injector } from "./injector/injector.ts";
import { InstanceLoader } from "./injector/instance-loader.ts";

// https://github.com/nestjs/nest/blob/85cc3869ee2a38f57075d59ac642eddf259ab016/packages/core/nest-factory.ts#L33
export class DentsFactory {
	private static logger = new Logger("DentsFactory", {
		timestamp: true,
	});

	// TODO: type the any away
	static async create(entryModule: any, options?: any): Promise<DestsApplication> {
		if (!isUndefined(options?.logger)) {
			Logger.overrideLogger(options?.logger);
		}

		const httpApp = new HttpApplication();

		// register application module and its dependencies
		const container = new AppContainer();
		const appModule = new AppModule(container);
		container.setAppModule(appModule);
		const injector = new Injector(container);
		await this.initialize(container, injector, entryModule);

		const app = new DestsApplication(container, injector, httpApp, options);
		// return that instead
		this.logger.log("Dents initialized");
		return app; // for testing, to be able to check
	}

	private static async initialize(container: AppContainer, injector: Injector, entryModule: any) {
		this.logger.log("Initializing Dents");
		const instanceLoader = new InstanceLoader(container, injector);

		const metadataScanner = new MetadataScanner();
		const scanner = new DependenciesScanner(container, metadataScanner);

		try {
			scanner.scan(entryModule);
			await instanceLoader.createInstancesOfDependencies();
			// TODO: load global providers
		} catch (err: unknown) {
			this.logger.error(err);
		}
	}
}
