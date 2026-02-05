import { type ComponentIndex } from '@lunagraph/codegen';
import type { FEElement } from './types';
export interface EditorTab {
    id: string;
    name: string;
    type: 'canvas' | 'file';
    elements: FEElement[];
    canvasId?: string;
    canvasPath?: string;
    canvasSaved?: boolean;
    filePath?: string;
    variables?: string[];
    initialValues?: Record<string, any>;
    props?: string[];
    mockValues?: Record<string, any>;
    snapshotComponentName?: string;
    snapshotVersion?: number;
    snapshotProps?: Array<{
        name: string;
        source: string;
        initialValue?: any;
        type?: string;
        options?: string[];
        hasImportDefault?: boolean;
    }>;
    sourceCode?: string;
    renderMode?: 'felement' | 'snapshot';
    hasUnsavedChanges?: boolean;
    lastSavedElements?: string;
    loadedFromDraft?: boolean;
    internalComponents?: Array<{
        name: string;
        startLine: number;
        endLine: number;
        props?: Record<string, {
            type: string;
            required: boolean;
        }>;
    }>;
    isInternalComponent?: boolean;
    parentFilePath?: string;
    internalComponentName?: string;
    internalComponentRange?: {
        startLine: number;
        endLine: number;
    };
    transform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
}
interface BottomBarProps {
    tab: EditorTab;
    onSaveSuccess?: (filePath: string) => void;
    onDiscardDraft?: () => void;
    readOnly?: boolean;
    selectedElementId: string | null;
    elements: FEElement[];
    componentIndex: ComponentIndex;
}
export declare function BottomBar({ tab, onSaveSuccess, onDiscardDraft, readOnly, selectedElementId, elements, componentIndex }: BottomBarProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BottomBar.d.ts.map