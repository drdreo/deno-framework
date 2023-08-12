import {createApp} from "@deno-framework/nests";


function bootstrap() {
  const app = createApp({port: 3000}).then(() => console.log("App running"));

}

bootstrap();