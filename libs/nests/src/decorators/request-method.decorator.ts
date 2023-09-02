import { CONTROLLER_METADATA } from "../domain/constants.ts";
import { RequestMethod } from "../domain/request-method.enum.ts";
import { Reflect } from "../../deps.ts";

export interface RequestMappingMetadata {
	path?: string | string[];
	method?: RequestMethod;
}

const defaultMetadata = {
	[CONTROLLER_METADATA.PATH]: "/",
	[CONTROLLER_METADATA.METHOD]: RequestMethod.GET,
};

export const RequestMapping = (
	metadata: RequestMappingMetadata = defaultMetadata,
): MethodDecorator => {
	const pathMetadata = metadata[CONTROLLER_METADATA.PATH as "path"];
	const path = pathMetadata?.length ? pathMetadata : "/";
	const requestMethod = metadata[CONTROLLER_METADATA.METHOD as keyof RequestMappingMetadata] ||
		RequestMethod.GET;

	return (
		target: object,
		key: string | symbol,
		descriptor: TypedPropertyDescriptor<any>,
	) => {
		Reflect.defineMetadata(CONTROLLER_METADATA.PATH, path, descriptor.value);
		Reflect.defineMetadata(CONTROLLER_METADATA.METHOD, requestMethod, descriptor.value);
		return descriptor;
	};
};

const createMappingDecorator =
	(method: RequestMethod) => (path?: string | string[]): MethodDecorator => {
		return RequestMapping({
			[CONTROLLER_METADATA.PATH]: path,
			[CONTROLLER_METADATA.METHOD]: method,
		});
	};

export const Post = createMappingDecorator(RequestMethod.POST);

export const Get = createMappingDecorator(RequestMethod.GET);

export const Delete = createMappingDecorator(RequestMethod.DELETE);

export const Put = createMappingDecorator(RequestMethod.PUT);

export const Patch = createMappingDecorator(RequestMethod.PATCH);

export const Options = createMappingDecorator(RequestMethod.OPTIONS);

export const Head = createMappingDecorator(RequestMethod.HEAD);

export const All = createMappingDecorator(RequestMethod.ALL);

export const Search = createMappingDecorator(RequestMethod.SEARCH);
