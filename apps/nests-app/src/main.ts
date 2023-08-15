import { Application, createApp, Logger } from "@deno-framework/nests";

async function bootstrap() {
    const app: Application = await createApp();

    const port = 3000;
    Logger.log(`listening at http://localhost:${ port }`, 'Bootstrap');
    await app.listen({ port });
}

bootstrap();