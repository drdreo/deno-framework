import { Controller, Delete, Get, HttpContext, Inject, Post } from "@deno-framework/nests";

@Controller("/dogs")
export class DogsController {

    constructor(@Inject("TEST") testValue: number) {
        console.log(testValue);
    }

    @Get("/")
    baseRoute(context: HttpContext): any {
        console.log('baseRoute called');
        console.log(context)
    }

    @Get("/:id")
    getOne(ctx: HttpContext): any {
        console.log(`getOne called with :id - ${ ctx.params.id }`);
        return { name: "Retriever", id: ctx.params.id };
    }

    @Post("/:id")
    updateOne(): any {
        console.log('updateOne called');
        return true;
    }

    @Delete("/:id/")
    deleteOne(): any {
        console.log('deleteOne called');
        return false;
    }

    @Get("/:id/details")
    getOnesDetails(): any {
        console.log('getOnesDetails called');
        return { name: "Retriever", cute: true, golden: true };
    }

}