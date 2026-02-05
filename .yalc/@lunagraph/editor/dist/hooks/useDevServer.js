import { useState } from 'react';
import { useDevServerUrl } from '../contexts/DevServerContext';
// For backwards compatibility
export const DEV_SERVER_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER) ||
    'http://localhost:4001';
export function useDevServer() {
    const devServerUrl = useDevServerUrl();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const loadFile = async (filePath) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/files/${filePath}`, {
                method: 'GET',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load file');
            }
            // Return file data
            return data;
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
    const saveFile = async (options) => {
        setIsSaving(true);
        setError(null);
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
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save file');
            }
            return data;
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
    const createSnapshot = async (componentPath, componentName) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${devServerUrl}/api/snapshot/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ componentPath, componentName }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create snapshot');
            }
            return data;
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
    const loadDraft = async (componentName) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}`, {
                method: 'GET',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load draft');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                draft: null,
                error: errorMessage,
            };
        }
    };
    const saveDraft = async (params) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save draft');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    };
    const deleteDraft = async (componentName) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete draft');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    };
    const listDrafts = async () => {
        try {
            const response = await fetch(`${devServerUrl}/api/drafts`, {
                method: 'GET',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to list drafts');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                drafts: [],
                error: errorMessage,
            };
        }
    };
    // Draft version management
    const listDraftVersions = async (componentName) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions`, {
                method: 'GET',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to list draft versions');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                versions: [],
                error: errorMessage,
            };
        }
    };
    const getDraftVersion = async (componentName, versionFilename) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions/${encodeURIComponent(versionFilename)}`, { method: 'GET' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get draft version');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    };
    const restoreDraftVersion = async (componentName, versionFilename) => {
        try {
            const response = await fetch(`${devServerUrl}/api/draft/${encodeURIComponent(componentName)}/versions/${encodeURIComponent(versionFilename)}/restore`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to restore draft version');
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
            };
        }
    };
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
    };
}
