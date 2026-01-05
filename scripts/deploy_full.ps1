# Полный автоматический деплой TrustCheck AI Chat на production
# Сервер: 46.224.147.252 (Hetzner CX23)

$SERVER_IP = "46.224.147.252"
$SERVER_USER = "root"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 TrustCheck AI Chat Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1. Деплой на сервер
Write-Host ""
Write-Host "1️⃣ Деплой на production сервер..." -ForegroundColor Yellow

$deployScript = @"
set -e

echo '📦 Обновление кода...'
cd /root/trustcheck
git pull origin main

echo '🏗️ Пересборка Docker контейнеров...'
docker compose down app
docker compose build --no-cache app
docker compose up -d app

echo '⏳ Ожидание запуска (30 сек)...'
sleep 30

echo '✅ Деплой завершен!'
"@

ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" $deployScript

Write-Host "✅ Деплой завершен" -ForegroundColor Green

# 2. Проверка здоровья
Write-Host ""
Write-Host "2️⃣ Проверка здоровья сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🔍 Health check основного API..."
try {
    $health = Invoke-RestMethod -Uri "https://trustcheck.co.il/api/health" -Method Get
    Write-Host "  Status: $($health.status)" -ForegroundColor Green
    Write-Host "  Environment: $($health.environment)"
} catch {
    Write-Host "  ⚠️ Ошибка: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Health check AI Chat API..."
try {
    $aiHealth = Invoke-RestMethod -Uri "https://trustcheck.co.il/api/ai" -Method Get
    Write-Host "  Status: $($aiHealth.status)" -ForegroundColor Green
    Write-Host "  Model: $($aiHealth.model)"
} catch {
    Write-Host "  ⚠️ Ошибка: $_" -ForegroundColor Red
}

# 3. Тест AI Chat
Write-Host ""
Write-Host "3️⃣ Тестирование AI Chat..." -ForegroundColor Yellow

try {
    $body = @{
        prompt = "מה זה TrustCheck Israel?"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://trustcheck.co.il/api/ai" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "📝 Ответ AI (первые 200 символов):"
    Write-Host $response.response.Substring(0, [Math]::Min(200, $response.response.Length)) -ForegroundColor Cyan
    Write-Host "..."
} catch {
    Write-Host "  ⚠️ Ошибка: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Деплой успешно завершен!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URL:" -ForegroundColor Cyan
Write-Host "  • Сайт: https://trustcheck.co.il"
Write-Host "  • API: https://trustcheck.co.il/api/ai"
Write-Host "  • Health: https://trustcheck.co.il/api/health"
Write-Host ""
Write-Host "💬 Чат доступен на главной странице (нижний левый угол)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Мониторинг:" -ForegroundColor Cyan
Write-Host "  ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP}"
Write-Host "  docker compose logs -f app"
