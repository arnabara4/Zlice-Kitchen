# run-auth-fix.ps1
# PowerShell script to copy the SQL script for easy pasting into Supabase

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AUTH SESSIONS TABLE FIX" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "scripts\019_recreate_auth_sessions.sql"

if (Test-Path $sqlFile) {
    Write-Host "Reading SQL script..." -ForegroundColor Green
    $sqlContent = Get-Content $sqlFile -Raw
    
    Write-Host ""
    Write-Host "SQL Script copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to your Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Open SQL Editor" -ForegroundColor White
    Write-Host "3. Click 'New Query'" -ForegroundColor White
    Write-Host "4. Paste (Ctrl+V) and click 'Run'" -ForegroundColor White
    Write-Host ""
    
    # Copy to clipboard
    Set-Clipboard -Value $sqlContent
    
    Write-Host "Or view the SQL below:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $sqlContent -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
} else {
    Write-Host "Error: SQL file not found at $sqlFile" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
