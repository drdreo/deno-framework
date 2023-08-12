import {DiscoveryService} from "./discovery/discovery-service.ts";

/**
 * JSDoc for this function
 * @return {string}
 */
export function nests() {
  return "nests";
}


import {Application} from "../deps.ts";

interface CreateAppOptions {
  port: number;
  logger?: false | string[]; // TODO: type log levels
}

const discover = new DiscoveryService();

export async function createApp(options: CreateAppOptions) {
  // TODO: merge options with default values

  const app = new Application();

  await discover.discover(app);

  const port = options.port;
  console.log(`[NESTS] listening at port ${port}`);
  await app.listen({port: port});
}


export {Controller} from "./decorators/controller.ts";
//export {Validate} from "./decorators/Validate.ts";
export {Get, Post, Put, Patch, Delete} from "./decorators/method.ts";
