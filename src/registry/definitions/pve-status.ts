import type { WidgetDefinition } from '@/types/widget.ts';

export const pveStatusDefinition: WidgetDefinition<'pve-status'> = {
  kind: 'pve-status',
  displayName: 'PVE 状态',
  displayKey: 'registry.widget.pveStatus',
  icon: 'Server',
  defaultSize: { w: 4, h: 5 },
  minSize: { w: 3, h: 4 },
  defaultOptions: {
    proxmoxHost: '',
    nodeName: 'pve',
    showCpu: true,
    showMemory: true,
    showUptime: true,
    showStorage: true,
    showVmCounts: true,
    refreshInterval: 15,
  },
  componentLoader: () => import('@/components/widgets/PveStatusWidget'),
  settingsLoader: () => import('@/components/widgets/PveStatusWidget/Settings'),
  requiresServerData: true,
};
