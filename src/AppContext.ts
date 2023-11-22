import { createContext } from 'react';
import { APP_CONFIG } from './public-constants';
import { AppConfig, UserData } from './types';

export const AppContext = createContext<
    {
        audio: boolean,
        appConfig: AppConfig,
        userData: UserData | undefined,
        guestData: UserData | undefined,
        connect: boolean,
        join: boolean,
        conversationName: string | undefined,
        notify: (message: any) => void
    }>(
        {
            audio: true,
            appConfig: APP_CONFIG,
            userData: undefined,
            guestData: undefined,
            connect: true,
            join: true,
            conversationName: undefined,
            notify: () => { }
        });