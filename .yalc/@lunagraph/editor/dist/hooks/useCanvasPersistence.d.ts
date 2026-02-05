import type { CanvasData } from '@lunagraph/codegen';
import type { FEElement } from '../components/types';
interface SaveCanvasParams {
    id?: string;
    name: string;
    elements: FEElement[];
    zoom?: number;
    pan?: {
        x: number;
        y: number;
    };
    metadata?: {
        description?: string;
        tags?: string[];
    };
}
interface CreateComponentParams {
    canvasId: string;
    componentName: string;
    code: string;
}
interface CreateComponentFromFileParams {
    sourceFilePath: string;
    componentName: string;
    code: string;
}
export interface CanvasVersion {
    filename: string;
    timestamp: string;
    createdAt: string;
}
export declare function useCanvasPersistence(): {
    saveCanvas: (params: SaveCanvasParams) => Promise<{
        success: boolean;
        canvas: CanvasData;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        canvas?: undefined;
    }>;
    loadCanvas: (canvasId: string) => Promise<{
        success: boolean;
        canvas: CanvasData;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        canvas?: undefined;
    }>;
    listCanvases: () => Promise<{
        success: boolean;
        canvases: CanvasData[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        canvases: never[];
    }>;
    createComponent: (params: CreateComponentParams) => Promise<{
        success: boolean;
        componentName: any;
        path: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        componentName?: undefined;
        path?: undefined;
    }>;
    createComponentFromFile: (params: CreateComponentFromFileParams) => Promise<{
        success: boolean;
        componentName: any;
        path: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        componentName?: undefined;
        path?: undefined;
    }>;
    listCanvasVersions: (canvasId: string) => Promise<{
        success: boolean;
        versions: CanvasVersion[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        versions: CanvasVersion[];
    }>;
    getCanvasVersion: (canvasId: string, versionFilename: string) => Promise<{
        success: boolean;
        version: {
            filename: string;
            canvas: CanvasData;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        version?: undefined;
    }>;
    restoreCanvasVersion: (canvasId: string, versionFilename: string) => Promise<{
        success: boolean;
        canvas: CanvasData;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        canvas?: undefined;
    }>;
    isSaving: boolean;
    isLoading: boolean;
    error: string | null;
};
export {};
//# sourceMappingURL=useCanvasPersistence.d.ts.map