export const addLeadingSlash = (path?: string): string =>
	path && typeof path === "string" ? path.charAt(0) !== "/" ? "/" + path : path : "";

export const stripEndSlash = (path: string) =>
	path[path.length - 1] === "/" ? path.slice(0, path.length - 1) : path;

export function flatten<T extends Array<unknown> = any>(
	arr: T,
): T extends Array<infer R> ? R : never {
	const flat = [].concat(...arr);
	return flat.some(Array.isArray) ? flatten(flat) : flat;
}
