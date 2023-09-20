import { createContext } from 'react';
import { DEFAULT_APP_CONFIG } from './constants';
import { AppConfig, UserData } from './types';

export const AppContext = createContext<
    {
        appConfig: AppConfig,
        userData: UserData | undefined,
        guestData: UserData | undefined,
        connect: boolean,
        join: boolean,
        conversationName: string | undefined,
        notify: (level: 'info' | 'error' | 'warn', message: string) => void
    }>(
        {
            appConfig: DEFAULT_APP_CONFIG,
            userData: undefined,
            guestData: undefined,
            connect: true,
            join: true,
            conversationName: undefined,
            notify: () => { }
        });