/**
 * Health monitor + alert
 *
 * Usage:
 *   HEALTHCHECK_API_URL=http://localhost:3001/api node scripts/health-watch.mjs
 */

import { sendAlert } from './notify.mjs';

const API_URL = process.env.HEALTHCHECK_API_URL || 'http://localhost:3001/api';

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 'ok') {
      await sendAlert('Health check degraded', JSON.stringify(data), 'warning');
      process.exit(1);
    }
    console.log('[health] ok');
  } catch (err) {
    await sendAlert('Health check failed', err?.message || String(err), 'critical');
    process.exit(1);
  }
}

checkHealth();
