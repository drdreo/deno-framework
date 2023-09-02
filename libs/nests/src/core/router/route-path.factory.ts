import { RoutePathMetadata } from "../../domain/router.ts";
import { addLeadingSlash, flatten, stripEndSlash } from "./router.utils.ts";

export class RoutePathFactory {
	constructor() {
	}

	public create(
		metadata: RoutePathMetadata,
	): string[] {
		let paths = [""];

		paths = this.appendToAllIfDefined(paths, metadata.modulePath);
		paths = this.appendToAllIfDefined(paths, metadata.ctrlPath);
		paths = this.appendToAllIfDefined(paths, metadata.methodPath);

		if (metadata.globalPrefix) {
			paths = paths.map((path) => {
				return stripEndSlash(metadata.globalPrefix || "") + path;
			});
		}

		return paths
			.map((path) => addLeadingSlash(path || "/"))
			.map((path) => (path !== "/" ? stripEndSlash(path) : path));
	}

	public appendToAllIfDefined(
		paths: string[],
		fragmentToAppend: string | string[] | undefined,
	): string[] {
		if (!fragmentToAppend) {
			return paths;
		}
		const concatPaths = (a: string, b: string) => stripEndSlash(a) + addLeadingSlash(b);

		if (Array.isArray(fragmentToAppend)) {
			const paths2dArray = paths.map((path) =>
				fragmentToAppend.map((fragment) => concatPaths(path, fragment))
			);
			return flatten(paths2dArray);
		}
		return paths.map((path) => concatPaths(path, fragmentToAppend));
	}
}
