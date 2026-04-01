/**
 * Alert helper (email + telegram).
 *
 * Configure via env:
 *  - ALERT_TELEGRAM_BOT_TOKEN
 *  - ALERT_TELEGRAM_CHAT_ID
 *  - ALERT_EMAIL_TO
 *  - ALERT_EMAIL_FROM
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

import nodemailer from 'nodemailer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const TELEGRAM_TOKEN = process.env.ALERT_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.ALERT_TELEGRAM_CHAT_ID;
const EMAIL_TO = process.env.ALERT_EMAIL_TO;
const EMAIL_FROM = process.env.ALERT_EMAIL_FROM;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const THROTTLE_MINUTES = parseInt(process.env.ALERT_THROTTLE_MINUTES || '30', 10);
const THROTTLE_TELEGRAM_MINUTES = parseInt(process.env.ALERT_THROTTLE_TELEGRAM_MINUTES || '0', 10);
const THROTTLE_EMAIL_MINUTES = parseInt(process.env.ALERT_THROTTLE_EMAIL_MINUTES || '0', 10);
const THROTTLE_FILE = process.env.ALERT_THROTTLE_FILE || path.join('logs', 'alert-throttle.json');

function resolveThrottleMinutes(channel) {
  if (channel === 'telegram' && Number.isFinite(THROTTLE_TELEGRAM_MINUTES) && THROTTLE_TELEGRAM_MINUTES > 0) {
    return THROTTLE_TELEGRAM_MINUTES;
  }
  if (channel === 'email' && Number.isFinite(THROTTLE_EMAIL_MINUTES) && THROTTLE_EMAIL_MINUTES > 0) {
    return THROTTLE_EMAIL_MINUTES;
  }
  return THROTTLE_MINUTES;
}

async function shouldThrottle(key, channel) {
  const minutes = resolveThrottleMinutes(channel);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return false;
  }
  try {
    const content = await readFile(THROTTLE_FILE, 'utf-8');
    const data = JSON.parse(content || '{}');
    const last = data[key] || 0;
    const now = Date.now();
    if (now - last < minutes * 60 * 1000) {
      return true;
    }
    data[key] = now;
    await writeThrottle(data);
    return false;
  } catch {
    await writeThrottle({ [key]: Date.now() });
    return false;
  }
}

async function writeThrottle(data) {
  const dir = path.dirname(THROTTLE_FILE);
  await mkdir(dir, { recursive: true });
  await writeFile(THROTTLE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return false;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram failed: ${res.status} ${text}`);
  }
  return true;
}

async function sendEmail(subject, message) {
  if (!EMAIL_TO || !EMAIL_FROM || !SMTP_HOST) return false;
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });

  await transport.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject,
    text: message
  });
  return true;
}

const SEVERITY_PREFIX = {
  info: 'INFO',
  warning: 'WARN',
  critical: 'CRITICAL'
};

export async function sendAlert(subject, message, severity = 'warning') {
  const prefix = SEVERITY_PREFIX[severity] || 'ALERT';
  const payload = `[${prefix}] ${subject}\n${message}`;
  let sent = false;
  const baseKey = `${severity}:${subject}`;

  try {
    if (await shouldThrottle(`telegram:${baseKey}`, 'telegram')) {
      console.warn('[notify] telegram throttled:', subject);
    } else {
      const ok = await sendTelegram(payload);
      sent = sent || ok;
    }
  } catch (err) {
    console.error('[notify] telegram error:', err.message);
  }

  try {
    if (await shouldThrottle(`email:${baseKey}`, 'email')) {
      console.warn('[notify] email throttled:', subject);
    } else {
      const ok = await sendEmail(`${prefix}: ${subject}`, message);
      sent = sent || ok;
    }
  } catch (err) {
    console.error('[notify] email error:', err.message);
  }

  if (!sent) {
    console.warn('[notify] no alert channels configured');
  }
}
