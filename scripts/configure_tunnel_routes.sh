#!/bin/bash
# Configure Cloudflare Tunnel Routes for TrustCheck Israel
# Tunnel ID: e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4

TUNNEL_ID="e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4"
DOMAIN="trustcheck.co.il"

echo "🔧 Настройка маршрутов Cloudflare Tunnel..."
echo ""

# Create config file
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

echo "✅ Конфигурация создана: /root/.cloudflared/config.yml"
echo ""
cat /root/.cloudflared/config.yml
echo ""

# Restart tunnel to apply config
echo "🔄 Перезапуск tunnel для применения конфигурации..."
systemctl restart cloudflared
sleep 3

# Check status
echo ""
echo "📊 Статус tunnel:"
systemctl status cloudflared --no-pager -l

echo ""
echo "✅ Готово! Tunnel настроен для:"
echo "   • https://$DOMAIN → http://localhost:3000"
echo "   • https://www.$DOMAIN → http://localhost:3000"
