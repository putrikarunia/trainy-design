/**
 * Check if element A is fully inside element B
 */
export function isFullyInside(rectA, rectB) {
    return (rectA.left >= rectB.left &&
        rectA.right <= rectB.right &&
        rectA.top >= rectB.top &&
        rectA.bottom <= rectB.bottom);
}
/**
 * Check if element A is completely outside element B
 */
export function isCompletelyOutside(rectA, rectB) {
    return (rectA.right < rectB.left ||
        rectA.left > rectB.right ||
        rectA.bottom < rectB.top ||
        rectA.top > rectB.bottom);
}
/**
 * Get element's bounding rect by its data-element-id
 * For elements with display:contents (like component wrappers),
 * returns the rect of the first visible child instead.
 */
export function getElementRect(elementId) {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element)
        return null;
    // For elements with display:contents, getBoundingClientRect returns zeros
    const computedStyle = window.getComputedStyle(element);
    const rectEl = (computedStyle.display === 'contents' && element.firstElementChild)
        ? element.firstElementChild
        : element;
    return rectEl.getBoundingClientRect();
}
/**
 * Get canvas bounding rect
 */
export function getCanvasRect() {
    const canvas = document.querySelector('.w-full.h-full.relative');
    return canvas ? canvas.getBoundingClientRect() : null;
}
/**
 * Convert screen coordinates to canvas-relative coordinates
 */
export function screenToCanvas(screenX, screenY) {
    const canvasRect = getCanvasRect();
    if (!canvasRect)
        return null;
    return {
        x: screenX - canvasRect.left,
        y: screenY - canvasRect.top,
    };
}
