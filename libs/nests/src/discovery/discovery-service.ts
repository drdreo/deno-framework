// deno-lint-ignore-file no-explicit-any
import { Application, Reflect, Router, toFileUrl } from "../../deps.ts";
import { CONTROLLER_METADATA } from "../domain/constants.ts";
import { handleRoute } from "../handler/route.ts";
import { isConstructor } from "../utils/data.ts";
import { Logger } from "../utils/logger/logger.service.ts";

const cwd = Deno.cwd();
const router = new Router();
const methodsMap = new Map([
	["DELETE", router.delete],
	["GET", router.get],
	["PATCH", router.patch],
	["POST", router.post],
	["PUT", router.put],
]);

// https://github.com/nestjs/nest/blob/master/packages/core/discovery/discovery-service.ts
export class DiscoveryService {
	private logger = new Logger(DiscoveryService.name, { timestamp: true });

	constructor() {
		this.logger.log("Current working directory:", cwd);
		this.logger.log("import meta: ", import.meta.url);
	}

	async discover(app: Application) {
		await this.initializeControllers(app);
	}

	private async getControllers(name: string, controllers: any[]) {
		for await (const item of Deno.readDir(name)) {
			if (item.isDirectory) {
				await this.getControllers(`${name}/${item.name}`, controllers);
			} else {
				if (item.name.includes(".controller.ts")) {
					const fileURL = toFileUrl(`${cwd}/${name}/${item.name}`);
					const controller = (await import(fileURL.href)).default;

					controllers.push(controller);
				}
			}
		}
	}

	private registerController(Controller: any) {
		const basePath = Reflect.getMetadata(
			CONTROLLER_METADATA.ENDPOINT,
			Controller,
		);
		const methods = Object.getOwnPropertyNames(Controller.prototype);

		methods.forEach((methodName) => {
			if (isConstructor(methodName)) {
				return;
			}

			const endpoint = Reflect.getMetadata(
				CONTROLLER_METADATA.ENDPOINT,
				Controller.prototype[methodName],
			) as string;
			const httpMethod = Reflect.getMetadata(
				CONTROLLER_METADATA.METHOD,
				Controller.prototype[methodName],
			) as string;
			const middleware = Controller.prototype[methodName];

			let path = basePath + endpoint;
			if (path[path.length - 1] === "/") {
				path = path.substring(0, path.length - 1);
			}

			const routerFn = methodsMap.get(httpMethod);
			if (!routerFn) {
				throw new Error(
					`The method ${httpMethod} can not be handled by Dest.`,
				);
			}

			routerFn.call(router, path, handleRoute(middleware));
		});
	}

	private async initializeControllers(app: Application) {
		const controllers: any[] = [];

		// TODO: scan all project for controllers
		await this.getControllers("controllers", controllers);

		controllers.forEach((controller) => {
			this.registerController(controller);
		});

		app.use(router.routes());
		app.use(router.allowedMethods());
		this.logger.log("controllers initialized!");
	}
}
