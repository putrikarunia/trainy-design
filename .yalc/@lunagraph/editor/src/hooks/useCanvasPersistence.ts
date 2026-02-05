import { useState } from 'react'
import type { CanvasData } from '@lunagraph/codegen'
import type { FEElement } from '../components/types'
import { useDevServerUrl } from '../contexts/DevServerContext'

interface SaveCanvasParams {
  id?: string
  name: string
  elements: FEElement[]
  zoom?: number
  pan?: { x: number; y: number }
  metadata?: {
    description?: string
    tags?: string[]
  }
}

interface CreateComponentParams {
  canvasId: string
  componentName: string
  code: string
}

interface CreateComponentFromFileParams {
  sourceFilePath: string  // e.g., "components/ProductList.tsx"
  componentName: string   // e.g., "ProductCard"
  code: string
}

export interface CanvasVersion {
  filename: string
  timestamp: string
  createdAt: string
}

export function useCanvasPersistence() {
  const devServerUrl = useDevServerUrl()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveCanvas = async (params: SaveCanvasParams) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/canvas/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save canvas')
      }

      return {
        success: true,
        canvas: result.canvas as CanvasData,
      }
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

  const loadCanvas = async (canvasId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load canvas')
      }

      return {
        success: true,
        canvas: result.canvas as CanvasData,
      }
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

  const listCanvases = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/canvas`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to list canvases')
      }

      return {
        success: true,
        canvases: result.canvases as CanvasData[],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        canvases: [],
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createComponent = async (params: CreateComponentParams) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `${devServerUrl}/api/canvas/${params.canvasId}/component`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentName: params.componentName,
            code: params.code,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create component')
      }

      return {
        success: true,
        componentName: result.componentName,
        path: result.path,
      }
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

  const createComponentFromFile = async (params: CreateComponentFromFileParams) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `${devServerUrl}/api/component/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceFilePath: params.sourceFilePath,
            componentName: params.componentName,
            code: params.code,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create component')
      }

      return {
        success: true,
        componentName: result.componentName,
        path: result.path,
      }
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

  // List available versions for a canvas
  const listCanvasVersions = async (canvasId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/versions`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to list versions')
      }

      return {
        success: true,
        versions: result.versions as CanvasVersion[],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        versions: [] as CanvasVersion[],
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Get a specific version's content (for preview)
  const getCanvasVersion = async (canvasId: string, versionFilename: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/versions/${versionFilename}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get version')
      }

      return {
        success: true,
        version: result.version as { filename: string; canvas: CanvasData },
      }
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

  // Restore canvas from a specific version
  const restoreCanvasVersion = async (canvasId: string, versionFilename: string) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `${devServerUrl}/api/canvas/${canvasId}/versions/${versionFilename}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to restore version')
      }

      return {
        success: true,
        canvas: result.canvas as CanvasData,
      }
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

  return {
    saveCanvas,
    loadCanvas,
    listCanvases,
    createComponent,
    createComponentFromFile,
    // Version management
    listCanvasVersions,
    getCanvasVersion,
    restoreCanvasVersion,
    isSaving,
    isLoading,
    error,
  }
}
