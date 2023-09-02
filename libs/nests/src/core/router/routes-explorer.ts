import { Reflect, Router } from "../../../deps.ts";
import { CONTROLLER_METADATA } from "../../domain/constants.ts";
import { Controller } from "../../domain/provider.ts";
import { RequestMethod } from "../../domain/request-method.enum.ts";
import { RoutePathMetadata } from "../../domain/router.ts";
import { Type } from "../../domain/type-helpers.ts";
import { clc } from "../../utils/color.ts";
import { isUndefined } from "../../utils/data.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { MetadataScanner } from "../discover/metadata-scanner.ts";
import { ProviderWrapper } from "../injector/provider-wrapper.ts";
import { PathsExplorer } from "./path-explorer.ts";
import { handleRequest } from "./request-handler.ts";
import { RoutePathFactory } from "./route-path.factory.ts";
import { RouterMethodFactory } from "./router-method.factory.ts";
import { addLeadingSlash } from "./router.utils.ts";

export interface RouteDefinition {
	path: string[];
	requestMethod: RequestMethod;
	targetCallback: RouterCallback;
	methodName: string;
}

export type RouterCallback = <TRequest, TResponse>(
	req?: TRequest,
	res?: TResponse,
	next?: () => void,
) => void;

export class RouterExplorer {
	private readonly pathsExplorer: PathsExplorer;
	private readonly logger = new Logger(RouterExplorer.name, {
		timestamp: true,
	});
	private readonly routerMethodFactory = new RouterMethodFactory();

	constructor(
		metadataScanner: MetadataScanner,
		private readonly routePathFactory: RoutePathFactory,
	) {
		this.pathsExplorer = new PathsExplorer(metadataScanner);
	}

	public explore(
		instanceWrapper: ProviderWrapper,
		router: Router,
		routePathMetadata: RoutePathMetadata,
	) {
		const { instance } = instanceWrapper;
		const routerPaths = this.pathsExplorer.scanForPaths(instance);
		this.applyPathsToRouter(
			router,
			routerPaths,
			instanceWrapper,
			routePathMetadata,
		);
	}

	public extractRouterPath(metatype: Type<Controller>): string[] {
		const path = Reflect.getMetadata(CONTROLLER_METADATA.PATH, metatype);

		if (isUndefined(path)) {
			throw new Error(`UnknownRequestMappingException ${metatype.name}`);
		}
		if (Array.isArray(path)) {
			return path.map((p) => addLeadingSlash(p));
		}
		return [addLeadingSlash(path)];
	}

	public applyPathsToRouter(
		router: Router,
		routeDefinitions: RouteDefinition[],
		instanceWrapper: ProviderWrapper,
		routePathMetadata: RoutePathMetadata,
	) {
		(routeDefinitions || []).forEach((routeDefinition) => {
			this.applyCallbackToRouter(
				router,
				routeDefinition,
				routePathMetadata,
			);
		});
	}

	private applyCallbackToRouter(
		router: Router,
		routeDefinition: RouteDefinition,
		routePathMetadata: RoutePathMetadata,
	) {
		const {
			path: paths,
			requestMethod,
			targetCallback,
			methodName,
		} = routeDefinition;

		const routerMethodRef = this.routerMethodFactory.get(router, requestMethod).bind(router);

		paths.forEach((path) => {
			routePathMetadata.methodPath = path;
			const pathsToRegister = this.routePathFactory.create(
				routePathMetadata,
				requestMethod,
			);
			pathsToRegister.forEach((path) => {
				// routerMethodRef.call(router, path, handleRequest(targetCallback));
				routerMethodRef(path, handleRequest(targetCallback)); // TODO: add Req Res references

				this.logger.log(
					`=> ${clc.green(path)} ${clc.blue(RequestMethod[requestMethod])} - ${
						clc.cyanBright(methodName)
					} `,
				);
			});
		});
	}
}
