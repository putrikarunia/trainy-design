import { jsx as _jsx } from "react/jsx-runtime";
import { createElement, Fragment } from "react";
import { DraggableElement } from "../DraggableElement";
import { ElementErrorBoundary } from "../ErrorBoundary";
import { ViewportRenderer } from "../ViewportRenderer";
// Default dev server URL for proxy
const DEFAULT_DEV_SERVER_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER) ||
    'http://localhost:4001';
export function renderElement(element, options = {}) {
    const { isDragPreview = false, selectionMode = 'deepest', isSVGContext = false, devServerUrl = DEFAULT_DEV_SERVER_URL } = options;
    // In 'deepest' mode: stopPropagation to select deepest element
    // In 'topmost' mode: don't stopPropagation, let event bubble to topmost parent
    const shouldStopPropagation = selectionMode === 'deepest';
    // Detect if this element is an SVG or we're entering SVG context
    const isSVGElement = element.type === 'html' && element.tag === 'svg';
    const isInSVG = isSVGContext || isSVGElement;
    const commonProps = {
        "data-element-id": element.id,
        onClick: options.onSelectElement
            ? (e) => {
                if (shouldStopPropagation && element.type !== "text") {
                    e.stopPropagation();
                }
                // Shift+Click adds to selection (multi-select)
                options.onSelectElement(element.id, e.shiftKey);
            }
            : undefined,
        onDoubleClick: options.onDoubleClickElement
            ? (e) => {
                if (shouldStopPropagation && element.type !== "text") {
                    e.stopPropagation();
                }
                options.onDoubleClickElement(element.id, e.clientX, e.clientY);
            }
            : undefined,
        onMouseOver: options.onHoverElement
            ? (e) => {
                if (shouldStopPropagation && element.type !== "text") {
                    e.stopPropagation();
                }
                options.onHoverElement(element.id);
            }
            : undefined,
        onMouseLeave: options.onHoverElement
            ? (e) => {
                if (shouldStopPropagation && element.type !== "text") {
                    e.stopPropagation();
                }
                options.onHoverElement(null);
            }
            : undefined,
    };
    let content = _jsx("div", { children: "Default Content" });
    // Helper to render slot placeholder
    const renderSlot = () => {
        // Return null - users can add children via Layers panel
        return null;
    };
    if (element.type === "html") {
        // Void elements cannot have children
        const voidElements = ['img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        const isVoidElement = voidElements.includes(element.tag);
        // Textarea uses value/defaultValue, cannot have children
        const isTextarea = element.tag === 'textarea';
        // Check if element has no children - render slot placeholder
        const hasChildren = element.children && element.children.length > 0;
        // For img/video: override Tailwind/Next.js reset styles (max-width: 100%, height: auto) that break sizing
        // But only if user hasn't set their own max-width via class or inline style
        const needsResetOverride = element.tag === 'img' || element.tag === 'video';
        const hasMaxWidthClass = element.props?.className?.match(/\bmax-w-/);
        const hasMaxWidthInline = element.styles?.maxWidth !== undefined;
        const elementStyle = (needsResetOverride && !hasMaxWidthClass && !hasMaxWidthInline)
            ? { maxWidth: 'none', ...element.styles }
            : element.styles;
        // Special handling for iframe - wrap with overlay for interaction blocking
        const isIframe = element.tag === 'iframe';
        const iframeInteractionEnabled = element.props?.['data-interaction-enabled'] === 'true';
        if (isVoidElement || isTextarea) {
            // Void elements and textarea - no children allowed
            const elementProps = { ...element.props };
            content = createElement(element.tag ?? 'div', {
                ...elementProps,
                style: elementStyle,
                ...commonProps,
                draggable: false,
            });
        }
        else if (isIframe) {
            // Iframe with overlay for blocking interaction
            const elementProps = { ...element.props };
            // Remove the data attributes from props passed to iframe
            const useProxy = elementProps['data-use-proxy'] === 'true' || elementProps['data-use-proxy'] === true;
            const scale = parseFloat(elementProps['data-scale']) || 1;
            delete elementProps['data-interaction-enabled'];
            delete elementProps['data-use-proxy'];
            delete elementProps['data-scale'];
            // If using proxy, rewrite the src URL
            let iframeSrc = elementProps.src;
            if (useProxy && iframeSrc && iframeSrc !== 'about:blank') {
                iframeSrc = `${devServerUrl}/proxy?url=${encodeURIComponent(iframeSrc)}`;
            }
            // Parse container dimensions
            const containerWidth = elementStyle?.width;
            const containerHeight = elementStyle?.height;
            // Calculate iframe dimensions (scaled up so when we scale down, it fits the container)
            // e.g., if container is 560px and scale is 0.5, iframe should be 1120px
            const iframeWidth = scale !== 1 ? `${100 / scale}%` : '100%';
            const iframeHeight = scale !== 1 ? `${100 / scale}%` : '100%';
            content = createElement('div', {
                style: {
                    position: 'relative',
                    display: 'inline-block',
                    width: containerWidth,
                    height: containerHeight,
                    overflow: 'hidden',
                },
                ...commonProps,
            }, 
            // The iframe itself - scaled
            createElement(element.tag, {
                ...elementProps,
                src: iframeSrc,
                style: {
                    ...elementStyle,
                    width: iframeWidth,
                    height: iframeHeight,
                    transform: scale !== 1 ? `scale(${scale})` : undefined,
                    transformOrigin: 'top left',
                    border: 'none',
                },
                draggable: false,
            }), 
            // Overlay that blocks interaction when disabled
            !iframeInteractionEnabled && createElement('div', {
                style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'transparent',
                    cursor: 'default',
                },
                'data-iframe-overlay': 'true',
            }));
        }
        else {
            // Regular elements - can have children
            const elementProps = { ...element.props };
            content = createElement(element.tag ?? 'div', {
                ...elementProps,
                style: elementStyle,
                ...commonProps,
            }, hasChildren
                ? element.children?.map((child) => renderElement(child, {
                    ...options,
                    isSVGContext: isSVGElement // Pass SVG context to children
                }))
                : renderSlot());
        }
    }
    else if (element.type === "text") {
        // Text nodes - editable on double click
        const isEditing = options.editingTextId === element.id;
        if (isEditing) {
            // Get the captured bounds from when edit started
            const bounds = options.editingTextBounds;
            // Helper to auto-size textarea height to content (only expands, doesn't shrink below initial)
            const autoSizeHeight = (el, minHeight) => {
                el.style.height = 'auto';
                el.style.height = Math.max(el.scrollHeight, minHeight) + 'px';
            };
            // Render textarea when editing - sizes to content but wraps at container edge
            return createElement('textarea', {
                key: element.id,
                defaultValue: element.text || '',
                autoFocus: true,
                rows: 1,
                'data-text-element': 'true',
                style: {
                    ...element.styles,
                    border: 'none',
                    outline: '2px solid #3b82f6',
                    background: 'transparent',
                    font: 'inherit',
                    padding: 0,
                    margin: 0,
                    // Size to content (like span), but don't exceed container
                    width: 'fit-content',
                    maxWidth: '100%',
                    // Start with captured height, can expand
                    minHeight: bounds?.height ? bounds.height + 'px' : 'auto',
                    resize: 'none',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    display: 'block',
                    lineHeight: element.styles?.lineHeight || 'inherit',
                    // Enable native auto-sizing in modern browsers
                    fieldSizing: 'content',
                },
                ref: (el) => {
                    if (el && !el.dataset.initialized) {
                        // Mark as initialized to prevent re-running on re-renders
                        el.dataset.initialized = 'true';
                        // Set initial height based on content
                        el.style.height = 'auto';
                        el.style.height = Math.max(el.scrollHeight, bounds?.height || 0) + 'px';
                        // Focus and place cursor at end (don't select all)
                        el.focus();
                        el.setSelectionRange(el.value.length, el.value.length);
                    }
                },
                onInput: (e) => {
                    // Expand height if content grows, but don't shrink below original
                    const minHeight = bounds?.height || 0;
                    autoSizeHeight(e.currentTarget, minHeight);
                },
                onBlur: (e) => {
                    if (options.onEditText) {
                        options.onEditText(element.id, e.target.value);
                    }
                    if (options.onStopEditText) {
                        options.onStopEditText();
                    }
                },
                onKeyDown: (e) => {
                    // Cmd/Ctrl+Enter or Shift+Enter to confirm
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                        e.preventDefault();
                        e.currentTarget.blur();
                    }
                    if (e.key === 'Escape') {
                        // Revert to original text
                        e.currentTarget.value = element.text || '';
                        e.currentTarget.blur();
                    }
                },
                onClick: (e) => {
                    e.stopPropagation();
                },
            });
        }
        // Render normal span when not editing
        return createElement('span', {
            key: element.id,
            style: element.styles,
            ...commonProps,
            'data-text-element': 'true',
            onDoubleClick: (e) => {
                e.stopPropagation();
                if (options.onStartEditText) {
                    // Just capture the span's height - width will be 100% of container
                    const rect = e.currentTarget.getBoundingClientRect();
                    options.onStartEditText(element.id, { width: 0, height: rect.height });
                }
            },
        }, element.text);
    }
    else if (element.type === "component") {
        const componentElement = element;
        // Check if component has children prop defined in index
        const componentInfo = options.componentIndex?.[element.componentName];
        const hasChildrenProp = componentInfo?.props?.children !== undefined;
        const hasChildren = element.children && element.children.length > 0;
        // For unregistered components (library primitives like ProgressPrimitive.Root),
        // render using the stored componentRef
        if (componentElement.isRegistered === false) {
            const renderedChildren = element.children?.map((child) => renderElement(child, {
                ...options,
                isSVGContext,
            }));
            // Use the stored component reference if available
            if (componentElement.componentRef) {
                const LibraryComponent = componentElement.componentRef;
                const componentStyle = { ...element.styles, ...element.props?.style };
                content = createElement('div', {
                    style: { display: 'contents' },
                    ...commonProps,
                }, createElement(LibraryComponent, {
                    ...element.props,
                    style: componentStyle,
                }, renderedChildren));
            }
            else {
                // Fallback: render as div with styles
                content = createElement('div', {
                    style: { display: 'contents', ...element.styles },
                    ...commonProps,
                }, renderedChildren);
            }
        }
        else {
            // Registered component - render via registry
            const Component = options.components?.[element.componentName];
            if (!Component) {
                console.error('[renderElement] Component not found:', element.componentName, {
                    availableComponents: Object.keys(options.components || {}).slice(0, 10),
                });
                content = createElement('div', {
                    style: {
                        ...element.styles,
                        padding: '12px',
                        border: '2px dashed #f59e0b',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                    },
                    ...commonProps,
                }, `Component not found: ${element.componentName}`);
            }
            else {
                // If wrapper has explicit width/height, pass style to component to fill wrapper
                const hasExplicitSize = element.styles && (element.styles.width || element.styles.height);
                // Merge element.styles with any explicit width/height for wrapper
                const componentStyle = hasExplicitSize
                    ? {
                        width: element.styles?.width ? '100%' : undefined,
                        height: element.styles?.height ? '100%' : undefined,
                        ...element.styles, // Apply all user styles to component
                        ...element.props?.style, // Merge with existing style prop
                    }
                    : {
                        ...element.styles, // Apply all user styles to component
                        ...element.props?.style, // Merge with existing style prop
                    };
                // Wrapper always uses display:contents (styles go to component, not wrapper)
                const wrapperStyle = { display: 'contents' };
                // Filter out undefined props so component can use its defaults
                const filteredProps = {};
                if (element.props) {
                    for (const [key, value] of Object.entries(element.props)) {
                        if (value !== undefined) {
                            filteredProps[key] = value;
                        }
                    }
                }
                // Check if this is a child of an asChild component (passed via options)
                const isAsChildChild = options.isDragPreview && element.type === 'component';
                // Render children
                // If parent has asChild prop, render children without wrappers so Radix can clone them
                const parentHasAsChild = filteredProps.asChild === true;
                const renderedChildren = hasChildrenProp && !hasChildren
                    ? renderSlot()
                    : element.children?.map((child) => renderElement(child, {
                        ...options,
                        isSVGContext,
                        isDragPreview: parentHasAsChild ? true : options.isDragPreview
                    }));
                // If this is a child of an asChild component, return JUST the component without wrappers
                // This allows Radix Slot to properly clone it
                if (isAsChildChild) {
                    // Return directly without any wrappers (not even Fragment!)
                    return createElement(Component, {
                        ...filteredProps,
                        key: element.id, // Add key directly to component
                        style: componentStyle,
                        ...commonProps, // Add click/hover handlers directly to component
                    }, renderedChildren);
                }
                // Normal rendering with wrapper and error boundary
                // Special case: if this component has asChild, pass single child directly (not as array)
                // because Radix Slot expects a single child to clone
                const childrenToPass = parentHasAsChild && renderedChildren && renderedChildren.length === 1
                    ? renderedChildren[0]
                    : renderedChildren;
                content = createElement('div', {
                    style: wrapperStyle,
                    ...commonProps,
                }, createElement(ElementErrorBoundary, { elementId: element.id, elementName: element.componentName }, createElement(Component, {
                    ...filteredProps,
                    style: componentStyle,
                }, childrenToPass)));
            }
        }
    }
    else if (element.type === "icon") {
        // Render icon from registered library
        const library = options.iconLibraries?.[element.library];
        const IconComponent = library?.icons[element.iconName];
        if (!IconComponent) {
            // Icon not found - show placeholder
            content = createElement('div', {
                style: {
                    ...element.styles,
                    width: element.props?.size || 16,
                    height: element.props?.size || 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #f59e0b',
                    borderRadius: '2px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '10px',
                },
                title: `Icon not found: ${element.iconName} from ${element.library}`,
                ...commonProps,
            }, '?');
        }
        else {
            content = createElement('span', {
                style: {
                    display: 'inline-flex',
                    ...element.styles
                },
                ...commonProps,
            }, createElement(IconComponent, element.props));
        }
    }
    else if (element.type === "viewport") {
        // Viewport elements render children inside an iframe for CSS viewport isolation
        // This makes media queries work based on the viewport width, not the window width
        const viewportElement = element;
        // For viewport, we skip DraggableElement wrapper because:
        // 1. ViewportRenderer has its own data-element-id and event handlers
        // 2. The iframe inside would block drag events anyway
        // TODO: Add drag support for viewport elements by handling it on the wrapper
        return (_jsx(ViewportRenderer, { element: viewportElement, options: options }, element.id));
    }
    // Wrap with DraggableElement (unless it's a drag preview or SVG child)
    // SVG children can't have HTML div wrappers - only the SVG element itself gets wrapped
    // Table elements also can't have div wrappers - they have strict parent-child relationships
    // (e.g., <tr> can only contain <th>/<td>, <thead> can only contain <tr>)
    const tableElements = ['thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col', 'caption'];
    const isTableElement = element.type === 'html' && tableElements.includes(element.tag);
    const shouldSkipWrapper = isDragPreview || (isSVGContext && !isSVGElement) || isTableElement;
    // Use display:contents for most elements so wrapper doesn't affect layout
    // But for img/video, we need a real wrapper for events to work
    // (these elements have issues with event handlers when wrapper has display:contents)
    const needsRealWrapper = ['img', 'video'];
    const needsInlineBlock = element.type === 'html' && needsRealWrapper.includes(element.tag);
    const wrapperDisplay = needsInlineBlock ? 'inline-block' : 'contents';
    const draggableContent = shouldSkipWrapper ? (_jsx(Fragment, { children: content }, element.id)) : (_jsx(DraggableElement, { id: element.id, display: wrapperDisplay, onClick: commonProps.onClick, onMouseOver: commonProps.onMouseOver, onMouseLeave: commonProps.onMouseLeave, children: content }, element.id));
    return draggableContent;
}
