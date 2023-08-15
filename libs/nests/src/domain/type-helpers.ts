export interface Type<T = any> extends Function {
	new (...args: any[]): T;
}

export interface Abstract<T> extends Function {
	prototype: T;
}
