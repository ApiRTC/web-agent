export type ApiRtcSettings = {
    apiKey: string | undefined,
    cloudUrl: string,
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