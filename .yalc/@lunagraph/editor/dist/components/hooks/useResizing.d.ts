import { Dispatch, SetStateAction } from "react";
import { ResizingState, FEElement } from "../types";
export declare function useResizing({ resizing, setResizing, onResizeElement, transform, }: {
    resizing: ResizingState | null;
    setResizing: Dispatch<SetStateAction<ResizingState | null>>;
    onResizeElement: (id: string, size: {
        width: number;
        height: number;
    }, position?: {
        x: number;
        y: number;
    }) => void;
    transform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
}): {
    handleResizeStart: (e: React.MouseEvent, id: string, handle: string, element: FEElement) => void;
};
//# sourceMappingURL=useResizing.d.ts.map