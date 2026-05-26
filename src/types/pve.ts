export interface PveNodeStatus {
  uptime: number;
  cpu: number;
  loadavg: [string, string, string];
  cpuinfo: {
    cores: number;
    cpus: number;
    model: string;
    sockets: number;
  };
  memory: {
    free: number;
    total: number;
    used: number;
  };
  swap: {
    free: number;
    total: number;
    used: number;
  };
  rootfs: {
    free: number;
    total: number;
    used: number;
    avail: number;
  };
  pveversion: string;
  'current-kernel': {
    sysname: string;
    release: string;
    version: string;
    machine: string;
  };
  'boot-info': {
    mode: 'efi' | 'legacy-bios';
    secureboot?: boolean;
  };
  ksm?: { shared: number };
  idle: number;
  wait: number;
}

export interface PveClusterResource {
  type: 'node' | 'qemu' | 'lxc' | 'storage';
  node?: string;
  id: string;
  status: string;
  name?: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  uptime?: number;
}

export interface PveNodeListItem {
  node: string;
  status: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  uptime?: number;
}
