/**
 * ViewportRenderer - Renders a responsive viewport preview using an iframe
 * 
 * This component uses an iframe to provide true viewport-based CSS media queries,
 * allowing users to preview how their design looks at different screen sizes.
 * 
 * ## Known Limitation: Zoom Inside Viewport
 * 
 * Pinch-to-zoom is DISABLED inside the viewport. This is intentional.
 * 
 * Due to browser limitations, when a pinch gesture crosses the iframe boundary
 * (starts inside the viewport and the cursor moves outside), the browser's native
 * zoom takes over before JavaScript can intercept it. This causes unwanted browser
 * zoom behavior.
 * 
 * Current behavior:
 * - Pan (two-finger scroll) inside viewport: ✅ Pans the canvas
 * - Zoom (pinch) inside viewport: ❌ Blocked to prevent browser zoom issues
 * - Pan/Zoom on the main canvas: ✅ Works normally
 * 
 * To zoom, move your mouse to the main canvas area (outside any viewport).
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import Frame, { FrameContextConsumer } from 'react-frame-component'
import { FEElement, ViewportElement, IconLibraryConfig } from './types'
import { renderElement, SelectionMode } from './utils/renderElement'
import { findElement } from './utils/treeUtils'

interface ViewportRendererProps {
  element: ViewportElement
  options: {
    onSelectElement?: (id: string, addToSelection?: boolean) => void
    onHoverElement?: (id: string | null) => void
    onDoubleClickElement?: (id: string, x: number, y: number) => void
    components?: Record<string, React.ComponentType<any>>
    componentIndex?: Record<string, any>
    iconLibraries?: Record<string, IconLibraryConfig>
    onEditText?: (id: string, text: string) => void
    editingTextId?: string | null
    editingTextBounds?: { width: number; height: number } | null
    onStartEditText?: (id: string, bounds: { width: number; height: number }) => void
    onStopEditText?: () => void
    selectionMode?: SelectionMode
    selectedElementIds?: Set<string>
    onResizeViewport?: (id: string, width: number, height: number) => void
    canvasScale?: number
    onResizeElement?: (id: string, size: { width: number; height: number }) => void
    onViewportPan?: (deltaX: number, deltaY: number) => void  // Called for pan events inside viewport
    devServerUrl?: string
  }
}

/**
 * Get device category name based on width
 */
export function getDeviceNameForWidth(width: number): string {
  if (width >= 1280) return 'Desktop'
  if (width >= 1024) return 'Laptop'
  if (width >= 768) return 'Tablet'
  if (width >= 480) return 'Mobile Landscape'
  return 'Mobile'
}

/**
 * Manually copies all stylesheets and fonts from parent document into iframe.
 */
function injectStylesIntoIframe(iframeDoc: Document) {
  // Clear any previously injected viewport styles
  iframeDoc.querySelectorAll('[data-viewport-style], [data-viewport-vars], [data-viewport-fonts]').forEach(el => el.remove())

  // Copy all link elements (stylesheets, fonts, preconnects)
  const linkNodes = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"][as="font"], link[rel="preload"][as="style"]')
  linkNodes.forEach((node, index) => {
    const link = node as HTMLLinkElement
    const newLink = iframeDoc.createElement('link')
    // Copy all attributes
    Array.from(link.attributes).forEach(attr => {
      newLink.setAttribute(attr.name, attr.value)
    })
    newLink.setAttribute('data-viewport-style', String(index))
    iframeDoc.head.appendChild(newLink)
  })

  // Copy all style elements
  const styleNodes = document.querySelectorAll('style')
  styleNodes.forEach((node, index) => {
    const style = node as HTMLStyleElement
    const newStyle = iframeDoc.createElement('style')
    newStyle.textContent = style.textContent
    newStyle.setAttribute('data-viewport-style', `style-${index}`)
    Array.from(style.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || attr.name === 'media') {
        newStyle.setAttribute(attr.name, attr.value)
      }
    })
    iframeDoc.head.appendChild(newStyle)
  })

  // Extract and copy @font-face rules from all stylesheets
  // This handles fonts loaded via CSS that we can access (same-origin)
  const fontFaceRules: string[] = []
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        // Can only access same-origin stylesheets
        const rules = sheet.cssRules || sheet.rules
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSFontFaceRule) {
            fontFaceRules.push(rule.cssText)
          }
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
    if (fontFaceRules.length > 0) {
      const fontStyle = iframeDoc.createElement('style')
      fontStyle.textContent = fontFaceRules.join('\n')
      fontStyle.setAttribute('data-viewport-fonts', 'true')
      iframeDoc.head.appendChild(fontStyle)
    }
  } catch {
    // Stylesheet access failed, continue without font-face extraction
  }

  // Copy html classes (Next.js fonts add classes that define CSS variables like --font-poppins)
  if (document.documentElement.className) {
    iframeDoc.documentElement.className = document.documentElement.className
  }

  // Copy CSS variables from :root / html to iframe
  const rootStyles = window.getComputedStyle(document.documentElement)
  const cssVars: string[] = []
  for (let i = 0; i < rootStyles.length; i++) {
    const prop = rootStyles[i]
    if (prop.startsWith('--')) {
      cssVars.push(`${prop}: ${rootStyles.getPropertyValue(prop)};`)
    }
  }
  if (cssVars.length > 0) {
    const varStyle = iframeDoc.createElement('style')
    varStyle.textContent = `:root { ${cssVars.join(' ')} }`
    varStyle.setAttribute('data-viewport-vars', 'true')
    iframeDoc.head.appendChild(varStyle)
  }

  // Copy body classes for Tailwind dark mode, etc.
  if (document.body.className) {
    iframeDoc.body.className = document.body.className
  }
}

/**
 * Get element label for overlay display
 */
function getElementLabel(el: FEElement): string {
  if (el.type === 'html') return el.tag
  if (el.type === 'component') return el.componentName
  if (el.type === 'icon') return el.iconName
  if (el.type === 'text') return 'Text'
  if (el.type === 'viewport') return 'Viewport'
  return 'Element'
}

/**
 * ViewportRenderer renders children inside an iframe using react-frame-component.
 */
export function ViewportRenderer({ element, options }: ViewportRendererProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [iframeMounted, setIframeMounted] = useState(false)
  const [hoveredChildId, setHoveredChildId] = useState<string | null>(null)
  const [elementRects, setElementRects] = useState<Map<string, DOMRect>>(new Map())
  const [isResizing, setIsResizing] = useState<'e' | 's' | 'se' | null>(null)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Element resize state (for children inside viewport)
  const [elementResizing, setElementResizing] = useState<{
    id: string
    handle: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const { selectedElementIds = new Set<string>(), canvasScale = 1 } = options

  // Inverse scale to compensate for canvas zoom
  const inverseScale = 1 / canvasScale

  // Make the viewport draggable (via label) and droppable
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: element.id,
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: element.id,
  })

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node)
    setDroppableRef(node)
      ; (wrapperRef as any).current = node
  }

  // Get selected children inside this viewport
  const selectedChildIds = new Set<string>()
  const collectChildIds = (els: FEElement[] | undefined) => {
    els?.forEach(el => {
      if (selectedElementIds.has(el.id)) {
        selectedChildIds.add(el.id)
      }
      if (el.type !== 'text' && el.type !== 'icon' && el.children) {
        collectChildIds(el.children)
      }
    })
  }
  collectChildIds(element.children)

  // Update element rects for overlays
  // Only update when selection/hover actually changes, not via polling
  useEffect(() => {
    if (!iframeMounted) return

    const iframe = frameRef.current
    if (!iframe?.contentDocument) return

    const newRects = new Map<string, DOMRect>()

    // Collect all element IDs we need to track
    const idsToTrack = new Set<string>()
    if (hoveredChildId) idsToTrack.add(hoveredChildId)
    selectedChildIds.forEach(id => idsToTrack.add(id))

    idsToTrack.forEach(id => {
      const el = iframe.contentDocument!.querySelector(`[data-element-id="${id}"]`)
      if (el) {
        newRects.set(id, el.getBoundingClientRect())
      }
    })

    setElementRects(newRects)
    // Note: Removed 100ms polling interval - rects update when selection/hover changes
    // which is the intended behavior. Continuous polling caused performance issues.
  }, [iframeMounted, hoveredChildId, selectedChildIds.size, selectedElementIds])

  // Handle selection/hover from inside iframe
  const handleChildSelect = useCallback((id: string, addToSelection?: boolean) => {
    options.onSelectElement?.(id, addToSelection)
  }, [options])

  const handleChildHover = useCallback((id: string | null) => {
    setHoveredChildId(id)
    options.onHoverElement?.(id)
  }, [options])

  const childOptions = {
    ...options,
    onSelectElement: handleChildSelect,
    onHoverElement: handleChildHover,
  }

  // Handle viewport resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: 'e' | 's' | 'se') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.viewportWidth,
      height: element.viewportHeight || 600,
    })
  }, [element.viewportWidth, element.viewportHeight])

  useEffect(() => {
    if (!isResizing || !resizeStart) return

    const handleMouseMove = (e: MouseEvent) => {
      // Account for canvas scale when calculating deltas
      const deltaX = (e.clientX - resizeStart.x) / canvasScale
      const deltaY = (e.clientY - resizeStart.y) / canvasScale

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height

      if (isResizing === 'e' || isResizing === 'se') {
        newWidth = Math.max(200, resizeStart.width + deltaX)
      }
      if (isResizing === 's' || isResizing === 'se') {
        newHeight = Math.max(200, resizeStart.height + deltaY)
      }

      options.onResizeViewport?.(element.id, Math.round(newWidth), Math.round(newHeight))
    }

    const handleMouseUp = () => {
      setIsResizing(null)
      setResizeStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, element.id, options, canvasScale])

  // Handle element resize inside viewport
  const handleElementResizeStart = useCallback((e: React.MouseEvent, id: string, handle: string, rect: DOMRect) => {
    e.preventDefault()
    e.stopPropagation()
    setElementResizing({
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    })
  }, [])

  useEffect(() => {
    if (!elementResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      // Account for canvas scale
      const deltaX = (e.clientX - elementResizing.startX) / canvasScale
      const deltaY = (e.clientY - elementResizing.startY) / canvasScale

      let newWidth = elementResizing.startWidth
      let newHeight = elementResizing.startHeight

      const handle = elementResizing.handle
      if (handle.includes('e')) {
        newWidth = Math.max(20, elementResizing.startWidth + deltaX)
      }
      if (handle.includes('w')) {
        newWidth = Math.max(20, elementResizing.startWidth - deltaX)
      }
      if (handle.includes('s')) {
        newHeight = Math.max(20, elementResizing.startHeight + deltaY)
      }
      if (handle.includes('n')) {
        newHeight = Math.max(20, elementResizing.startHeight - deltaY)
      }

      options.onResizeElement?.(elementResizing.id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      })
    }

    const handleMouseUp = () => {
      setElementResizing(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [elementResizing, canvasScale, options])

  // Block gestures on wrapper to prevent Safari pinch-to-zoom on border areas
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const handleGestureStart = (e: Event) => {
      e.preventDefault()
    }

    // Also block touchmove on wrapper for consistent behavior
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    wrapper.addEventListener('gesturestart', handleGestureStart, { passive: false })
    wrapper.addEventListener('gesturechange', handleGestureStart, { passive: false })
    wrapper.addEventListener('gestureend', handleGestureStart, { passive: false })
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      wrapper.removeEventListener('gesturestart', handleGestureStart)
      wrapper.removeEventListener('gesturechange', handleGestureStart)
      wrapper.removeEventListener('gestureend', handleGestureStart)
      wrapper.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Handle wheel/gesture events inside the iframe - forward to parent
  useEffect(() => {
    if (!iframeMounted) return
    const iframe = frameRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument
    const iframeWin = iframe.contentWindow
    if (!iframeDoc || !iframeWin) return

    // Apply overscroll-behavior to iframe's html element to prevent browser navigation
    if (iframeDoc.documentElement) {
      iframeDoc.documentElement.style.overscrollBehavior = 'none'
    }

    // Block ALL wheel events - prevents browser back/forward and zoom
    const handleIframeWheel = (e: WheelEvent) => {
      // Always prevent default to block browser navigation
      e.preventDefault()
      e.stopPropagation()

      if (e.ctrlKey || e.metaKey) {
        // Block zoom - don't forward
      } else {
        // Forward pan to canvas
        options.onViewportPan?.(e.deltaX, e.deltaY)
      }
    }

    // Block touchmove to prevent any gesture handling in the iframe
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    // Block gestures
    const handleGestureStart = (e: Event) => {
      e.preventDefault()
    }

    // Add listeners to BOTH document and window with capture for maximum priority
    iframeDoc.addEventListener('wheel', handleIframeWheel, { passive: false, capture: true })
    iframeWin.addEventListener('wheel', handleIframeWheel, { passive: false, capture: true })
    iframeDoc.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    iframeDoc.addEventListener('gesturestart', handleGestureStart, { passive: false, capture: true })
    iframeDoc.addEventListener('gesturechange', handleGestureStart, { passive: false, capture: true })
    iframeDoc.addEventListener('gestureend', handleGestureStart, { passive: false, capture: true })
    iframeWin.addEventListener('gesturestart', handleGestureStart, { passive: false, capture: true })
    iframeWin.addEventListener('gesturechange', handleGestureStart, { passive: false, capture: true })
    iframeWin.addEventListener('gestureend', handleGestureStart, { passive: false, capture: true })

    return () => {
      iframeDoc.removeEventListener('wheel', handleIframeWheel, { capture: true })
      iframeWin.removeEventListener('wheel', handleIframeWheel, { capture: true })
      iframeDoc.removeEventListener('touchmove', handleTouchMove, { capture: true })
      iframeDoc.removeEventListener('gesturestart', handleGestureStart, { capture: true })
      iframeDoc.removeEventListener('gesturechange', handleGestureStart, { capture: true })
      iframeDoc.removeEventListener('gestureend', handleGestureStart, { capture: true })
      iframeWin.removeEventListener('gesturestart', handleGestureStart, { capture: true })
      iframeWin.removeEventListener('gesturechange', handleGestureStart, { capture: true })
      iframeWin.removeEventListener('gestureend', handleGestureStart, { capture: true })
    }
  }, [iframeMounted, options.onViewportPan])

  // Watch for font loading events and re-inject styles when fonts change
  // This handles fonts that load after the iframe is mounted
  useEffect(() => {
    if (!iframeMounted) return
    const iframe = frameRef.current
    if (!iframe?.contentDocument) return

    // Listen for font loading events
    const handleFontLoading = () => {
      if (iframe?.contentDocument) {
        injectStylesIntoIframe(iframe.contentDocument)
      }
    }

    // Use the fonts API to detect when new fonts are loaded
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', handleFontLoading)
      return () => {
        document.fonts.removeEventListener('loadingdone', handleFontLoading)
      }
    }
  }, [iframeMounted])

  const {
    viewportWidth,
    viewportHeight,
    deviceName,
    children,
    styles,
  } = element

  const initialContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin: 0; padding: 0; touch-action: none; overscroll-behavior: none;">
        <div id="viewport-root"></div>
      </body>
    </html>
  `

  const frameHeight = viewportHeight || 600

  // Use custom deviceName if set, otherwise auto-detect from width
  const displayName = deviceName || getDeviceNameForWidth(viewportWidth)

  // Scaled sizes for overlays (compensate for canvas zoom)
  const outlineWidth = 2 * inverseScale
  const handleSize = 8 * inverseScale
  const labelFontSize = 11 * inverseScale
  const labelTop = -20 * inverseScale

  // Render overlay for a single element
  const renderOverlay = (id: string, isSelected: boolean) => {
    const rect = elementRects.get(id)
    if (!rect) return null

    const el = findElement(element.children || [], id)
    if (!el || el.type === 'text') return null

    const isComponent = el.type === 'component'
    const color = isComponent ? '#a855f7' : '#3b82f6'

    return (
      <div
        key={id}
        style={{
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          outline: `${outlineWidth}px solid ${color}`,
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '2px',
        }}
      >
        {/* Label - scaled to compensate for zoom */}
        <div
          style={{
            position: 'absolute',
            top: labelTop,
            left: 0,
            fontSize: `${labelFontSize}px`,
            color: color,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
            transformOrigin: 'bottom left',
          }}
        >
          {getElementLabel(el)}
        </div>

        {/* Resize handles - scaled and with pointer events */}
        {isSelected && (
          <>
            {/* NW */}
            <div
              style={{
                position: 'absolute',
                width: handleSize,
                height: handleSize,
                background: 'white',
                border: `${outlineWidth}px solid ${color}`,
                left: -handleSize / 2,
                top: -handleSize / 2,
                cursor: 'nw-resize',
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => handleElementResizeStart(e, id, 'nw', rect)}
            />
            {/* NE */}
            <div
              style={{
                position: 'absolute',
                width: handleSize,
                height: handleSize,
                background: 'white',
                border: `${outlineWidth}px solid ${color}`,
                right: -handleSize / 2,
                top: -handleSize / 2,
                cursor: 'ne-resize',
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => handleElementResizeStart(e, id, 'ne', rect)}
            />
            {/* SW */}
            <div
              style={{
                position: 'absolute',
                width: handleSize,
                height: handleSize,
                background: 'white',
                border: `${outlineWidth}px solid ${color}`,
                left: -handleSize / 2,
                bottom: -handleSize / 2,
                cursor: 'sw-resize',
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => handleElementResizeStart(e, id, 'sw', rect)}
            />
            {/* SE */}
            <div
              style={{
                position: 'absolute',
                width: handleSize,
                height: handleSize,
                background: 'white',
                border: `${outlineWidth}px solid ${color}`,
                right: -handleSize / 2,
                bottom: -handleSize / 2,
                cursor: 'se-resize',
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => handleElementResizeStart(e, id, 'se', rect)}
            />
          </>
        )}
      </div>
    )
  }

  // Scaled viewport label dimensions
  const viewportLabelFontSize = 12 * inverseScale
  const viewportLabelTop = -28 * inverseScale
  const viewportLabelPadding = `${4 * inverseScale}px ${8 * inverseScale}px`
  const viewportLabelBorderRadius = `${4 * inverseScale}px ${4 * inverseScale}px 0 0`

  // Scaled resize handle sizes
  const resizeHandleWidth = 8 * inverseScale
  const cornerHandleSize = 12 * inverseScale

  return (
    <div
      ref={setNodeRef}
      data-element-id={element.id}
      data-viewport-width={viewportWidth}
      style={{
        ...styles,
        position: 'relative',
        width: viewportWidth,
        height: frameHeight,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Disable browser touch gestures (pinch zoom, swipe back)
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          options.onSelectElement?.(element.id, e.shiftKey)
        }
      }}
      onMouseOver={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          options.onHoverElement?.(element.id)
        }
      }}
      onMouseLeave={(e) => {
        e.stopPropagation()
        options.onHoverElement?.(null)
        setHoveredChildId(null)
      }}
      {...attributes}
    >
      {/* Device name label - scaled to stay same visual size when zoomed */}
      <div
        style={{
          position: 'absolute',
          top: viewportLabelTop,
          left: 0,
          fontSize: `${viewportLabelFontSize}px`,
          fontWeight: 500,
          color: '#6b7280',
          whiteSpace: 'nowrap',
          cursor: 'grab',
          padding: viewportLabelPadding,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: viewportLabelBorderRadius,
          borderTop: `${1 * inverseScale}px solid #e5e7eb`,
          borderLeft: `${1 * inverseScale}px solid #e5e7eb`,
          borderRight: `${1 * inverseScale}px solid #e5e7eb`,
          borderBottom: 'none',
          zIndex: 10,
          transformOrigin: 'bottom left',
        }}
        onClick={(e) => {
          e.stopPropagation()
          options.onSelectElement?.(element.id, e.shiftKey)
        }}
        {...listeners}
      >
        {displayName} ({viewportWidth}×{frameHeight})
      </div>

      <Frame
        ref={frameRef as any}
        initialContent={initialContent}
        mountTarget="#viewport-root"
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          display: 'block',
          touchAction: 'none', // Disable browser touch gestures inside iframe
        }}
        contentDidMount={() => {
          const iframe = frameRef.current
          if (iframe?.contentDocument) {
            // Initial injection
            injectStylesIntoIframe(iframe.contentDocument)
            setIframeMounted(true)

            // Wait for fonts to be ready and re-inject to capture @font-face rules
            // Next.js fonts and other async-loaded fonts may not be available immediately
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(() => {
                if (iframe?.contentDocument) {
                  injectStylesIntoIframe(iframe.contentDocument)
                }
              })
            }

            // Also re-inject after a short delay to catch dynamically added stylesheets
            // This handles cases where CSS is loaded asynchronously (e.g., code splitting)
            setTimeout(() => {
              if (iframe?.contentDocument) {
                injectStylesIntoIframe(iframe.contentDocument)
              }
            }, 100)
          }
        }}
      >
        <FrameContextConsumer>
          {({ document: frameDocument, window: frameWindow }) => (
            <div
              style={{
                width: '100%',
                minHeight: '100%',
                position: 'relative',
              }}
              onClick={(e) => {
                // If clicking empty space (not on a child element), select the viewport
                const target = e.target as HTMLElement
                const clickedChild = target.closest('[data-element-id]')
                if (!clickedChild) {
                  e.stopPropagation()
                  options.onSelectElement?.(element.id, e.shiftKey)
                }
              }}
              onMouseOver={(e) => {
                // If hovering empty space, hover the viewport
                const target = e.target as HTMLElement
                const hoveredChild = target.closest('[data-element-id]')
                if (!hoveredChild) {
                  e.stopPropagation()
                  options.onHoverElement?.(element.id)
                  setHoveredChildId(null)
                }
              }}
            >
              {children?.map((child) => renderElement(child, childOptions))}

              {/* Hover overlay - only if not selected */}
              {hoveredChildId && !selectedChildIds.has(hoveredChildId) && renderOverlay(hoveredChildId, false)}

              {/* Selection overlays */}
              {Array.from(selectedChildIds).map(id => renderOverlay(id, true))}
            </div>
          )}
        </FrameContextConsumer>
      </Frame>


      {/* Viewport resize handles - scaled */}
      {/* East (right edge) */}
      <div
        style={{
          position: 'absolute',
          right: -resizeHandleWidth / 2,
          top: 0,
          width: resizeHandleWidth,
          height: '100%',
          cursor: 'ew-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
      />
      {/* South (bottom edge) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: -resizeHandleWidth / 2,
          width: '100%',
          height: resizeHandleWidth,
          cursor: 'ns-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
      />
      {/* Southeast corner */}
      <div
        style={{
          position: 'absolute',
          right: -resizeHandleWidth / 2,
          bottom: -resizeHandleWidth / 2,
          width: cornerHandleSize,
          height: cornerHandleSize,
          cursor: 'nwse-resize',
          background: 'transparent',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
    </div>
  )
}
