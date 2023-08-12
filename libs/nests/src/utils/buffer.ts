
export function getBytesFromString(content: string): Uint8Array {
    return new TextEncoder().encode(content);
}

export function getStringFromBytes(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}