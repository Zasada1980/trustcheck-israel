# Full Ollama Deployment to Hetzner Server
# Разворачивает обученную модель на продакшн сервер

param(
    [switch]$SkipModelUpload,
    [switch]$SkipOllamaInstall,
    [switch]$TestOnly
)

$ErrorActionPreference = "Stop"

$SERVER = "root@46.224.147.252"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"
$MODEL_PATH = "E:\LLaMA-Factory\exports\trustcheck-ai"
$REMOTE_MODEL_PATH = "/root/trustcheck/models"

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host "🚀 TrustCheck AI Deployment to Production" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host ""

# Проверка модели
$ggufFile = Get-ChildItem -Path $MODEL_PATH -Filter "*.gguf" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $ggufFile) {
    Write-Host "❌ Модель GGUF не найдена в $MODEL_PATH" -ForegroundColor Red
    Write-Host "   Сначала запусти экспорт:" -ForegroundColor Yellow
    Write-Host "   pwsh E:\LLaMA-Factory\export_with_timeout.ps1" -ForegroundColor Gray
    exit 1
}

$sizeMB = [math]::Round($ggufFile.Length / 1MB, 2)
Write-Host "✅ Модель найдена: $($ggufFile.Name) ($sizeMB MB)" -ForegroundColor Green
Write-Host ""

if ($TestOnly) {
    Write-Host "🧪 TEST MODE - проверка только SSH подключения" -ForegroundColor Yellow
    Write-Host ""
    
    ssh -i $SSH_KEY $SERVER "echo '✅ SSH подключение OK' && ollama --version"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Сервер готов к развертыванию" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка подключения" -ForegroundColor Red
        exit 1
    }
    
    exit 0
}

# ШАГ 1: Установка Ollama (если нужно)
if (-not $SkipOllamaInstall) {
    Write-Host "=" -NoNewline -ForegroundColor Blue
    Write-Host ("=" * 58) -ForegroundColor Blue
    Write-Host "📦 ШАГ 1: Установка Ollama" -ForegroundColor Blue
    Write-Host "=" -NoNewline -ForegroundColor Blue
    Write-Host ("=" * 58) -ForegroundColor Blue
    Write-Host ""
    
    ssh -i $SSH_KEY $SERVER @"
echo '📥 Скачивание Ollama...'
curl -fsSL https://ollama.ai/install.sh | sh

echo '🔧 Настройка systemd сервиса...'
systemctl enable ollama
systemctl start ollama

echo '✅ Ollama установлен'
ollama --version
"@
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки Ollama" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Ollama успешно установлен" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 3
}

# ШАГ 2: Загрузка модели на сервер
if (-not $SkipModelUpload) {
    Write-Host "=" -NoNewline -ForegroundColor Blue
    Write-Host ("=" * 58) -ForegroundColor Blue
    Write-Host "📤 ШАГ 2: Загрузка модели на сервер" -ForegroundColor Blue
    Write-Host "=" -NoNewline -ForegroundColor Blue
    Write-Host ("=" * 58) -ForegroundColor Blue
    Write-Host ""
    
    # Создать директорию
    ssh -i $SSH_KEY $SERVER "mkdir -p $REMOTE_MODEL_PATH"
    
    # Загрузить модель
    Write-Host "⏳ Загрузка $($ggufFile.Name) ($sizeMB MB)..." -ForegroundColor Yellow
    scp -i $SSH_KEY $ggufFile.FullName "${SERVER}:${REMOTE_MODEL_PATH}/"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка загрузки модели" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Модель загружена" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 2
}

# ШАГ 3: Создание Modelfile
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host "📝 ШАГ 3: Регистрация модели в Ollama" -ForegroundColor Blue
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host ""

$modelfileName = $ggufFile.Name
ssh -i $SSH_KEY $SERVER @"
cd $REMOTE_MODEL_PATH

cat > Modelfile << 'MODELFILE_END'
FROM ./$modelfileName

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

SYSTEM """
Ты - TrustCheck AI, помощник для проверки надежности израильских бизнесов.
Отвечай на иврите, профессионально и по существу.
Используй данные из обучения для точных ответов.
"""
MODELFILE_END

echo '✅ Modelfile создан'
cat Modelfile
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка создания Modelfile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Регистрация модели в Ollama..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "cd $REMOTE_MODEL_PATH && ollama create trustcheck-ai -f Modelfile"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка регистрации модели" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Модель зарегистрирована как 'trustcheck-ai'" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ШАГ 4: Тест модели
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host "🧪 ШАГ 4: Тестирование модели" -ForegroundColor Blue
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host ""

Write-Host "💬 Отправка тестового вопроса..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "ollama run trustcheck-ai 'מה זה TrustCheck?'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка тестирования" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Модель отвечает корректно" -ForegroundColor Green
Write-Host ""

# ШАГ 5: Конфигурация Nginx
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host "🌐 ШАГ 5: Настройка Nginx" -ForegroundColor Blue
Write-Host "=" -NoNewline -ForegroundColor Blue
Write-Host ("=" * 58) -ForegroundColor Blue
Write-Host ""

ssh -i $SSH_KEY $SERVER @"
cat > /etc/nginx/sites-available/ollama << 'NGINX_END'
location /api/ollama/ {
    proxy_pass http://127.0.0.1:11434/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 120s;
}
NGINX_END

# Добавить в основной конфиг
if ! grep -q '/api/ollama' /etc/nginx/sites-enabled/trustcheck; then
    sed -i '/location \\/api\\//a\\    include /etc/nginx/sites-available/ollama;' /etc/nginx/sites-enabled/trustcheck
fi

nginx -t && systemctl reload nginx

echo '✅ Nginx настроен'
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка настройки Nginx" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Nginx обновлен" -ForegroundColor Green
Write-Host ""

# ФИНАЛ
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host ("=" * 58) -ForegroundColor Green
Write-Host "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host ("=" * 58) -ForegroundColor Green
Write-Host ""
Write-Host "✅ Модель развернута: trustcheck-ai" -ForegroundColor Green
Write-Host "✅ API доступен: https://trustcheck.co.il/api/ollama/api/generate" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. Обнови app/api/ai/route.ts (замени Gemini → Ollama)" -ForegroundColor Gray
Write-Host "   2. Обнови .env: OLLAMA_API_URL=https://trustcheck.co.il/api/ollama" -ForegroundColor Gray
Write-Host "   3. Выполни: cd E:\SBF && git add . && git commit -m 'feat: Switch to local AI'" -ForegroundColor Gray
Write-Host "   4. Развертывание: pwsh scripts/deploy_full.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Проверка здоровья модели:" -ForegroundColor Cyan
Write-Host "   curl https://trustcheck.co.il/api/ollama/api/tags" -ForegroundColor Gray
