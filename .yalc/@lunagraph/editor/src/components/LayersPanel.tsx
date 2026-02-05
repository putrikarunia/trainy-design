"use client";

import { FEElement } from "./types";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { CaretDownIcon, CaretRightIcon, CodeIcon, DiamondIcon, TextT, Sparkle, Browser, Crosshair } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface LayersPanelProps {
  elements: FEElement[];
  selectedElementIds: Set<string>;
  onSelectElement: (id: string | null, addToSelection?: boolean) => void;
  onDragElement?: (draggedId: string, targetId: string | null, position: "before" | "after" | "inside") => void;
  onUpdateText?: (id: string, newText: string) => void;
  onFocusElement?: (id: string) => void;
  readOnly?: boolean;
}

function DropIndicatorLine({ show, depth, position }: { show: boolean, depth: number, position: 'before' | 'after' }) {
  return <div className={cn("absolute left-0 right-0 h-0.5 bg-selection pointer-events-none opacity-0 transition-all duration-100 -translate-y-1/2",
    position === 'before' ? 'top-0' : 'bottom-0',
    show && "opacity-100 h-1")} style={{ marginLeft: `${depth * 16 + 12}px`, marginRight: '12px' }} />
}

export function LayersPanel({
  elements,
  selectedElementIds,
  onSelectElement,
  onDragElement,
  onUpdateText,
  onFocusElement,
  readOnly = false,
}: LayersPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTextId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTextId]);

  // Scroll to selected element when selection changes
  useEffect(() => {
    if (selectedElementIds.size === 0 || !scrollContainerRef.current) return;

    // Get the first selected element
    const firstSelectedId = Array.from(selectedElementIds)[0];
    const layerRow = scrollContainerRef.current.querySelector(`[data-layer-id="${firstSelectedId}"]`);

    if (layerRow) {
      // Only scrolls if element is not already visible
      layerRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedElementIds]);

  const handleTextDoubleClick = (e: React.MouseEvent, element: FEElement) => {
    e.stopPropagation();
    if (readOnly) return; // Disable text editing in read-only mode
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

  const handleTextEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextEditComplete();
    } else if (e.key === 'Escape') {
      setEditingTextId(null);
      setEditingTextValue("");
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (readOnly) {
      e.preventDefault();
      return; // Disable drag in read-only mode
    }
    e.stopPropagation();
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, hasChildren: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // For elements without children, use 50/50 split for before/after
    // For elements with children, use 33/33/33 split for before/inside/after
    if (!hasChildren) {
      if (y < height * 0.5) {
        setDropPosition("before");
      } else {
        setDropPosition("after");
      }
    } else {
      if (y < height * 0.33) {
        setDropPosition("before");
      } else if (y > height * 0.67) {
        setDropPosition("after");
      } else {
        setDropPosition("inside");
      }
    }

    setDropTargetId(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the element entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
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

  const getElementIcon = (element: FEElement) => {
    if (element.type === 'text') {
      return <TextT size={16} weight="regular" className="text-ed-muted-foreground" />;
    }
    if (element.type === 'component') {
      return <DiamondIcon size={16} weight="regular" className="text-purple-600" />;
    }
    if (element.type === 'icon') {
      return <Sparkle size={16} weight="fill" className="text-amber-500" />;
    }
    if (element.type === 'viewport') {
      return <Browser size={16} weight="regular" className="text-blue-500" />;
    }
    return <CodeIcon size={16} weight="regular" className="text-ed-muted-foreground" />;
  };

  const getElementLabel = (element: FEElement): string => {
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

  const renderLayerItem = (element: FEElement, depth: number = 0) => {
    const isSelected = selectedElementIds.has(element.id);
    const isCollapsed = collapsedIds.has(element.id);
    const currentlyHasChildren = Boolean(element.type !== 'text' && element.type !== 'icon' && element.children && element.children?.length > 0);
    const canHaveChildren = element.type !== 'text' && element.type !== 'icon'; // Can accept drops inside if not a text or icon node
    const isDragging = draggedId === element.id;
    const isDropTarget = dropTargetId === element.id;
    const isEditingThis = editingTextId === element.id;

    return (
      <div key={element.id} className="relative">
        {/* Drop indicator line - before */}
        <DropIndicatorLine show={isDropTarget && dropPosition === "before"} depth={depth} position="before" />

        <div
          data-layer-id={element.id}
          draggable={!isEditingThis}
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={(e) => handleDragOver(e, element.id, canHaveChildren)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, element.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-ed-accent/50 transition-colors group relative border border-transparent border-solid",
            isSelected && "bg-ed-accent",
            isDragging && "opacity-50",
            isDropTarget && dropPosition === "inside" && canHaveChildren && "bg-selection/10 border-selection"
          )}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={(e) => onSelectElement(element.id, e.shiftKey)}
          onDoubleClick={(e) => handleTextDoubleClick(e, element)}
        >
          {/* Focus button - appears on hover */}
          {onFocusElement && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFocusElement(element.id);
              }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 hover:bg-ed-accent rounded p-0.5 transition-opacity"
              title="Focus in canvas"
            >
              <Crosshair size={14} weight="regular" className="text-ed-muted-foreground" />
            </button>
          )}

          {/* Collapse/Expand button */}
          {currentlyHasChildren ? (
            <Button
              variant="ghost"
              size="icon-2xs"
              isChildText={false}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(element.id);
              }}
            >
              {isCollapsed ? (
                <CaretRightIcon size={8} weight="bold" className="text-ed-muted-foreground" />
              ) : (
                <CaretDownIcon size={8} weight="bold" className="text-ed-muted-foreground" />
              )}
            </Button>
          ) : (
            <div className="w-2" />
          )}

          {/* Element icon */}
          <div className="shrink-0">
            {getElementIcon(element)}
          </div>

          {/* Element label - show input when editing text */}
          {isEditingThis ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onBlur={handleTextEditComplete}
              onKeyDown={handleTextEditKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 py-0 text-sm bg-ed-background border border-ed-border rounded outline-none focus:border-ed-primary text-ed-foreground"
            />
          ) : (
            <Text
              size="sm"
              variant="primary"
              className="flex-1 truncate select-none"
            >
              {getElementLabel(element)}
            </Text>
          )}
        </div>

        {/* Drop indicator line - after */}
        <DropIndicatorLine show={isDropTarget && dropPosition === "after"} depth={depth} position="after" />

        {/* Render children */}
        {currentlyHasChildren && !isCollapsed && element.type !== 'text' && element.type !== 'icon' && (
          <div>
            {element.children?.map((child: FEElement) => renderLayerItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ed-border">
        <Text size="xs" weight="semibold" variant="primary">
          Layers
        </Text>
      </div>

      {/* Layers list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Text size="sm" variant="tertiary">
              No layers yet
            </Text>
          </div>
        ) : (
          <div className="py-1">
            {elements.map((element) => renderLayerItem(element))}
          </div>
        )}
      </div>
    </div>
  );
}
