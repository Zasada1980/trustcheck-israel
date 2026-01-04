# Скрипт мониторинга DNS активации
# Проверяет каждые 5 минут, максимум 1 час

$domain = "trustcheck.co.il"
$maxAttempts = 12  # 12 * 5 минут = 1 час
$interval = 300    # 5 минут в секундах

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DNS Мониторинг для trustcheck.co.il                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📊 Параметры:" -ForegroundColor Yellow
Write-Host "   • Домен: $domain"
Write-Host "   • Проверка каждые: 5 минут"
Write-Host "   • Максимум попыток: 12 (1 час)`n"

for ($i = 1; $i -le $maxAttempts; $i++) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Проверка $i/$maxAttempts..." -ForegroundColor Cyan
    
    # Проверка nameservers
    $nsResult = nslookup -type=NS $domain 2>&1 | Out-String
    
    if ($nsResult -match "jihoon|molly") {
        Write-Host "`n✅ NAMESERVERS АКТИВНЫ!" -ForegroundColor Green
        Write-Host $nsResult
        
        # Проверка A/CNAME записи
        Write-Host "`n🔍 Проверяю DNS resolution..." -ForegroundColor Cyan
        $dnsResult = nslookup $domain 2>&1 | Out-String
        
        if ($dnsResult -match "cloudflare|104\.|172\.") {
            Write-Host "✅ DNS ПОЛНОСТЬЮ АКТИВЕН!" -ForegroundColor Green
            Write-Host $dnsResult
            
            # Проверка HTTPS
            Write-Host "`n🌐 Проверяю HTTPS..." -ForegroundColor Cyan
            try {
                $response = curl -I https://$domain 2>&1 | Out-String
                if ($response -match "HTTP/2|cloudflare") {
                    Write-Host "✅ HTTPS РАБОТАЕТ!" -ForegroundColor Green
                    Write-Host $response
                    
                    # Успех! Играем звук
                    [Console]::Beep(800, 200)
                    Start-Sleep -Milliseconds 100
                    [Console]::Beep(1000, 200)
                    Start-Sleep -Milliseconds 100
                    [Console]::Beep(1200, 300)
                    
                    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
                    Write-Host "║  🎉 САЙТ ГОТОВ!                                           ║" -ForegroundColor Green
                    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
                    
                    Write-Host "Открываю сайт в браузере..." -ForegroundColor Cyan
                    Start-Process "https://$domain"
                    
                    exit 0
                }
            } catch {
                Write-Host "⏳ HTTPS ещё не готов, но DNS активен" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⏳ Nameservers активны, но CNAME ещё не распространился" -ForegroundColor Yellow
            Write-Host "   Жду ещё 5 минут..." -ForegroundColor White
        }
        
    } elseif ($nsResult -match "elsa|todd") {
        Write-Host "⚠️  Старые nameservers (elsa/todd) всё ещё видны" -ForegroundColor Yellow
        Write-Host "   Propagation в процессе..." -ForegroundColor White
        
    } else {
        Write-Host "⏳ DNS ещё не активен" -ForegroundColor Yellow
    }
    
    if ($i -lt $maxAttempts) {
        Write-Host "`n⏰ Следующая проверка через 5 минут...`n" -ForegroundColor Gray
        Start-Sleep -Seconds $interval
    }
}

Write-Host "`n⏰ Прошёл 1 час, DNS ещё не активен" -ForegroundColor Yellow
Write-Host "   Это нормально - MyNames может занять до 24 часов" -ForegroundColor White
Write-Host "   Но обычно активируется в течение 2-3 часов`n" -ForegroundColor White

Write-Host "💡 Рекомендации:" -ForegroundColor Cyan
Write-Host "   1. Проверяй вручную: nslookup -type=NS trustcheck.co.il" -ForegroundColor White
Write-Host "   2. Когда увидишь jihoon/molly → жди ещё 15-30 минут" -ForegroundColor White
Write-Host "   3. Потом проверь: https://trustcheck.co.il`n" -ForegroundColor White
