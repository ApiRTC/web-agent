// In a private navigation window access to local storage is not allowed and triggers an exception.
// Going through theses methods prevents from such problems.

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