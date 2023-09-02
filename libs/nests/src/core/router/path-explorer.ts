import { CONTROLLER_METADATA } from "../../domain/constants.ts";
import { Controller } from "../../domain/provider.ts";
import { RequestMethod } from "../../domain/request-method.enum.ts";
import { isString, isUndefined } from "../../utils/data.ts";
import { MetadataScanner } from "../discover/metadata-scanner.ts";
import { addLeadingSlash } from "./router.utils.ts";
import { RouterCallback } from "./routes-explorer.ts";

export interface RouteDefinition {
	path: string[];
	requestMethod: RequestMethod;
	targetCallback: RouterCallback;
	methodName: string;
}

export class PathsExplorer {
	constructor(private readonly metadataScanner: MetadataScanner) {
	}

	public scanForPaths(
		instance: Controller,
		prototype?: object,
	): RouteDefinition[] {
		const instancePrototype = isUndefined(prototype)
			? Object.getPrototypeOf(instance)
			: prototype;

		return this.metadataScanner
			.getAllMethodNames(instancePrototype)
			.reduce((acc, method) => {
				const route = this.exploreMethodMetadata(
					instance,
					instancePrototype,
					method,
				);

				if (route) {
					acc.push(route);
				}

				return acc;
			}, []);
	}

	public exploreMethodMetadata(
		instance: Controller,
		prototype: object,
		methodName: string,
	): RouteDefinition | null {
		const instanceCallback = instance[methodName];
		const prototypeCallback = prototype[methodName];
		const routePath = Reflect.getMetadata(CONTROLLER_METADATA.PATH, prototypeCallback);
		if (isUndefined(routePath)) {
			return null;
		}
		const requestMethod: RequestMethod = Reflect.getMetadata(
			CONTROLLER_METADATA.METHOD,
			prototypeCallback,
		);

		const path = isString(routePath)
			? [addLeadingSlash(routePath)]
			: routePath.map((p: string) => addLeadingSlash(p));

		return {
			path,
			requestMethod,
			targetCallback: instanceCallback,
			methodName,
		};
	}
}
