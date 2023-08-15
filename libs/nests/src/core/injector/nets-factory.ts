import { isUndefined } from "../../utils/data.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { AppModule } from "./app-module.ts";
import { AppContainer } from "./container.ts";
import { Injector } from "./injector.ts";
import { InstanceLoader } from "./instance-loader.ts";
import { Scanner } from "./scanner.ts";

// https://github.com/nestjs/nest/blob/85cc3869ee2a38f57075d59ac642eddf259ab016/packages/core/nest-factory.ts#L33
export class NestsFactory {
	private static logger = new Logger("NestsFactory", {
		timestamp: true,
	});

	// TODO: type the any away
	static create(entryModule: any, options?: any) {
		if (!isUndefined(options?.logger)) {
			Logger.overrideLogger(options?.logger);
		}

		const container = new AppContainer();
		const appModule = new AppModule(container);
		container.setAppModule(appModule);

		this.initialize(container, entryModule);

		return container; // for testing, to be able to check
	}

	private static initialize(container: AppContainer, entryModule: any) {
		this.logger.log("Initializing Nests");
		const injector = new Injector(container);
		const instanceLoader = new InstanceLoader(container, injector);

		const scanner = new Scanner(container);

		try {
			scanner.scan(entryModule);
			instanceLoader.createInstancesOfDependencies();
			// TODO: load global providers
		} catch (err: unknown) {
			this.logger.error(err);
		}
	}
}
