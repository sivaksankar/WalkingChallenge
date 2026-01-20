// src/services/nativeHealthService.ts
import { Capacitor } from '@capacitor/core';
import { Health, HealthDataType } from '@capgo/capacitor-health';

export interface HealthData {
  steps: number;
  distance?: number;
  calories?: number;
  date: string;
}

/**
 * Detect if running in a native Capacitor app.
 * When loading from a remote server URL, we need to check for the native bridge differently.
 */
function detectNativePlatform(): boolean {
  // First try the standard Capacitor check
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  // If loading from remote server, check for Capacitor bridge in window
  if (typeof window !== 'undefined') {
    // Check for Capacitor native bridge
    const win = window as any;
    if (win.Capacitor?.isNativePlatform?.()) {
      return true;
    }
    // Check for Android WebView
    if (win.AndroidBridge || win.Capacitor?.Plugins?.App) {
      return true;
    }
    // Check for iOS WebView
    if (win.webkit?.messageHandlers?.Capacitor) {
      return true;
    }
    // Check user agent for Android WebView
    const ua = navigator.userAgent || '';
    if (ua.includes('wv') || ua.includes('WebView')) {
      return true;
    }
  }

  return false;
}

/**
 * Detect the platform (ios, android, or web)
 */
function detectPlatform(): 'ios' | 'android' | 'web' {
  // First try the standard Capacitor check
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }

  // If loading from remote server, detect from user agent
  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
      return 'android';
    }
    if (/iPad|iPhone|iPod/.test(ua)) {
      return 'ios';
    }
  }

  return 'web';
}

export class NativeHealthService {
  private _isNative: boolean | null = null;
  private _platform: 'ios' | 'android' | 'web' | null = null;

  constructor() {
    // Don't detect in constructor - wait until client-side
  }

  /**
   * Initialize detection (called lazily on first access)
   */
  private ensureDetected(): void {
    if (this._isNative === null) {
      this._isNative = detectNativePlatform();
      this._platform = detectPlatform();
      console.log('[NativeHealthService] Platform detection:', { isNative: this._isNative, platform: this._platform });
    }
  }

  /**
   * Check if running on a native platform (iOS or Android)
   */
  isNativePlatform(): boolean {
    this.ensureDetected();
    return this._isNative!;
  }

  /**
   * Get the current platform name
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    this.ensureDetected();
    return this._platform!;
  }

  /**
   * Force re-detection of platform (useful after page load)
   */
  redetect(): void {
    this._isNative = null;
    this._platform = null;
    this.ensureDetected();
  }

  /**
   * Request permissions to access health data
   * iOS: HealthKit permissions
   * Android: Health Connect permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      throw new Error('Health permissions can only be requested on native platforms');
    }

    try {
      const dataTypes: HealthDataType[] = ['steps', 'distance'];
      const result = await Health.requestAuthorization({
        read: dataTypes,
        write: []
      });
      
      return result.readAuthorized && result.readAuthorized.length > 0;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  /**
   * Check if health permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }

    try {
      const result = await Health.checkAuthorization({
        read: ['steps' as HealthDataType]
      });
      return result.readAuthorized && result.readAuthorized.includes('steps');
    } catch (error) {
      console.error('Error checking health permissions:', error);
      return false;
    }
  }

  /**
   * Get step count for a specific date range
   */
  async getSteps(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isNativePlatform()) {
      throw new Error('Health data can only be accessed on native platforms');
    }

    try {
      const result = await Health.readSamples({
        dataType: 'steps' as HealthDataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // Sum all step samples in the time range
      return result.samples.reduce((sum, sample) => sum + sample.value, 0);
    } catch (error) {
      console.error('Error getting steps:', error);
      return 0;
    }
  }

  /**
   * Get today's step count
   */
  async getTodaySteps(): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    return this.getSteps(startOfDay, endOfDay);
  }

  /**
   * Get health data for the last N days
   */
  async getRecentHealthData(days: number = 7): Promise<HealthData[]> {
    if (!this.isNativePlatform()) {
      throw new Error('Health data can only be accessed on native platforms');
    }

    const healthData: HealthData[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      try {
        const steps = await this.getSteps(startOfDay, endOfDay);
        
        healthData.push({
          steps,
          date: date.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error(`Error getting health data for ${date.toISOString()}:`, error);
      }
    }

    return healthData;
  }

  /**
   * Sync health data with the backend API
   */
  async syncWithBackend(userId: string): Promise<{ success: boolean; synced: number; message?: string }> {
    if (!this.isNativePlatform()) {
      return {
        success: false,
        synced: 0,
        message: 'Health sync only available on native apps'
      };
    }

    try {
      // Check permissions first
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          success: false,
          synced: 0,
          message: 'Health permissions not granted'
        };
      }

      // Get last 7 days of data
      const healthData = await this.getRecentHealthData(7);
      
      // Determine platform
      const platform = this.getPlatform();
      const endpoint = platform === 'ios' 
        ? '/api/health/apple/sync' 
        : '/api/health/samsung/sync';

      // Sync with backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          data: healthData,
          syncDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      const result = await response.json();

      return {
        success: true,
        synced: healthData.length,
        message: `Synced ${healthData.length} days of health data`
      };

    } catch (error) {
      console.error('Error syncing health data:', error);
      return {
        success: false,
        synced: 0,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }
}

// Export singleton instance
export const nativeHealthService = new NativeHealthService();
