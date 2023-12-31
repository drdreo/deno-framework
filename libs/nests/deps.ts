/**
 * deps.ts
 * https://deno.land/manual@v1.36.1/examples/manage_dependencies

 * This module re-exports the required methods from the dependant remote modules.
 */
export { writeAllSync } from "https://deno.land/std@0.198.0/streams/write_all.ts";

export {
    Application,
    composeMiddleware,
    Context,
    Router,
} from "https://deno.land/x/oak@v9.0.1/mod.ts";
export type { Body, BodyType } from "https://deno.land/x/oak@v9.0.1/mod.ts";

export { validate } from "https://deno.land/x/deno_class_validator@v1.0.0/mod.ts";
export type { ValidationError } from "https://deno.land/x/deno_class_validator@v1.0.0/mod.ts";

export { Reflect } from "https://deno.land/x/reflect_metadata@v0.1.12/mod.ts";
export { toFileUrl } from "https://deno.land/std@0.105.0/path/mod.ts";
