"use client";

import React, { useState, useEffect, useRef } from "react";
import { FEElement } from "./types";
import { findElement } from "./utils/treeUtils";
import { extractComputedStyles, camelToKebab, kebabToCamel, ComputedStyleEntry, CascadeSource, getCascadeForProperty } from "./utils/computedStyles";
import { Button } from "./ui/Button";
import { DiamondsFourIcon, TrashIcon, CaretRight, CaretDown } from "@phosphor-icons/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/Tooltip";
import { cn } from "../lib/utils";

/**
 * Find a DOM element by data-element-id, searching both main document and iframes.
 * This is needed because viewport children are rendered inside iframes.
 */
function findDOMElement(elementId: string): HTMLElement | null {
  // First try main document
  const mainEl = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
  if (mainEl) return mainEl;

  // Search inside iframes (for viewport children)
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        const el = iframeDoc.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
        if (el) return el;
      }
    } catch (e) {
      // Cross-origin iframe, skip
    }
  }

  return null;
}

interface HybridStylesPanelProps {
  selectedElementId: string | null;
  elements: FEElement[];
  onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void;
  onUpdateElementProps?: (elementId: string, props: Record<string, any>) => void;
  onCreateComponent?: () => void;
  renderMode?: 'felement' | 'snapshot';
  readOnly?: boolean;
}

interface StyleRowProps {
  entry: ComputedStyleEntry;
  isFocused: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  selectedElementId: string;
  onFocus: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onValueChange: (newValue: string) => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onDeleteCascadeSource: (selector: string) => void;
}

// Get helpful placeholder for property
function getPlaceholder(property: string): string {
  const placeholders: Record<string, string> = {
    'padding': 'top right bottom left',
    'margin': 'top right bottom left',
    'border': 'width style color',
    'border-radius': 'top-left top-right bottom-right bottom-left',
    'box-shadow': 'x y blur spread color',
    'text-shadow': 'x y blur color',
    'background': 'color image position/size repeat',
    'font': 'style weight size/line-height family',
    'transition': 'property duration timing-function delay',
    'animation': 'name duration timing-function delay iteration-count direction',
  }
  return placeholders[property] || ''
}

function StyleRow({
  entry,
  isFocused,
  isEditing,
  isExpanded,
  selectedElementId,
  onFocus,
  onStartEdit,
  onStopEdit,
  onValueChange,
  onDelete,
  onToggleExpand,
  onDeleteCascadeSource,
}: StyleRowProps) {
  const [localValue, setLocalValue] = useState(entry.value);
  const [originalValue, setOriginalValue] = useState(entry.value);
  const [cascade, setCascade] = useState<CascadeSource[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(entry.value);
    setOriginalValue(entry.value);
  }, [entry.value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
      // Set initial height to fit content
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Lazy-load cascade when expanded
  useEffect(() => {
    if (isExpanded && !cascade) {
      const domElement = findDOMElement(selectedElementId);
      if (domElement) {
        const cascadeSources = getCascadeForProperty(
          domElement,
          entry.property,
          entry.displayProperty,
          entry.value
        );
        setCascade(cascadeSources);
      }
    }
  }, [isExpanded, cascade, selectedElementId, entry.property, entry.displayProperty, entry.value]);

  const handleBlur = () => {
    // Only apply changes if value actually changed
    if (localValue !== originalValue) {
      onValueChange(localValue);
    }
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Only apply changes if value actually changed
      if (localValue !== originalValue) {
        onValueChange(localValue);
      }
      onStopEdit();
    } else if (e.key === 'Escape') {
      setLocalValue(originalValue); // Revert to original
      onStopEdit();
    }
  };

  return (
    <div>
      {/* Main property row */}
      <div
        className={`
          flex gap-2 px-2 py-0.5 group cursor-pointer
          ${isEditing ? 'items-start' : 'items-center'}
          ${entry.isUserOverride ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
          ${isFocused ? 'bg-ed-accent' : ''}
        `}
        onClick={onFocus}
        onDoubleClick={onStartEdit}
      >
        {/* Chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="shrink-0 hover:text-ed-foreground text-ed-muted-foreground transition-colors"
        >
          {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
        </button>

        <span className="text-ed-muted-foreground text-xs font-mono shrink-0 pt-0.5">
          {entry.displayProperty}:
        </span>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono px-1 py-0.5 resize-none leading-tight text-ed-foreground"
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              // Auto-resize textarea to fit content
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder(entry.displayProperty)}
            style={{ minHeight: '18px' }}
          />
        ) : (
          <span
            className="flex-1 text-xs font-mono hover:outline hover:outline-1 hover:outline-blue-500 rounded px-1 transition-all truncate text-ed-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            title={entry.value}
          >
            {entry.value}
          </span>
        )}

        {/* Show pencil emoji only for user overrides */}
        {entry.isUserOverride && (
          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 shrink-0">✏️</span>
        )}

        {/* Show trash for ANY property that exists in inline styles */}
        {entry.isInlineStyle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-ed-destructive"
            title="Delete style"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>

      {/* Cascade sources (when expanded) */}
      {isExpanded && cascade && cascade.length > 0 && (
        <div className="ml-6 border-l border-ed-border pl-2 py-1">
          {cascade.map((source, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-2 py-0.5 text-xs group/cascade",
                source.isActive ? "text-ed-foreground" : "text-ed-muted-foreground line-through opacity-60"
              )}
            >
              <span className="font-mono">{source.value}</span>
              <span className="text-ed-muted-foreground">from</span>
              <code className="bg-ed-muted px-1 rounded">{source.selector}</code>
              {source.type === 'class' && (
                <button
                  onClick={() => onDeleteCascadeSource(source.selector)}
                  className="opacity-0 group-hover/cascade:opacity-100 transition-opacity shrink-0 hover:text-ed-destructive ml-auto"
                  title={`Remove class "${source.selector}"`}
                >
                  <TrashIcon size={12} />
                </button>
              )}
              {source.type === 'inline' && (
                <button
                  onClick={() => onDelete()}
                  className="opacity-0 group-hover/cascade:opacity-100 transition-opacity shrink-0 hover:text-ed-destructive ml-auto"
                  title="Remove inline style"
                >
                  <TrashIcon size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HybridStylesPanel({
  selectedElementId,
  elements,
  onUpdateElementStyles,
  onUpdateElementProps,
  onCreateComponent,
  renderMode = 'felement',
  readOnly = false,
}: HybridStylesPanelProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState("");
  const [inputMode, setInputMode] = useState<'css' | 'tailwind'>('css');
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const element = selectedElementId ? findElement(elements, selectedElementId) : null;

  // Get computed styles - use state + useLayoutEffect to ensure DOM has updated
  const [styleEntries, setStyleEntries] = useState<ComputedStyleEntry[]>([]);

  useEffect(() => {
    if (!selectedElementId || !element) {
      setStyleEntries([]);
      return;
    }

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      const domElement = findDOMElement(selectedElementId);
      if (!domElement) {
        setStyleEntries([]);
        return;
      }

      const styles = extractComputedStyles(domElement, element.styles || {});
      setStyleEntries(styles);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    selectedElementId,
    element?.styles,
    element && element.type !== 'text' ? (element as any).props?.className : undefined,
    // Force recalculation by including a stringified version
    JSON.stringify(element?.styles),
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this panel is visible and focused
      if (!containerRef.current?.contains(document.activeElement)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, styleEntries.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && !editingProperty) {
        e.preventDefault();
        setEditingProperty(styleEntries[focusedIndex].property);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, editingProperty, styleEntries]);

  const handleValueChange = (property: string, newValue: string) => {
    if (!selectedElementId) return;

    const updatedStyles = { ...(element?.styles || {}) } as Record<string, any>;

    // If updating a shorthand, remove any related longhands to avoid conflicts
    if (property === 'background') {
      delete updatedStyles['backgroundColor'];
      delete updatedStyles['backgroundImage'];
      delete updatedStyles['backgroundPosition'];
      delete updatedStyles['backgroundSize'];
      delete updatedStyles['backgroundRepeat'];
    }

    updatedStyles[property] = newValue;

    onUpdateElementStyles(selectedElementId, updatedStyles);
  };

  const handleDeleteStyle = (property: string) => {
    if (!selectedElementId || !element) return;

    const updatedStyles = { ...(element.styles || {}) } as Record<string, any>;
    delete updatedStyles[property];

    // If deleting a shorthand, also delete any related longhands
    if (property === 'background') {
      delete updatedStyles['backgroundColor'];
      delete updatedStyles['backgroundImage'];
      delete updatedStyles['backgroundPosition'];
      delete updatedStyles['backgroundSize'];
      delete updatedStyles['backgroundRepeat'];
    } else if (property === 'padding') {
      delete updatedStyles['paddingTop'];
      delete updatedStyles['paddingRight'];
      delete updatedStyles['paddingBottom'];
      delete updatedStyles['paddingLeft'];
    } else if (property === 'margin') {
      delete updatedStyles['marginTop'];
      delete updatedStyles['marginRight'];
      delete updatedStyles['marginBottom'];
      delete updatedStyles['marginLeft'];
    }

    onUpdateElementStyles(selectedElementId, updatedStyles);
  };

  const handleToggleExpand = (property: string) => {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(property)) {
        next.delete(property);
      } else {
        next.add(property);
      }
      return next;
    });
  };

  const handleDeleteCascadeSource = (className: string) => {
    if (!selectedElementId || !element || element.type === 'text') return;

    // Remove the class from className
    const currentClassName = (element as any).props?.className || '';
    const classes = currentClassName.split(/\s+/).filter(Boolean);
    const updatedClasses = classes.filter((cls: string) => cls !== className);
    const updatedClassName = updatedClasses.join(' ');

    if (onUpdateElementProps) {
      onUpdateElementProps(selectedElementId, {
        ...((element as any).props || {}),
        className: updatedClassName
      });
    }
  };

  const handleQuickAdd = () => {
    if (!selectedElementId || !quickAddValue.trim()) return;

    if (inputMode === 'css') {
      // Parse "property: value;" format
      const match = quickAddValue.match(/^([^:]+):\s*([^;]+);?$/);
      if (!match) return;

      const property = match[1].trim();
      const value = match[2].trim();
      const camelProperty = kebabToCamel(property);

      onUpdateElementStyles(selectedElementId, {
        ...(element?.styles || {}),
        [camelProperty]: value,
      });
    } else {
      // Tailwind mode - merge classes with cn()
      const newClasses = quickAddValue.trim();
      const currentClassName = (element && element.type !== 'text' ? (element as any).props?.className || '' : '') as string;
      const updatedClassName = cn(currentClassName, newClasses);

      // Update className through props
      if (onUpdateElementProps && element && element.type !== 'text') {
        onUpdateElementProps(selectedElementId, {
          ...((element as any).props || {}),
          className: updatedClassName
        });
      }
    }

    setQuickAddValue("");

    // Focus back to textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  if (!selectedElementId) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-ed-muted-foreground p-4">
        Select an element to edit its styles
      </div>
    );
  }

  const elementType = element?.type === 'component'
    ? `Component: ${(element as any).componentName}`
    : element?.type === 'html'
      ? `HTML: <${(element as any).tag}>`
      : 'Text';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b border-ed-border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ed-foreground">Styles</h3>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  LeftIcon={DiamondsFourIcon}
                  leftIconProps={{ weight: "fill" }}
                  isChildText={false}
                  onClick={onCreateComponent}
                  disabled={!onCreateComponent}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Create Component</span>
                  <span className="opacity-60">⌥⌘K</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <p className="text-xs text-ed-muted-foreground mt-1">{elementType}</p>
      </div>

      {renderMode === 'snapshot' ? (
        <div className="p-3">
          <p className="text-xs text-ed-muted-foreground">
            Styles editing disabled in read-only mode
          </p>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-auto pb-16"
            tabIndex={0}
          >
            {/* Computed styles rows */}
            <div className="py-2">
              {styleEntries.map((entry, index) => (
                <StyleRow
                  key={entry.property}
                  entry={entry}
                  isFocused={focusedIndex === index}
                  isEditing={editingProperty === entry.property}
                  isExpanded={expandedProperties.has(entry.property)}
                  selectedElementId={selectedElementId!}
                  onFocus={() => setFocusedIndex(index)}
                  onStartEdit={() => setEditingProperty(entry.property)}
                  onStopEdit={() => setEditingProperty(null)}
                  onValueChange={(newValue) => handleValueChange(entry.property, newValue)}
                  onDelete={() => handleDeleteStyle(entry.property)}
                  onToggleExpand={() => handleToggleExpand(entry.property)}
                  onDeleteCascadeSource={handleDeleteCascadeSource}
                />
              ))}
            </div>
          </div>

          {/* Quick add textarea - fixed at bottom */}
          <div className="border-t border-ed-border">
            {/* Mode toggle */}
            <div className="flex border-b border-ed-border">
              <button
                onClick={() => setInputMode('css')}
                className={cn(
                  "flex-1 px-3 py-1 text-[10px] font-medium transition-colors",
                  inputMode === 'css'
                    ? "bg-ed-background text-ed-foreground"
                    : "text-ed-muted-foreground hover:text-ed-foreground"
                )}
              >
                CSS
              </button>
              <button
                onClick={() => setInputMode('tailwind')}
                className={cn(
                  "flex-1 px-3 py-1 text-[10px] font-medium transition-colors border-l border-ed-border",
                  inputMode === 'tailwind'
                    ? "bg-ed-background text-ed-foreground"
                    : "text-ed-muted-foreground hover:text-ed-foreground"
                )}
              >
                Tailwind
              </button>
            </div>

            {/* Input textarea */}
            <div className="px-2 py-1">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none outline-none resize-none text-xs font-mono text-ed-muted-foreground placeholder:text-ed-muted-foreground/50"
                placeholder={inputMode === 'css' ? 'property: value;' : 'p-4 gap-2 bg-blue-500'}
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAdd();
                  }
                  // Prevent arrow keys from bubbling when editing
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.stopPropagation();
                  }
                }}
                rows={4}
              />
            </div>
          </div>

          {/* Help text - fixed at bottom */}
          <div className="border-t border-ed-border p-3 text-xs text-ed-muted-foreground">
            <p>Click value to edit • Type <code className="bg-ed-muted px-1 rounded">property: value;</code> above to add</p>
          </div>
        </>
      )}
    </div>
  );
}
