export type AppSettings = {
    apiKey: string,
    cloudUrl: string,
    [key: string]: string;
};

export type AppDataMetadata = {
    installationId: string,
    settings: AppSettings
};

export type AppData = {
    metadata: AppDataMetadata
};