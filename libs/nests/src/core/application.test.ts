import { assertEquals, describe, it } from "../../dev_deps.ts";
import { Controller } from "../decorators/core/controller.decorator.ts";
import { Get } from "../decorators/request-method.decorator.ts";
import { DestsApplication } from "./application.ts";

@Controller()
class TestController {
	constructor(public readonly testFoodService: TestFoodService) {
	}

	@Get()
	get(): number {
		return this.testFoodService.amount;
	}
}

@Controller("/test")
class TestController {
	constructor(public readonly testFoodService: TestFoodService) {
	}

	@Get()
	get(): number {
		return this.testFoodService.amount;
	}
}

describe("[Core] DestsApplication", () => {
	describe("Register routes", () => {
		it("should register controller routes", async () => {
			const instance = new DestsApplication(
				container,
				noopHttpAdapter,
				applicationConfig,
			);

			await instance.init();

			assertEquals(httpAdapterSpy.init.calledOnce, true);
		});
	});
});
