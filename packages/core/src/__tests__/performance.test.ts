/**
 * Unit Tests for Performance Monitor
 */

import {
  performanceMonitor,
  createTimer,
  formatDuration,
} from '../utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setEnabled(true);
  });

  describe('start/end', () => {
    it('should track timing', () => {
      const id = performanceMonitor.start('test-operation');
      // Simulate some work
      const duration = performanceMonitor.end(id);
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return unique IDs', () => {
      const id1 = performanceMonitor.start('op1');
      const id2 = performanceMonitor.start('op2');
      expect(id1).not.toBe(id2);
    });

    it('should store metrics', () => {
      const id = performanceMonitor.start('test-metric');
      performanceMonitor.end(id);

      const report = performanceMonitor.getReport('test-metric');
      expect(report).not.toBeNull();
      expect(report?.totalMetrics).toBe(1);
    });

    it('should handle non-existent timer', () => {
      const duration = performanceMonitor.end('non-existent-id');
      expect(duration).toBe(0);
    });

    it('should store metadata', () => {
      const id = performanceMonitor.start('meta-test', { key: 'value' });
      performanceMonitor.end(id);

      const report = performanceMonitor.getReport('meta-test');
      expect(report?.metrics[0].metadata).toEqual({ key: 'value' });
    });
  });

  describe('measure', () => {
    it('should measure async function', async () => {
      const result = await performanceMonitor.measure(
        'async-test',
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          return 'done';
        }
      );

      expect(result).toBe('done');
      const report = performanceMonitor.getReport('async-test');
      expect(report).not.toBeNull();
      expect(report?.averageDuration).toBeGreaterThan(0);
    });

    it('should handle errors in measured function', async () => {
      await expect(
        performanceMonitor.measure('error-test', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      // Should still record the metric
      const report = performanceMonitor.getReport('error-test');
      expect(report).not.toBeNull();
    });
  });

  describe('measureSync', () => {
    it('should measure sync function', () => {
      const result = performanceMonitor.measureSync('sync-test', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(result).toBe(499500);
      const report = performanceMonitor.getReport('sync-test');
      expect(report).not.toBeNull();
    });

    it('should handle errors in sync function', () => {
      expect(() =>
        performanceMonitor.measureSync('sync-error', () => {
          throw new Error('Sync error');
        })
      ).toThrow('Sync error');
    });
  });

  describe('getReport', () => {
    it('should return null for unknown metric', () => {
      const report = performanceMonitor.getReport('unknown');
      expect(report).toBeNull();
    });

    it('should calculate statistics correctly', () => {
      // Record multiple measurements
      for (let i = 0; i < 5; i++) {
        const id = performanceMonitor.start('stats-test');
        performanceMonitor.end(id);
      }

      const report = performanceMonitor.getReport('stats-test');
      expect(report?.totalMetrics).toBe(5);
      expect(report?.averageDuration).toBeGreaterThanOrEqual(0);
      expect(report?.minDuration).toBeLessThanOrEqual(report!.averageDuration);
      expect(report?.maxDuration).toBeGreaterThanOrEqual(report!.averageDuration);
    });
  });

  describe('getAllReports', () => {
    it('should return all metric reports', () => {
      const id1 = performanceMonitor.start('metric-a');
      performanceMonitor.end(id1);
      const id2 = performanceMonitor.start('metric-b');
      performanceMonitor.end(id2);

      const reports = performanceMonitor.getAllReports();
      expect(reports.size).toBe(2);
      expect(reports.has('metric-a')).toBe(true);
      expect(reports.has('metric-b')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      const id = performanceMonitor.start('to-clear');
      performanceMonitor.end(id);

      performanceMonitor.clear();

      expect(performanceMonitor.getReport('to-clear')).toBeNull();
    });
  });

  describe('clearMetric', () => {
    it('should clear specific metric', () => {
      const id1 = performanceMonitor.start('keep');
      performanceMonitor.end(id1);
      const id2 = performanceMonitor.start('remove');
      performanceMonitor.end(id2);

      performanceMonitor.clearMetric('remove');

      expect(performanceMonitor.getReport('keep')).not.toBeNull();
      expect(performanceMonitor.getReport('remove')).toBeNull();
    });
  });

  describe('setEnabled', () => {
    it('should skip tracking when disabled', () => {
      performanceMonitor.setEnabled(false);

      const id = performanceMonitor.start('disabled-test');
      performanceMonitor.end(id);

      expect(performanceMonitor.getReport('disabled-test')).toBeNull();
    });

    it('should resume tracking when re-enabled', () => {
      performanceMonitor.setEnabled(false);
      performanceMonitor.setEnabled(true);

      const id = performanceMonitor.start('enabled-test');
      performanceMonitor.end(id);

      expect(performanceMonitor.getReport('enabled-test')).not.toBeNull();
    });
  });

  describe('export', () => {
    it('should export metrics as JSON', () => {
      const id = performanceMonitor.start('export-test');
      performanceMonitor.end(id);

      const exported = performanceMonitor.export();
      const parsed = JSON.parse(exported);

      expect(parsed['export-test']).toBeDefined();
      expect(parsed['export-test'].count).toBe(1);
    });
  });
});

describe('createTimer', () => {
  it('should measure elapsed time', async () => {
    const timer = createTimer();
    await new Promise((r) => setTimeout(r, 10));
    const elapsed = timer.stop();

    expect(elapsed).toBeGreaterThanOrEqual(9);
  });

  it('should allow multiple stop calls', () => {
    const timer = createTimer();
    const elapsed1 = timer.stop();
    const elapsed2 = timer.stop();

    expect(elapsed2).toBeGreaterThanOrEqual(elapsed1);
  });
});

describe('formatDuration', () => {
  it('should format microseconds', () => {
    const result = formatDuration(0.5);
    expect(result).toContain('μs');
  });

  it('should format milliseconds', () => {
    const result = formatDuration(50);
    expect(result).toContain('ms');
  });

  it('should format seconds', () => {
    const result = formatDuration(1500);
    expect(result).toContain('s');
  });

  it('should format with 2 decimal places', () => {
    const result = formatDuration(123.456);
    expect(result).toBe('123.46ms');
  });

  it('should handle edge cases', () => {
    expect(formatDuration(0)).toContain('μs');
    expect(formatDuration(1)).toContain('ms');
    expect(formatDuration(1000)).toContain('s');
  });
});
