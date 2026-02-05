"use client";

import React, { useState, useEffect } from "react";
import { FEElement, ComponentElement, IconElement, ViewportElement, IconLibraryConfig, IconPropsSchema, PHOSPHOR_PROPS_SCHEMA, LUCIDE_PROPS_SCHEMA, VIEWPORT_PRESETS } from "./types";
import { findElement } from "./utils/treeUtils";
import { getDeviceNameForWidth } from "./ViewportRenderer";
import { ComponentIndex } from "./LunagraphEditor";
import { Text } from "./ui/Text";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/Select";
import { htmlPropsSchema } from "@lunagraph/codegen";
import { DiamondIcon, X } from "@phosphor-icons/react";

interface PropsPanelProps {
  selectedElementId: string | null;
  elements: FEElement[];
  componentIndex?: ComponentIndex;
  iconLibraries?: Record<string, IconLibraryConfig>;
  onUpdateElementProps: (elementId: string, props: Record<string, any>) => void;
  onReplaceElement?: (oldElementId: string, newElement: FEElement) => void;
  onOpenComponent?: (componentName: string, filePath: string) => void;
  renderMode?: 'felement' | 'snapshot';
  readOnly?: boolean;
}

// Default schema for unknown icon libraries
const DEFAULT_ICON_PROPS_SCHEMA: IconPropsSchema = {
  size: { type: 'number', default: 16, label: 'Size' },
  color: { type: 'color', label: 'Color' },
};

// Get schema for a library (try to detect common libraries)
function getIconPropsSchema(libraryName: string, config?: IconLibraryConfig): IconPropsSchema {
  if (config?.propsSchema) return config.propsSchema;
  if (libraryName.includes('phosphor')) return PHOSPHOR_PROPS_SCHEMA;
  if (libraryName.includes('lucide')) return LUCIDE_PROPS_SCHEMA;
  return DEFAULT_ICON_PROPS_SCHEMA;
}

const COMPONENT_HINT_DISMISSED_KEY = 'lunagraph-component-hint-dismissed';

export default function PropsPanel({
  selectedElementId,
  elements,
  componentIndex,
  iconLibraries,
  onUpdateElementProps,
  onReplaceElement,
  onOpenComponent,
  renderMode = 'felement',
  readOnly = false,
}: PropsPanelProps) {
  const [propValues, setPropValues] = useState<Record<string, string>>({});
  const [viewportValues, setViewportValues] = useState<{ width: string; height: string; deviceName: string }>({
    width: '',
    height: '',
    deviceName: '',
  });
  const [componentHintDismissed, setComponentHintDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(COMPONENT_HINT_DISMISSED_KEY) === 'true';
    }
    return false;
  });

  const handleDismissComponentHint = () => {
    setComponentHintDismissed(true);
    localStorage.setItem(COMPONENT_HINT_DISMISSED_KEY, 'true');
  };

  useEffect(() => {
    if (!selectedElementId) {
      setPropValues({});
      setViewportValues({ width: '', height: '', deviceName: '' });
      return;
    }

    const element = findElement(elements, selectedElementId);
    if (!element) {
      setPropValues({});
      setViewportValues({ width: '', height: '', deviceName: '' });
      return;
    }

    // Handle viewport elements separately
    if (element.type === 'viewport') {
      const viewportEl = element as ViewportElement;
      setViewportValues({
        width: String(viewportEl.viewportWidth),
        height: viewportEl.viewportHeight ? String(viewportEl.viewportHeight) : '',
        deviceName: viewportEl.deviceName || '',
      });
      setPropValues({});
      return;
    }

    if (element.type !== 'component' && element.type !== 'icon' && element.type !== 'html') {
      setPropValues({});
      return;
    }

    // Initialize prop values from element.props
    const currentProps = element.props || {};

    // Convert all values to strings for input fields
    const stringValues: Record<string, string> = {};
    Object.entries(currentProps).forEach(([key, value]) => {
      // Skip style and className - they're handled separately
      if (key === 'style' || key === 'className') return;
      stringValues[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    });

    setPropValues(stringValues);
  }, [selectedElementId, elements]);

  if (!selectedElementId) {
    return null;
  }

  const element = findElement(elements, selectedElementId);
  if (!element) {
    return null;
  }

  // Handle viewport elements
  if (element.type === 'viewport') {
    const viewportElement = element as ViewportElement;

    const handleViewportChange = (field: 'width' | 'height' | 'deviceName', value: string) => {
      if (!onReplaceElement) return;

      let newWidth = viewportElement.viewportWidth;
      let newHeight = viewportElement.viewportHeight;
      let newDeviceName = viewportElement.deviceName;

      if (field === 'width') {
        newWidth = parseInt(value) || viewportElement.viewportWidth;
        // Auto-update deviceName only if it wasn't explicitly set (empty or matches auto-detected name)
        const currentAutoName = getDeviceNameForWidth(viewportElement.viewportWidth);
        if (!viewportElement.deviceName || viewportElement.deviceName === currentAutoName) {
          newDeviceName = ''; // Clear it so it auto-detects in ViewportRenderer
        }
      } else if (field === 'height') {
        newHeight = value ? parseInt(value) : undefined;
      } else if (field === 'deviceName') {
        newDeviceName = value;
      }

      setViewportValues({
        width: String(newWidth),
        height: newHeight ? String(newHeight) : '',
        deviceName: newDeviceName || '',
      });

      const updatedElement: ViewportElement = {
        ...viewportElement,
        viewportWidth: newWidth,
        viewportHeight: newHeight,
        deviceName: newDeviceName || undefined,
      };

      onReplaceElement(selectedElementId, updatedElement);
    };

    const handlePresetChange = (presetKey: string) => {
      const preset = VIEWPORT_PRESETS[presetKey as keyof typeof VIEWPORT_PRESETS];
      if (!preset || !onReplaceElement) return;

      setViewportValues({
        width: String(preset.width),
        height: String(preset.height),
        deviceName: preset.name,
      });

      const updatedElement: ViewportElement = {
        ...viewportElement,
        viewportWidth: preset.width,
        viewportHeight: preset.height,
        deviceName: preset.name,
      };

      onReplaceElement(selectedElementId, updatedElement);
    };

    return (
      <div className="border-b border-ed-border">
        <div className="p-3 border-b border-ed-border">
          <Text size="sm" weight="semibold">Viewport</Text>
          <Text size="xs" variant="tertiary" className="mt-1">
            {viewportElement.deviceName || 'Custom'} ({viewportElement.viewportWidth}px)
          </Text>
        </div>

        <div className="p-3 space-y-3">
          {/* Preset selector */}
          <div>
            <Text size="xs" weight="medium" className="mb-1 block">Preset</Text>
            <Select
              value=""
              onValueChange={handlePresetChange}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Choose a preset..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VIEWPORT_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name} ({preset.width}×{preset.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Width */}
          <div>
            <Text size="xs" weight="medium" className="mb-1 block">Width (px)</Text>
            <Input
              type="number"
              value={viewportValues.width}
              onChange={(e) => handleViewportChange('width', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full h-8 text-xs"
              placeholder="1512"
              min={100}
            />
          </div>

          {/* Height */}
          <div>
            <Text size="xs" weight="medium" className="mb-1 block">Height (px)</Text>
            <Input
              type="number"
              value={viewportValues.height}
              onChange={(e) => handleViewportChange('height', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full h-8 text-xs"
              placeholder="auto"
              min={100}
            />
            <Text size="3xs" variant="tertiary" className="mt-0.5">Leave empty for auto height</Text>
          </div>

          {/* Device Name */}
          <div>
            <Text size="xs" weight="medium" className="mb-1 block">Label</Text>
            <Input
              type="text"
              value={viewportValues.deviceName}
              onChange={(e) => handleViewportChange('deviceName', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full h-8 text-xs"
              placeholder="Desktop, Mobile, etc."
            />
          </div>
        </div>
      </div>
    );
  }

  // For other types, check if they have editable props
  if (element.type !== 'component' && element.type !== 'icon' && element.type !== 'html') {
    return null;
  }

  const handlePropChange = (propName: string, value: string, propType?: string) => {
    setPropValues(prev => ({ ...prev, [propName]: value }));

    // Parse value and update element props
    let parsedValue: any = value;

    // Handle specific prop types
    if (propType === 'number') {
      parsedValue = value === '' ? undefined : Number(value);
    } else if (propType === 'boolean') {
      parsedValue = value === 'true';
    } else if (value.startsWith('{') || value.startsWith('[')) {
      try {
        // First try strict JSON
        parsedValue = JSON.parse(value);
      } catch {
        // If JSON fails, try evaluating as JavaScript (handles single quotes, unquoted keys)
        try {
          // Use Function constructor to safely evaluate JS object/array literals
          // This handles: { label: 'test' } and ['a', 'b']
          parsedValue = new Function(`return ${value}`)();
        } catch {
          // Keep as string if both fail
        }
      }
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      parsedValue = Number(value);
    }

    const newProps = {
      ...element.props,
      [propName]: parsedValue,
    };

    onUpdateElementProps(selectedElementId, newProps);
  };

  // Handle icon elements
  if (element.type === 'icon') {
    const iconElement = element as IconElement;
    const libraryConfig = iconLibraries?.[iconElement.library];
    const schema = getIconPropsSchema(iconElement.library, libraryConfig);

    return (
      <div className="border-b border-ed-border">
        <div className="p-3 border-b border-ed-border">
          <Text size="sm" weight="semibold">Icon</Text>
          <Text size="xs" variant="tertiary" className="mt-1">{iconElement.iconName}</Text>
          <Text size="3xs" variant="tertiary">{libraryConfig?.displayName || iconElement.library}</Text>
        </div>

        <div className="p-3 space-y-3 max-h-[300px] overflow-auto">
          {Object.entries(schema).map(([propName, propConfig]) => {
            const currentValue = propValues[propName] ?? String(propConfig.default ?? '');

            if (propConfig.type === 'enum' && propConfig.options) {
              return (
                <div key={propName}>
                  <Text size="xs" weight="medium" className="mb-1 block">
                    {propConfig.label || propName}
                  </Text>
                  <Select
                    value={currentValue}
                    onValueChange={(value) => handlePropChange(propName, value)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder={`Select ${propName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {propConfig.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (propConfig.type === 'boolean') {
              return (
                <div key={propName}>
                  <Text size="xs" weight="medium" className="mb-1 block">
                    {propConfig.label || propName}
                  </Text>
                  <Select
                    value={currentValue}
                    onValueChange={(value) => handlePropChange(propName, value, 'boolean')}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">false</SelectItem>
                      <SelectItem value="true">true</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (propConfig.type === 'color') {
              return (
                <div key={propName}>
                  <Text size="xs" weight="medium" className="mb-1 block">
                    {propConfig.label || propName}
                  </Text>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentValue || '#000000'}
                      onChange={(e) => handlePropChange(propName, e.target.value)}
                      className="w-8 h-8 rounded border border-ed-border cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handlePropChange(propName, e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="flex-1 h-8 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              );
            }

            // Default: number or string input
            return (
              <div key={propName}>
                <Text size="xs" weight="medium" className="mb-1 block">
                  {propConfig.label || propName}
                </Text>
                <Input
                  type={propConfig.type === 'number' ? 'number' : 'text'}
                  step={propConfig.type === 'number' ? 'any' : undefined}
                  value={currentValue}
                  onChange={(e) => handlePropChange(propName, e.target.value, propConfig.type)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-8 text-xs"
                  placeholder={String(propConfig.default ?? '')}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle HTML elements (img, a, input, etc.)
  if (element.type === 'html') {
    const htmlElement = element;
    const tag = htmlElement.tag;

    // Use shared schema for HTML element props
    const propsForTag = htmlPropsSchema[tag] || [];

    if (propsForTag.length === 0) {
      return null;
    }

    return (
      <div className="border-b border-ed-border">
        <div className="p-3 border-b border-ed-border">
          <Text size="sm" weight="semibold">Attributes</Text>
          <Text size="xs" variant="tertiary" className="mt-1">&lt;{tag}&gt;</Text>
        </div>

        <div className="p-3 space-y-3 max-h-[300px] overflow-auto">
          {propsForTag.map((propConfig) => {
            const propName = propConfig.label;
            const currentValue = propValues[propName] ?? '';

            if (propConfig.type === 'boolean') {
              return (
                <div key={propName}>
                  <Text size="xs" weight="medium" className="mb-1 block">
                    {propName}
                  </Text>
                  <Select
                    value={currentValue || 'false'}
                    onValueChange={(value) => handlePropChange(propName, value, 'boolean')}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">false</SelectItem>
                      <SelectItem value="true">true</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            // Special handling for img src - show preview
            if (tag === 'img' && propName === 'src' && currentValue) {
              return (
                <div key={propName}>
                  <Text size="xs" weight="medium" className="mb-1 block">
                    {propName}
                  </Text>
                  {currentValue.startsWith('data:') ? (
                    <div className="mb-2 p-2 bg-ed-muted rounded border border-ed-border">
                      <img
                        src={currentValue}
                        alt="Preview"
                        className="max-w-full max-h-24 object-contain mx-auto"
                      />
                    </div>
                  ) : null}
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handlePropChange(propName, e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 text-xs"
                    placeholder="https://..."
                  />
                </div>
              );
            }

            return (
              <div key={propName}>
                <Text size="xs" weight="medium" className="mb-1 block">
                  {propName}
                </Text>
                <Input
                  type={propConfig.type === 'number' ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) => handlePropChange(propName, e.target.value, propConfig.type)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-8 text-xs"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle component elements
  const componentElement = element as ComponentElement;
  const componentName = componentElement.componentName;
  const componentInfo = componentIndex?.[componentName];
  const componentFilePath = componentInfo?.path;
  const availableProps = componentInfo?.props || {};

  // Filter out style and className props
  const editableProps = Object.entries(availableProps).filter(
    ([key]) => key !== 'style' && key !== 'className'
  );

  return (
    <div>
      {/* Component open hint - dismissible */}
      {!componentHintDismissed && componentFilePath && (
        <div className="mx-3 mt-3 mb-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 flex items-start gap-2">
          <DiamondIcon size={14} weight="bold" className="text-purple-500 shrink-0 mt-0.5" />
          <Text size="xs" className="text-purple-700 dark:text-purple-300 flex-1">
            Double-click this component to open the main component file
          </Text>
          <button
            onClick={handleDismissComponentHint}
            className="shrink-0 p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded text-purple-500 dark:text-purple-400"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {editableProps.length > 0 && (
        <div className="border-b border-ed-border">
          <div className="p-3 border-b border-ed-border">
            <Text size="sm" weight="semibold">Props</Text>
            <Text size="xs" variant="tertiary" className="mt-1">{componentName}</Text>
          </div>

          {renderMode === 'snapshot' ? (
            <div className="p-3">
              <p className="text-xs text-ed-muted-foreground">
                Props editing disabled in read-only mode
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3 max-h-[300px] overflow-auto">
              {editableProps.map(([propName, propInfo]) => {
                const isRequired = (propInfo as any).required;
                const propType = (propInfo as any).type || 'string';
                const currentValue = propValues[propName] || '';

                return (
                  <div key={propName}>
                    <Text size="xs" weight="medium" className="mb-1 block">
                      {propName}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Text>
                    <Input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handlePropChange(propName, e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full h-8 text-xs"
                      placeholder={propType}
                    />
                    <Text size="3xs" variant="tertiary" className="mt-0.5">{propType}</Text>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
