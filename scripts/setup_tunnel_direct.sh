#!/bin/bash
# Cloudflare Tunnel Quick Setup for TrustCheck Israel
# Auto-configuration without manual Dashboard steps

set -e

ACCOUNT_ID="20f5ee00fbbdf9c8b779161ea33c21cb"
ZONE_ID="736fb1cca4558c8a7f36adf14e2b153b"
DOMAIN="trustcheck.co.il"
TUNNEL_NAME="trustcheck-tunnel"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Cloudflare Tunnel Auto-Setup                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install cloudflared (already done)
echo "✅ cloudflared уже установлен: $(cloudflared --version)"
echo ""

# Step 2: Create tunnel using local credentials
echo "📝 Создаём tunnel с локальной авторизацией..."

# Generate credentials directory
mkdir -p /root/.cloudflared

# Create tunnel
TUNNEL_OUTPUT=$(cloudflared tunnel create $TUNNEL_NAME 2>&1 || true)

if echo "$TUNNEL_OUTPUT" | grep -q "Tunnel credentials"; then
    # Extract tunnel ID from output
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Tunnel credentials written to .*/\K[a-f0-9-]+(?=\.json)')
    
    echo "✅ Tunnel создан: $TUNNEL_ID"
    echo "   Credentials: /root/.cloudflared/$TUNNEL_ID.json"
    
    # Step 3: Create config file
    echo ""
    echo "⚙️  Создаём конфигурацию..."
    
    cat > /root/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:3000
  - hostname: www.$DOMAIN
    service: http://localhost:3000
  - service: http_status:404
EOF
    
    echo "✅ Конфигурация создана"
    
    # Step 4: Route DNS
    echo ""
    echo "🌐 Настраиваем DNS routing..."
    
    cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN || echo "⚠️  DNS routing требует API token"
    cloudflared tunnel route dns $TUNNEL_NAME www.$DOMAIN || echo "⚠️  DNS routing требует API token"
    
    # Step 5: Install and start service
    echo ""
    echo "🚀 Запускаем tunnel как сервис..."
    
    cloudflared service install
    systemctl enable cloudflared
    systemctl start cloudflared
    
    echo ""
    echo "📊 Статус tunnel:"
    systemctl status cloudflared --no-pager || true
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✅ Tunnel настроен локально!                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⚠️  ВАЖНО: Нужно завершить в Cloudflare Dashboard:"
    echo ""
    echo "1. Открой: https://one.dash.cloudflare.com/$ACCOUNT_ID/networks/tunnels"
    echo "2. Найди tunnel: $TUNNEL_NAME"
    echo "3. Вкладка 'Public Hostname' → Add hostname:"
    echo "   - $DOMAIN → http://localhost:3000"
    echo "   - www.$DOMAIN → http://localhost:3000"
    echo ""
    echo "4. DNS записи создадутся автоматически"
    echo ""
    echo "Tunnel ID: $TUNNEL_ID"
    
else
    echo "❌ Не удалось создать tunnel локально"
    echo ""
    echo "Причина: Требуется авторизация через Dashboard"
    echo ""
    echo "📋 АЛЬТЕРНАТИВА: Создай tunnel через Dashboard:"
    echo ""
    echo "1. Открой: https://one.dash.cloudflare.com/$ACCOUNT_ID/networks/tunnels"
    echo "2. Create a tunnel → Cloudflared"
    echo "3. Название: $TUNNEL_NAME"
    echo "4. Cloudflare покажет команду установки с токеном"
    echo "5. Запусти эту команду на сервере"
    echo ""
fi
