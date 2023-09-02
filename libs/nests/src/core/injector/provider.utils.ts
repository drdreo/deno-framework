import { ClassProvider, ValueProvider } from "../../domain/provider.ts";
import { isObject, isUndefined } from "../../utils/data.ts";

export function isCustomClass(provider: unknown): provider is ClassProvider {
	return !isUndefined((provider as ClassProvider).useClass);
}

export function isCustomValue(provider: unknown): provider is ValueProvider {
	return (
		isObject(provider) &&
		Object.prototype.hasOwnProperty.call(provider, "useValue")
	);
}
