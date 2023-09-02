import { Controller, Get, HttpContext } from "@deno-framework/nests";

@Controller("/")
export class BaseController {

    @Get("/")
    baseRoute(context: HttpContext): any {
        console.log('baseRoute called');
        console.log(context)
    }

    @Get("/:id")
    getOne(): any {
        console.log('getOne called');
        return { time: Date.now() };
    }

}