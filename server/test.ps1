# Test MySQL sync
$body = @{name="Test User"; email="test@example.com"; password="password123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -ContentType "application/json" -Body $body
