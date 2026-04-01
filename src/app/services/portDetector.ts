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
 */
export async function getApiUrl(): Promise<string> {
  // Auto-detect port first (ignore env var for now to force detection)
  const port = await findServerPort();
  if (port) {
    const url = `http://localhost:${port}/api`;
    console.log(`[PortDetector] Using API URL: ${url}`);
    return url;
  }
  
  // Check environment variable as fallback
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log(`[PortDetector] Falling back to env URL: ${envUrl}`);
    return envUrl;
  }
  
  // Final fallback
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
