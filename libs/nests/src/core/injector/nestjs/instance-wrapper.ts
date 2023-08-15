// import { UuidFactory } from "../../utils/uuid-factory.ts";
// import { InjectionToken } from "../../domain/provider.ts";
// import { Type } from "../../domain/type-helpers.ts";
// import { Logger } from "../../utils/logger/logger.service.ts";
// import { STATIC_CONTEXT } from "./constants.ts";
//
// export const INSTANCE_METADATA_SYMBOL = Symbol.for("instance_metadata:cache");
// export const INSTANCE_ID_SYMBOL = Symbol.for("instance_metadata:id");
//
// export interface HostComponentInfo {
// 	/**
// 	 * Injection token (or class reference)
// 	 */
// 	token: InjectionToken;
// }
//
// export interface ContextId {
// 	readonly id: number;
// 	payload?: unknown;
//
// 	getParent?(info: HostComponentInfo): ContextId;
// }
//
// export interface InstancePerContext<T> {
// 	instance: T;
// 	isResolved?: boolean;
// }
//
// export interface PropertyMetadata {
// 	key: symbol | string;
// 	wrapper: InstanceWrapper;
// }
//
// interface InstanceMetadataStore {
// 	dependencies?: InstanceWrapper[];
// 	properties?: PropertyMetadata[];
// }
//
// export class InstanceWrapper<T = any> {
// 	private static logger = new Logger(InstanceWrapper.name);
// 	public readonly name?: string;
// 	public readonly token?: InjectionToken;
// 	public metatype?: Type<T> | Function;
//
// 	private readonly values = new WeakMap<ContextId, InstancePerContext<T>>();
//
// 	private readonly [INSTANCE_ID_SYMBOL]: string;
// 	private [INSTANCE_METADATA_SYMBOL]: InstanceMetadataStore = {};
//
// 	constructor(
// 		metadata: Partial<InstanceWrapper<T>> & InstancePerContext<T>,
// 	) {
// 		this.initialize(metadata);
// 		this[INSTANCE_ID_SYMBOL] = metadata.id ?? this.generateUuid();
// 	}
//
// 	get id(): string {
// 		return this[INSTANCE_ID_SYMBOL];
// 	}
//
// 	get isNotMetatype(): boolean {
// 		return !this.metatype;
// 	}
//
// 	get instance(): T {
// 		const instancePerContext = this.getInstanceByContextId(STATIC_CONTEXT);
// 		return instancePerContext.instance;
// 	}
//
// 	set instance(value: T) {
// 		this.values.set(STATIC_CONTEXT, { instance: value });
// 	}
//
// 	public setInstanceByContextId(
// 		contextId: ContextId,
// 		value: InstancePerContext<T>,
// 	) {
// 		this.values.set(contextId, value);
// 	}
//
// 	public getInstanceByContextId(
// 		contextId: ContextId,
// 	): InstancePerContext<T> {
// 		return this.values.get(contextId)!;
// 	}
//
// 	public addCtorMetadata(index: number, wrapper: InstanceWrapper) {
// 		if (!this[INSTANCE_METADATA_SYMBOL].dependencies) {
// 			this[INSTANCE_METADATA_SYMBOL].dependencies = [];
// 		}
// 		this[INSTANCE_METADATA_SYMBOL].dependencies[index] = wrapper;
// 	}
//
// 	public getCtorMetadata(): InstanceWrapper[] {
// 		return this[INSTANCE_METADATA_SYMBOL].dependencies!;
// 	}
//
// 	public addPropertiesMetadata(
// 		key: symbol | string,
// 		wrapper: InstanceWrapper,
// 	) {
// 		if (!this[INSTANCE_METADATA_SYMBOL].properties) {
// 			this[INSTANCE_METADATA_SYMBOL].properties = [];
// 		}
// 		this[INSTANCE_METADATA_SYMBOL].properties.push({
// 			key,
// 			wrapper,
// 		});
// 	}
//
// 	public getPropertiesMetadata(): PropertyMetadata[] {
// 		return this[INSTANCE_METADATA_SYMBOL].properties!;
// 	}
//
// 	public createPrototype(contextId: ContextId) {
// 		const host = this.getInstanceByContextId(contextId);
// 		if (!this.isNewable() || host.isResolved) {
// 			return;
// 		}
// 		return Object.create(this.metatype!.prototype);
// 	}
//
// 	private isNewable(): boolean {
// 		return !!this.metatype?.prototype;
// 	}
//
// 	private initialize(
// 		metadata: Partial<InstanceWrapper<T>> & InstancePerContext<T>,
// 	) {
// 		const { instance, isResolved, ...wrapperPartial } = metadata;
// 		Object.assign(this, wrapperPartial);
//
// 		this.setInstanceByContextId(STATIC_CONTEXT, {
// 			instance,
// 			isResolved,
// 		});
// 	}
//
// 	private generateUuid(): string {
// 		const key = this.name?.toString() ?? this.token?.toString();
// 		return UuidFactory.get(key);
// 	}
// }
