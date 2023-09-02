import { HttpServer } from "https://deno.land/x/oak@v11.1.0/http_server_native.ts";
import { Router } from "../../../deps.ts";
import { Controller } from "../../domain/provider.ts";
import { RoutePathMetadata } from "../../domain/router.ts";
import { Type } from "../../domain/type-helpers.ts";
import { clc } from "../../utils/color.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { MetadataScanner } from "../discover/metadata-scanner.ts";
import { AppContainer } from "../injector/container.ts";
import { ProviderWrapper } from "../injector/provider-wrapper.ts";
import { RoutePathFactory } from "./route-path.factory.ts";
import { RouterExplorer } from "./routes-explorer.ts";

export class RoutesResolver {
	readonly router = new Router();

	private readonly logger = new Logger(RoutesResolver.name, {
		timestamp: true,
	});
	private readonly routerExplorer: RouterExplorer;
	private readonly routePathFactory: RoutePathFactory;

	constructor(
		private readonly container: AppContainer,
	) {
		this.routePathFactory = new RoutePathFactory();
		const metadataScanner = new MetadataScanner();
		this.routerExplorer = new RouterExplorer(
			metadataScanner,
			this.routePathFactory,
		);
	}

	public resolve<T extends HttpServer>(
		globalPrefix: string,
	) {
		const controllers = this.container.getControllers();
		this.registerRouters(
			controllers,
			globalPrefix,
			"",
		);
	}

	public registerRouters(
		routes: Map<string | symbol | Function, ProviderWrapper<Controller>>,
		globalPrefix: string,
		modulePath: string,
	) {
		routes.forEach((instanceWrapper) => {
			const { metatype } = instanceWrapper;

			const routerPaths = this.routerExplorer.extractRouterPath(
				metatype as Type<any>,
			);
			const controllerName = metatype.name;

			routerPaths.forEach((path) => {
				const pathsToLog = this.routePathFactory.create({
					ctrlPath: path,
					modulePath,
					globalPrefix,
				});

				pathsToLog.forEach((path) => {
					this.logger.log(
						`Mounting ${clc.yellow(controllerName)} ${clc.green(clc.bold(path))}:`,
					);
				});

				const routePathMetadata: RoutePathMetadata = {
					ctrlPath: path,
					modulePath,
					globalPrefix,
				};
				this.routerExplorer.explore(
					instanceWrapper,
					this.router,
					routePathMetadata,
				);
			});
		});
	}
}
