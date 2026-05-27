import type { WidgetRegistry, WidgetType } from '@/types/widget';
import { clockDefinition } from './definitions/clock';
import { imageDefinition } from './definitions/image';
import { titleHeaderDefinition } from './definitions/title-header';
import { markdownTextDefinition } from './definitions/markdown-text';
import { webLinkDefinition } from './definitions/web-link';
import { webPageDefinition } from './definitions/web-page';
import { pveStatusDefinition } from './definitions/pve-status';
import { searchBoxDefinition } from './definitions/search-box';

export const registry: WidgetRegistry = {
  'clock': clockDefinition,
  'image': imageDefinition,
  'title-header': titleHeaderDefinition,
  'markdown-text': markdownTextDefinition,
  'web-link': webLinkDefinition,
  'web-page': webPageDefinition,
  'pve-status': pveStatusDefinition,
  'search-box': searchBoxDefinition,
};

export function getWidgetDefinition(type: WidgetType) {
  return registry[type];
}

export function getAllWidgetDefinitions() {
  return Object.values(registry);
}

export function getWidgetDefinitionsByGroup(): Record<string, WidgetType[]> {
  return {
    'Content': ['title-header', 'markdown-text'],
    'Navigation': ['web-link', 'web-page', 'search-box'],
    'Media': ['image'],
    'System': ['pve-status'],
    'Utilities': ['clock'],
  };
}
