/**
 * Performance Monitoring Utilities
 * Tracks execution times and provides benchmarking tools
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  totalMetrics: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  metrics: PerformanceMetric[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeTimers: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = true;

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Start a performance timer
   */
  start(name: string, metadata?: Record<string, unknown>): string {
    if (!this.enabled) return name;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    const id = `${name}_${Date.now()}`;
    this.activeTimers.set(id, metric);
    return id;
  }

  /**
   * End a performance timer
   */
  end(id: string): number {
    if (!this.enabled) return 0;

    const metric = this.activeTimers.get(id);
    if (!metric) return 0;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Store in metrics collection
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);
    this.metrics.set(metric.name, existing);

    this.activeTimers.delete(id);
    return metric.duration;
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const id = this.start(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(id);
    }
  }

  /**
   * Measure synchronous function
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const id = this.start(name, metadata);
    try {
      return fn();
    } finally {
      this.end(id);
    }
  }

  /**
   * Get report for a specific metric
   */
  getReport(name: string): PerformanceReport | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!);

    if (durations.length === 0) return null;

    return {
      totalMetrics: durations.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      metrics,
    };
  }

  /**
   * Get all reports
   */
  getAllReports(): Map<string, PerformanceReport> {
    const reports = new Map<string, PerformanceReport>();

    for (const name of this.metrics.keys()) {
      const report = this.getReport(name);
      if (report) {
        reports.set(name, report);
      }
    }

    return reports;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * Clear metrics for a specific name
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    const data: Record<string, unknown> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      data[name] = {
        count: metrics.length,
        durations: metrics.map((m) => m.duration),
        average:
          metrics.reduce((a, m) => a + (m.duration || 0), 0) / metrics.length,
      };
    }

    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${(target as object).constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.measure(metricName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Simple timing utility
 */
export function createTimer(): { stop: () => number } {
  const start = performance.now();
  return {
    stop: () => performance.now() - start,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}
