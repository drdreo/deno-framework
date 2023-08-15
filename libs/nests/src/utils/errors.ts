export class UnknownDependenciesException extends Error {
	constructor(name?: string) {
		super(`Unknown dependency [${name ?? "unknown"}]`);
	}
}
