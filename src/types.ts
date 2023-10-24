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
};

export type UserData = {
    userId?: string,
    username?: string,
    name?: string
    [key: string]: string | undefined;
}