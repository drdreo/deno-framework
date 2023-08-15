import { Reflect } from "../../../deps.ts";
import {
	PROPERTY_DEPS_METADATA,
	SELF_DECLARED_DEPS_METADATA,
	TYPE_METADATA,
} from "../../domain/constants.ts";
import { isUndefined } from "../../utils/data.ts";

/**
 * Decorator that marks a constructor parameter as a target
 */
export function Inject<T = any>(
	token?: T,
): PropertyDecorator & ParameterDecorator {
	return (
		target: object,
		key: string | symbol | undefined,
		index?: number,
	) => {
		const type = token || Reflect.getMetadata(TYPE_METADATA, target, key!);

		if (!isUndefined(index)) {
			let dependencies = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || [];

			dependencies = [...dependencies, { index, param: type }];
			Reflect.defineMetadata(
				SELF_DECLARED_DEPS_METADATA,
				dependencies,
				target,
			);
			return;
		}
		let properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, target.constructor) ||
			[];

		properties = [...properties, { key, type }];
		Reflect.defineMetadata(
			PROPERTY_DEPS_METADATA,
			properties,
			target.constructor,
		);
	};
}
