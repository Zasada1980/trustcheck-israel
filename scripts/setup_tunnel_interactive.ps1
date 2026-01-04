# CLOUDFLARE TUNNEL - Dashboard Setup Helper
# Для TrustCheck Israel (trustcheck.co.il)
# Упрощённый процесс создания tunnel через Dashboard

$ACCOUNT_ID = "20f5ee00fbbdf9c8b779161ea33c21cb"
$ZONE_ID = "736fb1cca4558c8a7f36adf14e2b153b"
$DOMAIN = "trustcheck.co.il"
$SERVER_IP = "46.224.147.252"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CLOUDFLARE TUNNEL - Пошаговая инструкция                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📌 Твои данные:" -ForegroundColor Yellow
Write-Host "   Account ID: $ACCOUNT_ID"
Write-Host "   Zone ID: $ZONE_ID"
Write-Host "   Domain: $DOMAIN"
Write-Host "   Server: root@$SERVER_IP"
Write-Host ""

Write-Host "🎯 ШАГ 1: Открой Cloudflare Dashboard" -ForegroundColor Green
Write-Host "   URL: https://one.dash.cloudflare.com/$ACCOUNT_ID/networks/tunnels" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Нажми Enter когда откроешь Dashboard..."
$null = Read-Host

Write-Host ""
Write-Host "🎯 ШАГ 2: Создай Tunnel" -ForegroundColor Green
Write-Host "   1. Нажми 'Create a tunnel'" -ForegroundColor White
Write-Host "   2. Выбери 'Cloudflared' (левая опция)" -ForegroundColor White
Write-Host "   3. Название: trustcheck-tunnel" -ForegroundColor Yellow
Write-Host "   4. Save tunnel" -ForegroundColor White
Write-Host ""
Write-Host "   Нажми Enter когда создашь tunnel..."
$null = Read-Host

Write-Host ""
Write-Host "🎯 ШАГ 3: Скопируй команду установки" -ForegroundColor Green
Write-Host "   Cloudflare покажет команду типа:" -ForegroundColor White
Write-Host "   sudo cloudflared service install ТВОЙ_ТОКЕН_ЗДЕСЬ" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Скопируй эту команду ЦЕЛИКОМ и вставь сюда:" -ForegroundColor White
$INSTALL_COMMAND = Read-Host "   Команда"

Write-Host ""
Write-Host "🎯 ШАГ 4: Устанавливаю tunnel на сервер..." -ForegroundColor Green

# Extract token from command
if ($INSTALL_COMMAND -match "cloudflared.*?service install\s+(.+)$") {
    $TOKEN = $Matches[1].Trim()
    
    Write-Host "   ✅ Токен извлечён: $($TOKEN.Substring(0,20))..." -ForegroundColor Green
    
    # Run installation on server
    Write-Host "   📡 Подключаюсь к серверу..." -ForegroundColor Cyan
    
    $SSH_COMMAND = "ssh -i `"$SSH_KEY`" root@$SERVER_IP `"$INSTALL_COMMAND && systemctl status cloudflared`""
    
    Write-Host "   🔧 Выполняю: cloudflared service install..." -ForegroundColor Cyan
    Invoke-Expression $SSH_COMMAND
    
    Write-Host ""
    Write-Host "   ✅ Tunnel установлен на сервере!" -ForegroundColor Green
    
} else {
    Write-Host "   ❌ Не удалось извлечь токен из команды" -ForegroundColor Red
    Write-Host "   Запусти команду вручную на сервере:" -ForegroundColor Yellow
    Write-Host "   ssh -i $SSH_KEY root@$SERVER_IP" -ForegroundColor Cyan
    Write-Host "   $INSTALL_COMMAND" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Нажми Enter когда установишь tunnel..."
    $null = Read-Host
}

Write-Host ""
Write-Host "🎯 ШАГ 5: Настрой Public Hostname" -ForegroundColor Green
Write-Host "   В Dashboard tunnel перейди на вкладку 'Public Hostname'" -ForegroundColor White
Write-Host ""
Write-Host "   🔹 Hostname 1:" -ForegroundColor Cyan
Write-Host "      Public hostname: $DOMAIN" -ForegroundColor Yellow
Write-Host "      Service: HTTP" -ForegroundColor White
Write-Host "      URL: localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "   🔹 Hostname 2:" -ForegroundColor Cyan
Write-Host "      Public hostname: www.$DOMAIN" -ForegroundColor Yellow
Write-Host "      Service: HTTP" -ForegroundColor White
Write-Host "      URL: localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Нажми Enter когда настроишь оба hostname..."
$null = Read-Host

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ TUNNEL ГОТОВ!                                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Проверь сайт:" -ForegroundColor Yellow
Write-Host "   https://$DOMAIN" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Проверка tunnel на сервере:" -ForegroundColor Yellow
ssh -i "$SSH_KEY" root@$SERVER_IP "systemctl status cloudflared --no-pager"

Write-Host ""
Write-Host "📊 DNS записи (автоматически созданы):" -ForegroundColor Yellow
Write-Host "   $DOMAIN → CNAME к .cfargotunnel.com" -ForegroundColor Cyan
Write-Host "   www.$DOMAIN → CNAME к .cfargotunnel.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Преимущества tunnel:" -ForegroundColor Green
Write-Host "   ✅ HTTPS автоматически (без certbot)" -ForegroundColor White
Write-Host "   ✅ Обход DNS propagation (работает сразу)" -ForegroundColor White
Write-Host "   ✅ DDoS защита Cloudflare" -ForegroundColor White
Write-Host "   ✅ Не нужно открывать порты на сервере" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Открыть сайт?" -ForegroundColor Yellow
$OPEN = Read-Host "   [Y/n]"
if ($OPEN -ne "n") {
    Start-Process "https://$DOMAIN"
}

Write-Host ""
Write-Host "✅ Готово!" -ForegroundColor Green
