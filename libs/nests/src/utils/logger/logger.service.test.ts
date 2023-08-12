import { afterEach, assertEquals, assertStringIncludes, beforeEach, describe, it, sinon } from '../../../dev_deps.ts';
import { getStringFromBytes } from "../buffer.ts";
import { ConsoleLogger } from "./console-logger.service.ts";
import { Logger, LoggerService, LogLevel } from './logger.service.ts';


describe('Logger', () => {

    describe('[static methods]', () => {
        describe('when the default logger is used', () => {
            let processStdoutWriteSpy: sinon.SinonSpy;
            let processStderrWriteSpy: sinon.SinonSpy;

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
                processStderrWriteSpy = sinon.spy(Deno.stderr, 'writeSync');
            });

            afterEach(() => {
                processStdoutWriteSpy.restore();
                processStderrWriteSpy.restore();
            });

            it('should print one message to the console', () => {
                const message = 'random message';
                const context = 'RandomContext';

                Logger.log(message, context);

                assertEquals(processStdoutWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg), message);
            });

            it('should print one message without context to the console', () => {
                const message = 'random message without context';

                Logger.log(message);

                assertEquals(processStdoutWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    message,
                );
            });

            it('should print multiple messages to the console', () => {
                const messages = [ 'message 1', 'message 2', 'message 3' ];
                const context = 'RandomContext';

                Logger.log(messages[0], messages[1], messages[2], context);


                assertEquals(processStdoutWriteSpy.calledThrice, true);

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    messages[0],
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    messages[1],
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    messages[2],
                );
            });

            it('should print one error to the console with context', () => {
                const message = 'random error';
                const context = 'RandomContext';

                Logger.error(message, context);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
            });

            it('should print one error to the console with stacktrace', () => {
                const message = 'random error';
                const stacktrace = 'Error: message\n    at <anonymous>:1:2';

                Logger.error(message, stacktrace);

                assertEquals(processStderrWriteSpy.calledTwice, true);
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg).includes('[]'),
                    false
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
                assertEquals(getStringFromBytes(processStderrWriteSpy.secondCall.firstArg), stacktrace + '\n');
            });

            it('should print one error without context to the console', () => {
                const message = 'random error without context';

                Logger.error(message);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
            });

            it('should print error object without context to the console', () => {
                const error = new Error('Random text here');

                Logger.error(error);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `Error: Random text here`
                );
            });

            it('should serialise a plain JS object (as a message) without context to the console', () => {
                const error = {
                    randomError: true,
                };

                Logger.error(error);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `Object:`
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `{\n  "randomError": true\n}`
                );
            });

            it('should print one error with stacktrace and context to the console', () => {
                const message = 'random error with context';
                const stacktrace = 'stacktrace';
                const context = 'ErrorContext';

                Logger.error(message, stacktrace, context);

                assertEquals(processStderrWriteSpy.calledTwice, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message,
                );
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    stacktrace + '\n',
                );
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg).includes(context),
                    false
                );
            });

            it('should print multiple 2 errors and one stacktrace to the console', () => {
                const messages = [ 'message 1', 'message 2' ];
                const stack = 'stacktrace';
                const context = 'RandomContext';

                Logger.error(messages[0], messages[1], stack, context);

                assertEquals(processStderrWriteSpy.calledThrice, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    messages[0],
                );

                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    messages[1],
                );

                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.thirdCall.firstArg).includes(`[${ context }]`),
                    false,
                );
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.thirdCall.firstArg),
                    stack + '\n'
                );
            });
        });
        describe('when logging is disabled', () => {
            let processStdoutWriteSpy: sinon.SinonSpy;
            let previousLoggerRef: LoggerService;

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
                // @ts-ignore - store reference for testing
                previousLoggerRef = Logger['localInstanceRef'] || Logger['staticInstanceRef'];

                Logger.overrideLogger(false);
            });

            afterEach(() => {
                processStdoutWriteSpy.restore();

                Logger.overrideLogger(previousLoggerRef);
            });

            it('should not print any message to the console', () => {
                const message = 'random message';
                const context = 'RandomContext';

                Logger.log(message, context);

                assertEquals(
                    processStdoutWriteSpy.called,
                    false,
                );
            });
        });
        describe('when custom logger is being used', () => {
            class CustomLogger implements LoggerService {
                log(message: any, context?: string) {
                }

                error(message: any, trace?: string, context?: string) {
                }

                warn(message: any, context?: string) {
                }
            }

            const customLogger = new CustomLogger();
            let previousLoggerRef: LoggerService;

            beforeEach(() => {
                // @ts-ignore - store reference for testing
                previousLoggerRef = Logger["localInstanceRef"] || Logger['staticInstanceRef'];
                Logger.overrideLogger(customLogger);
            });

            afterEach(() => {
                Logger.overrideLogger(previousLoggerRef);
            });

            it('should call custom logger "#log()" method', () => {
                const message = 'random message';
                const context = 'RandomContext';

                const customLoggerLogSpy = sinon.spy(customLogger, 'log');

                Logger.log(message, context);
                assertEquals(customLoggerLogSpy.called, true);
                assertEquals(customLoggerLogSpy.calledWith(message, context), true);
            });

            it('should call custom logger "#error()" method', () => {
                const message = 'random message';
                const context = 'RandomContext';

                const customLoggerErrorSpy = sinon.spy(customLogger, 'error');

                Logger.error(message, context);

                assertEquals(customLoggerErrorSpy.called, true);
                assertEquals(customLoggerErrorSpy.calledWith(message, context), true);
            });
        });
    });

    describe('ConsoleLogger', () => {
        it('should allow setting and resetting of context', () => {
            const logger = new ConsoleLogger();
            assertEquals(logger['context'], undefined);
            logger.setContext('context');
            assertEquals(logger['context'], 'context');
            logger.resetContext();
            assertEquals(logger['context'], undefined);


            const loggerWithContext = new ConsoleLogger('context');
            assertEquals(loggerWithContext['context'], 'context');
            loggerWithContext.setContext('other');
            assertEquals(loggerWithContext['context'], 'other');
            loggerWithContext.resetContext();
            assertEquals(loggerWithContext['context'], 'context');
        });

        describe('functions for message', () => {
            let processStdoutWriteSpy: sinon.SinonSpy;
            const logger = new ConsoleLogger();
            const message = 'Hello World';

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
            });
            afterEach(() => {
                processStdoutWriteSpy.restore();
            });

            it('works', () => {
                logger.log(() => message);

                assertEquals(processStdoutWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    message
                );
                // Ensure we didn't serialize the function itself.
                assertEquals(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg).includes(' => '),
                    false
                );
                assertEquals(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg).includes('function'),
                    false
                );
                assertEquals(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg).includes('Function'),
                    false
                );
            });
        });
    });

    describe('[instance methods]', () => {
        describe('when the default logger is used', () => {
            const logger = new Logger();

            let processStdoutWriteSpy: sinon.SinonSpy;
            let processStderrWriteSpy: sinon.SinonSpy;

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
                processStderrWriteSpy = sinon.spy(Deno.stderr, 'writeSync');
            });

            afterEach(() => {
                processStdoutWriteSpy.restore();
                processStderrWriteSpy.restore();
            });

            it('should print one message to the console', () => {
                const message = 'random message';
                const context = 'RandomContext';

                logger.log(message, context);

                assertEquals(processStdoutWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    message,
                );
            });

            it('should print one message without context to the console', () => {
                const message = 'random message without context';

                logger.log(message);

                assertEquals(processStdoutWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    message
                );
            });

            it('should print multiple messages to the console', () => {
                const messages = [ 'message 1', 'message 2', 'message 3' ];
                const context = 'RandomContext';

                logger.log(messages[0], messages[1], messages[2], context);

                assertEquals(processStdoutWriteSpy.calledThrice, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    `[${ context }]`
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    messages[0],
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    `[${ context }]`
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    messages[1],
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    `[${ context }]`
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    messages[2],
                );
            });

            it('should print one error to the console with context', () => {
                const message = 'random error';
                const context = 'RandomContext';

                logger.error(message, context);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
            });

            it('should print one error to the console with stacktrace', () => {
                const message = 'random error';
                const stacktrace = 'Error: message\n    at <anonymous>:1:2';

                logger.error(message, stacktrace);

                assertEquals(processStderrWriteSpy.calledTwice, true);
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg).includes(`[]`),
                    false
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    stacktrace + '\n',
                );
            });

            it('should print one error without context to the console', () => {
                const message = 'random error without context';

                logger.error(message);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );
            });

            it('should print one error with stacktrace and context to the console', () => {
                const message = 'random error with context';
                const stacktrace = 'stacktrace';
                const context = 'ErrorContext';

                logger.error(message, stacktrace, context);

                assertEquals(processStderrWriteSpy.calledTwice, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message
                );

                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    stacktrace + '\n',
                );
            });

            it('should print 2 errors and one stacktrace to the console', () => {
                const messages = [ 'message 1', 'message 2' ];
                const stack = 'stacktrace';
                const context = 'RandomContext';

                logger.error(messages[0], messages[1], stack, context);

                assertEquals(processStderrWriteSpy.calledThrice, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    messages[0],
                );

                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    `[${ context }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.secondCall.firstArg),
                    messages[1],
                );

                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.thirdCall.firstArg).includes(`[${ context }]`),
                    false
                );
                assertEquals(
                    getStringFromBytes(processStderrWriteSpy.thirdCall.firstArg),
                    stack + '\n'
                );
            });
        });

        describe('when the default logger is used and global context is set and timestamp enabled', () => {
            const globalContext = 'GlobalContext';
            const logger = new Logger(globalContext, { timestamp: true });

            let processStdoutWriteSpy: sinon.SinonSpy;
            let processStderrWriteSpy: sinon.SinonSpy;

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
                processStderrWriteSpy = sinon.spy(Deno.stderr, 'writeSync');
            });

            afterEach(() => {
                processStdoutWriteSpy.restore();
                processStderrWriteSpy.restore();
            });

            it('should print multiple messages to the console and append global context', () => {
                const messages = [ 'message 1', 'message 2', 'message 3' ];

                logger.log(messages[0], messages[1], messages[2]);

                assertEquals(processStdoutWriteSpy.calledThrice, true);
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    `[${ globalContext }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                    messages[0],
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    `[${ globalContext }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    messages[1],
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.secondCall.firstArg),
                    'ms',
                );

                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    `[${ globalContext }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    messages[2],
                );
                assertStringIncludes(
                    getStringFromBytes(processStdoutWriteSpy.thirdCall.firstArg),
                    'ms',
                );
            });

            it('should log out an error to stderr but not include an undefined log', () => {
                const message = 'message 1';

                logger.error(message);

                assertEquals(processStderrWriteSpy.calledOnce, true);
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    `[${ globalContext }]`,
                );
                assertStringIncludes(
                    getStringFromBytes(processStderrWriteSpy.firstCall.firstArg),
                    message,
                );
            });
        });

        describe('when logging is disabled', () => {
            const logger = new Logger();

            let processStdoutWriteSpy: sinon.SinonSpy;
            let previousLoggerRef: LoggerService;

            beforeEach(() => {
                processStdoutWriteSpy = sinon.spy(Deno.stdout, 'writeSync');
                // @ts-ignore - store reference for testing
                previousLoggerRef = Logger['localInstanceRef'] || Logger['staticInstanceRef'];
                Logger.overrideLogger(false);
            });

            afterEach(() => {
                processStdoutWriteSpy.restore();

                Logger.overrideLogger(previousLoggerRef);
            });

            it('should not print any message to the console', () => {
                const message = 'random message';
                const context = 'RandomContext';

                logger.log(message, context);

                assertEquals(processStdoutWriteSpy.called, false);
            });
        });
        describe('when custom logger is being used', () => {
            class CustomLogger implements LoggerService {
                log(message: any, context?: string) {
                }

                error(message: any, trace?: string, context?: string) {
                }

                warn(message: any, context?: string) {
                }
            }

            describe('with global context', () => {
                const customLogger = new CustomLogger();
                const globalContext = 'RandomContext';
                const originalLogger = new Logger(globalContext);

                let previousLoggerRef: LoggerService;

                beforeEach(() => {
                    // @ts-ignore - store reference for testing
                    previousLoggerRef = Logger['localInstanceRef'] || Logger['staticInstanceRef'];
                    Logger.overrideLogger(customLogger);
                });

                afterEach(() => {
                    Logger.overrideLogger(previousLoggerRef);
                });

                it('should call custom logger "#log()" method with context as second argument', () => {
                    const message = 'random log message with global context';

                    const customLoggerLogSpy = sinon.spy(customLogger, 'log');

                    originalLogger.log(message);

                    assertEquals(customLoggerLogSpy.called, true);
                    assertEquals(customLoggerLogSpy.calledWith(message, globalContext), true);
                });
                it('should call custom logger "#error()" method with context as third argument', () => {
                    const message = 'random error message with global context';

                    const customLoggerErrorSpy = sinon.spy(customLogger, 'error');

                    originalLogger.error(message);

                    assertEquals(customLoggerErrorSpy.called, true);
                    assertEquals(
                        customLoggerErrorSpy.calledWith(message, undefined, globalContext),
                        true
                    );
                });
            });
            describe('without global context', () => {
                const customLogger = new CustomLogger();
                const originalLogger = new Logger();

                let previousLoggerRef: LoggerService;

                beforeEach(() => {
                    // @ts-ignore - store reference for testing
                    previousLoggerRef = Logger['localInstanceRef'] || Logger['staticInstanceRef'];
                    Logger.overrideLogger(customLogger);
                });

                afterEach(() => {
                    Logger.overrideLogger(previousLoggerRef);
                });

                it('should call custom logger "#log()" method', () => {
                    const message = 'random message';
                    const context = 'RandomContext';

                    const customLoggerLogSpy = sinon.spy(customLogger, 'log');

                    originalLogger.log(message, context);

                    assertEquals(customLoggerLogSpy.called, true);
                    assertEquals(customLoggerLogSpy.calledWith(message, context), true);
                });

                it('should call custom logger "#error()" method', () => {
                    const message = 'random message';
                    const context = 'RandomContext';

                    const customLoggerErrorSpy = sinon.spy(customLogger, 'error');

                    originalLogger.error(message, undefined, context);

                    assertEquals(customLoggerErrorSpy.called, true);
                    assertEquals(customLoggerErrorSpy.calledWith(message, undefined, context), true);
                });
            });
        });
    });
    describe('ConsoleLogger', () => {
        let processStdoutWriteSpy: sinon.SinonSpy;

        beforeEach(() => {
            processStdoutWriteSpy = sinon.spy(Deno.stdout, 'write');
        });
        afterEach(() => {
            processStdoutWriteSpy.restore();
        });

        it('should support custom formatter', () => {
            class CustomConsoleLogger extends ConsoleLogger {
                protected formatMessage(
                    logLevel: LogLevel,
                    message: unknown,
                    pidMessage: string,
                    formattedLogLevel: string,
                    contextMessage: string,
                    timestampDiff: string,
                ) {
                    return `Prefix: ${ message }`;
                }
            }

            const consoleLogger = new CustomConsoleLogger();
            consoleLogger.debug('test');

            assertEquals(getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg), `Prefix: test`);
        });

        it('should support custom formatter and colorizer', () => {
            class CustomConsoleLogger extends ConsoleLogger {
                protected formatMessage(
                    logLevel: LogLevel,
                    message: unknown,
                    pidMessage: string,
                    formattedLogLevel: string,
                    contextMessage: string,
                    timestampDiff: string,
                ) {
                    const strMessage = this.stringifyMessage(message, logLevel);
                    return `Prefix: ${ strMessage }`;
                }

                protected colorize(message: string, logLevel: LogLevel): string {
                    return `~~~${ message }~~~`;
                }
            }

            const consoleLogger = new CustomConsoleLogger();
            consoleLogger.debug('test');

            assertEquals(
                getStringFromBytes(processStdoutWriteSpy.firstCall.firstArg),
                `Prefix: ~~~test~~~`,
            );
        });

        it.only('should stringify messages', () => {
            class CustomConsoleLogger extends ConsoleLogger {
                protected colorize(message: string, _: LogLevel): string {
                    return message;
                }
            }

            const consoleLogger = new CustomConsoleLogger();
            const consoleLoggerSpy = sinon.spy(consoleLogger, 'stringifyMessage' as keyof ConsoleLogger);
            consoleLogger.debug(
                'str1',
                { key: 'str2' },
                [ 'str3' ],
                [ { key: 'str4' } ],
                null,
                1,
            );

            assertEquals(consoleLoggerSpy.getCall(0).returnValue, 'str1');
            assertEquals(consoleLoggerSpy.getCall(1).returnValue,
                `Object:
{
  "key": "str2"
}
`,
            );
            assertEquals(consoleLoggerSpy.getCall(2).returnValue,
                `Object:
[
  "str3"
]
`,
            );
            assertEquals(consoleLoggerSpy.getCall(3).returnValue,
                `Object:
[
  {
    "key": "str4"
  }
]
`,
            );
            assertEquals(consoleLoggerSpy.getCall(4).returnValue, null);
            assertEquals(consoleLoggerSpy.getCall(5).returnValue, 1);
        });
    });
});