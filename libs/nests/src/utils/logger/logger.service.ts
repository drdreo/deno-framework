import { isObject } from "../data.ts";
import { ConsoleLogger } from "./console-logger.service.ts";
import { isLogLevelEnabled } from "./logger.utils.ts";

export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";

export interface LoggerService {
	/**
	 * Write a 'log' level log.
	 */
	log(message: any, ...optionalParams: any[]): any;

	/**
	 * Write an 'error' level log.
	 */
	error(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'debug' level log.
	 */
	debug?(message: any, ...optionalParams: any[]): any;

	/**
	 * Write a 'verbose' level log.
	 */
	verbose?(message: any, ...optionalParams: any[]): any;

	/**
	 * Set log levels.
	 * @param levels log levels
	 */
	setLogLevels?(levels: LogLevel[]): any;
}

const DEFAULT_LOGGER = new ConsoleLogger();

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
	day: "2-digit",
	month: "2-digit",
});

/**
 * @publicApi
 */
export class Logger implements LoggerService {
    protected static logLevels?: LogLevel[];
    protected static staticInstanceRef?: LoggerService = DEFAULT_LOGGER;
	protected localInstanceRef?: LoggerService;

	constructor(
		protected context?: string,
		protected options: { timestamp?: boolean } = {},
	) {
	}

	get localInstance(): LoggerService | undefined {
		if (Logger.staticInstanceRef === DEFAULT_LOGGER) {
			return this.registerLocalInstanceRef();
		} else if (Logger.staticInstanceRef instanceof Logger) {
			const prototype = Object.getPrototypeOf(Logger.staticInstanceRef);
			if (prototype.constructor === Logger) {
				return this.registerLocalInstanceRef();
			}
		}
		return Logger.staticInstanceRef;
	}

	/**
	 * Write an 'error' level log.
	 */
	static error(message: any, stackOrContext?: string): void;

	static error(message: any, context?: string): void;

	static error(message: any, stack?: string, context?: string): void;

	static error(
		message: any,
		...optionalParams: [...any, string?, string?]
	): void;

	static error(message: any, ...optionalParams: any[]) {
		this.staticInstanceRef?.error(message, ...optionalParams);
	}

	/**
	 * Write a 'log' level log.
	 */
	static log(message: any, context?: string): void;

	static log(message: any, ...optionalParams: [...any, string?]): void;

	static log(message: any, ...optionalParams: any[]) {
		this.staticInstanceRef?.log(message, ...optionalParams);
	}

	/**
	 * Write a 'warn' level log.
	 */
	static warn(message: any, context?: string): void;

	static warn(message: any, ...optionalParams: [...any, string?]): void;

	static warn(message: any, ...optionalParams: any[]) {
		this.staticInstanceRef?.warn(message, ...optionalParams);
	}

	/**
	 * Write a 'debug' level log, if the configured level allows for it.
	 * Prints to `stdout` with newline.
	 */
	static debug(message: any, context?: string): void;

	static debug(message: any, ...optionalParams: [...any, string?]): void;

	static debug(message: any, ...optionalParams: any[]) {
		this.staticInstanceRef?.debug?.(message, ...optionalParams);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	static verbose(message: any, context?: string): void;

	static verbose(message: any, ...optionalParams: [...any, string?]): void;

	static verbose(message: any, ...optionalParams: any[]) {
		this.staticInstanceRef?.verbose?.(message, ...optionalParams);
	}

	static getTimestamp() {
		return dateTimeFormatter.format(Date.now());
	}

	static overrideLogger(logger: LoggerService | LogLevel[] | boolean) {
		if (Array.isArray(logger)) {
			Logger.logLevels = logger;
			return this.staticInstanceRef?.setLogLevels!(logger);
		}
		if (isObject(logger)) {
			if (logger instanceof Logger && logger.constructor !== Logger) {
				const errorMessage =
					`Using the "extends Logger" instruction is not allowed. Please, use "extends ConsoleLogger" instead.`;
				this.staticInstanceRef?.error(errorMessage);
				throw new Error(errorMessage);
			}
			this.staticInstanceRef = logger;
		} else {
			this.staticInstanceRef = undefined;
		}
	}

	static isLevelEnabled(level: LogLevel): boolean {
		return isLogLevelEnabled(level, Logger.logLevels);
	}

	/**
	 * Write an 'error' level log.
	 */
	error(message: any, stack?: string, context?: string): void;

	error(message: any, ...optionalParams: [...any, string?, string?]): void;

	error(message: any, ...optionalParams: any[]) {
		optionalParams = this.context
			? (optionalParams.length ? optionalParams : [undefined]).concat(
				this.context,
			)
			: optionalParams;

		this.localInstance?.error(message, ...optionalParams);
	}

	/**
	 * Write a 'log' level log.
	 */
	log(message: any, context?: string): void;

	log(message: any, ...optionalParams: [...any, string?]): void;

	log(message: any, ...optionalParams: any[]) {
		optionalParams = this.context
			? optionalParams.concat(this.context)
			: optionalParams;
		this.localInstance?.log(message, ...optionalParams);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: any, context?: string): void;

	warn(message: any, ...optionalParams: [...any, string?]): void;

	warn(message: any, ...optionalParams: any[]) {
		optionalParams = this.context
			? optionalParams.concat(this.context)
			: optionalParams;
		this.localInstance?.warn(message, ...optionalParams);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug(message: any, context?: string): void;

	debug(message: any, ...optionalParams: [...any, string?]): void;

	debug(message: any, ...optionalParams: any[]) {
		optionalParams = this.context
			? optionalParams.concat(this.context)
			: optionalParams;
		this.localInstance?.debug?.(message, ...optionalParams);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose(message: any, context?: string): void;

	verbose(message: any, ...optionalParams: [...any, string?]): void;

	verbose(message: any, ...optionalParams: any[]) {
		optionalParams = this.context
			? optionalParams.concat(this.context)
			: optionalParams;
		this.localInstance?.verbose?.(message, ...optionalParams);
	}

	private registerLocalInstanceRef() {
		if (this.localInstanceRef) {
			return this.localInstanceRef;
		}
		this.localInstanceRef = new ConsoleLogger(this.context, {
			timestamp: this.options?.timestamp,
			logLevels: Logger.logLevels,
		});
		return this.localInstanceRef;
	}
}
