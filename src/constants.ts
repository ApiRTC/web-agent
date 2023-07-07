export const MAX_HEIGHT = 1280;
export const RESIZE_CONTAINER_DELAY = 750;

// radius used for images attached to a comment in Zendesk is 5px
// but Apizee UX recommended a multiple of 4px, and most mui radius seem to be 4px by default
export const VIDEO_ROUNDED_CORNERS = { borderRadius: '4px', overflow: 'hidden' };

export const CODECS = { supportedVideoCodecs: ["vp9"] };

export const DEFAULT_INSTALLATION_ID = 'agent-room';
export const DEFAULT_CLOUD_URL = 'https://cloud.apirtc.com';
export const DEFAULT_ASSISTED_URL = 'https://apirtc.github.io/visio-assisted';

export const DEFAULT_APP_CONFIG = {
    installationId: DEFAULT_INSTALLATION_ID,
    apiRtc: { cloudUrl: DEFAULT_CLOUD_URL, apiKey: undefined },
    assistedUrl: DEFAULT_ASSISTED_URL
};

export const ROOM_THEME_OPTIONS = {
    components: {
        MuiChip: {
            variants: [
                {
                    props: {},
                    style: {
                        color: '#F7F7F8',
                        backgroundColor: '#111313',
                        borderRadius: '4px',
                        opacity: '75%',
                        ':hover': {
                            backgroundColor: '#1D1F20',
                            opacity: '100%',
                        }
                    },
                },
            ],
        },
        MuiCircularProgress: {
            variants: [
                {
                    props: {},
                    style: {
                        color: '#F7F7F8',
                    },
                },
            ],
        },
        MuiIconButton: {
            variants: [
                {
                    props: {},
                    style: {
                        padding: 4,
                        margin: 2,
                        color: '#F7F7F8',
                        backgroundColor: '#111313',
                        borderRadius: '4px',
                        opacity: '75%',
                        ':hover': {
                            backgroundColor: '#1D1F20',
                            opacity: '100%',
                        },
                        ':disabled': {
                            color: '#7A8085',
                            backgroundColor: '#CACCCE',
                            opacity: '75%',
                        }
                    },
                },
            ],
        },
    }
};