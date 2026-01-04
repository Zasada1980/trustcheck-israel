# DNS Monitoring & Auto-SSL Setup Script
# Monitors trustcheck.co.il DNS activation and automatically configures SSL

$Domain = "trustcheck.co.il"
$ServerIP = "46.224.147.252"
$SSHKey = "C:\Users\zakon\.ssh\trustcheck_hetzner"
$ServerUser = "root"

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DNS Monitoring: trustcheck.co.il                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⏰ Начало мониторинга: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
Write-Host "📡 Проверка каждые 10 минут..." -ForegroundColor Gray
Write-Host "🔍 Ожидаем: elsa/todd.ns.cloudflare.com`n" -ForegroundColor Gray

$MaxAttempts = 12  # 2 hours max
$Attempt = 0

while ($Attempt -lt $MaxAttempts) {
    $Attempt++
    
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "Попытка $Attempt/$MaxAttempts - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
    
    # Check DNS
    try {
        $NSQuery = nslookup -type=NS $Domain 2>&1 | Out-String
        
        if ($NSQuery -match "cloudflare\.com") {
            Write-Host "✅ DNS АКТИВИРОВАН!" -ForegroundColor Green
            Write-Host "`n$NSQuery" -ForegroundColor Cyan
            
            # Play success sound
            [Console]::Beep(800, 200)
            [Console]::Beep(1000, 200)
            [Console]::Beep(1200, 400)
            
            Write-Host "`n🔒 Запускаю автоматическую настройку SSL..." -ForegroundColor Yellow
            
            # Wait 30 seconds for DNS propagation to complete
            Write-Host "⏳ Ожидание полной propagation (30 сек)..." -ForegroundColor Gray
            Start-Sleep -Seconds 30
            
            # Run SSL setup
            $SSLScriptPath = "E:\SBF\scripts\setup_ssl_remote.ps1"
            if (Test-Path $SSLScriptPath) {
                & $SSLScriptPath
            } else {
                Write-Host "⚠️  Скрипт SSL не найден. Запускаю вручную..." -ForegroundColor Yellow
                
                $SSHCommands = @"
apt update && apt install -y certbot python3-certbot-nginx
certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email admin@$Domain --redirect
systemctl reload nginx
"@
                
                ssh -i $SSHKey "$ServerUser@$ServerIP" $SSHCommands
            }
            
            Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
            Write-Host "🌐 Проверь: https://$Domain" -ForegroundColor Cyan
            
            # Open browser
            Start-Process "https://$Domain"
            
            break
        } else {
            Write-Host "⏳ DNS ещё не активен" -ForegroundColor Gray
            Write-Host "   Статус: Non-existent domain или старые NS" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "❌ Ошибка проверки DNS: $_" -ForegroundColor Red
    }
    
    if ($Attempt -lt $MaxAttempts) {
        Write-Host "`n⏰ Следующая проверка через 10 минут..." -ForegroundColor Gray
        Start-Sleep -Seconds 600  # 10 minutes
    }
}

if ($Attempt -ge $MaxAttempts) {
    Write-Host "`n⚠️  DNS не активировался за 2 часа" -ForegroundColor Yellow
    Write-Host "   Проверь MyNames → שרתי שם → статус должен быть 'מופנה'" -ForegroundColor Gray
    Write-Host "   Или запусти проверку позже: nslookup -type=NS $Domain" -ForegroundColor Gray
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Мониторинг завершён                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
