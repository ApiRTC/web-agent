import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { frFR as mui_frFR } from '@mui/material/locale';
import { createTheme, ThemeProvider as MuiThemeProvider, ThemeOptions } from '@mui/material/styles';

import { frFR as ApiRtcMuiReactLib_frFR, setLogLevel as setApiRtcMuiReactLibLogLevel } from '@apirtc/mui-react-lib';
import { setLogLevel as setApiRtcReactLibLogLevel } from '@apirtc/react-lib';

import merge from 'lodash.merge';

import { App } from './App';
import { AppContext } from './AppContext';
import { frFR } from './locale/frFR';
import { setLogLevel, LogLevelText } from './logLevel';
import { APP_CONFIG } from './public-constants';
import { AppConfig, UserData } from './types';
import { InputMessageType, OutputMessageType } from './MessageTypes';
// import { useSearchParams } from 'react-router-dom';

// declare var apiRTC:any;

// By default, set this as early as possible, to prevent some error cases to fail
// finding  globalThis.logLevel
setLogLevel('warn')

const languageToLocale = (language: string) => {
    switch (language) {
        case 'fr':
            return 'fr-FR'
        default:
            return 'en-US'
    }
};

const APZ_ORANGE = "#F76B40";

// export type ConversationEvent = { type: 'conversation', name: string };
// function isInstanceOfConversationEvent(object: any): object is ConversationEvent {
//     if (typeof object !== 'object') return false;
//     return 'type' in object && object['type'] === 'conversation';
// }

enum RequestParameters {
    apiKey = "aK",
    assistedUrl = "aU",
    connect = "c",
    conversationName = "cN",
    cloudUrl = "cU",
    guestName = "gN",
    guestPhone = "gP",
    invitationServiceUrl = "iU",
    installationId = "iI",
    join = "j",
    locale = "l",
    logLevel = "lL",
    userId = "uId",
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

    const [appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG);

    const [userData, setUserData] = useState<UserData>();
    const [guestData, setGuestData] = useState<UserData>();

    const [conversationName, setConversationName] = useState<string>();

    const [connect, setConnect] = useState<boolean>(false);
    const [join, setJoin] = useState<boolean>(false);

    const [withAudio, setWithAudio] = useState<boolean | undefined>(undefined);
    const [withVideo, setWithVideo] = useState<boolean | undefined>(undefined);

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

    const receiveMessage = useCallback((event: any) => {
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|receives event`, event);
        }

        if (event.data instanceof Object && event.data.type === 'webPackWarnings') {
            return
        }

        // if (event.origin !== "http://example.org:8080") return;
        // …

        try {
            const message = event.data;

            if (globalThis.logLevel.isInfoEnabled) {
                console.info(`${COMPONENT_NAME}|receives message|${conversationName}`, message);
            }

            switch (message.type) {
                case InputMessageType.Configuration: {
                    setAppConfig((prev) => {
                        const appConfig = merge(prev, message.data);
                        if (globalThis.logLevel.isDebugEnabled) {
                            console.debug(`${COMPONENT_NAME}|appConfig`, appConfig);
                        }
                        // force new object, to enable react state change detection
                        return { ...appConfig }
                    })
                    break;
                }
                case InputMessageType.Connect: {
                    setConnect(true)
                    break;
                }
                case InputMessageType.Conversation: {
                    setConversationName(message.name)
                    break;
                }
                case InputMessageType.Disconnect: {
                    setConnect(false)
                    break;
                }
                case InputMessageType.GuestData: {
                    setGuestData(message.data)
                    break;
                }
                case InputMessageType.Join: {
                    setJoin(true)
                    break;
                }
                case InputMessageType.Leave: {
                    setJoin(false)
                    break;
                }
                case InputMessageType.UserData: {
                    setUserData(message.data)
                    break;
                }
                default:
                    if (globalThis.logLevel.isWarnEnabled) {
                        console.warn(`${COMPONENT_NAME}|receiveMessage, unknown message.type ${message.type}.`);
                    }
            }
        } catch (error) {
            console.error(`${COMPONENT_NAME}|receiveMessage error`, error)
        }
    }, [conversationName]);

    useEffect(() => {
        window.addEventListener('message', receiveMessage, false);
        return () => {
            window.removeEventListener('message', receiveMessage);
        }
    }, [receiveMessage]);

    useEffect(() => {
        // Notify the application is ready to receive messages
        setTimeout(() => {
            window.parent.postMessage({
                type: OutputMessageType.Ready
            }, '*')// '*') | window.parent.origin -> DOMException: Permission denied to access property "origin" 
        }, 100)
    }, []);

    useEffect(() => {
        const logLevel: LogLevelText = searchParams.get(RequestParameters.logLevel) as LogLevelText ?? 'warn';
        setLogLevel(logLevel)
        setApiRtcReactLibLogLevel(logLevel)
        setApiRtcMuiReactLibLogLevel(logLevel)
        //apiRTC.setLogLevel(10)

        const l_appConfig = merge(APP_CONFIG, {
            installationId: searchParams.get(RequestParameters.installationId) ?? undefined,
            apiRtc: {
                cloudUrl: searchParams.get(RequestParameters.cloudUrl) ?? undefined,
                apiKey: searchParams.get(RequestParameters.apiKey) ?? undefined
            },
            assistedUrl: searchParams.get(RequestParameters.assistedUrl) ?? undefined,
            invitationServiceUrl: searchParams.get(RequestParameters.invitationServiceUrl) ?? undefined,
        })
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|init appConfig`, l_appConfig);
        }
        // force new object, to enable react state change detection
        setAppConfig({ ...l_appConfig });

        const userId: string | null = searchParams.get(RequestParameters.userId);
        if (userId) {
            setUserData({ userId })
        }

        setConnect((/true/i).test(searchParams.get(RequestParameters.connect) ?? 'false'))

        setJoin((/true/i).test(searchParams.get(RequestParameters.join) ?? 'false'))

        // guest data
        const guestName: string | null = searchParams.get(RequestParameters.guestName);
        const guestPhone: string | null = searchParams.get(RequestParameters.guestPhone);
        if (guestName || guestPhone) {
            setGuestData({ ...(guestName ? { name: guestName } : {}), ...(guestPhone ? { phone: guestPhone } : {}) })
        }

        const conversationName: string | null = searchParams.get(RequestParameters.conversationName);
        if (conversationName) {
            setConversationName(conversationName)
        }

        const locale: string | null = searchParams.get(RequestParameters.locale);
        if (locale) {
            setLocale(locale)
        }

    }, [searchParams])

    useEffect(() => {
        // To update <html lang='en'> attribute with correct language
        document.documentElement.setAttribute('lang', locale.slice(0, 2))
    }, [locale]);

    return <MuiThemeProvider theme={theme}>
        <AppContext.Provider value={{
            appConfig,
            userData,
            guestData,
            join, connect,
            conversationName, notify: () => { }
        }}>
            <App />
        </AppContext.Provider>
    </MuiThemeProvider>
}