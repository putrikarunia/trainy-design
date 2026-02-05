import React, { createContext, useContext } from 'react'

const DEFAULT_DEV_SERVER_URL = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER) || 
  'http://localhost:4001'

const DevServerContext = createContext<string>(DEFAULT_DEV_SERVER_URL)

export interface DevServerProviderProps {
  url?: string
  children: React.ReactNode
}

export function DevServerProvider({ url, children }: DevServerProviderProps) {
  const devServerUrl = url || DEFAULT_DEV_SERVER_URL
  return (
    <DevServerContext.Provider value={devServerUrl}>
      {children}
    </DevServerContext.Provider>
  )
}

export function useDevServerUrl(): string {
  return useContext(DevServerContext)
}

// For backwards compatibility - export the default URL
export const DEV_SERVER_URL = DEFAULT_DEV_SERVER_URL
