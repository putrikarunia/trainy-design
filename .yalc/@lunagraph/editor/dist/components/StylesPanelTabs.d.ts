import React from "react";
import { FEElement } from "./types";
interface StylesPanelTabsProps {
    selectedElementId: string | null;
    selectedElementIds?: Set<string>;
    elements: FEElement[];
    onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void;
    onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
    onUpdateMultipleElementsProps?: (elementIds: Set<string>, propsUpdater: (currentProps: Record<string, any>) => Record<string, any>) => void;
    onUpdateMultipleElementsStyles?: (elementIds: Set<string>, stylesUpdater: (currentStyles: React.CSSProperties) => React.CSSProperties) => void;
    onCreateComponent?: () => void;
    renderMode?: 'felement' | 'snapshot';
    readOnly?: boolean;
}
export default function StylesPanelTabs({ selectedElementId, selectedElementIds, elements, onUpdateElementStyles, onUpdateElementProps, onUpdateMultipleElementsProps, onUpdateMultipleElementsStyles, onCreateComponent, renderMode, readOnly, }: StylesPanelTabsProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StylesPanelTabs.d.ts.map