import { Abstract, Type } from "./type-helpers.ts";

export type InjectionToken<T = any> =
	| string
	| symbol
	| Type<T>
	| Abstract<T>
	| Function;

export type Provider<T = any> =
	| Type<any>
	| ClassProvider<T>
	| ValueProvider<T>;

export type Injectable = unknown;

/**
 * Interface defining a *Class* type provider.
 *
 * For example:
 * ```typescript
 * const configServiceProvider = {
 *      provide: ConfigService,
 *      useClass:DevelopmentConfigService,
 * };
 * ```
 *
 * @see [Class providers](https://docs.nestjs.com/fundamentals/custom-providers#class-providers-useclass)
 * @see [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export interface ClassProvider<T = any> {
	/**
	 * Injection token
	 */
	provide: InjectionToken;
	/**
	 * Type (class name) of provider (instance to be injected).
	 */
	useClass: Type<T>;
}

/**
 * Interface defining a *Value* type provider.
 *
 * For example:
 * ```typescript
 * const customProvider = {
 *   provide: 'VALUE',
 *   useValue: 123,
 * };
 * ```
 */
export interface ValueProvider<T = any> {
	/**
	 * Injection token
	 */
	provide: InjectionToken;
	/**
	 * Instance of a provider to be injected.
	 */
	useValue: T;
}
