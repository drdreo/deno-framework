import { Reflect } from "../../../deps.ts";
import { ModuleMetadata } from "../../domain/metadata.ts";

/**
 * Decorator that marks a class as a module.
 *
 * @param metadata module configuration metadata
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
	// const propsKeys = Object.keys(metadata);
	// TODO: validateModuleKeys(propsKeys);

	return (target: Function) => {
		for (const property in metadata) {
			if (metadata.hasOwnProperty(property)) {
				Reflect.defineMetadata(
					property,
					(metadata as any)[property],
					target,
				);
			}
		}
	};
}
