/**
 * Check if element A is fully inside element B
 */
export declare function isFullyInside(rectA: DOMRect, rectB: DOMRect): boolean;
/**
 * Check if element A is completely outside element B
 */
export declare function isCompletelyOutside(rectA: DOMRect, rectB: DOMRect): boolean;
/**
 * Get element's bounding rect by its data-element-id
 * For elements with display:contents (like component wrappers),
 * returns the rect of the first visible child instead.
 */
export declare function getElementRect(elementId: string): DOMRect | null;
/**
 * Get canvas bounding rect
 */
export declare function getCanvasRect(): DOMRect | null;
/**
 * Convert screen coordinates to canvas-relative coordinates
 */
export declare function screenToCanvas(screenX: number, screenY: number): {
    x: number;
    y: number;
} | null;
//# sourceMappingURL=collisionUtils.d.ts.map