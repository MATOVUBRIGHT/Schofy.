// client/src/services/performanceMonitor.ts
// Real-time performance monitoring for bottleneck detection

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  category: 'render' | 'data' | 'sync' | 'api';
  status: 'success' | 'slow' | 'error';
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private thresholds = {
    render: 100, // ms - should complete in <100ms
    data: 200,   // ms - DB queries should be quick
    sync: 1000,  // ms - sync can take longer
    api: 500,    // ms - API calls
  };
  private enabled = true;
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Measure async operation performance
   * Usage: const result = await perf.measure('operation', myAsyncFunction);
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'data'
  ): Promise<T> {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        category,
        status: duration > this.thresholds[category] ? 'slow' : 'success',
      });

      if (duration > this.thresholds[category]) {
        console.warn(
          `⚠️ Slow ${category}: "${name}" took ${duration.toFixed(2)}ms (threshold: ${this.thresholds[category]}ms)`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        category,
        status: 'error',
      });
      throw error;
    }
  }

  /**
   * Measure sync operation performance
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'data'
  ): T {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        category,
        status: duration > this.thresholds[category] ? 'slow' : 'success',
      });

      if (duration > this.thresholds[category]) {
        console.warn(
          `⚠️ Slow ${category}: "${name}" took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        category,
        status: 'error',
      });
      throw error;
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep memory usage bounded
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance report
   */
  getReport(category?: PerformanceMetric['category']) {
    const filtered = category
      ? this.metrics.filter(m => m.category === category)
      : this.metrics;

    const slowMetrics = filtered.filter(m => m.status === 'slow' || m.status === 'error');
    const avgDuration = filtered.length
      ? filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length
      : 0;
    const maxDuration = filtered.length
      ? Math.max(...filtered.map(m => m.duration))
      : 0;
    const minDuration = filtered.length
      ? Math.min(...filtered.map(m => m.duration))
      : 0;

    return {
      totalMeasurements: filtered.length,
      slowOperations: slowMetrics.length,
      avgDuration: avgDuration.toFixed(2),
      maxDuration: maxDuration.toFixed(2),
      minDuration: minDuration.toFixed(2),
      slowestOperations: filtered
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(m => ({ name: m.name, duration: m.duration.toFixed(2) + 'ms' })),
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Set performance thresholds (in milliseconds)
   */
  setThresholds(thresholds: Partial<typeof this.thresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get all raw metrics for analysis
   */
  getMetrics() {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitorService();
