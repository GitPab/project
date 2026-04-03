/**
 * Health Ping Service
 * Prevents Render free tier cold start by pinging /health every 10 minutes
 * Also keeps Supabase connection alive
 */

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const HEALTH_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/health` : 'http://localhost:3001/api/health';

class HealthPingService {
  private intervalId: number | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      console.log('[HealthPing] Already running');
      return;
    }

    // Only run in production (Render deployment)
    const isProduction = import.meta.env.PROD === true || 
                         window.location.hostname.includes('vercel.app') ||
                         window.location.hostname.includes('onrender.com');
    
    if (!isProduction) {
      console.log('[HealthPing] Skipped in development mode');
      return;
    }

    console.log('[HealthPing] Starting health ping service...');
    this.isRunning = true;

    // Immediate first ping
    this.ping();

    // Schedule regular pings
    this.intervalId = window.setInterval(() => {
      this.ping();
    }, PING_INTERVAL);

    console.log(`[HealthPing] Scheduled ping every ${PING_INTERVAL / 60000} minutes to ${HEALTH_URL}`);
  }

  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[HealthPing] Stopped');
  }

  private async ping(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Ping': 'true' // Identify as health ping
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[HealthPing] ✓ ${new Date().toISOString()} - Server is healthy`);
      } else {
        console.warn(`[HealthPing] ✗ ${new Date().toISOString()} - Server returned ${response.status}`);
      }
    } catch (error) {
      console.error(`[HealthPing] ✗ ${new Date().toISOString()} - Ping failed:`, error);
    }
  }

  // Manual ping for testing
  async pingNow(): Promise<boolean> {
    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        headers: { 'X-Health-Ping': 'true' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const healthPingService = new HealthPingService();

// React hook for components
export function useHealthPing(): { isRunning: boolean; pingNow: () => Promise<boolean> } {
  return {
    isRunning: (healthPingService as any).isRunning,
    pingNow: () => healthPingService.pingNow()
  };
}

export default healthPingService;
