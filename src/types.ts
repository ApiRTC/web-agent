
export type ApiRtcSettings = {
    apiKey?: string,
    cloudUrl: string,
    callStatsMonitoringInterval?: number
    // [key: string]: string;
};

export type AppConfig = {
    installationId: string,
    apiRtc: ApiRtcSettings,
    guestUrl: string,
    invitationServiceUrl: string,
    logLevel: string,
    logRocketAppID: string | undefined
};

// TODO: publish timeline events with postMessage for iframe host to know about them !
// Needs more standardization probably !
export type TimelineEvent = {
    severity: 'success' | 'info' | 'warning' | 'error',
    name: string | undefined,
    message: string,
    dataUrl?: string,
    dateTime: Date
};

export type UserData = {
    userId?: string,
    username?: string,
    name?: string
    [key: string]: string | undefined;
}