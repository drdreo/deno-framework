import { assertEquals, assertExists, beforeEach, describe, it } from "../../../dev_deps.ts";
import { Injectable } from "../../decorators/core/injectable.decorator.ts";
import { Controller } from "../../decorators/core/controller.decorator.ts";
import { Module } from "../../decorators/core/module.decorator.ts";
import { Get } from "../../decorators/request-method.decorator.ts";
import { DentsFactory } from "../dents-factory.ts";
import { AppContainer } from "./container.ts";
import { ProviderWrapper } from "./provider-wrapper.ts";

@Injectable()
class TestFoodService {
	amount = 123;
	treats = {
		cakes: 123,
		crisps: false,
	};

	constructor() {
	}
}

@Injectable()
class TestDogService {
	constructor(public readonly testFoodService: TestFoodService) {
	}
}

@Controller()
class TestController {
	constructor(public readonly testFoodService: TestFoodService) {
	}

	@Get()
	get(): number {
		return this.testFoodService.amount;
	}
}

describe("[DI] Container", () => {
	let container: AppContainer;

	describe("Injectables", () => {
		beforeEach(async () => {
			@Module({
				providers: [
					TestDogService,
					TestFoodService,
					{ provide: "TEST", useValue: 666 },
				],
			})
			class TestModule {
			}

			container = (await DentsFactory.create(TestModule)).container;
		});

		it("should create", () => {
			assertExists(container);
		});

		it("should setup providers", () => {
			const providers = container.getProviders();
			assertEquals(providers.size, 3);
		});

		it("should instantiate provider dependencies", () => {
			const dogService = container.get<TestDogService>(TestDogService);
			assertExists(dogService.testFoodService);
			assertEquals(dogService.testFoodService.amount, 123);
		});
	});

	describe("Controllers", () => {
		beforeEach(async () => {
			@Module({
				providers: [
					TestFoodService,
					{ provide: "TEST", useValue: 666 },
				],
				controllers: [
					TestController,
				],
			})
			class TestModule {
			}

			container = (await DentsFactory.create(TestModule)).container;
		});

		it("should create", () => {
			assertExists(container);
		});

		it("should setup controllers", () => {
			const controllers = container.getControllers();
			assertEquals(controllers.size, 1);
		});

		it("should instantiate controller dependencies", () => {
			const controllers = container.getControllers();
			const controller = (controllers.get(TestController) as ProviderWrapper<TestController>)
				.instance!;
			assertExists(controller.testFoodService);
			assertEquals(controller.get(), 123);
		});
	});
});
