import { useState } from 'react';
import { useDevServerUrl } from '../contexts/DevServerContext';
export function useCanvasPersistence() {
    const devServerUrl = useDevServerUrl();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const saveCanvas = async (params) => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to save canvas');
            }
            return {
                success: true,
                canvas: result.canvas,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsSaving(false);
        }
    };
    const loadCanvas = async (canvasId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}`);
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to load canvas');
            }
            return {
                success: true,
                canvas: result.canvas,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsLoading(false);
        }
    };
    const listCanvases = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas`);
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to list canvases');
            }
            return {
                success: true,
                canvases: result.canvases,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
                canvases: [],
            };
        }
        finally {
            setIsLoading(false);
        }
    };
    const createComponent = async (params) => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/${params.canvasId}/component`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    componentName: params.componentName,
                    code: params.code,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to create component');
            }
            return {
                success: true,
                componentName: result.componentName,
                path: result.path,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsSaving(false);
        }
    };
    const createComponentFromFile = async (params) => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/component/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceFilePath: params.sourceFilePath,
                    componentName: params.componentName,
                    code: params.code,
                }),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to create component');
            }
            return {
                success: true,
                componentName: result.componentName,
                path: result.path,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsSaving(false);
        }
    };
    // List available versions for a canvas
    const listCanvasVersions = async (canvasId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/versions`);
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to list versions');
            }
            return {
                success: true,
                versions: result.versions,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
                versions: [],
            };
        }
        finally {
            setIsLoading(false);
        }
    };
    // Get a specific version's content (for preview)
    const getCanvasVersion = async (canvasId, versionFilename) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/versions/${versionFilename}`);
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to get version');
            }
            return {
                success: true,
                version: result.version,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsLoading(false);
        }
    };
    // Restore canvas from a specific version
    const restoreCanvasVersion = async (canvasId, versionFilename) => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/canvas/${canvasId}/versions/${versionFilename}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to restore version');
            }
            return {
                success: true,
                canvas: result.canvas,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
        finally {
            setIsSaving(false);
        }
    };
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
    };
}
