import { ClassProvider, Provider, ValueProvider } from "../../domain/provider.ts";
import { isObject, isUndefined } from "../../utils/data.ts";

export function isClassProvider<T = any>(
	provider: Provider,
): provider is ClassProvider<T> {
	return Boolean((provider as ClassProvider<T>)?.useClass);
}

export function isValueProvider<T = any>(
	provider: Provider,
): provider is ValueProvider<T> {
	const providerValue = (provider as ValueProvider)?.useValue;
	return !isUndefined(providerValue);
}

export function isCustomClass(provider: unknown): provider is ClassProvider {
	return !isUndefined((provider as ClassProvider).useClass);
}

export function isCustomValue(provider: unknown): provider is ValueProvider {
	return (
		isObject(provider) &&
		Object.prototype.hasOwnProperty.call(provider, "useValue")
	);
}
