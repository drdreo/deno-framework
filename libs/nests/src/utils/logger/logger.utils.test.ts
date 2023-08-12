import { assertEquals } from "../../../dev_deps.ts";

import { LogLevel } from "./logger.service.ts";
import { isLogLevelEnabled } from "./logger.utils.ts";

Deno.test("isLogLevelEnabled", async (t) => {
	const tests = [
		{ inputArgs: ["log", ["log"]], expectedReturnValue: true },
		{ inputArgs: ["debug", ["debug"]], expectedReturnValue: true },
		{ inputArgs: ["verbose", ["verbose"]], expectedReturnValue: true },
		{ inputArgs: ["error", ["error"]], expectedReturnValue: true },
		{ inputArgs: ["warn", ["warn"]], expectedReturnValue: true },
		/** explicitly included + log level is higher than target */
		{ inputArgs: ["log", ["error", "log"]], expectedReturnValue: true },
		{ inputArgs: ["warn", ["warn", "error"]], expectedReturnValue: true },
		{ inputArgs: ["debug", ["warn", "debug"]], expectedReturnValue: true },
		{
			inputArgs: ["verbose", ["error", "verbose"]],
			expectedReturnValue: true,
		},
		/** not explicitly included + log level is higher than target */
		{ inputArgs: ["log", ["error", "warn"]], expectedReturnValue: false },
		{ inputArgs: ["verbose", ["warn"]], expectedReturnValue: false },
		{ inputArgs: ["debug", ["warn", "error"]], expectedReturnValue: false },
		{ inputArgs: ["warn", ["error"]], expectedReturnValue: false },
	];

	await Promise.all(tests.map(({ inputArgs, expectedReturnValue }) =>
		t.step({
			name: `when log levels = [${inputArgs[1]}] and target level is "${
				inputArgs[0]
			}" should be ${expectedReturnValue}`,
			fn: () => {
				assertEquals(
					isLogLevelEnabled(...(inputArgs as [LogLevel, LogLevel[]])),
					expectedReturnValue,
				);
			},
			sanitizeOps: false,
			sanitizeResources: false,
			sanitizeExit: false,
		})
	));

	await t.step(`when log levels = undefined should be false`, () => {
		assertEquals(isLogLevelEnabled("warn", undefined), false);
	});
});
