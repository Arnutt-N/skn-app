declare global {
    interface Window {
        liff: {
            init: (config: { liffId: string }) => Promise<void>;
            isLoggedIn: () => boolean;
            login: () => void;
            logout: () => void;
            getAccessToken: () => string;
            getContext: () => string;
            getOS: () => string;
            getVersion: () => string;
            getLanguage: () => string;
            isInClient: () => boolean;
            isApiAvailable: (name: string) => boolean;
            scanCodeV2: () => Promise<any>;
            openWindow: (url: string) => void;
            getProfile: () => Promise<{
                userId: string;
                displayName: string;
                pictureUrl: string;
                statusMessage: string;
            }>;
            getFriendship: () => Promise<{ friendFlag: boolean }>;
            sendMessages: (messages: any[]) => Promise<void>;
            closeWindow: () => void;
        };
    }
}

export {};
