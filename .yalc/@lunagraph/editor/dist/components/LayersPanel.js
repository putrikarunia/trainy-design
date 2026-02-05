"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { CaretDownIcon, CaretRightIcon, CodeIcon, DiamondIcon, TextT, Sparkle, Browser, Crosshair } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
function DropIndicatorLine({ show, depth, position }) {
    return _jsx("div", { className: cn("absolute left-0 right-0 h-0.5 bg-selection pointer-events-none opacity-0 transition-all duration-100 -translate-y-1/2", position === 'before' ? 'top-0' : 'bottom-0', show && "opacity-100 h-1"), style: { marginLeft: `${depth * 16 + 12}px`, marginRight: '12px' } });
}
export function LayersPanel({ elements, selectedElementIds, onSelectElement, onDragElement, onUpdateText, onFocusElement, readOnly = false, }) {
    const [collapsedIds, setCollapsedIds] = useState(new Set());
    const [draggedId, setDraggedId] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [dropPosition, setDropPosition] = useState(null);
    const [editingTextId, setEditingTextId] = useState(null);
    const [editingTextValue, setEditingTextValue] = useState("");
    const editInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    // Focus input when editing starts
    useEffect(() => {
        if (editingTextId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingTextId]);
    // Scroll to selected element when selection changes
    useEffect(() => {
        if (selectedElementIds.size === 0 || !scrollContainerRef.current)
            return;
        // Get the first selected element
        const firstSelectedId = Array.from(selectedElementIds)[0];
        const layerRow = scrollContainerRef.current.querySelector(`[data-layer-id="${firstSelectedId}"]`);
        if (layerRow) {
            // Only scrolls if element is not already visible
            layerRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedElementIds]);
    const handleTextDoubleClick = (e, element) => {
        e.stopPropagation();
        if (readOnly)
            return; // Disable text editing in read-only mode
        if (element.type === 'text' && onUpdateText) {
            setEditingTextId(element.id);
            setEditingTextValue(element.text || "");
        }
    };
    const handleTextEditComplete = () => {
        if (editingTextId && onUpdateText) {
            onUpdateText(editingTextId, editingTextValue);
        }
        setEditingTextId(null);
        setEditingTextValue("");
    };
    const handleTextEditKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTextEditComplete();
        }
        else if (e.key === 'Escape') {
            setEditingTextId(null);
            setEditingTextValue("");
        }
    };
    const toggleCollapse = (id) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    };
    const handleDragStart = (e, id) => {
        if (readOnly) {
            e.preventDefault();
            return; // Disable drag in read-only mode
        }
        e.stopPropagation();
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };
    const handleDragOver = (e, targetId, hasChildren) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedId || draggedId === targetId)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        // For elements without children, use 50/50 split for before/after
        // For elements with children, use 33/33/33 split for before/inside/after
        if (!hasChildren) {
            if (y < height * 0.5) {
                setDropPosition("before");
            }
            else {
                setDropPosition("after");
            }
        }
        else {
            if (y < height * 0.33) {
                setDropPosition("before");
            }
            else if (y > height * 0.67) {
                setDropPosition("after");
            }
            else {
                setDropPosition("inside");
            }
        }
        setDropTargetId(targetId);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        // Only clear if we're leaving the element entirely
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            setDropTargetId(null);
            setDropPosition(null);
        }
    };
    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedId || !onDragElement || draggedId === targetId) {
            setDraggedId(null);
            setDropTargetId(null);
            setDropPosition(null);
            return;
        }
        if (dropPosition) {
            onDragElement(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDropTargetId(null);
        setDropPosition(null);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
        setDropPosition(null);
    };
    const getElementIcon = (element) => {
        if (element.type === 'text') {
            return _jsx(TextT, { size: 16, weight: "regular", className: "text-ed-muted-foreground" });
        }
        if (element.type === 'component') {
            return _jsx(DiamondIcon, { size: 16, weight: "regular", className: "text-purple-600" });
        }
        if (element.type === 'icon') {
            return _jsx(Sparkle, { size: 16, weight: "fill", className: "text-amber-500" });
        }
        if (element.type === 'viewport') {
            return _jsx(Browser, { size: 16, weight: "regular", className: "text-blue-500" });
        }
        return _jsx(CodeIcon, { size: 16, weight: "regular", className: "text-ed-muted-foreground" });
    };
    const getElementLabel = (element) => {
        if (element.type === "component") {
            return element.componentName || "Component";
        }
        if (element.type === "html") {
            return element.tag || "Element";
        }
        if (element.type === "text") {
            return element.text || "Text";
        }
        if (element.type === "icon") {
            return element.iconName || "Icon";
        }
        if (element.type === "viewport") {
            return element.deviceName || `Viewport (${element.viewportWidth}px)`;
        }
        return "Element";
    };
    const renderLayerItem = (element, depth = 0) => {
        const isSelected = selectedElementIds.has(element.id);
        const isCollapsed = collapsedIds.has(element.id);
        const currentlyHasChildren = Boolean(element.type !== 'text' && element.type !== 'icon' && element.children && element.children?.length > 0);
        const canHaveChildren = element.type !== 'text' && element.type !== 'icon'; // Can accept drops inside if not a text or icon node
        const isDragging = draggedId === element.id;
        const isDropTarget = dropTargetId === element.id;
        const isEditingThis = editingTextId === element.id;
        return (_jsxs("div", { className: "relative", children: [_jsx(DropIndicatorLine, { show: isDropTarget && dropPosition === "before", depth: depth, position: "before" }), _jsxs("div", { "data-layer-id": element.id, draggable: !isEditingThis, onDragStart: (e) => handleDragStart(e, element.id), onDragOver: (e) => handleDragOver(e, element.id, canHaveChildren), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, element.id), onDragEnd: handleDragEnd, className: cn("flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-ed-accent/50 transition-colors group relative border border-transparent border-solid", isSelected && "bg-ed-accent", isDragging && "opacity-50", isDropTarget && dropPosition === "inside" && canHaveChildren && "bg-selection/10 border-selection"), style: { paddingLeft: `${depth * 16 + 12}px` }, onClick: (e) => onSelectElement(element.id, e.shiftKey), onDoubleClick: (e) => handleTextDoubleClick(e, element), children: [onFocusElement && (_jsx("button", { onClick: (e) => {
                                e.stopPropagation();
                                onFocusElement(element.id);
                            }, className: "absolute right-2 opacity-0 group-hover:opacity-100 hover:bg-ed-accent rounded p-0.5 transition-opacity", title: "Focus in canvas", children: _jsx(Crosshair, { size: 14, weight: "regular", className: "text-ed-muted-foreground" }) })), currentlyHasChildren ? (_jsx(Button, { variant: "ghost", size: "icon-2xs", isChildText: false, onClick: (e) => {
                                e.stopPropagation();
                                toggleCollapse(element.id);
                            }, children: isCollapsed ? (_jsx(CaretRightIcon, { size: 8, weight: "bold", className: "text-ed-muted-foreground" })) : (_jsx(CaretDownIcon, { size: 8, weight: "bold", className: "text-ed-muted-foreground" })) })) : (_jsx("div", { className: "w-2" })), _jsx("div", { className: "shrink-0", children: getElementIcon(element) }), isEditingThis ? (_jsx("input", { ref: editInputRef, type: "text", value: editingTextValue, onChange: (e) => setEditingTextValue(e.target.value), onBlur: handleTextEditComplete, onKeyDown: handleTextEditKeyDown, onClick: (e) => e.stopPropagation(), className: "flex-1 min-w-0 px-1 py-0 text-sm bg-ed-background border border-ed-border rounded outline-none focus:border-ed-primary text-ed-foreground" })) : (_jsx(Text, { size: "sm", variant: "primary", className: "flex-1 truncate select-none", children: getElementLabel(element) }))] }), _jsx(DropIndicatorLine, { show: isDropTarget && dropPosition === "after", depth: depth, position: "after" }), currentlyHasChildren && !isCollapsed && element.type !== 'text' && element.type !== 'icon' && (_jsx("div", { children: element.children?.map((child) => renderLayerItem(child, depth + 1)) }))] }, element.id));
    };
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "flex items-center justify-between px-4 py-3 border-b border-ed-border", children: _jsx(Text, { size: "xs", weight: "semibold", variant: "primary", children: "Layers" }) }), _jsx("div", { ref: scrollContainerRef, className: "flex-1 overflow-y-auto", children: elements.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(Text, { size: "sm", variant: "tertiary", children: "No layers yet" }) })) : (_jsx("div", { className: "py-1", children: elements.map((element) => renderLayerItem(element)) })) })] }));
}
