import { createContext } from 'react';
import { AppData } from './ZAF';

export const AppContext = createContext<
    {
        appData: AppData,
        activated: boolean,
        userId: string | undefined,
        conversationName: string | undefined,
        notify: (level: 'info' | 'error' | 'warn', message: string) => void
    }>(
        {
            appData: { metadata: { installationId: '', settings: { apiKey: 'myDemoApiKey', cloudUrl: 'https://cloud.apirtc.com' } } },
            activated: true,
            userId: undefined,
            conversationName: undefined,
            notify: () => { }
        });