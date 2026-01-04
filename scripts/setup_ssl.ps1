# Auto-SSL Setup for TrustCheck Israel (Remote Execution)
# Выполняется с локального Windows на сервер Hetzner

$SERVER = "root@46.224.147.252"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔒 Автоматическая настройка SSL для trustcheck.co.il  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check DNS
Write-Host "📡 Шаг 1/6: Проверка DNS..." -ForegroundColor Yellow
$dnsCheck = nslookup trustcheck.co.il 2>&1 | Select-String "Address:"

if (-not $dnsCheck) {
    Write-Host "❌ КРИТИЧЕСКАЯ ОШИБКА: DNS ещё не работает!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Текущий статус:" -ForegroundColor Yellow
    nslookup trustcheck.co.il
    Write-Host ""
    Write-Host "Что делать:" -ForegroundColor Yellow
    Write-Host "  1. Проверь статус в MyNames: https://my.mynames.co.il" -ForegroundColor White
    Write-Host "  2. Ищи строку: 'בתהליך' → должна смениться на 'מופנה'" -ForegroundColor White
    Write-Host "  3. Подожди 30-60 минут" -ForegroundColor White
    Write-Host "  4. Запусти скрипт снова" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ DNS работает!" -ForegroundColor Green
Write-Host "   Адрес: $($dnsCheck -join ', ')" -ForegroundColor Gray
Write-Host ""

# Step 2: Upload SSL script to server
Write-Host "📤 Шаг 2/6: Загружаем скрипт на сервер..." -ForegroundColor Yellow
$sshKey = "C:\Users\zakon\.ssh\trustcheck_hetzner"

scp -i $sshKey scripts/setup_ssl.sh "${SERVER}:/root/setup_ssl.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки скрипта!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Скрипт загружен" -ForegroundColor Green
Write-Host ""

# Step 3: Make script executable
Write-Host "🔧 Шаг 3/6: Делаем скрипт исполняемым..." -ForegroundColor Yellow
ssh -i $sshKey $SERVER "chmod +x /root/setup_ssl.sh"
Write-Host "✅ Права установлены" -ForegroundColor Green
Write-Host ""

# Step 4: Run SSL setup
Write-Host "🚀 Шаг 4/6: Запускаем установку SSL..." -ForegroundColor Yellow
Write-Host "   (это займёт ~30-60 секунд)" -ForegroundColor Gray
Write-Host ""

ssh -i $sshKey $SERVER "/root/setup_ssl.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Ошибка настройки SSL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Проверь логи:" -ForegroundColor Yellow
    Write-Host "  ssh -i $sshKey $SERVER 'docker logs trustcheck-nginx --tail 50'" -ForegroundColor White
    exit 1
}

# Step 5: Verify HTTPS
Write-Host ""
Write-Host "✅ SSL установлен!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Шаг 5/6: Проверяем HTTPS..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "https://trustcheck.co.il" -Method Head -SkipCertificateCheck -ErrorAction Stop
    Write-Host "✅ HTTPS работает! (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  HTTPS ещё не доступен (может занять 1-2 минуты)" -ForegroundColor Yellow
    Write-Host "   Ошибка: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Step 6: Configure Cloudflare SSL
Write-Host "🌐 Шаг 6/6: Настройка Cloudflare..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Открой Cloudflare Dashboard:" -ForegroundColor Yellow
Write-Host "  https://dash.cloudflare.com/736fb1cca4558c8a7f36adf14e2b153b/trustcheck.co.il/ssl-tls" -ForegroundColor Cyan
Write-Host ""
Write-Host "Установи параметры:" -ForegroundColor Yellow
Write-Host "  1. SSL/TLS encryption mode: Full (strict)" -ForegroundColor White
Write-Host "  2. Always Use HTTPS: ON" -ForegroundColor White
Write-Host "  3. Automatic HTTPS Rewrites: ON" -ForegroundColor White
Write-Host "  4. Minimum TLS Version: 1.2" -ForegroundColor White
Write-Host ""

# Final status
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ НАСТРОЙКА ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Проверка сайта:" -ForegroundColor Yellow
Write-Host "  https://trustcheck.co.il" -ForegroundColor Cyan
Write-Host "  https://www.trustcheck.co.il" -ForegroundColor Cyan
Write-Host ""
Write-Host "Проверка SSL:" -ForegroundColor Yellow
Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=trustcheck.co.il" -ForegroundColor Cyan
Write-Host ""
Write-Host "Автопродление сертификата:" -ForegroundColor Yellow
Write-Host "  Certbot автоматически продлит за 30 дней до истечения" -ForegroundColor White
Write-Host "  Проверка: ssh $SERVER 'certbot renew --dry-run'" -ForegroundColor Gray
Write-Host ""

# Open browser
Write-Host "Открыть сайт в браузере? (y/n): " -NoNewline
$answer = Read-Host

if ($answer -eq "y" -or $answer -eq "Y") {
    Start-Process "https://trustcheck.co.il"
}
