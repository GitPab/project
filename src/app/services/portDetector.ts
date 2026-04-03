/**
 * Dynamic Server Port Detector
 * Automatically finds the backend server port (3001, 3002, etc.)
 */

const DEFAULT_PORTS = [3001, 3002, 3003]; // Reduced from 5 ports
const LOCALSTORAGE_KEY = 'sacma_server_port';

export interface PortCheckResult {
  port: number;
  url: string;
  healthy: boolean;
}

/**
 * Check if server is running on a specific port
 */
async function checkPort(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`http://localhost:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Find the first available server port
 */
export async function findServerPort(): Promise<number | null> {
  // First check if we have a stored working port
  const storedPort = localStorage.getItem(LOCALSTORAGE_KEY);
  if (storedPort) {
    const port = parseInt(storedPort);
    if (await checkPort(port)) {
      console.log(`[PortDetector] Using stored port: ${port}`);
      return port;
    }
  }
  
  // Try default ports in order
  for (const port of DEFAULT_PORTS) {
    if (await checkPort(port)) {
      console.log(`[PortDetector] Found server on port: ${port}`);
      localStorage.setItem(LOCALSTORAGE_KEY, port.toString());
      return port;
    }
  }
  
  console.log('[PortDetector] No server found on ports:', DEFAULT_PORTS);
  return null;
}

/**
 * Get the current API URL (with detected port)
 * Production: Use VITE_API_URL directly without probing
 * Development: Auto-detect localhost port
 */
export async function getApiUrl(): Promise<string> {
  // In production (Vercel/Netlify), use env var directly - NO localhost probing
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Detect production environment
  const isProduction = import.meta.env.PROD === true || 
                       import.meta.env.MODE === 'production' ||
                       window.location.hostname !== 'localhost';
  
  if (isProduction && envUrl) {
    // Production: Return env URL immediately without health check
    // Health checks can timeout and cause 6-10s delays per request
    console.log(`[PortDetector] Production mode - using env URL: ${envUrl}`);
    return envUrl;
  }
  
  // If env URL exists (even in dev), try it first with health check
  if (envUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${envUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        console.log(`[PortDetector] Using env URL: ${envUrl}`);
        return envUrl;
      }
    } catch {
      console.warn(`[PortDetector] Env URL ${envUrl} not healthy, trying local...`);
    }
  }
  
  // Development: Auto-detect port from localhost only
  const port = await findServerPort();
  if (port) {
    const url = `http://localhost:${port}/api`;
    console.log(`[PortDetector] Using local API URL: ${url}`);
    return url;
  }
  
  // Final fallback - only for development
  console.log('[PortDetector] Using default fallback: http://localhost:3001/api');
  return 'http://localhost:3001/api';
}

/**
 * Reset stored port (force re-detection)
 */
export function resetServerPort(): void {
  localStorage.removeItem(LOCALSTORAGE_KEY);
  console.log('[PortDetector] Port cache cleared');
}

/**
 * Get stored port without checking
 */
export function getStoredPort(): number | null {
  const stored = localStorage.getItem(LOCALSTORAGE_KEY);
  return stored ? parseInt(stored) : null;
}

export default {
  findServerPort,
  getApiUrl,
  resetServerPort,
  getStoredPort,
  checkPort
};
