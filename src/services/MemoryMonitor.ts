import { NativeModules } from 'react-native';

const { PlatformConstants } = NativeModules;

interface MemoryInfo {
  usedMemory: number;
  totalMemory: number;
  percentUsed: number;
  timestamp: number;
}

interface MemoryTrend {
  readings: MemoryInfo[];
  leakDetected: boolean;
  leakRate: number; // MB/minute
}

export class MemoryMonitor {
  private static readings: MemoryInfo[] = [];
  private static maxReadings = 60; // Keep last 60 readings
  private static checkInterval: NodeJS.Timeout | null = null;

  static startMonitoring(intervalMs: number = 10000) {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.recordMemory();
    }, intervalMs);
  }

  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private static recordMemory() {
    try {
      const info = this.getMemoryInfo();
      this.readings.push(info);

      // Keep only last N readings
      if (this.readings.length > this.maxReadings) {
        this.readings.shift();
      }

      // Check for leaks if we have enough data
      if (this.readings.length >= 10) {
        const leak = this.detectLeak();
        if (leak.leakDetected) {
          console.warn('[MemoryMonitor] Potential memory leak detected:', {
            leakRate: leak.leakRate.toFixed(2),
            current: info.percentUsed.toFixed(1),
          });
        }
      }
    } catch (error) {
      console.error('[MemoryMonitor] Error:', error);
    }
  }

  private static getMemoryInfo(): MemoryInfo {
    const memInfo = NativeModules.ExpoPerformance?.getMemoryUsage?.() || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
    };

    const used = memInfo.usedJSHeapSize || 0;
    const total = memInfo.totalJSHeapSize || 1;

    return {
      usedMemory: used / (1024 * 1024), // Convert to MB
      totalMemory: total / (1024 * 1024),
      percentUsed: (used / total) * 100,
      timestamp: Date.now(),
    };
  }

  private static detectLeak(): MemoryTrend {
    if (this.readings.length < 10) {
      return { readings: this.readings, leakDetected: false, leakRate: 0 };
    }

    // Calculate linear trend over last 10 readings
    const recent = this.readings.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const timeDiffMs = last.timestamp - first.timestamp;
    const timeDiffMin = timeDiffMs / (1000 * 60);
    const memDiffMb = last.usedMemory - first.usedMemory;
    const leakRate = memDiffMb / timeDiffMin;

    // Threshold: >1 MB/min increase indicates leak
    const leakDetected = leakRate > 1.0;

    return {
      readings: recent,
      leakDetected,
      leakRate,
    };
  }

  static getMetrics() {
    if (this.readings.length === 0) {
      return {
        current: null,
        peak: null,
        trend: null,
      };
    }

    const current = this.readings[this.readings.length - 1];
    const peak = this.readings.reduce((max, r) =>
      r.usedMemory > max.usedMemory ? r : max
    );

    const trend = this.readings.length >= 10 ? this.detectLeak() : null;

    return { current, peak, trend };
  }

  static reset() {
    this.readings = [];
    this.stopMonitoring();
  }

  static exportMetrics() {
    return {
      readings: this.readings,
      summary: this.getMetrics(),
      timestamp: Date.now(),
    };
  }
}
