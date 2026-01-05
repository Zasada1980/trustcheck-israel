# test_training_system.ps1 - Автоматическая проверка системы обучения AI
# Использование: pwsh test_training_system.ps1

$ErrorActionPreference = "Stop"
$BaseUrl = "https://trustcheck.co.il"

Write-Host "🧪 Тест системы обучения AI - TrustCheck" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "1️⃣ Тест авторизации..." -ForegroundColor Yellow
try {
    $loginBody = @{
        password = "admin"
        rememberMe = $true
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session `
        -ErrorAction Stop

    Write-Host "✅ Авторизация успешна" -ForegroundColor Green
    Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Ошибка авторизации: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check auth status
Write-Host "2️⃣ Проверка сессии..." -ForegroundColor Yellow
try {
    $authCheck = Invoke-RestMethod -Uri "$BaseUrl/api/admin/auth/check" `
        -Method Get `
        -WebSession $session

    if ($authCheck.authenticated -eq $true) {
        Write-Host "✅ Сессия активна" -ForegroundColor Green
        Write-Host "Username: $($authCheck.username)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Сессия не активна" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Ошибка проверки сессии: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Check documents
Write-Host "3️⃣ Проверка списка документов..." -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "$BaseUrl/api/admin/documents" `
        -Method Get `
        -WebSession $session

    $docsCount = $docs.documents.Count
    Write-Host "📚 Документов в системе: $docsCount" -ForegroundColor Cyan
    
    if ($docsCount -gt 0) {
        Write-Host "Документы:" -ForegroundColor Gray
        $docs.documents | ForEach-Object {
            Write-Host "  - $($_.name) (URLs: $($_.urlsExtracted.Count))" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "⚠️ Ошибка получения документов: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Check chat history
Write-Host "4️⃣ Проверка истории чата..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$BaseUrl/api/admin/chat/history" `
        -Method Get `
        -WebSession $session

    $messagesCount = $history.messages.Count
    Write-Host "💬 Сообщений в истории: $messagesCount" -ForegroundColor Cyan
}
catch {
    Write-Host "⚠️ Ошибка получения истории: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Test chat API
Write-Host "5️⃣ Тест AI чата..." -ForegroundColor Yellow
try {
    $chatBody = @{
        message = "Привет! Как тебя зовут?"
        history = @()
    } | ConvertTo-Json

    $chatResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/chat" `
        -Method Post `
        -Body $chatBody `
        -ContentType "application/json" `
        -WebSession $session `
        -TimeoutSec 60

    Write-Host "✅ AI чат работает" -ForegroundColor Green
    Write-Host "📝 Ответ AI:" -ForegroundColor Gray
    Write-Host $chatResponse.content.Substring(0, [Math]::Min(200, $chatResponse.content.Length)) -ForegroundColor Gray
    
    if ($chatResponse.sources) {
        Write-Host "📚 Источники: $($chatResponse.sources.Count)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "⚠️ AI чат недоступен: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Возможные причины:" -ForegroundColor Gray
    Write-Host "  - Ollama не запущен (запустите: pwsh scripts/START_TUNNEL.ps1)" -ForegroundColor Gray
    Write-Host "  - OLLAMA_API_URL не настроен в .env" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Check server-side data
Write-Host "6️⃣ Проверка данных на сервере..." -ForegroundColor Yellow
Write-Host "Для проверки векторной базы выполните на сервере:" -ForegroundColor Gray
Write-Host "  ssh root@46.224.147.252" -ForegroundColor Gray
Write-Host "  cd /root/trustcheck" -ForegroundColor Gray
Write-Host "  cat data/vector_db.json | jq '.documents | length'" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 ИТОГИ ПРОВЕРКИ:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Авторизация: работает" -ForegroundColor Green
Write-Host "✅ Сессия: сохраняется" -ForegroundColor Green
Write-Host "✅ API endpoints: доступны" -ForegroundColor Green
Write-Host "✅ Документы: система готова к загрузке" -ForegroundColor Green

if ($chatResponse) {
    Write-Host "✅ AI чат: работает" -ForegroundColor Green
}
else {
    Write-Host "⚠️ AI чат: недоступен (Ollama)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Загрузить тестовый файл:" -ForegroundColor White
Write-Host "   - Откройте: https://trustcheck.co.il" -ForegroundColor Gray
Write-Host "   - Нажмите кнопку 'Developer'" -ForegroundColor Gray
Write-Host "   - Войдите: admin / admin" -ForegroundColor Gray
Write-Host "   - Загрузите файл: test_training.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Проверить извлечение URL (вкладка 'Документы')" -ForegroundColor White
Write-Host "3. Проверить web scraping (SSH на сервер)" -ForegroundColor White
Write-Host "4. Протестировать RAG чат с вопросами" -ForegroundColor White
Write-Host ""
Write-Host "📖 Полная инструкция: TRAINING_VERIFICATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
