# PostgreSQL Schema Initialization Script
# This script creates all tables in PostgreSQL, then switches back to MySQL for sync

Write-Host "=== PostgreSQL Schema Initialization ===" -ForegroundColor Green

# Step 1: Stop current server
Write-Host "`n[1/4] Stopping Node.js server..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Set PostgreSQL environment and start server to create tables
Write-Host "`n[2/4] Creating PostgreSQL schema (tables will be auto-created)..." -ForegroundColor Yellow
$env:DB_TYPE = "postgresql"
$env:DATABASE_URL = "postgresql://postgres:savethissacma-db@localhost:5432/sacma"

# Start server in background to create tables
$serverJob = Start-Job -ScriptBlock {
    param($cwd)
    Set-Location $cwd
    $env:DB_TYPE = "postgresql"
    $env:DATABASE_URL = "postgresql://postgres:savethissacma-db@localhost:5432/sacma"
    node server.js 2>&1
} -ArgumentList $PWD.Path

# Wait for tables to be created (server starts)
Write-Host "Waiting for PostgreSQL tables to be created..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if server started successfully
$log = Receive-Job -Job $serverJob -Keep | Select-Object -Last 20
if ($log -match "error|failed|cannot" -and -not ($log -match "Database ready|Server running")) {
    Write-Host "ERROR: Server failed to start. Check logs:" -ForegroundColor Red
    Receive-Job -Job $serverJob | Select-Object -Last 30
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob
    exit 1
}

Write-Host "PostgreSQL tables created successfully!" -ForegroundColor Green

# Step 3: Stop PostgreSQL server
Write-Host "`n[3/4] Stopping PostgreSQL server..." -ForegroundColor Yellow
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 4: Switch back to MySQL mode
Write-Host "`n[4/4] Switching back to MySQL mode..." -ForegroundColor Yellow
$env:DB_TYPE = "mysql"
$env:PG_SYNC_URL = "postgresql://postgres:savethissacma-db@localhost:5432/sacma"

Write-Host "`n=== PostgreSQL Schema Ready! ===" -ForegroundColor Green
Write-Host "Run these commands to start sync:" -ForegroundColor Cyan
Write-Host "  `$env:DB_TYPE = 'mysql'"
Write-Host "  `$env:PG_SYNC_URL = 'postgresql://postgres:savethissacma-db@localhost:5432/sacma'"
Write-Host "  node server.js"
Write-Host ""
Write-Host "Then in another terminal:" -ForegroundColor Cyan
Write-Host "  `$login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -Body '{`\"email\"`:`\"syncadmin@sacma.com\"`,`\"password\"`:`\"Sync@123456\"`}' -ContentType 'application/json'"
Write-Host "  `$token = `$login.token"
Write-Host "  Invoke-RestMethod -Uri 'http://localhost:3001/api/admin/db/sync' -Method POST -Headers @{Authorization=`"Bearer `$token`"} -Body '{`\"direction\"`:`\"mysql-to-postgres\"`}' -ContentType 'application/json'"
