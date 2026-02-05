import React, { useRef, useState, useEffect, useCallback } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { FEElement, ResizingState, IconLibraryConfig } from "./types";
import { useHoverAndSelectionOverlay } from "./hooks/useHoverAndSelectionOverlay";
import { useResizing } from "./hooks/useResizing";
import { usePotentialParentOverlay } from "./hooks/usePotentialParentOverlay";
import { renderElement, SelectionMode } from "./utils/renderElement";
import { getImageFromDropEvent, createImageElement } from "./utils/clipboard";
import { useDevServerUrl } from "../contexts/DevServerContext";
import { ZoomControls } from "./ZoomControls";
import { Text } from "./ui/Text";
import { DiamondsFour, X, WarningCircle } from "@phosphor-icons/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { toast } from "sonner";

// Error boundary for file tab FElement rendering - triggers fallback to snapshot mode on error
class FileTabErrorBoundary extends React.Component<{
  onRenderError?: () => void;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[Canvas] FElement render failed, switching to snapshot mode:', error.message);
    this.props.onRenderError?.();
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function Canvas({
  elements,
  selectedElementIds,
  hoverElementId,
  onSelectElement,
  onHoverElement,
  onResizeElement,
  onEditText,
  editingTextId,
  editingTextBounds,
  onStartEditText,
  onStopEditText,
  isDragging = false,
  draggedIds = new Set<string>(),
  potentialParentId = null,
  components = {},
  componentIndex = {},
  iconLibraries = {},
  editingFile = null,
  onCloseEdit,
  onZoomChange,
  cmdPressed = false,
  onDoubleClickDrillIn,
  snapshotContent = null,
  renderMode = 'felement',
  onRenderError,
  onAddElement,
  onTransformChange,
  canvasRefProp,
  viewportRefProp,
  readOnly = false,
  initialTransform,
  onUpdateElementStyles,
  onUpdateElementProps,
}: {
  elements: FEElement[];
  selectedElementIds: Set<string>;
  hoverElementId: string | null;
  onSelectElement: (id: string | null, addToSelection?: boolean) => void;
  onHoverElement: (id: string | null) => void;
  onResizeElement: (
    id: string,
    size: { width: number; height: number },
    position?: { x: number; y: number }
  ) => void;
  onEditText: (id: string, text: string) => void;
  editingTextId: string | null;
  editingTextBounds: { width: number; height: number } | null;
  onStartEditText: (id: string, bounds: { width: number; height: number }) => void;
  onStopEditText: () => void;
  isDragging?: boolean;
  draggedIds?: Set<string>;
  potentialParentId?: string | null;
  components?: Record<string, React.ComponentType<any>>;
  componentIndex?: Record<string, any>;
  iconLibraries?: Record<string, IconLibraryConfig>;
  editingFile?: string | null;
  onCloseEdit?: () => void;
  onZoomChange?: (zoom: number) => void;
  cmdPressed?: boolean;
  onDoubleClickDrillIn?: (elementId: string, x: number, y: number) => void;
  /** For snapshot tabs: render this content directly instead of FEElements */
  snapshotContent?: React.ReactNode;
  /** Rendering mode for file tabs: 'felement' (editable) or 'snapshot' (read-only fallback) */
  renderMode?: 'felement' | 'snapshot';
  /** Callback when FElement rendering fails - triggers switch to snapshot mode */
  onRenderError?: () => void;
  /** Callback when an element is added (e.g., via drag-drop) */
  onAddElement?: (element: FEElement) => void;
  /** Callback when transform changes (zoom/pan) */
  onTransformChange?: (transform: { scale: number; positionX: number; positionY: number }) => void;
  /** Ref to access canvas element for coordinate conversion */
  canvasRefProp?: React.RefObject<HTMLDivElement | null>;
  /** Ref to access viewport element (visible area) */
  viewportRefProp?: React.RefObject<HTMLDivElement | null>;
  /** Read-only mode - disables editing and resizing */
  readOnly?: boolean;
  /** Initial transform state for the canvas */
  initialTransform?: { scale: number; positionX: number; positionY: number };
  /** Callback to update element styles */
  onUpdateElementStyles?: (elementId: string, styles: React.CSSProperties) => void;
  /** Callback to update element props */
  onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
}) {
  const devServerUrl = useDevServerUrl();
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = canvasRefProp || internalCanvasRef;
  const internalViewportRef = useRef<HTMLDivElement>(null);
  const viewportRef = viewportRefProp || internalViewportRef;

  const [resizing, setResizing] = useState<ResizingState | null>(null);
  const [zoom, setZoom] = useState(initialTransform?.scale ?? 1);
  const [transformState, setTransformState] = useState({
    scale: initialTransform?.scale ?? 1,
    positionX: initialTransform?.positionX ?? 0,
    positionY: initialTransform?.positionY ?? 0,
  });
  const [spacePressed, setSpacePressed] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Store transformState in a ref so callbacks always have latest values
  const transformStateRef = useRef(transformState);
  transformStateRef.current = transformState;

  // PERFORMANCE FIX: Throttle hover updates using RAF
  // This prevents excessive state updates during fast mouse movement
  const pendingHoverRef = useRef<string | null | undefined>(undefined);
  const hoverRafRef = useRef<number | null>(null);

  const throttledHoverElement = useCallback((id: string | null) => {
    // If same as pending, skip
    if (pendingHoverRef.current === id) return;
    pendingHoverRef.current = id;

    // If RAF already scheduled, it will pick up the latest value
    if (hoverRafRef.current !== null) return;

    hoverRafRef.current = requestAnimationFrame(() => {
      hoverRafRef.current = null;
      if (pendingHoverRef.current !== undefined) {
        onHoverElement(pendingHoverRef.current);
      }
    });
  }, [onHoverElement]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (hoverRafRef.current !== null) {
        cancelAnimationFrame(hoverRafRef.current);
      }
    };
  }, []);

  // Figma-like wheel handler: scroll = pan, pinch (ctrl+wheel) = zoom
  // Must use native event listener with { passive: false } to prevent browser's default pinch-to-zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (!transformRef.current) return;

      // Read transform state directly from the library's internal state
      // This ensures we always have the correct values, even if our React state is out of sync
      const instance = transformRef.current.instance;
      const state = instance.transformState;

      // On trackpads, pinch-to-zoom comes through as wheel events with ctrlKey
      // On mouse, ctrl+scroll should also zoom
      const isPinchOrCtrlZoom = e.ctrlKey || e.metaKey;

      // Always prevent default to stop browser zoom and scroll
      e.preventDefault();

      if (isPinchOrCtrlZoom) {
        // Zoom: use deltaY to determine zoom direction
        const zoomFactor = 0.01;
        const delta = -e.deltaY * zoomFactor;
        const newScale = Math.max(0.1, Math.min(5, state.scale * (1 + delta)));

        // Zoom towards mouse position
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new position to zoom towards mouse
        const scaleChange = newScale / state.scale;
        const newX = mouseX - (mouseX - state.positionX) * scaleChange;
        const newY = mouseY - (mouseY - state.positionY) * scaleChange;

        transformRef.current.setTransform(newX, newY, newScale, 0);
      } else {
        // Pan: scroll to move canvas
        const sensitivity = 1;
        const newX = state.positionX - e.deltaX * sensitivity;
        const newY = state.positionY - e.deltaY * sensitivity;
        transformRef.current.setTransform(newX, newY, state.scale, 0);
      }
    };

    // Use passive: false to allow preventDefault() on wheel events
    // This is required to prevent browser's native pinch-to-zoom
    viewport.addEventListener('wheel', handleWheel, { passive: false });

    // Block Safari gesture events to prevent browser zoom
    const blockGesture = (e: Event) => {
      e.preventDefault();
    };
    viewport.addEventListener('gesturestart', blockGesture, { passive: false });
    viewport.addEventListener('gesturechange', blockGesture, { passive: false });
    viewport.addEventListener('gestureend', blockGesture, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('gesturestart', blockGesture);
      viewport.removeEventListener('gesturechange', blockGesture);
      viewport.removeEventListener('gestureend', blockGesture);
    };
  }, []);

  // Block horizontal swipe gestures globally to prevent browser back/forward navigation
  // This must be at window level with capture to intercept before iframes
  useEffect(() => {
    const blockHorizontalSwipe = (e: WheelEvent) => {
      // Block horizontal swipe gestures (browser back/forward)
      const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5;
      if (isHorizontalSwipe) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', blockHorizontalSwipe, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', blockHorizontalSwipe, { capture: true });
    };
  }, []);

  // Disable browser back/forward swipe gesture by setting overscroll-behavior on body/html
  useEffect(() => {
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
    };
  }, []);


  // Determine selection mode based on Cmd key and selection state
  // - Cmd pressed: always select deepest (leaf) element
  // - Nothing selected + No Cmd: select topmost (shallowest) element
  // - Something selected + No Cmd: select deepest (smart navigation)
  const selectionMode: SelectionMode = cmdPressed
    ? 'deepest'
    : (selectedElementIds.size === 0 ? 'topmost' : 'deepest');

  const { handleResizeStart } = useResizing({
    resizing,
    setResizing,
    onResizeElement,
    transform: transformState
  })

  const { renderSelectionOverlay, renderHoverOverlay } = useHoverAndSelectionOverlay({
    canvasRef,
    elements,
    selectedElementIds,
    hoverElementId,
    handleResizeStart: readOnly ? () => { } : handleResizeStart,
    transform: transformState,
    onSelectElement,
    onHoverElement,
    onUpdateElementStyles,
    onUpdateElementProps,
    readOnly,
  })

  const { renderPotentialParentOverlay } = usePotentialParentOverlay({
    canvasRef,
    potentialParentId,
    transform: transformState
  })

  // Track space key for left-click panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Extract component name from file path (e.g., "components/ui/button.tsx" -> "button")
  const getComponentNameFromPath = (path: string) => {
    const fileName = path.split('/').pop() || ''
    return fileName.replace(/\.tsx?$/, '')
  }

  const componentName = editingFile ? getComponentNameFromPath(editingFile) : null

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ width: '100%', height: '100%' }}>
      {/* Editing header */}
      {editingFile && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-ed-border bg-ed-accent/50">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium" variant="secondary">Editing</Text>
            <div className="flex items-center gap-1.5">
              <DiamondsFour size={14} weight="fill" className="text-purple-500" />
              <Text size="sm" weight="medium">{componentName}</Text>
            </div>
          </div>
          <button
            onClick={onCloseEdit}
            className="p-1 hover:bg-ed-accent rounded transition-colors"
          >
            <X size={16} weight="bold" className="text-ed-muted-foreground" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: spacePressed ? 'grab' : 'default', touchAction: 'none', overscrollBehavior: 'none' }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (readOnly || !onAddElement) return;

          const result = await getImageFromDropEvent(e, readOnly ? undefined : devServerUrl);
          if (result.error) {
            toast.error(result.errorMessage || 'Failed to add image');
            return;
          }
          if (result.src) {
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
              const x = (e.clientX - canvasRect.left) / transformState.scale;
              const y = (e.clientY - canvasRect.top) / transformState.scale;
              onAddElement(createImageElement(result.src, { x, y }));
            }
          }
        }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={initialTransform?.scale ?? 1}
          initialPositionX={initialTransform?.positionX ?? 0}
          initialPositionY={initialTransform?.positionY ?? 0}
          minScale={0.1}
          maxScale={5}
          limitToBounds={false}
          centerOnInit={false}
          wheel={{
            // Disable library's wheel handler - we use custom handler for Figma-like behavior
            // (scroll = pan, pinch/ctrl+scroll = zoom)
            disabled: true,
          }}
          pinch={{
            step: 5,
            disabled: false,
          }}
          panning={{
            disabled: false,
            velocityDisabled: true,
            allowLeftClickPan: spacePressed,
            allowRightClickPan: false,
            allowMiddleClickPan: true,
          }}
          doubleClick={{ disabled: true }}
          onTransformed={(ref, state) => {
            setZoom(state.scale);
            setTransformState(state);
            onZoomChange?.(state.scale);
            onTransformChange?.(state);
          }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full"
            wrapperStyle={{ width: '100%', height: '100%' }}
            // PERFORMANCE FIX: will-change hints browser to optimize transform animations
            contentStyle={{ width: '100%', height: '100%', willChange: 'transform' }}
            wrapperProps={{
              onClick: (e: React.MouseEvent) => {
                // Deselect when clicking canvas background (not on any element)
                const target = e.target as HTMLElement
                const clickedElement = target.closest('[data-element-id]')
                if (!clickedElement) {
                  onSelectElement(null)
                }
              }
            }}
          >
            <div
              style={{ width: '4000px', height: '4000px' }}
              ref={canvasRef}
              onClick={(e) => {
                // Deselect when clicking canvas background (not on any element)
                // Check if click target is inside an element with data-element-id
                const target = e.target as HTMLElement
                const clickedElement = target.closest('[data-element-id]')
                if (!clickedElement) {
                  onSelectElement(null)
                }
              }}
              onMouseOver={(e) => {
                // Only clear hover if hovering canvas background itself
                if (e.target === e.currentTarget) {
                  throttledHoverElement(null);
                }
              }}
            >
              {/* Conditional rendering based on mode */}
              {(() => {
                const useSnapshot = renderMode === 'snapshot' || (snapshotContent && elements.length === 0);

                return useSnapshot;
              })() ? (
                /* Snapshot mode OR empty elements with snapshot available: render snapshot content */
                <div
                  key={React.isValidElement(snapshotContent) ? snapshotContent.key : 'snapshot'}
                  className="absolute"
                  style={{
                    top: 20,
                    left: 20,
                    pointerEvents: 'none',
                  }}
                >
                  <ErrorBoundary>
                    {snapshotContent}
                  </ErrorBoundary>
                </div>
              ) : (
                /* FElement mode: render from FEElements (editable, with error boundary fallback) */
                <FileTabErrorBoundary
                  onRenderError={onRenderError}
                  fallback={
                    snapshotContent ? (
                      <div
                        key={React.isValidElement(snapshotContent) ? snapshotContent.key : 'snapshot'}
                        className="absolute"
                        style={{
                          top: 20,
                          left: 20,
                          pointerEvents: 'none',
                        }}
                      >
                        <ErrorBoundary>
                          {snapshotContent}
                        </ErrorBoundary>
                      </div>
                    ) : null
                  }
                >
                  {elements.map((el) =>
                    <div
                      key={el.id}
                      className="absolute"
                      style={{
                        top: el.canvasPosition?.y || 20,
                        left: el.canvasPosition?.x || 20,
                        // Hide elements that are being dragged (they appear in DragOverlay)
                        opacity: draggedIds.has(el.id) ? 0 : 1,
                      }}
                    >
                      {renderElement(el, {
                        onSelectElement,
                        onHoverElement: throttledHoverElement,
                        onDoubleClickElement: onDoubleClickDrillIn,
                        components,
                        componentIndex,
                        iconLibraries,
                        onEditText: readOnly ? () => { } : onEditText,
                        editingTextId: readOnly ? null : editingTextId,
                        editingTextBounds: readOnly ? null : editingTextBounds,
                        onStartEditText: readOnly ? () => { } : onStartEditText,
                        onStopEditText: readOnly ? () => { } : onStopEditText,
                        selectionMode,
                        selectedElementIds,
                        canvasScale: transformState.scale,
                        onResizeViewport: readOnly ? undefined : (id, width, height) => {
                          onResizeElement(id, { width, height })
                        },
                        onResizeElement: readOnly ? undefined : (id, size) => {
                          onResizeElement(id, size)
                        },
                        onViewportPan: (deltaX, deltaY) => {
                          // Pan the canvas when panning inside viewport
                          if (!transformRef.current) return;
                          const state = transformStateRef.current;
                          const sensitivity = 1;
                          const newX = state.positionX - deltaX * sensitivity;
                          const newY = state.positionY - deltaY * sensitivity;
                          transformRef.current.setTransform(newX, newY, state.scale, 0);
                        },
                        devServerUrl,
                      })}
                    </div>
                  )}
                </FileTabErrorBoundary>
              )}

              {/* Render snapshot invisibly when in FElement mode so it can capture updates */}
              {snapshotContent && elements.length > 0 && renderMode === 'felement' && (
                <div
                  key={React.isValidElement(snapshotContent) ? `${snapshotContent.key}-hidden` : 'snapshot-hidden'}
                  style={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                  }}
                >
                  {snapshotContent}
                </div>
              )}
            </div>
          </TransformComponent>

          {/* Zoom controls - must be inside TransformWrapper for useControls hook */}
          <ZoomControls zoom={zoom} />
        </TransformWrapper>

        {/* Overlays rendered outside TransformWrapper so they don't scale */}
        <div className="absolute inset-0 pointer-events-none" data-overlay-container>
          {/* Selection overlay - hide while dragging */}
          {!isDragging && renderSelectionOverlay()}
          {!isDragging && renderHoverOverlay()}

          {/* Potential parent overlay - show while dragging */}
          {isDragging && renderPotentialParentOverlay()}

        </div>

        {/* Read-only mode indicator */}
        {renderMode === 'snapshot' && (
          <div
            className="absolute flex items-center gap-2 px-3 py-2 rounded-md shadow-lg"
            style={{
              top: '16px',
              right: '16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              fontSize: '12px',
              zIndex: 1000,
              pointerEvents: 'auto',
            }}
          >
            <WarningCircle size={16} weight="fill" className="text-amber-600" />
            <div>
              <Text size="xs" weight="medium" className="text-amber-900">
                Read-only mode
              </Text>
              <Text size="xs" className="text-amber-700">
                Component uses non-serializable props
              </Text>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
