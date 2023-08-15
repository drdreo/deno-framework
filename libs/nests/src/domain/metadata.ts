import { Provider } from "./provider.ts";
import { Type } from "./type-helpers.ts";

/**
 * Defining the property object that describes a module.
 */
export interface ModuleMetadata {
	/**
	 * Optional list of controllers defined in this module which have to be
	 * instantiated.
	 */
	controllers?: Type<any>[];
	/**
	 * Optional list of providers that will be instantiated by the Nest injector
	 * and that may be shared at least across this module.
	 */
	providers?: Provider[];
}
