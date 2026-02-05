import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const DEFAULT_DEV_SERVER_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER) ||
    'http://localhost:4001';
const DevServerContext = createContext(DEFAULT_DEV_SERVER_URL);
export function DevServerProvider({ url, children }) {
    const devServerUrl = url || DEFAULT_DEV_SERVER_URL;
    return (_jsx(DevServerContext.Provider, { value: devServerUrl, children: children }));
}
export function useDevServerUrl() {
    return useContext(DevServerContext);
}
// For backwards compatibility - export the default URL
export const DEV_SERVER_URL = DEFAULT_DEV_SERVER_URL;
