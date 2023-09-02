import { Application, Context } from "../deps.ts";

export function nests() {
	return "nests";
}

interface CreateAppOptions {
	logger?: false | string[]; // TODO: type log levels
}

// /**
//  * Create <nests> application
//  * @return {void}
//  */
// export async function createApp(
// 	options?: CreateAppOptions,
// ): Promise<Application> {
// 	const discover = new DiscoveryService();
//
// 	// TODO: merge options with default values
// 	const app = new Application();
//
// 	await discover.discover(app);
// 	Logger.log("Discovery done.");
//
// 	return app;
// }

export { DentsFactory } from "./core/dents-factory.ts";
export { DestsApplication } from "./core/application.ts";
export type HttpServer = Application;
export { Controller } from "./decorators/core/controller.decorator.ts";
export { Inject } from "./decorators/core/inject.decorator.ts";
export { Injectable } from "./decorators/core/injectable.decorator.ts";
export { Module } from "./decorators/core/module.decorator.ts";
export { Logger } from "./utils/logger/logger.service.ts";
export { Delete, Get, Patch, Post, Put } from "./decorators/request-method.decorator.ts";
export type HttpContext = Context;
