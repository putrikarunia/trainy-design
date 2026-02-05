import { RefObject } from "react";
export declare function usePotentialParentOverlay({ canvasRef, potentialParentId, transform }: {
    canvasRef: RefObject<HTMLDivElement | null>;
    potentialParentId: string | null;
    transform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
}): {
    renderPotentialParentOverlay: () => import("react/jsx-runtime").JSX.Element | null;
};
//# sourceMappingURL=usePotentialParentOverlay.d.ts.map