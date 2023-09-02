import { Application as HttpApplication } from "../../deps.ts";
import { isFunction } from "../utils/data.ts";
import { Logger } from "../utils/logger/logger.service.ts";
import { AppContainer } from "./injector/container.ts";
import { Injector } from "./injector/injector.ts";
import { addLeadingSlash } from "./router/router.utils.ts";
import { RoutesResolver } from "./router/routes-resolver.ts";

export class DestsApplication {
	private logger = new Logger(DestsApplication.name);

	private routesResolver: RoutesResolver;
	private isInitialized = false;
	private isListening = false;

	constructor(
		public container: AppContainer,
		private injector: Injector,
		private readonly httpApp: HttpApplication,
		options = {},
	) {
		this.routesResolver = new RoutesResolver(
			this.container,
		);
	}

	public getHttpAdapter(): HttpApplication {
		return this.httpApp;
	}

	init(): DestsApplication {
		if (this.isInitialized) {
			return this;
		}
		// TODO: apply options

		this.registerRouter();

		this.isInitialized = true;
		this.logger.log("DesTs application successfully started");
		return this;
	}

	public async listen(port: string): Promise<any>;
	public async listen(port: string, options: object): Promise<any>;
	public async listen(port: string, options: object, callback: Function): Promise<any> {
		if (!this.isInitialized) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const isCallbackInOriginalArgs = isFunction(callback);

			const errorCb = (e: any) => {
				this.logger.error(e?.toString?.());
				reject(e);
			};
			const listenCb = (e: any) => {
				this.httpApp.removeEventListener("error", errorCb);
				this.isListening = true;
				this.logger.log(`🐈 listening on http://localhost:${port}`);

				resolve(this.httpApp);
				if (isCallbackInOriginalArgs) {
					callback();
				}
			};

			this.httpApp.addEventListener("error", errorCb);
			this.httpApp.addEventListener("listen", listenCb);

			this.httpApp.listen(
				{
					port,
					...options,
				},
			);
		});
	}

	private registerRouter() {
		const basePath = addLeadingSlash("");
		this.routesResolver.resolve(basePath);
		this.applyRoutes();
	}

	private applyRoutes() {
		this.httpApp.use(this.routesResolver.router.routes());
		this.httpApp.use(this.routesResolver.router.allowedMethods());
	}
}
