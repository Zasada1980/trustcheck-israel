#!/bin/bash
# Скрипт развертывания обученной модели TrustCheck AI на Hetzner сервере
# Сервер: 46.224.147.252 (CX23, 8GB RAM, 4 vCPU)

set -e

SERVER_IP="46.224.147.252"
SERVER_USER="root"
SSH_KEY="C:/Users/zakon/.ssh/trustcheck_hetzner"
MODEL_PATH="E:/LLaMA-Factory/exports/trustcheck-ai/model.gguf"

echo "======================================"
echo "🚀 TrustCheck AI Model Deployment"
echo "======================================"

# 1. Проверить что модель экспортирована
echo "1️⃣ Проверка экспортированной модели..."
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Модель не найдена: $MODEL_PATH"
    echo "Сначала экспортируй модель из LLaMA Factory!"
    exit 1
fi

MODEL_SIZE=$(du -h "$MODEL_PATH" | cut -f1)
echo "✅ Модель найдена: $MODEL_SIZE"

# 2. Установить Ollama на сервере
echo ""
echo "2️⃣ Установка Ollama на сервере..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    # Проверить установлен ли Ollama
    if ! command -v ollama &> /dev/null; then
        echo "Установка Ollama..."
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "✅ Ollama уже установлен"
    fi
    
    # Создать директории
    mkdir -p /opt/trustcheck/models
    mkdir -p /opt/trustcheck/config
    
    # Настроить systemd service
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
    
    echo "✅ Ollama настроен"
ENDSSH

# 3. Загрузить модель на сервер
echo ""
echo "3️⃣ Загрузка модели на сервер (это займет время)..."
scp -i "$SSH_KEY" "$MODEL_PATH" "$SERVER_USER@$SERVER_IP:/opt/trustcheck/models/trustcheck-ai.gguf"
echo "✅ Модель загружена"

# 4. Создать Modelfile и зарегистрировать модель
echo ""
echo "4️⃣ Регистрация модели в Ollama..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    cd /opt/trustcheck/config
    
    # Создать Modelfile
    cat > Modelfile << 'EOF'
FROM /opt/trustcheck/models/trustcheck-ai.gguf

TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>
"""

PARAMETER num_ctx 4096
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

SYSTEM """אתה עוזר AI של פלטפורמת TrustCheck Israel. 
אתה יודע הכל על בדיקת אמינות עסקים ישראלים.
תמיד עונה בעברית בצורה ברורה ומקצועית."""
EOF
    
    # Запустить Ollama
    systemctl start ollama-trustcheck
    sleep 5
    
    # Зарегистрировать модель
    ollama create trustcheck-ai -f Modelfile
    
    echo "✅ Модель зарегистрирована"
ENDSSH

# 5. Тестирование
echo ""
echo "5️⃣ Тестирование модели..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    # Тест запрос
    response=$(curl -s http://localhost:11434/api/generate -d '{
      "model": "trustcheck-ai",
      "prompt": "מה זה TrustCheck Israel?",
      "stream": false
    }')
    
    echo "📝 Ответ модели:"
    echo "$response" | jq -r '.response'
ENDSSH

# 6. Настроить Nginx reverse proxy
echo ""
echo "6️⃣ Настройка Nginx для доступа к API..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    # Добавить в nginx.conf
    cat >> /etc/nginx/sites-available/trustcheck << 'EOF'

# AI Chat API
location /api/ai {
    proxy_pass http://localhost:11434/api/generate;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type';
}
EOF
    
    # Перезагрузить Nginx
    nginx -t && systemctl reload nginx
    
    echo "✅ Nginx настроен"
ENDSSH

echo ""
echo "======================================"
echo "✅ Развертывание завершено!"
echo "======================================"
echo ""
echo "📊 Статус:"
echo "  • Модель: trustcheck-ai"
echo "  • API: https://trustcheck.co.il/api/ai"
echo "  • Формат: Ollama API"
echo ""
echo "🧪 Тестирование:"
echo "curl https://trustcheck.co.il/api/ai \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\": \"trustcheck-ai\", \"prompt\": \"מה זה TrustCheck?\", \"stream\": false}'"
echo ""
echo "📋 Следующий шаг: Добавь чат-интерфейс на сайт"
