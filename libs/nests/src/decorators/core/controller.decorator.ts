import { Reflect } from "../../../deps.ts";
import { CONTROLLER_METADATA } from "../../domain/constants.ts";
import { isString, isUndefined } from "../../utils/data.ts";

export interface ControllerOptions {
	/**
	 * Specifies an optional `route path prefix`.
	 * The prefix is pre-pended to the path specified in any request
	 */
	path?: string;
}

export function Controller(
	prefixOrOptions?: string | ControllerOptions,
): ClassDecorator {
	const defaultPath = "/";

	const [path] = isUndefined(prefixOrOptions)
		? [defaultPath]
		: isString(prefixOrOptions)
		? [prefixOrOptions]
		: [
			prefixOrOptions.path || defaultPath,
		];

	return (target: object) => {
		Reflect.defineMetadata(CONTROLLER_METADATA.WATERMARK, true, target);
		Reflect.defineMetadata(CONTROLLER_METADATA.PATH, path, target);
	};
}
