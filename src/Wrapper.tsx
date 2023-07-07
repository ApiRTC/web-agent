import React, { useEffect, useMemo, useState } from 'react';

import { frFR as mui_frFR } from '@mui/material/locale';
import { createTheme, ThemeProvider as MuiThemeProvider, ThemeOptions } from '@mui/material/styles';

import { frFR as ApiRtcMuiReactLib_frFR, setLogLevel as setApiRtcMuiReactLibLogLevel } from '@apirtc/mui-react-lib';
import { setLogLevel as setApiRtcReactLibLogLevel } from '@apirtc/react-lib';

import { App } from './App';
import { AppContext } from './AppContext';
import { frFR } from './locale/frFR';
import { setLogLevel, LogLevelText } from './logLevel';
import { DEFAULT_APP_CONFIG } from './constants';
import { AppConfig, UserData } from './types';
// import { useSearchParams } from 'react-router-dom';

// declare var apiRTC:any;

const languageToLocale = (language: string) => {
    switch (language) {
        case 'fr':
            return 'fr-FR'
        default:
            return 'en-US'
    }
};

const APZ_ORANGE = "#F76B40";

export type ConversationEvent = { type: 'conversation', name: string };
function isInstanceOfConversationEvent(object: any): object is ConversationEvent {
    if (typeof object !== 'object') return false;
    return 'type' in object && object['type'] === 'conversation';
}

export type WrapperProps = {
    //  client: any,
};
const COMPONENT_NAME = "Wrapper";
export function Wrapper(
    // props: WrapperProps
) {

    const [options] = useState<ThemeOptions>({
        palette: {
            mode: "light",
            primary: {
                main: APZ_ORANGE,
                light: "#ba3108",
                dark: "#f88562"
            },
            secondary: {
                main: "#5b5baf",
                light: "#8eabc7",
                dark: "#2e455c"
            }
        },
        typography: {
            button: {
                textTransform: 'none',
                letterSpacing: 0.25,
            }
        },
        components: {
            MuiAccordion: {
                variants: [
                    {
                        props: {},
                        style: {
                            boxShadow: 'none'
                        },
                    },
                ],
            },
            MuiAccordionSummary: {
                variants: [
                    {
                        props: {},
                        style: {
                            backgroundColor: '#F8F9F9'
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
                            // color: '#111313',
                            // backgroundColor: '#F76B40',
                            // borderRadius: '4px',
                            color: '#2E455C',
                            backgroundColor: '#F7F7F8',
                            borderRadius: '4px',
                            border: '2px solid #2E455C',
                            // opacity: '75%',
                            ':hover': {
                                //backgroundColor: '#F88562',
                                color: '#1D2C3A',
                                backgroundColor: 'D3DEE9',
                                // opacity: '100%',
                            },
                            ':disabled': {
                                color: '#7A8085',
                                backgroundColor: '#CACCCE',
                                // opacity: '75%',
                            }
                        },
                    },
                ],
            },
        }
    });

    // const [searchParams] = useSearchParams();
    const searchParams = useMemo(() => new URLSearchParams(document.location.search), []);

    const [locale, setLocale] = React.useState<string>(languageToLocale(navigator.language));

    const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);

    const [userData, setUserData] = useState<UserData>();
    const [inviteeData, setInviteeData] = useState<UserData>();

    const [conversationName, setConversationName] = useState<string>();

    const [activated, setActivated] = useState<boolean>(true);

    const theme = useMemo(() => {
        switch (locale) {
            case 'fr':
            case 'fr-FR':
                return createTheme(options, frFR,
                    mui_frFR, ApiRtcMuiReactLib_frFR);
            default:
                return createTheme(options);
        }
    }, [JSON.stringify(options), locale]);

    // ------------------------------------------------------------------------
    // Effects

    useEffect(() => {
        setAppConfig({
            installationId: searchParams.get("iI") ?? DEFAULT_APP_CONFIG.installationId,
            apiRtc: {
                cloudUrl: searchParams.get("cU") ?? DEFAULT_APP_CONFIG.apiRtc.cloudUrl,
                apiKey: searchParams.get("aK") ?? DEFAULT_APP_CONFIG.apiRtc.apiKey
            },
            assistedUrl: searchParams.get("aU") ?? DEFAULT_APP_CONFIG.assistedUrl
        });

        const userId: string | null = searchParams.get("uId");
        if (userId) {
            setUserData({ userId })
        }
        const inviteeName: string | null = searchParams.get("iN");
        if (inviteeName) {
            setInviteeData({ name: inviteeName })
        }
        const conversationName: string | null = searchParams.get("cN");
        if (conversationName) {
            setConversationName(conversationName)
        }

        const logLevel: LogLevelText = searchParams.get("lL") as LogLevelText ?? 'warn';
        setLogLevel(logLevel)
        setApiRtcReactLibLogLevel(logLevel)
        setApiRtcMuiReactLibLogLevel(logLevel)
        //apiRTC.setLogLevel(10)

        const locale: string | null = searchParams.get("l");
        if (locale) {
            setLocale(locale)
        }

    }, [searchParams])

    useEffect(() => {

        const receiveMessage = (event: any) => {
            console.log('iframe receives message:', event);

            if (event.data instanceof Object && event.data.type === 'webPackWarnings') {
                return
            }

            // if (event.origin !== "http://example.org:8080") return;
            // …

            try {
                const message = event.data;

                // on conversation,
                if (isInstanceOfConversationEvent(message)) {
                    setConversationName(message.name)
                }

                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|receives message`, message);
                }

                switch (message.type) {
                    case 'app_config': {
                        setAppConfig(message.data)
                        break;
                    }
                    case 'user_data': {
                        setUserData(message.data)
                        break;
                    }
                    case 'invitee_data': {
                        setInviteeData(message.data)
                        break;
                    }
                    default:
                        console.log(`${COMPONENT_NAME}|Unknown message.type ${message.type}.`);
                }

            } catch (error) {
                console.error('Error', error)
            }

        };

        window.addEventListener('message', receiveMessage, false);

        // Notify the application is ready to receive messages
        window.parent.postMessage({
            type: 'ready'
        }, '*')

        return () => {
            window.removeEventListener('message', receiveMessage);
        }
    }, []);

    useEffect(() => {
        // To update <html lang='en'> attribute with correct language
        document.documentElement.setAttribute('lang', locale.slice(0, 2))
    }, [locale]);

    // useEffect(() => {

    //     client.context().then((context: any) => {
    //         if (globalThis.logLevel.isInfoEnabled) {
    //             console.info(`${COMPONENT_NAME}|client context`, context)
    //         }
    //         setContext(context)
    //     })

    //     client.get(['currentUser', 'isCollapsed']).then((data: any) => {
    //         // Get locale configured by the current user
    //         if (data['currentUser'].locale) {
    //             setLocale(data['currentUser'].locale.toLowerCase())
    //         }
    //         setExpanded(!data.isCollapsed)
    //     });

    //     const onAppExpanded = () => {
    //         if (globalThis.logLevel.isDebugEnabled) {
    //             console.debug(`${COMPONENT_NAME}|app.expanded`)
    //         }
    //         setExpanded(true)
    //     };
    //     client.on('app.expanded', onAppExpanded)

    //     const onAppCollapsed = () => {
    //         if (globalThis.logLevel.isDebugEnabled) {
    //             console.debug(`${COMPONENT_NAME}|app.collapsed`)
    //         }
    //         setExpanded(false)
    //     };
    //     client.on('app.collapsed', onAppCollapsed)

    //     const onAppDeactivated = (data: any) => {
    //         if (globalThis.logLevel.isDebugEnabled) {
    //             console.debug(`${COMPONENT_NAME}|app.deactivated`)
    //         }
    //         setActivated(false)
    //     };
    //     client.on('app.deactivated', onAppDeactivated)

    //     const onAppActivated = (data: any) => {
    //         if (globalThis.logLevel.isDebugEnabled) {
    //             console.debug(`${COMPONENT_NAME}|app.activated`)
    //         }
    //         setActivated(true)
    //     };
    //     client.on('app.activated', onAppActivated)

    //     return () => {
    //         client.off('app.expanded', onAppExpanded)
    //         client.off('app.collapsed', onAppCollapsed)
    //         client.off('app.deactivated', onAppDeactivated)
    //         client.off('app.activated', onAppActivated)
    //     }
    // }, [client]);

    return <MuiThemeProvider theme={theme}>
        <AppContext.Provider value={{
            appConfig,
            userData,
            inviteeData,
            activated, conversationName, notify: () => { }
        }}>
            <App />
        </AppContext.Provider>
    </MuiThemeProvider>
}