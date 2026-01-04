#!/bin/bash
# Cloudflare Tunnel Setup Script for TrustCheck Israel
# Generated: 25.12.2025

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Cloudflare Tunnel Setup for trustcheck.co.il            ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Zone ID and Account ID
ZONE_ID="736fb1cca4558c8a7f36adf14e2b153b"
ACCOUNT_ID="20f5ee00fbbdf9c8b779161ea33c21cb"

echo ""
echo "📋 Шаг 1: Создание tunnel в Cloudflare Dashboard"
echo "───────────────────────────────────────────────────────────"
echo "1. Открой: https://one.dash.cloudflare.com/$ACCOUNT_ID/networks/tunnels"
echo "2. Нажми: 'Create a tunnel'"
echo "3. Выбери: 'Cloudflared'"
echo "4. Название: trustcheck-tunnel"
echo "5. Нажми: 'Save tunnel'"
echo ""
echo "6. Cloudflare покажет команду установки, например:"
echo "   cloudflared service install <TOKEN>"
echo ""
echo "7. СКОПИРУЙ токен из команды (длинная строка после 'eyJ...')"
echo ""
read -p "Нажми Enter, когда скопируешь токен..."

echo ""
echo "📦 Шаг 2: Установка cloudflared"
echo "───────────────────────────────────────────────────────────"

if ! command -v cloudflared &> /dev/null; then
    echo "Устанавливаем cloudflared..."
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared.deb
    rm cloudflared.deb
    echo "✅ cloudflared установлен: $(cloudflared --version)"
else
    echo "✅ cloudflared уже установлен: $(cloudflared --version)"
fi

echo ""
echo "🔑 Шаг 3: Вставь токен из Cloudflare"
echo "───────────────────────────────────────────────────────────"
read -p "Вставь токен: " TUNNEL_TOKEN

echo ""
echo "⚙️  Шаг 4: Создание конфигурации"
echo "───────────────────────────────────────────────────────────"

mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml <<EOF
tunnel: trustcheck-tunnel
credentials-file: /root/.cloudflared/tunnel-credentials.json

ingress:
  - hostname: trustcheck.co.il
    service: http://localhost:3000
  - hostname: www.trustcheck.co.il
    service: http://localhost:3000
  - service: http_status:404
EOF

echo "✅ Конфигурация создана: /etc/cloudflared/config.yml"

echo ""
echo "🚀 Шаг 5: Установка и запуск сервиса"
echo "───────────────────────────────────────────────────────────"

cloudflared service install $TUNNEL_TOKEN

systemctl enable cloudflared
systemctl start cloudflared

echo "✅ Tunnel сервис запущен"

echo ""
echo "📊 Шаг 6: Проверка статуса"
echo "───────────────────────────────────────────────────────────"

sleep 3
systemctl status cloudflared --no-pager

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Tunnel настроен!                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Следующий шаг:"
echo "1. Вернись в Cloudflare Dashboard"
echo "2. Вкладка 'Public Hostname'"
echo "3. Добавь маршруты:"
echo "   - trustcheck.co.il → http://localhost:3000"
echo "   - www.trustcheck.co.il → http://localhost:3000"
echo ""
echo "Затем проверь: https://trustcheck.co.il"
