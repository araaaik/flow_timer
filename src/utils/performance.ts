/**
 * Performance optimization utilities
 * Tools for measuring and optimizing app performance
 */

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`Performance measurement "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  static logMemoryUsage(label?: string): void {
    const memory = this.getMemoryUsage();
    if (memory && process.env.NODE_ENV === 'development') {
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`🧠 Memory${label ? ` (${label})` : ''}: ${used}MB / ${total}MB (limit: ${limit}MB)`);
    }
  }
}

/**
 * Frame rate monitoring
 */
export class FPSMonitor {
  private static isRunning = false;
  private static frameCount = 0;
  private static lastTime = 0;
  private static fps = 0;

  static start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.tick();
  }

  static stop(): void {
    this.isRunning = false;
  }

  static getFPS(): number {
    return this.fps;
  }

  private static tick(): void {
    if (!this.isRunning) return;

    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 FPS: ${this.fps}`);
      }
    }

    requestAnimationFrame(() => this.tick());
  }
}

/**
 * Bundle size analyzer (development only)
 */
export class BundleAnalyzer {
  static analyzeChunks(): void {
    if (process.env.NODE_ENV !== 'development') return;

    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const chunks = scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      size: 'unknown' // Would need server-side support for actual sizes
    }));

    console.table(chunks);
  }

  static measureComponentSize(componentName: string, renderFn: () => void): void {
    if (process.env.NODE_ENV !== 'development') return;

    PerformanceMonitor.measure(`Component: ${componentName}`, renderFn);
  }
}

/**
 * React DevTools integration
 */
export class ReactProfiler {
  static profileComponent<T>(
    componentName: string,
    renderFn: () => T,
    onRender?: (id: string, phase: string, actualDuration: number) => void
  ): T {
    if (process.env.NODE_ENV !== 'development') {
      return renderFn();
    }

    // This would integrate with React DevTools Profiler
    // For now, just use our performance monitor
    return PerformanceMonitor.measure(`React: ${componentName}`, renderFn);
  }
}