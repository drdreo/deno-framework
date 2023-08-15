import { Reflect } from "../../../deps.ts";
import { INJECTABLE_WATERMARK } from "../../domain/constants.ts";

/**
 * Decorator that marks a class as a provider
 * Providers can be injected into other classes via constructor parameter injection
 */
export function Injectable(): ClassDecorator {
	return (target: object) => {
		Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);
	};
}
