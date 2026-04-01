# Maintenance Guide

## Quick Commands (npm scripts)

```bash
# Database
npm run migrate              # Run database migrations
npm run migrate:check        # Check migration status

# Testing & Health
npm run smoke                # Run smoke tests
npm run health:watch         # Monitor server health

# Maintenance
npm run backup               # Create database backup
npm run logs:rotate          # Rotate log files
npm run audit:purge          # Purge old audit logs
npm run maintenance:daily    # Run all daily maintenance tasks
```

---

## CORS & Multi-Origin Setup

For development with multiple frontend origins:

```env
# server/.env - Single origin
FRONTEND_URL=http://localhost:5173

# Multiple origins (comma-separated)
FRONTEND_URLS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
```

CORS is automatically configured to:
- Allow all origins in development (`NODE_ENV !== 'production'`)
- Validate against `FRONTEND_URLS` or `FRONTEND_URL` in production
- Support credentials (cookies/auth headers)
- Skip OPTIONS requests from rate limiting

---

This project already includes backup/sync tooling and audit logging.
The items below add a lightweight migration system and smoke tests so
future changes are safer and easier to verify.

## 1) Migrations

Migrations are stored in `server/migrations` and executed by:

```
node server/migrate.js
```

Each migration file must export:

```
export async function up({ dbType, pool }) { ... }
```

Notes:
- `dbType` is `postgresql` or `mysql`.
- `pool` is the active DB connection.
- The runner records applied migrations in `schema_migrations`.

## 2) Smoke Tests

Run a basic API health check:

```
node scripts/smoke.mjs
```

Optional auth checks:

```
SMOKE_EMAIL=student@example.com SMOKE_PASSWORD=student123 node scripts/smoke.mjs
```

## 3) Daily Backups

Run a one-off backup:

```
BACKUP_API_URL=http://localhost:3001/api BACKUP_TOKEN=YOUR_ADMIN_JWT node scripts/backup.mjs
```

Optional backup settings:

- `BACKUP_RETENTION_DAYS` (default: 14)
- `BACKUP_RETENTION_COUNT` (default: 30)
- `BACKUP_RETENTION_SIZE_MB` (default: 0 = disabled)
- `BACKUP_DIR` (default: `backups`)
- `RUN_SMOKE_AFTER_BACKUP` (default: `true`)

Windows Task Scheduler example (runs daily at 02:00):

1. Open Task Scheduler → Create Basic Task.
2. Trigger: Daily → 02:00.
3. Action: Start a program.
4. Program/script: `node`
5. Add arguments:

```
scripts\\backup.mjs
```

6. Start in:

```
C:\\Users\\admin\\Downloads\\project
```

7. Set environment variables on the task:

```
BACKUP_API_URL=http://localhost:3001/api
BACKUP_TOKEN=YOUR_ADMIN_JWT
BACKUP_RETENTION_DAYS=14
BACKUP_RETENTION_COUNT=30
BACKUP_RETENTION_SIZE_MB=500
RUN_SMOKE_AFTER_BACKUP=true
```

## 4) Backups & Sync

Backups and sync are already available via API:

- `POST /api/admin/db/backup`
- `POST /api/admin/db/restore`
- `POST /api/admin/db/sync`

## 5) Audit Logs

Audit events are written to `audit_logs` on key actions.
Use the database tooling and logs to investigate changes over time.

## Recommended Routine

- Run `node scripts/check-migrations.mjs` after pulling changes.
- Run `node server/migrate.js` after pulling changes.
- Run `node scripts/smoke.mjs` after server boot.
- Create periodic backups using the admin DB endpoints.
- Run `node scripts/log-rotate.mjs` weekly (or daily).
- Run `node scripts/purge-audit.mjs` weekly (or daily).

## 6) Alerts

Set up alert channels for failures (backup/smoke/health):

- Telegram:
  - `ALERT_TELEGRAM_BOT_TOKEN`
  - `ALERT_TELEGRAM_CHAT_ID`

- Email (SMTP):
  - `ALERT_EMAIL_TO`
  - `ALERT_EMAIL_FROM`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

- Alert throttling:
  - `ALERT_THROTTLE_MINUTES` (default: 30)
  - `ALERT_THROTTLE_TELEGRAM_MINUTES` (default: 0, use global if not set)
  - `ALERT_THROTTLE_EMAIL_MINUTES` (default: 0, use global if not set)
  - `ALERT_THROTTLE_FILE` (default: `logs/alert-throttle.json`)

Alert severity:
- `sendAlert(subject, message, severity)`
- severity options: `info`, `warning`, `critical`

Run health monitoring:

```
HEALTHCHECK_API_URL=http://localhost:3001/api node scripts/health-watch.mjs
```

## 7) Log Rotation

Rotate local logs to keep disk usage stable:

```
LOG_DIR=logs LOG_RETENTION_DAYS=14 LOG_RETENTION_COUNT=20 LOG_RETENTION_SIZE_MB=500 node scripts/log-rotate.mjs
```

Defaults:
- `LOG_DIR` = `logs`
- `LOG_RETENTION_DAYS` = `14`
- `LOG_RETENTION_COUNT` = `20`
- `LOG_RETENTION_SIZE_MB` = `0` (disabled)

## 8) Audit Log Retention

Purge old audit logs:

```
AUDIT_RETENTION_DAYS=180 node scripts/purge-audit.mjs
```

Dry run:

```
AUDIT_RETENTION_DAYS=180 AUDIT_PURGE_DRY_RUN=true node scripts/purge-audit.mjs
```

Optional combined run:

```
npm run maintenance:daily
```
