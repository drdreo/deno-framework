export enum UuidFactoryMode {
	Random = "random",
	Deterministic = "deterministic",
}

export class UuidFactory {
	private static mode = UuidFactoryMode.Random;

	static get(key = "") {
		return this.mode === UuidFactoryMode.Deterministic
			? DeterministicUuidRegistry.get(key)
			: crypto.randomUUID();
	}
}

class DeterministicUuidRegistry {
	private static readonly registry = new Set<string>();

	static get(str: string, inc = 0): string {
		const id = inc ? this.hashCode(`${str}_${inc}`) : this.hashCode(str);
		if (this.registry.has(id)) {
			return this.get(str, inc + 1);
		}
		this.registry.add(id);
		return id;
	}

	static clear(): void {
		this.registry.clear();
	}

	private static hashCode(s: string): string {
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
		}
		return h.toString();
	}
}
