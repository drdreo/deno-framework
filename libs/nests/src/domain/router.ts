import { Body, Context } from "../../deps.ts";

export interface RoutePathMetadata {
	/**
	 * Controller-level path (e.g., @Controller('resource') = "resource").
	 */
	ctrlPath?: string;

	/**
	 * Method-level path (e.g., @Get('resource') = "resource").
	 */
	methodPath?: string;

	/**
	 * Global route prefix specified with the "NestApplication#setGlobalPrefix" method.
	 */
	globalPrefix?: string;

	/**
	 * Module-level path registered through the "RouterModule".
	 */
	modulePath?: string;
}

type BodyFunction = () => Body | Promise<Body>;

export type Callback = (
	context: Context,
) => Promise<Body | BodyFunction> | Body | BodyFunction;

export type HttpContext = Context;
