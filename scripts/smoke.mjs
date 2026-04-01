/**
 * Smoke test script (API health + login + basic endpoints).
 *
 * Usage:
 *   SMOKE_API_URL=http://localhost:3001/api node scripts/smoke.mjs
 *   SMOKE_EMAIL=student@example.com SMOKE_PASSWORD=student123 node scripts/smoke.mjs
 */

const API_URL = process.env.SMOKE_API_URL || 'http://localhost:3001/api';
const EMAIL = process.env.SMOKE_EMAIL;
const PASSWORD = process.env.SMOKE_PASSWORD;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${res.statusText} ${JSON.stringify(body)}`);
  }
  return body;
}

async function run() {
  console.log(`[smoke] API: ${API_URL}`);

  await request('/health');
  console.log('[smoke] /health OK');

  await request('/universities');
  console.log('[smoke] /universities OK');

  if (EMAIL && PASSWORD) {
    const login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const token = login?.token;
    if (!token) throw new Error('Login missing token');
    console.log('[smoke] /auth/login OK');

    await request('/features/service-feedback', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ feedback_type: 'general', rating: 5, feedback_text: 'smoke test' })
    });
    console.log('[smoke] /features/service-feedback OK');
  } else {
    console.log('[smoke] Skipped auth checks (set SMOKE_EMAIL/SMOKE_PASSWORD)');
  }
}

run().catch((err) => {
  console.error('[smoke] FAILED:', err.message);
  process.exit(1);
});
