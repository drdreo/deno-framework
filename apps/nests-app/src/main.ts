import { Application, createApp, Logger } from "@deno-framework/nests";

async function bootstrap() {
    const options = {
        port: 3000
    }
    const app: Application = await createApp(options);

    const port = options.port;
    Logger.log(`listening at http://localhost:${ port }`, 'Bootstrap');
    await app.listen({ port });
}

bootstrap();