import { useState } from 'react'
import { useDevServerUrl } from '../contexts/DevServerContext'

// For backwards compatibility
export const DEV_SERVER_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER) ||
  'http://localhost:4001'

interface SaveFileOptions {
  filePath: string
  elements: any[]
  stateContext?: Record<string, any>  // Mock values used during editing
  // For saving internal components (only update a portion of the file)
  internalComponent?: {
    name: string
    startLine: number
    endLine: number
  }
}

interface SaveFileResponse {
  success: boolean
  filePath?: string
  code?: string
  error?: string
}

interface LoadFileResponse {
  success: boolean
  filePath?: string
  variables?: string[]
  initialValues?: Record<string, any>
  props?: string[]
  raw?: string
  error?: string
}

export interface SnapshotProp {
  name: string
  source: 'originalProp' | 'useState' | 'useContext' | 'customHook' | 'internalConstant'
  initialValue?: any
  type?: string
  hasImportDefault?: boolean
}

export interface InternalComponent {
  name: string
  startLine: number
  endLine: number
  props?: Record<string, { type: string; required: boolean }>
}

export interface CreateSnapshotResponse {
  success: boolean
  componentPath?: string
  snapshotPath?: string
  snapshotComponentName?: string
  componentName?: string
  snapshotProps?: SnapshotProp[]
  initialMockValues?: Record<string, any>
  internalComponents?: InternalComponent[]
  error?: string
}

export interface DraftData {
  componentName: string
  filePath: string
  elements: any[]
  mockValues: Record<string, any>
  savedAt: string
  sourceFileModifiedAt: string | null
}

export interface LoadDraftResponse {
  success: boolean
  draft: DraftData | null
  sourceModifiedSinceDraft?: boolean
  error?: string
}

export interface SaveDraftResponse {
  success: boolean
  componentName?: string
  savedAt?: string
  error?: string
}

export interface DeleteDraftResponse {
  success: boolean
  componentName?: string
  error?: string
}

export interface DraftSummary {
  componentName: string
  filePath: string
  savedAt: string
}

export interface ListDraftsResponse {
  success: boolean
  drafts: DraftSummary[]
  error?: string
}

export interface DraftVersion {
  filename: string
  timestamp: string
  createdAt: string
}

export interface ListDraftVersionsResponse {
  success: boolean
  versions: DraftVersion[]
  error?: string
}

export interface GetDraftVersionResponse {
  success: boolean
  version?: {
    filename: string
    draft: DraftData
  }
  error?: string
}

export interface RestoreDraftVersionResponse {
  success: boolean
  draft?: DraftData
  error?: string
}

export function useDevServer() {
  const devServerUrl = useDevServerUrl()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = async (filePath: string): Promise<LoadFileResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/files/${filePath}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load file')
      }

      // Return file data
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveFile = async (options: SaveFileOptions): Promise<SaveFileResponse> => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/files/${options.filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements: options.elements,
          stateContext: options.stateContext,
          internalComponent: options.internalComponent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save file')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsSaving(false)
    }
  }

  const createSnapshot = async (componentPath: string, componentName?: string): Promise<CreateSnapshotResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/snapshot/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ componentPath, componentName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create snapshot')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadDraft = async (componentName: string): Promise<LoadDraftResponse> => {
    try {
      const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load draft')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        draft: null,
        error: errorMessage,
      }
    }
  }

  const saveDraft = async (params: {
    componentName: string
    filePath: string
    elements: any[]
    mockValues?: Record<string, any>
  }): Promise<SaveDraftResponse> => {
    try {
      const response = await fetch(`${devServerUrl}/api/draft/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save draft')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const deleteDraft = async (componentName: string): Promise<DeleteDraftResponse> => {
    try {
      const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete draft')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const listDrafts = async (): Promise<ListDraftsResponse> => {
    try {
      const response = await fetch(`${devServerUrl}/api/drafts`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to list drafts')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        drafts: [],
        error: errorMessage,
      }
    }
  }

  // Draft version management
  const listDraftVersions = async (componentName: string): Promise<ListDraftVersionsResponse> => {
    try {
      const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to list draft versions')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        versions: [],
        error: errorMessage,
      }
    }
  }

  const getDraftVersion = async (componentName: string, versionFilename: string): Promise<GetDraftVersionResponse> => {
    try {
      const response = await fetch(
        `${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions/${encodeURIComponent(versionFilename)}`,
        { method: 'GET' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get draft version')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const restoreDraftVersion = async (componentName: string, versionFilename: string): Promise<RestoreDraftVersionResponse> => {
    try {
      const response = await fetch(
        `${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions/${encodeURIComponent(versionFilename)}/restore`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore draft version')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  return {
    loadFile,
    saveFile,
    createSnapshot,
    loadDraft,
    saveDraft,
    deleteDraft,
    listDrafts,
    // Draft version management
    listDraftVersions,
    getDraftVersion,
    restoreDraftVersion,
    isLoading,
    isSaving,
    error,
  }
}
