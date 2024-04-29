export const INSTALLATION_ID = 'apirtc-web-agent';
export const CLOUD_URL = 'https://cloud.apirtc.com';
export const GUEST_URL = 'https://app.valid2.apizee.com/0.1/web-guest';
export const INVITATION_SERVICE_URL = 'https://is.apizee.com/invitations';
export const DEFAULT_LOG_LEVEL = 'warn';

export const APP_CONFIG = {
    installationId: INSTALLATION_ID,
    apiRtc: { cloudUrl: CLOUD_URL, apiKey: undefined, callStatsMonitoringInterval: undefined },
    guestUrl: GUEST_URL,
    invitationServiceUrl: INVITATION_SERVICE_URL,
    logLevel: DEFAULT_LOG_LEVEL,
    logRocketAppID: undefined
};