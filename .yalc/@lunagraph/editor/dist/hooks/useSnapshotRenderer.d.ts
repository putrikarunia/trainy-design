import * as React from 'react';
import { type FEElement } from '@lunagraph/codegen';
import type { IconLibraryConfig } from '../components/types';
interface UseSnapshotRendererOptions {
    /** Name of the snapshot component (e.g., "ButtonSnapshot") */
    snapshotComponentName: string | null | undefined;
    /** Mock values to pass as props to the snapshot */
    mockValues: Record<string, any>;
    /** Map of snapshot component names to actual components */
    snapshots: Record<string, React.ComponentType<any>>;
    /** Map of component names to actual components (for displayName lookup) */
    components: Record<string, React.ComponentType<any>>;
    /** Icon library configurations */
    iconLibraries?: Record<string, IconLibraryConfig>;
    /** Key to force re-render when mockValues changes */
    key?: string;
}
interface UseSnapshotRendererResult {
    /** The parsed FEElements from the snapshot */
    elements: FEElement[];
    /** React element to render (renders the snapshot invisibly to capture its output) */
    rendererElement: React.ReactElement | null;
}
/**
 * Renders a snapshot component with mock values and converts to FEElements.
 *
 * This hook returns:
 * 1. `elements` - The parsed FEElements for the canvas
 * 2. `rendererElement` - A React element that must be rendered in the component tree
 *    (renders invisibly but allows snapshot hooks to execute in proper React context)
 *
 * The snapshot component calls back with its React element tree via __onRender.
 * We then recursively expand that tree (calling child components as functions)
 * to get a fully static tree before serializing.
 */
export declare function useSnapshotRenderer({ snapshotComponentName, mockValues, snapshots, components, iconLibraries, key, }: UseSnapshotRendererOptions): UseSnapshotRendererResult;
export {};
//# sourceMappingURL=useSnapshotRenderer.d.ts.map