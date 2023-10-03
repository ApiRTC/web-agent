import { createContext } from 'react';
import { APP_CONFIG } from './public-constants';
import { AppConfig, UserData } from './types';

export const AppContext = createContext<
    {
        appConfig: AppConfig,
        userData: UserData | undefined,
        guestData: UserData | undefined,
        connect: boolean,
        join: boolean,
        allowAudio: boolean,
        conversationName: string | undefined,
        notify: (level: 'info' | 'error' | 'warn', message: string) => void
    }>(
        {
            appConfig: APP_CONFIG,
            userData: undefined,
            guestData: undefined,
            connect: true,
            join: true,
            allowAudio: true,
            conversationName: undefined,
            notify: () => { }
        });