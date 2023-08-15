import { InjectionToken } from "../../domain/provider.ts";
import { Type } from "../../domain/type-helpers.ts";
import { Logger } from "../../utils/logger/logger.service.ts";
import { UuidFactory } from "../../utils/uuid-factory.ts";

export const INSTANCE_METADATA_SYMBOL = Symbol.for("instance_metadata:cache");
export const INSTANCE_ID_SYMBOL = Symbol.for("instance_metadata:id");

export interface PropertyMetadata {
    key: symbol | string;
    wrapper: ProviderWrapper;
}

interface ProviderMetadataStore {
    dependencies?: ProviderWrapper[];
    properties?: PropertyMetadata[];
}

export class ProviderWrapper<T = any> {
    readonly id: string;
    readonly name?: string;
    readonly token: InjectionToken;
    metatype?: Type<T> | Function;
    // TODO: create per context
    instance?: T;
    isResolved?: boolean;

    initTime?: number; // time it took to load the instance

    private logger = new Logger(ProviderWrapper.name);
    private [INSTANCE_METADATA_SYMBOL]: ProviderMetadataStore = {};

    constructor(metadata: Partial<ProviderWrapper<T>>) {
        this.id = metadata.id ?? this.generateUuid();
        if (!metadata.token) {
            throw new Error("Token is required");
        }
        this.token = metadata.token;
        this.initialize(metadata);
    }

    addCtorMetadata(index: number, wrapper: ProviderWrapper) {
        if (!this[INSTANCE_METADATA_SYMBOL].dependencies) {
            this[INSTANCE_METADATA_SYMBOL].dependencies = [];
        }
        this[INSTANCE_METADATA_SYMBOL]!.dependencies[index] = wrapper;
    }

    public addPropertiesMetadata(
        key: symbol | string,
        wrapper: ProviderWrapper,
    ) {
        if (!this[INSTANCE_METADATA_SYMBOL].properties) {
            this[INSTANCE_METADATA_SYMBOL].properties = [];
        }
        this[INSTANCE_METADATA_SYMBOL]!.properties.push({
            key,
            wrapper,
        });
    }

    createPrototype() {
        if (!this.isNewable() || this.isResolved) {
            return;
        }
        this.logger.debug(`Creating prototype for ${ this.name }`);
        return Object.create(this.metatype!.prototype);
    }

    private isNewable(): boolean {
        return !!this.metatype?.prototype;
    }

    private initialize(metadata: Partial<ProviderWrapper<T>>) {
        const { instance, isResolved, token, ...wrapperPartial } = metadata;
        Object.assign(this, wrapperPartial);

        this.instance = instance;
        this.isResolved = isResolved;
    }

    private generateUuid(): string {
        const key = this.name?.toString() ?? this.token?.toString();
        return UuidFactory.get(key);
    }
}
