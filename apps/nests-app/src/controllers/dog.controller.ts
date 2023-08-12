import {Controller, Get, HttpContext} from "@deno-framework/nests";

@Controller("/dogs")
export default class DogsController {
  @Get("/")
  getOne(context: HttpContext): any {
    console.log(context.state);
    return {name: "Retriever", cute: true, golden: true};
  }
}