import React from "react";
import { FEElement } from "./types";
interface StylesPanelProps {
    selectedElementId: string | null;
    elements: FEElement[];
    onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void;
    onCreateComponent?: () => void;
}
export default function StylesPanel({ selectedElementId, elements, onUpdateElementStyles, onCreateComponent }: StylesPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StylesPanel.d.ts.map