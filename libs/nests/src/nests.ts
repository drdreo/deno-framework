import { Application, Context } from "../deps.ts";
import { DiscoveryService } from "./discovery/discovery-service.ts";
import { Logger } from "./utils/logger/logger.service.ts";

export function nests() {
	return "nests";
}

interface CreateAppOptions {
	logger?: false | string[]; // TODO: type log levels
}

/**
 * Create <nests> application
 * @return {void}
 */
export async function createApp(
	options?: CreateAppOptions,
): Promise<Application> {
	const discover = new DiscoveryService();

	// TODO: merge options with default values
	const app = new Application();

	await discover.discover(app);
	Logger.log("Discovery done.");

	return app;
}

export { Application, Logger };
export { Controller } from "./decorators/controller.ts";
//export {Validate} from "./decorators/Validate.ts";
export { Delete, Get, Patch, Post, Put } from "./decorators/method.ts";
export type HttpContext = Context;
