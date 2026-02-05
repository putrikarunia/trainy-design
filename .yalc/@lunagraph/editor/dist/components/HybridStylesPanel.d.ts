import React from "react";
import { FEElement } from "./types";
interface HybridStylesPanelProps {
    selectedElementId: string | null;
    elements: FEElement[];
    onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void;
    onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
    onCreateComponent?: () => void;
    renderMode?: 'felement' | 'snapshot';
    readOnly?: boolean;
}
export default function HybridStylesPanel({ selectedElementId, elements, onUpdateElementStyles, onUpdateElementProps, onCreateComponent, renderMode, readOnly, }: HybridStylesPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HybridStylesPanel.d.ts.map