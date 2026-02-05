import { useEffect, useState, useCallback, useRef } from "react";
import { FEElement } from "../types";
import { Text } from "../ui/Text";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/Tooltip";
import { findElement } from "../util";
import { cn } from "../../lib/utils";
import { CursorClick } from "@phosphor-icons/react";

export function useHoverAndSelectionOverlay(
  {
    canvasRef,
    elements,
    selectedElementIds,
    hoverElementId,
    handleResizeStart,
    transform,
    onSelectElement,
    onHoverElement,
    onUpdateElementStyles,
    onUpdateElementProps,
    readOnly = false,
  }: {
    canvasRef: React.RefObject<HTMLDivElement | null>,
    elements: FEElement[],
    selectedElementIds: Set<string>,
    hoverElementId: string | null,
    handleResizeStart: (
      e: React.MouseEvent,
      id: string,
      handle: string,
      element: FEElement
    ) => void,
    transform?: { scale: number, positionX: number, positionY: number },
    onSelectElement?: (id: string | null, addToSelection?: boolean) => void,
    onHoverElement?: (id: string | null) => void,
    onUpdateElementStyles?: (elementId: string, styles: React.CSSProperties) => void,
    onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void,
    readOnly?: boolean,
  }
) {

  const [elementRects, setElementRects] = useState<Map<string, DOMRect>>(new Map());
  const updateRectsRef = useRef<(() => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // PERFORMANCE FIX: Only calculate rects for selected + hovered elements (not all elements)
  // This reduces DOM queries from 50+ to 2-3 on every update
  const updateRects = useCallback(() => {
    const newRects = new Map<string, DOMRect>();

    // Only get rects for elements we need to draw overlays for
    const relevantIds = new Set<string>([...selectedElementIds]);
    if (hoverElementId) relevantIds.add(hoverElementId);

    // Early return if nothing to update
    if (relevantIds.size === 0) {
      setElementRects(prev => prev.size === 0 ? prev : new Map());
      return;
    }

    for (const id of relevantIds) {
      const domEl = document.querySelector(`[data-element-id="${id}"]`);
      if (domEl) {
        // For elements with display:contents (like component wrappers),
        // getBoundingClientRect returns zeros. Traverse down until we find a visible element.
        let rectEl: Element = domEl;
        let computedStyle = window.getComputedStyle(rectEl);
        while (computedStyle.display === 'contents' && rectEl.firstElementChild) {
          rectEl = rectEl.firstElementChild;
          computedStyle = window.getComputedStyle(rectEl);
        }
        newRects.set(id, rectEl.getBoundingClientRect());
      }
    }

    // Only update if rects actually changed to prevent infinite loops
    setElementRects(prev => {
      if (prev.size !== newRects.size) return newRects;
      let hasChanged = false;
      newRects.forEach((rect, id) => {
        const prevRect = prev.get(id);
        if (!prevRect ||
          prevRect.top !== rect.top ||
          prevRect.left !== rect.left ||
          prevRect.width !== rect.width ||
          prevRect.height !== rect.height) {
          hasChanged = true;
        }
      });
      return hasChanged ? newRects : prev;
    });
  }, [selectedElementIds, hoverElementId]);

  // Store updateRects in ref so transform effect can access it
  updateRectsRef.current = updateRects;

  // PERFORMANCE FIX: Only observe selected elements, not all elements
  // This reduces ResizeObserver overhead from 50+ observers to 1-5
  useEffect(() => {
    updateRects();
    // Update on resize or scroll
    window.addEventListener('resize', updateRects);
    const observer = new ResizeObserver(updateRects);

    // Only observe selected elements (not all elements)
    const relevantIds = new Set<string>([...selectedElementIds]);
    if (hoverElementId) relevantIds.add(hoverElementId);

    for (const id of relevantIds) {
      const domEl = document.querySelector(`[data-element-id="${id}"]`);
      if (domEl) {
        // For elements with display:contents, traverse down to find visible element to observe
        let observeEl: Element = domEl;
        let computedStyle = window.getComputedStyle(observeEl);
        while (computedStyle.display === 'contents' && observeEl.firstElementChild) {
          observeEl = observeEl.firstElementChild;
          computedStyle = window.getComputedStyle(observeEl);
        }
        observer.observe(observeEl);
      }
    }

    return () => {
      window.removeEventListener('resize', updateRects);
      observer.disconnect();
    };
  }, [selectedElementIds, hoverElementId, updateRects]);

  // Update rects when transform changes - use RAF to throttle and batch updates
  // This is separate from observer setup to avoid expensive observer recreation
  useEffect(() => {
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule update on next frame
    rafIdRef.current = requestAnimationFrame(() => {
      updateRectsRef.current?.();
      rafIdRef.current = null;
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [transform?.scale, transform?.positionX, transform?.positionY]);

  const renderSelectionOverlay = () => {
    if (selectedElementIds.size === 0) return null;

    const overlays: React.ReactNode[] = [];
    const isSingleSelection = selectedElementIds.size === 1;

    for (const selectedElementId of selectedElementIds) {
      const selectedElement = findElement(elements, selectedElementId);
      if (!selectedElement || selectedElement.type === 'text') continue;

      const selectedRect = elementRects.get(selectedElementId);
      if (!selectedRect) continue;

      // If we have transform, we're outside the TransformComponent
      // Get position relative to the overlay container
      let relativeRect;
      if (transform) {
        const overlayContainer = document.querySelector('[data-overlay-container]');
        if (!overlayContainer) continue;

        const overlayRect = overlayContainer.getBoundingClientRect();

        // Element's screen position - overlay container's screen position = relative position
        relativeRect = {
          left: selectedRect.left - overlayRect.left,
          top: selectedRect.top - overlayRect.top,
          width: selectedRect.width,
          height: selectedRect.height,
        };
      } else {
        const canvasEl = canvasRef?.current;
        if (!canvasEl) continue;
        const canvasRect = canvasEl.getBoundingClientRect();

        relativeRect = {
          left: selectedRect.left - canvasRect.left,
          top: selectedRect.top - canvasRect.top,
          width: selectedRect.width,
          height: selectedRect.height,
        };
      }

      const isComponent = selectedElement.type === 'component'

      overlays.push(
        <div
          key={selectedElementId}
          className={cn(
            "absolute pointer-events-none outline outline-2",
            isComponent ? "outline-purple-500" : "outline-blue-500"
          )}
          style={{
            left: relativeRect.left,
            top: relativeRect.top,
            width: relativeRect.width,
            height: relativeRect.height,
          }}
        >
          {/* Only show label for single selection - draggable */}
          {isSingleSelection && (
            <div
              className={cn(
                "absolute -top-5 flex items-center gap-1 select-none",
                !readOnly && "pointer-events-auto"
              )}
              onMouseDown={(e) => handleLabelMouseDown(e, selectedElementId)}
            >
              <Text size="xs" className={cn(isComponent ? "text-purple-500" : "text-blue-500")}>
                {selectedElement.type === 'html' ? selectedElement.tag :
                  selectedElement.type === 'icon' ? selectedElement.iconName :
                    selectedElement.type === 'component' ? selectedElement.componentName : 'Element'}
              </Text>
              {/* Interaction toggle badge for iframes */}
              {selectedElement.type === 'html' && selectedElement.tag === 'iframe' && !readOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer",
                        selectedElement.props?.['data-interaction-enabled'] !== 'true'
                          ? "bg-ed-muted text-ed-muted-foreground hover:bg-ed-accent"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const currentEnabled = selectedElement.props?.['data-interaction-enabled'] === 'true';
                        onUpdateElementProps?.(selectedElementId, { 'data-interaction-enabled': currentEnabled ? 'false' : 'true' });
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <CursorClick size={10} weight="bold" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {selectedElement.props?.['data-interaction-enabled'] !== 'true'
                      ? "Interaction disabled. Click to enable."
                      : "Interaction enabled. Click to disable."}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Only show resize handles for single selection */}
          {isSingleSelection && (
            <>
              <div
                className={cn(
                  "absolute w-2 h-2 bg-white border cursor-nw-resize pointer-events-auto",
                  isComponent ? "border-purple-500" : "border-blue-500"
                )}
                style={{ left: -4, top: -4 }}
                onMouseDown={(e) => handleResizeStart(e, selectedElementId, "nw", selectedElement)}
              />
              <div
                className={cn(
                  "absolute w-2 h-2 bg-white border cursor-ne-resize pointer-events-auto",
                  isComponent ? "border-purple-500" : "border-blue-500"
                )}
                style={{ right: -4, top: -4 }}
                onMouseDown={(e) => handleResizeStart(e, selectedElementId, "ne", selectedElement)}
              />
              <div
                className={cn(
                  "absolute w-2 h-2 bg-white border cursor-sw-resize pointer-events-auto",
                  isComponent ? "border-purple-500" : "border-blue-500"
                )}
                style={{ left: -4, bottom: -4 }}
                onMouseDown={(e) => handleResizeStart(e, selectedElementId, "sw", selectedElement)}
              />
              <div
                className={cn(
                  "absolute w-2 h-2 bg-white border cursor-se-resize pointer-events-auto",
                  isComponent ? "border-purple-500" : "border-blue-500"
                )}
                style={{ right: -4, bottom: -4 }}
                onMouseDown={(e) => handleResizeStart(e, selectedElementId, "se", selectedElement)}
              />
            </>
          )}
        </div>
      )
    }

    return <>{overlays}</>;
  }

  // Handle mousedown on label to trigger drag on the actual element
  const handleLabelMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (readOnly) return;

    // Prevent default to avoid text selection
    e.preventDefault();

    // First, select the element (if not already selected)
    if (!selectedElementIds.has(elementId)) {
      onSelectElement?.(elementId, e.shiftKey);
    }

    // Find the actual DOM element and dispatch a synthetic pointer event to start drag
    const domEl = document.querySelector(`[data-element-id="${elementId}"]`);
    if (domEl) {
      // Create and dispatch a pointerdown event on the actual element
      const pointerEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 1,
      });
      domEl.dispatchEvent(pointerEvent);
    }
  }, [onSelectElement, readOnly, selectedElementIds]);

  // Handle click on label to select element
  const handleLabelClick = useCallback((e: React.MouseEvent, elementId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelectElement?.(elementId, e.shiftKey);
  }, [onSelectElement, readOnly]);

  // Keep hover active when mouse enters the label
  const handleLabelMouseEnter = useCallback((elementId: string) => {
    onHoverElement?.(elementId);
  }, [onHoverElement]);

  const renderHoverOverlay = () => {
    if (!hoverElementId) return null;
    if (selectedElementIds.has(hoverElementId)) return null;

    const hoveredElement = findElement(elements, hoverElementId);
    if (hoveredElement?.type === 'text') return null;

    const hoveredRect = elementRects.get(hoverElementId);
    if (!hoveredRect) return null;

    // If we have transform, we're outside the TransformComponent
    let relativeRect;
    if (transform) {
      const overlayContainer = document.querySelector('[data-overlay-container]');
      if (!overlayContainer) return null;

      const overlayRect = overlayContainer.getBoundingClientRect();

      relativeRect = {
        left: hoveredRect.left - overlayRect.left,
        top: hoveredRect.top - overlayRect.top,
        width: hoveredRect.width,
        height: hoveredRect.height,
      };
    } else {
      const canvasEl = canvasRef?.current;
      if (!canvasEl) return null;
      const canvasRect = canvasEl.getBoundingClientRect();

      relativeRect = {
        left: hoveredRect.left - canvasRect.left,
        top: hoveredRect.top - canvasRect.top,
        width: hoveredRect.width,
        height: hoveredRect.height,
      };
    }

    const isComponent = hoveredElement?.type === 'component'
    const labelText = hoveredElement?.type === 'html' ? hoveredElement?.tag :
      hoveredElement?.type === 'icon' ? hoveredElement?.iconName :
        hoveredElement?.type === 'component' ? hoveredElement?.componentName : 'Element';

    return (
      <div
        className={cn(
          "absolute pointer-events-none outline outline-1",
          isComponent ? "outline-purple-500" : "outline-blue-500"
        )}
        style={{
          left: relativeRect.left,
          top: relativeRect.top,
          width: relativeRect.width,
          height: relativeRect.height,
        }}
      >
        <div
          className={cn(
            "absolute -top-5 flex items-center select-none",
            !readOnly && "pointer-events-auto"
          )}
          onClick={(e) => handleLabelClick(e, hoverElementId)}
          onMouseDown={(e) => handleLabelMouseDown(e, hoverElementId)}
          onMouseEnter={() => handleLabelMouseEnter(hoverElementId)}
        >
          <Text size="xs" className={cn(isComponent ? "text-purple-500" : "text-blue-500")}>
            {labelText}
          </Text>
        </div>
      </div>
    )
  }
  return {
    renderSelectionOverlay,
    renderHoverOverlay
  }
}
