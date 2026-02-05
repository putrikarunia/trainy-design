import { useDraggable, useDroppable, useDndContext } from "@dnd-kit/core";
import { ReactNode, memo } from "react";

// PERFORMANCE FIX: Memoize DraggableElement to prevent unnecessary re-renders
// when parent components update but props haven't changed
export const DraggableElement = memo(function DraggableElement({
  id,
  children,
  display,
  onClick,
  onMouseOver,
  onMouseLeave,
}: {
  id: string;
  children: ReactNode;
  display: string | undefined;
  onClick?: (e: React.MouseEvent) => void;
  onMouseOver?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: id,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: id,
  });

  // Check if ANY element is being dragged (not just this one)
  const { active } = useDndContext();
  const isAnyDragging = !!active;

  // Combine both refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  // Note: display:contents makes the wrapper invisible for layout but its children still receive events
  // However, for void elements like img, we need the wrapper to be a real element for drag/drop to work
  const style = {
    display: isAnyDragging ? undefined : display, // Remove display:contents during ANY drag so all elements can be droppable
    opacity: isDragging ? 0 : undefined, // Hide original completely while THIS element is dragging (Figma-style)
    pointerEvents: isDragging ? 'none' : undefined, // Disable all pointer events on original while THIS element is dragging
  } as React.CSSProperties;

  // Only add data-element-id to wrapper when it's a real element (not display:contents)
  // This ensures querySelector finds the right element for bounding rect calculations
  const isRealWrapper = display !== 'contents';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isRealWrapper ? { 'data-element-id': id } : {})}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
});
