import React, { useEffect, useMemo, useState } from 'react';

import { frFR as mui_frFR } from '@mui/material/locale';
import { createTheme, ThemeProvider as MuiThemeProvider, ThemeOptions } from '@mui/material/styles';

import { frFR as ApiRtcMuiReactLib_frFR, setLogLevel as setApiRtcMuiReactLibLogLevel } from '@apirtc/mui-react-lib';
import { setLogLevel as setApiRtcReactLibLogLevel } from '@apirtc/react-lib';

import LogRocket from 'logrocket';

import merge from 'lodash.merge';

import { App } from './App';
import { AppContext } from './AppContext';
import { frFR } from './locale/frFR';
import { LogLevelText, setLogLevel } from './logLevel';
import { InputMessageType, OutputMessageType } from './MessageTypes';
import { APP_CONFIG, DEFAULT_LOG_LEVEL } from './public-constants';
import { AppConfig, UserData } from './types';

// declare var apiRTC:any;

// By default, set this as early as possible, to prevent some error cases to fail
// finding  globalThis.logLevel
setLogLevel(DEFAULT_LOG_LEVEL)

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
    audio = 'a',
    apiKey = 'aK',
    guestUrl = 'gU',
    // TBD: this might become an ApiRTC platform configuration instead (per apiKey or even per userAgent id).
    callStatsMonitoringInterval = 'cSMI', // undocumented
    connect = 'c',
    conversationName = 'cN',
    cloudUrl = 'cU',
    guestName = 'gN',
    guestPhone = 'gP',
    invitationServiceUrl = 'iU',
    installationId = 'iI',
    join = 'j',
    locale = 'l',
    logLevel = 'lL',
    logRocketAppID = 'lRAppID',
    userId = 'uId'
}

const COMPONENT_NAME = "Wrapper";
export function Wrapper() {

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
        }
    });

    const searchParams = useMemo(() => new URLSearchParams(document.location.search), []);

    const logLevel = useMemo(() => {
        return searchParams.get(RequestParameters.logLevel) as LogLevelText ?? 'warn';
    }, [searchParams]);

    useEffect(() => {
        setLogLevel(logLevel)
        setApiRtcReactLibLogLevel(logLevel)
        setApiRtcMuiReactLibLogLevel(logLevel)
        // ApiRTC log level can be set at ApiRTC platform level, per apiKey.
        // Shall we set it here too ?
        //apiRTC.setLogLevel(10)
    }, [logLevel])

    const logRocketAppID = useMemo(() => {
        return searchParams.get(RequestParameters.logRocketAppID);
    }, [searchParams]);

    const { audio } = useMemo(() => {
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|useMemo searchParams`, searchParams);
        }
        return {
            audio: (/true/i).test(searchParams.get(RequestParameters.audio) ?? 'true')
        }
    }, [searchParams]);

    const [locale, setLocale] = React.useState<string>(languageToLocale(navigator.language));

    const [appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG);

    const [userData, setUserData] = useState<UserData>();
    const [guestData, setGuestData] = useState<UserData>();

    const [conversationName, setConversationName] = useState<string>();

    // Theses are set by default to false even if the actual default set by searchParams useEffect is true.
    // This is to prevent multiple rendering if developer-user decides to set them to false in search parameters.
    const [connect, setConnect] = useState<boolean>(false);
    const [join, setJoin] = useState<boolean>(false);

    const theme = useMemo(() => {
        switch (locale) {
            case 'fr':
            case 'fr-FR':
                return createTheme(options, frFR,
                    mui_frFR, ApiRtcMuiReactLib_frFR);
            default:
                return createTheme(options);
        }
    }, [options, locale]); // JSON.stringify(options) not required if we make sure to keep 'options' immutable, which we should always do in React
    // eslint complains about JSON.stringify(options) :
    // React Hook useMemo has a complex expression in the dependency array.
    // Extract it to a separate variable so it can be statically checked.eslintreact-hooks/exhaustive-deps

    // ------------------------------------------------------------------------
    // Effects

    useEffect(() => {
        // setup logRocket
        if (logRocketAppID && logRocketAppID !== '') {
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|logRocket init`, logRocketAppID);
            }
            LogRocket.init(logRocketAppID);
        }
    }, [logRocketAppID])

    // Inbound messages handling
    //
    useEffect(() => {
        const receiveMessage = (event: any) => {
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
        };
        window.addEventListener('message', receiveMessage, false);

        // Notify the application is ready to receive messages
        window.parent.postMessage({
            type: OutputMessageType.Ready
        }, '*')// '*') | window.parent.origin -> DOMException: Permission denied to access property "origin" 

        return () => {
            window.removeEventListener('message', receiveMessage);
        }
    }, []);

    useEffect(() => {

        const l_appConfig: AppConfig = merge(APP_CONFIG, {
            installationId: searchParams.get(RequestParameters.installationId) ?? undefined,
            apiRtc: {
                cloudUrl: searchParams.get(RequestParameters.cloudUrl) ?? undefined,
                apiKey: searchParams.get(RequestParameters.apiKey) ?? undefined,
                callStatsMonitoringInterval: searchParams.get(RequestParameters.callStatsMonitoringInterval) ?? undefined,
            },
            guestUrl: searchParams.get(RequestParameters.guestUrl) ?? undefined,
            invitationServiceUrl: searchParams.get(RequestParameters.invitationServiceUrl) ?? undefined,
            logLevel,
            logRocketAppID
        });

        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|init appConfig`, l_appConfig);
        }

        // force new object, to enable react state change detection
        setAppConfig({ ...l_appConfig });

        const userId: string | null = searchParams.get(RequestParameters.userId);
        if (userId) {
            setUserData({ userId })
        }

        // connect by default
        setConnect((/true/i).test(searchParams.get(RequestParameters.connect) ?? 'true'))

        // join by default
        setJoin((/true/i).test(searchParams.get(RequestParameters.join) ?? 'true'))

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

    }, [searchParams, logLevel, logRocketAppID])

    useEffect(() => {
        // To update <html lang='en'> attribute with correct language
        document.documentElement.setAttribute('lang', locale.slice(0, 2))
    }, [locale]);

    return <MuiThemeProvider theme={theme}>
        <AppContext.Provider value={{
            audio,
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