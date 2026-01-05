# Автоматический деплой локальной AI модели на Hetzner
# Запускать ПОСЛЕ завершения обучения

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🤖 TrustCheck Local AI Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Конфигурация
$LLAMAFACTORY_PATH = "E:\LLaMA-Factory"
$MODEL_PATH = "$LLAMAFACTORY_PATH\saves\trustcheck-ai"
$EXPORT_PATH = "$LLAMAFACTORY_PATH\exports\trustcheck-ai"
$SERVER_IP = "46.224.147.252"
$SERVER_USER = "root"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"

# ШАГ 1: Проверка обученной модели
Write-Host "`n1️⃣ Проверка обученной модели..." -ForegroundColor Yellow

if (-not (Test-Path "$MODEL_PATH\adapter_config.json")) {
    Write-Host "❌ Модель не обучена! Запусти обучение сначала." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Модель найдена: $MODEL_PATH" -ForegroundColor Green

# ШАГ 2: Экспорт в GGUF
Write-Host "`n2️⃣ Экспорт модели в GGUF формат..." -ForegroundColor Yellow

if (Test-Path $EXPORT_PATH) {
    Remove-Item $EXPORT_PATH -Recurse -Force
}

cd $LLAMAFACTORY_PATH

python -m llamafactory.cli.export `
    --model_name_or_path $MODEL_PATH `
    --export_dir $EXPORT_PATH `
    --export_size 4 `
    --export_device cpu `
    --export_legacy_format False

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка экспорта!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Модель экспортирована" -ForegroundColor Green

$modelFile = Get-ChildItem "$EXPORT_PATH\*.gguf" | Select-Object -First 1
if (-not $modelFile) {
    Write-Host "❌ GGUF файл не найден!" -ForegroundColor Red
    exit 1
}

$modelSize = [math]::Round($modelFile.Length / 1GB, 2)
Write-Host "📦 Размер модели: $modelSize GB" -ForegroundColor Cyan

# ШАГ 3: Установка Ollama на сервере
Write-Host "`n3️⃣ Установка Ollama на сервере..." -ForegroundColor Yellow

$ollamaSetup = @"
# Проверка/установка Ollama
if ! command -v ollama &> /dev/null; then
    echo '📥 Установка Ollama...'
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo '✅ Ollama уже установлен'
fi

# Создание директорий
mkdir -p /opt/trustcheck/models
mkdir -p /opt/trustcheck/config

# Настройка systemd service
cat > /etc/systemd/system/ollama-trustcheck.service << 'EOF'
[Unit]
Description=Ollama TrustCheck AI Service
After=network-online.target

[Service]
Type=simple
User=root
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/opt/trustcheck/models"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ollama-trustcheck
echo '✅ Ollama настроен'
"@

ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" $ollamaSetup

# ШАГ 4: Загрузка модели на сервер
Write-Host "`n4️⃣ Загрузка модели на сервер (это займет время)..." -ForegroundColor Yellow

scp -i $SSH_KEY $modelFile.FullName "${SERVER_USER}@${SERVER_IP}:/opt/trustcheck/models/trustcheck-ai.gguf"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Модель загружена на сервер" -ForegroundColor Green

# ШАГ 5: Создание Modelfile и регистрация
Write-Host "`n5️⃣ Регистрация модели в Ollama..." -ForegroundColor Yellow

$modelfileSetup = @"
cd /opt/trustcheck/config

# Создать Modelfile
cat > Modelfile << 'EOF'
FROM /opt/trustcheck/models/trustcheck-ai.gguf

TEMPLATE '''{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>
'''

PARAMETER num_ctx 4096
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

SYSTEM '''אתה עוזר AI של פלטפורמת TrustCheck Israel. 
אתה יודע הכל על בדיקת אמינות עסקים ישראלים.
תמיד עונה בעברית בצורה ברורה ומקצועית.'''
EOF

# Запустить Ollama
systemctl start ollama-trustcheck
sleep 5

# Зарегистрировать модель
ollama create trustcheck-ai -f Modelfile

echo '✅ Модель зарегистрирована'
"@

ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" $modelfileSetup

# ШАГ 6: Тестирование
Write-Host "`n6️⃣ Тестирование модели..." -ForegroundColor Yellow

$testScript = @"
response=\$(curl -s http://localhost:11434/api/generate -d '{
  \"model\": \"trustcheck-ai\",
  \"prompt\": \"מה זה TrustCheck Israel?\",
  \"stream\": false
}')

echo \$response | jq -r '.response' | head -n 5
"@

$testResult = ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" $testScript

Write-Host "`n📝 Ответ модели (первые 5 строк):" -ForegroundColor Cyan
Write-Host $testResult -ForegroundColor White

# ШАГ 7: Настройка Nginx
Write-Host "`n7️⃣ Настройка Nginx reverse proxy..." -ForegroundColor Yellow

$nginxSetup = @"
# Бэкап текущей конфигурации
cp /etc/nginx/sites-available/trustcheck /etc/nginx/sites-available/trustcheck.backup

# Добавить Ollama location
cat >> /etc/nginx/sites-available/trustcheck << 'EOF'

# Local AI API
location /api/ai/local {
    rewrite ^/api/ai/local(.*) /api/generate\$1 break;
    proxy_pass http://localhost:11434;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    
    # Timeout для AI ответов
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
}
EOF

# Проверить конфигурацию
nginx -t && systemctl reload nginx

echo '✅ Nginx настроен'
"@

ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" $nginxSetup

# ШАГ 8: Обновление кода приложения
Write-Host "`n8️⃣ Обновление приложения для использования локальной модели..." -ForegroundColor Yellow

# Вернуться в проект
cd E:\SBF

# Обновить .env
if (Test-Path ".env") {
    (Get-Content ".env") -replace "OLLAMA_API_URL=.*", "OLLAMA_API_URL=http://localhost:11434/api/generate" | Set-Content ".env"
}

# Commit и push
git add .
git commit -m "feat: Switch to local Ollama AI model

- Trained custom TrustCheck model on 265 records
- Exported to GGUF format (${modelSize} GB)
- Deployed to Hetzner server with Ollama
- API endpoint: /api/ai/local
"

git push origin main

# Деплой на сервер
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" "cd /root/trustcheck && git pull origin main && docker compose down app && docker compose build --no-cache app && docker compose up -d app"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Деплой завершен!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n🌐 Endpoints:" -ForegroundColor Cyan
Write-Host "  • Local AI: https://trustcheck.co.il/api/ai/local" -ForegroundColor White
Write-Host "  • Health: https://trustcheck.co.il/api/health" -ForegroundColor White
Write-Host "  • Website: https://trustcheck.co.il" -ForegroundColor White

Write-Host "`n📊 Статистика:" -ForegroundColor Cyan
Write-Host "  • Размер модели: $modelSize GB" -ForegroundColor White
Write-Host "  • Датасет: 265 records" -ForegroundColor White
Write-Host "  • Epochs: 3" -ForegroundColor White
Write-Host "  • LoRA rank: 8" -ForegroundColor White

Write-Host "`n🧪 Тестирование:" -ForegroundColor Cyan
Write-Host '  curl https://trustcheck.co.il/api/ai/local \' -ForegroundColor White
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor White
Write-Host '    -d '"'"'{"model": "trustcheck-ai", "prompt": "מה זה TrustCheck?", "stream": false}'"'"'' -ForegroundColor White

Write-Host "`n💡 Мониторинг:" -ForegroundColor Cyan
Write-Host "  ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "  systemctl status ollama-trustcheck" -ForegroundColor White
Write-Host "  docker compose logs -f app" -ForegroundColor White
