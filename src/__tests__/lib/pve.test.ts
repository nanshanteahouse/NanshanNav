import { describe, it, expect } from 'vitest'
import { formatUptime } from '@/lib/utils/format-uptime'
import { formatBytes } from '@/lib/utils/format-bytes'

describe('formatUptime', () => {
  it('should handle zero and negative', () => {
    expect(formatUptime(0)).toBe('0s')
    expect(formatUptime(-1)).toBe('0s')
  })

  it('should format pure seconds', () => {
    expect(formatUptime(1)).toBe('1s')
    expect(formatUptime(45)).toBe('45s')
    expect(formatUptime(59)).toBe('59s')
  })

  it('should format minutes without seconds', () => {
    expect(formatUptime(60)).toBe('1m')
    expect(formatUptime(120)).toBe('2m')
    expect(formatUptime(3599)).toBe('59m')
  })

  it('should format hours (seconds only shown when no higher units)', () => {
    expect(formatUptime(3600)).toBe('1h')
    expect(formatUptime(3661)).toBe('1h 1m')
    expect(formatUptime(3725)).toBe('1h 2m')
    expect(formatUptime(7200)).toBe('2h')
  })

  it('should format days (seconds only shown when no higher units)', () => {
    expect(formatUptime(86400)).toBe('1d')
    expect(formatUptime(90000)).toBe('1d 1h')
    expect(formatUptime(90061)).toBe('1d 1h 1m')
    expect(formatUptime(172800)).toBe('2d')
  })

  it('should handle large values', () => {
    expect(formatUptime(90061000)).toBe('1042d 8h 56m')
  })
})

describe('formatBytes', () => {
  it('should handle zero', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('should handle negative bytes', () => {
    expect(formatBytes(-1024)).toBe('-1.0 KB')
  })

  it('should format bytes', () => {
    expect(formatBytes(1)).toBe('1.0 B')
    expect(formatBytes(512)).toBe('512.0 B')
    expect(formatBytes(1023)).toBe('1023.0 B')
  })

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048575)).toBe('1024.0 KB')
  })

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB')
    expect(formatBytes(5242880)).toBe('5.0 MB')
  })

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
    expect(formatBytes(1610612736)).toBe('1.5 GB')
  })

  it('should format terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1.0 TB')
  })

  it('should respect decimal parameter', () => {
    expect(formatBytes(1500000, 0)).toBe('1 MB')
    expect(formatBytes(1500000, 2)).toBe('1.43 MB')
  })
})
