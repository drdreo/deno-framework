import { assertEquals, assertExists, beforeEach, describe, it } from "../../../dev_deps.ts";
import { Injectable } from "../../decorators/core/injectable.decorator.ts";
import { Module } from "../../decorators/core/module.decorator.ts";
import { AppContainer } from "./container.ts";
import { NestsFactory } from "./nets-factory.ts";

@Injectable()
class TestFoodService {
    amount = 123;
    treats = {
        cakes: 123,
        crisps: false
    };
}

@Injectable()
class TestDogService {
    constructor(public readonly testFoodService: TestFoodService) {
    }
}

describe("[DI] Container", () => {
    let container: AppContainer;

    beforeEach(() => {
        @Module({
            providers: [
                TestDogService,
                TestFoodService,
            ],
        })
        class TestModule {
        }

        container = NestsFactory.create(TestModule);
    });

    it("should create", () => {
        assertExists(container);
    });

    it("should setup providers", () => {
        const providers = container.getProviders();
        assertEquals(providers.size, 2);
    });

    it("should instantiate provider dependencies", () => {
        const dogService = container.get<TestDogService>(TestDogService);
        assertExists(dogService.testFoodService);
        assertEquals(dogService.testFoodService.amount, 123);
    });
});
