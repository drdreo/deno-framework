import { Module } from "@deno-framework/nests";
import { BaseController } from "./controllers/cat.controller.ts";
import { DogsController } from "./controllers/dog.controller.ts";

@Module({
    providers: [
        { provide: "TEST", useValue: 666 },
    ],
    controllers: [
        DogsController,
        BaseController
    ],
})
export class AppModule {
}
