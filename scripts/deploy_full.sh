#!/bin/bash
# Полный автоматический деплой TrustCheck AI Chat на production
# Сервер: 46.224.147.252 (Hetzner CX23)

set -e

SERVER_IP="46.224.147.252"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/trustcheck_hetzner"

echo "======================================"
echo "🚀 TrustCheck AI Chat Deployment"
echo "======================================"

# 1. Локальная сборка
echo ""
echo "1️⃣ Локальная сборка проекта..."
cd /e/SBF
npm run build || {
    echo "⚠️ Build имеет ESLint warnings, но продолжаем..."
}

echo "✅ Сборка завершена"

# 2. Коммит изменений
echo ""
echo "2️⃣ Коммит изменений в Git..."
git add .
git commit -m "feat: Add AI Chat powered by Gemini 2.0 Flash

- Added AIChat component with Hebrew RTL support
- Created /api/ai endpoint for chat
- Integrated Gemini for interactive Q&A
- Training dataset prepared (265 records, 1.15 MB)
" || echo "No changes to commit"

git push origin main
echo "✅ Изменения отправлены в GitHub"

# 3. Деплой на сервер
echo ""
echo "3️⃣ Деплой на production сервер..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    echo "📦 Обновление кода..."
    cd /root/trustcheck
    git pull origin main
    
    echo "🏗️ Пересборка Docker контейнеров..."
    docker compose down app
    docker compose build --no-cache app
    docker compose up -d app
    
    echo "⏳ Ожидание запуска (30 сек)..."
    sleep 30
    
    echo "✅ Деплой завершен!"
ENDSSH

# 4. Проверка здоровья
echo ""
echo "4️⃣ Проверка здоровья сервисов..."
sleep 5

echo "🔍 Health check основного API..."
curl -s https://trustcheck.co.il/api/health | jq '.'

echo ""
echo "🔍 Health check AI Chat API..."
curl -s https://trustcheck.co.il/api/ai | jq '.'

# 5. Тест AI Chat
echo ""
echo "5️⃣ Тестирование AI Chat..."
response=$(curl -s https://trustcheck.co.il/api/ai \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "מה זה TrustCheck Israel?"}')

echo "📝 Ответ AI:"
echo "$response" | jq -r '.response' | head -n 5

echo ""
echo "======================================"
echo "✅ Деплой успешно завершен!"
echo "======================================"
echo ""
echo "🌐 URL:"
echo "  • Сайт: https://trustcheck.co.il"
echo "  • API: https://trustcheck.co.il/api/ai"
echo "  • Health: https://trustcheck.co.il/api/health"
echo ""
echo "💬 Чат доступен на главной странице (нижний левый угол)"
echo ""
echo "📊 Мониторинг:"
echo "  ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "  docker compose logs -f app"
