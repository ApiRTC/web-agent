export type LogLevelText = 'debug' | 'info' | 'warn' | 'error';

export type LogLevel = {
    level: LogLevelText
    isDebugEnabled: boolean
    isInfoEnabled: boolean
    isWarnEnabled: boolean
};

const DEBUG: LogLevel = { level: 'debug', isDebugEnabled: true, isInfoEnabled: true, isWarnEnabled: true };
const INFO: LogLevel = { level: 'info', isDebugEnabled: false, isInfoEnabled: true, isWarnEnabled: true };
const WARN: LogLevel = { level: 'warn', isDebugEnabled: false, isInfoEnabled: false, isWarnEnabled: true };
const ERROR: LogLevel = { level: 'error', isDebugEnabled: false, isInfoEnabled: false, isWarnEnabled: false };

declare global {
    var logLevel: LogLevel
}

export function setLogLevel(logLevelText: LogLevelText) {
    switch (logLevelText) {
        case 'debug':
            globalThis.logLevel = DEBUG;
            break
        case 'info':
            globalThis.logLevel = INFO;
            break
        case 'warn':
            globalThis.logLevel = WARN;
            break
        case 'error':
            globalThis.logLevel = ERROR;
            break
        default:
            // in case null is passed as input, default to 'info'
            globalThis.logLevel = INFO;
    }
}