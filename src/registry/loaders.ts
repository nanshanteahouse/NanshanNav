import type { WidgetType, WidgetComponentProps, WidgetSettingsProps } from '@/types/widget.ts';
import type { ComponentType } from 'react';
import { registry } from './index.ts';

export function loadWidgetComponent(
  type: WidgetType,
): Promise<{ default: ComponentType<WidgetComponentProps> }> {
  return registry[type].componentLoader();
}

export function loadWidgetSettings(
  type: WidgetType,
): Promise<{ default: ComponentType<WidgetSettingsProps> }> | null {
  const settingsLoader = registry[type].settingsLoader;
  return settingsLoader ? settingsLoader() : null;
}

export function getWidgetDisplayName(type: WidgetType): string {
  return registry[type].displayName;
}

export function getWidgetDefaultSize(type: WidgetType): { w: number; h: number } {
  return registry[type].defaultSize;
}

export function getWidgetMinSize(type: WidgetType): { w: number; h: number } | undefined {
  return registry[type].minSize;
}
