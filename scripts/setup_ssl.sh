#!/bin/bash
# Auto-SSL Setup for TrustCheck Israel
# Run this script AFTER DNS propagation completes

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔒 Автоматическая настройка SSL для trustcheck.co.il    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check DNS resolution
echo "📡 Шаг 1: Проверка DNS..."
if ! nslookup trustcheck.co.il | grep -q "Address:"; then
    echo "❌ ОШИБКА: DNS ещё не резолвится!"
    echo "Подожди 30-60 минут и попробуй снова."
    echo ""
    echo "Проверка: nslookup trustcheck.co.il"
    exit 1
fi

echo "✅ DNS резолвится!"
echo ""

# Stop nginx to free port 80
echo "⏸️  Шаг 2: Останавливаем Nginx..."
cd /root/trustcheck
docker compose stop nginx
echo "✅ Nginx остановлен"
echo ""

# Get SSL certificate
echo "🔐 Шаг 3: Получаем SSL сертификат от Let's Encrypt..."
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@trustcheck.co.il \
    -d trustcheck.co.il \
    -d www.trustcheck.co.il

if [ $? -ne 0 ]; then
    echo "❌ Ошибка получения сертификата!"
    echo "Запускаем Nginx обратно..."
    docker compose up -d nginx
    exit 1
fi

echo "✅ SSL сертификат получен!"
echo ""

# Update docker-compose.yml to mount certificates
echo "📝 Шаг 4: Обновляем docker-compose.yml..."

# Backup original
cp docker-compose.yml docker-compose.yml.backup

# Add SSL volume mounts to nginx service
cat > docker-compose.ssl.yml << 'EOF'
version: '3.8'

services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
EOF

echo "✅ Конфигурация обновлена"
echo ""

# Update nginx.conf to use SSL
echo "⚙️  Шаг 5: Активируем HTTPS в nginx.conf..."

# Check if SSL block already exists
if ! grep -q "listen 443 ssl" nginx.conf; then
    echo "Добавляем SSL конфигурацию..."
    
    # Replace HTTP-only config with HTTPS config
    sed -i 's/# Production: Redirect HTTP to HTTPS/# HTTP to HTTPS redirect/' nginx.conf
    sed -i 's/# Production: HTTPS Server/server {/' nginx.conf
fi

echo "✅ HTTPS активирован"
echo ""

# Restart nginx with SSL
echo "🚀 Шаг 6: Запускаем Nginx с SSL..."
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx

# Wait for nginx to start
sleep 3

# Check nginx status
if docker ps | grep -q trustcheck-nginx; then
    echo "✅ Nginx запущен с SSL!"
else
    echo "❌ Ошибка запуска Nginx!"
    docker logs trustcheck-nginx --tail 20
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ SSL НАСТРОЕН УСПЕШНО!                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Проверка:"
echo "  curl https://trustcheck.co.il"
echo "  curl https://www.trustcheck.co.il"
echo ""
echo "Автопродление сертификата:"
echo "  certbot renew --dry-run"
echo ""
echo "Добавить в cron:"
echo "  0 0 * * * certbot renew --quiet --deploy-hook 'docker compose -f /root/trustcheck/docker-compose.yml restart nginx'"
