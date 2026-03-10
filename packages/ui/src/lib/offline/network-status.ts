/**
 * Network Status Monitor
 * Detects online/offline state and provides utilities for offline mode
 */

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkStatusListener {
  onStatusChange: (status: NetworkStatus) => void;
}

class NetworkStatusMonitor {
  private status: NetworkStatus = 'online';
  private listeners: Set<NetworkStatusListener> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private pingEndpoint: string = '/api/health';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    // Initial status
    this.status = navigator.onLine ? 'online' : 'offline';

    // Listen to browser events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Start ping check for slow connection detection
    this.startPingCheck();
  }

  private handleOnline(): void {
    this.updateStatus('online');
  }

  private handleOffline(): void {
    this.updateStatus('offline');
  }

  private updateStatus(newStatus: NetworkStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener.onStatusChange(this.status);
    }
  }

  /**
   * Start periodic ping check for slow connection detection
   */
  private startPingCheck(): void {
    this.pingInterval = setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check connection quality
   */
  private async checkConnection(): Promise<void> {
    if (!navigator.onLine) {
      this.updateStatus('offline');
      return;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.pingEndpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        this.updateStatus('offline');
        return;
      }

      const latency = Date.now() - startTime;

      // Consider slow if latency > 3 seconds
      if (latency > 3000) {
        this.updateStatus('slow');
      } else {
        this.updateStatus('online');
      }
    } catch {
      // If ping fails, might be offline
      if (!navigator.onLine) {
        this.updateStatus('offline');
      }
      // Otherwise keep current status
    }
  }

  /**
   * Add status change listener
   */
  public addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current status
   */
  public getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * Check if currently offline
   */
  public isOffline(): boolean {
    return this.status === 'offline';
  }

  /**
   * Force status check
   */
  public async refresh(): Promise<NetworkStatus> {
    await this.checkConnection();
    return this.status;
  }

  /**
   * Set custom ping endpoint
   */
  public setPingEndpoint(endpoint: string): void {
    this.pingEndpoint = endpoint;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusMonitor();

// React hook for network status
export function useNetworkStatus(): NetworkStatus {
  // This will be implemented in a separate hook file
  return 'online';
}
