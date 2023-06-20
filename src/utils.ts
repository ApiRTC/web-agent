export const getFromLocalStorage = (key: string, defaultValue: any): string => {
    try {
        return localStorage.getItem(key) ?? defaultValue;
    } catch (error: any) {
        if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`getFromLocalStorage caught error`, error)
        }
        return defaultValue
    }
};

export const setLocalStorage = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value)
    } catch (error: any) {
        if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`setLocalStorage caught error`, error)
        }
    }
};