import React from 'react';
export interface DevServerProviderProps {
    url?: string;
    children: React.ReactNode;
}
export declare function DevServerProvider({ url, children }: DevServerProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useDevServerUrl(): string;
export declare const DEV_SERVER_URL: string;
//# sourceMappingURL=DevServerContext.d.ts.map