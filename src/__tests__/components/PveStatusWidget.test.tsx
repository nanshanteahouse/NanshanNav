/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PveStatusWidget from '@/components/widgets/PveStatusWidget'

// ── Mock Zustand store ──
const mockStore = {
  editMode: false,
}

vi.mock('@/store/index', () => ({
  useDashboardStore: Object.assign(
    (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
    { getState: () => mockStore },
  ),
}))

// ── Mock i18n ──
vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'zh-CN',
  }),
}))

// ── Mock PVE data hook to avoid real API calls ──
vi.mock('@/components/widgets/PveStatusWidget/usePveStatus', () => ({
  usePveStatus: () => ({
    nodeStatusQuery: {
      data: {
        cpu: 0.25,
        cpuinfo: { cores: 8, cpus: 1, model: 'Test CPU', sockets: 1 },
        memory: { free: 12_884_901_888, total: 17_179_869_184, used: 4_294_967_296 },
        uptime: 86400,
        rootfs: { free: 50_000_000_000, total: 100_000_000_000, used: 50_000_000_000, avail: 50_000_000_000 },
        loadavg: ['0.5', '0.3', '0.2'],
        swap: { free: 0, total: 0, used: 0 },
        pveversion: '8.0',
        'current-kernel': { sysname: 'Linux', release: '6.2', version: '#1', machine: 'x86_64' },
        'boot-info': { mode: 'efi' },
        idle: 75,
        wait: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      dataUpdatedAt: 1_718_000_000_000,
    },
    resourcesQuery: {
      data: [
        { type: 'qemu', id: 'qemu/100', status: 'running' },
        { type: 'qemu', id: 'qemu/101', status: 'running' },
        { type: 'qemu', id: 'qemu/102', status: 'stopped' },
        { type: 'lxc', id: 'lxc/200', status: 'running' },
        { type: 'lxc', id: 'lxc/201', status: 'stopped' },
      ],
      isLoading: false,
      isError: false,
      error: null,
      dataUpdatedAt: 1_718_000_000_000,
    },
  }),
}))

const widgetProps = {
  widgetId: 'test-pve-1',
  options: {
    proxmoxHost: 'pve.lan:8006',
    nodeName: 'pve',
    showTitleLink: true,
    refreshInterval: 15,
  },
  isEditMode: false,
  width: 400,
  height: 300,
}

describe('PveStatusWidget — title link click behavior', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should NOT call window.open when clicking title in edit mode', () => {
    render(<PveStatusWidget {...widgetProps} isEditMode={true} />)

    const titleSpan = screen.getByTitle('widget.pveStatus.openWebUi')
    titleSpan.click()

    expect(window.open).not.toHaveBeenCalled()
  })

  it('should call window.open with PVE URL when clicking title in view mode', () => {
    render(<PveStatusWidget {...widgetProps} isEditMode={false} />)

    const titleSpan = screen.getByTitle('widget.pveStatus.openWebUi')
    titleSpan.click()

    expect(window.open).toHaveBeenCalledWith(
      'https://pve.lan:8006',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
