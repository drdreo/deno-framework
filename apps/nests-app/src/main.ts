import { DestsApplication,  DentsFactory } from "@deno-framework/nests";
import { AppModule } from "./app.module.ts";

async function bootstrap() {
    const app: DestsApplication = await DentsFactory.create(AppModule);

    const port = '3000';
    await app.listen(port);
}

bootstrap();