# PowerShell Script to Run Migration
# Run this script as Administrator if needed

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Running Migration: Add IS_LOCKED columns" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$serverName = "DESKTOP-68M1JL8\SQLEXPRESS"
$databaseName = "ESCE1"
$scriptPath = Join-Path $PSScriptRoot "QUICK_MIGRATION.sql"

# Check if sqlcmd is available
$sqlcmdPath = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmdPath) {
    Write-Host "ERROR: sqlcmd not found!" -ForegroundColor Red
    Write-Host "Please install SQL Server Command Line Utilities" -ForegroundColor Yellow
    Write-Host "Or run the script manually in SSMS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Script location: $scriptPath" -ForegroundColor Cyan
    Write-Host "Please open this file in SSMS and run it manually" -ForegroundColor Cyan
    exit 1
}

Write-Host "Found sqlcmd at: $($sqlcmdPath.Path)" -ForegroundColor Green
Write-Host ""

# Check if script file exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Script file not found at: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Script file found: $scriptPath" -ForegroundColor Green
Write-Host ""
Write-Host "Connecting to: $serverName" -ForegroundColor Yellow
Write-Host "Database: $databaseName" -ForegroundColor Yellow
Write-Host ""

# Run the migration script
try {
    Write-Host "Executing migration script..." -ForegroundColor Yellow
    $result = & sqlcmd -S $serverName -d $databaseName -i $scriptPath -E
    
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "Migration Output:" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host $result
    
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "Migration completed!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please restart your backend application" -ForegroundColor Yellow
    Write-Host "Then test the API: GET /api/Post/GetAllPost" -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the script manually in SSMS:" -ForegroundColor Yellow
    Write-Host "1. Open SQL Server Management Studio" -ForegroundColor Yellow
    Write-Host "2. Connect to: $serverName" -ForegroundColor Yellow
    Write-Host "3. Open file: $scriptPath" -ForegroundColor Yellow
    Write-Host "4. Execute the script (F5)" -ForegroundColor Yellow
    exit 1
}


