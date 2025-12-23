#!/bin/bash
# TrustCheck Israel — SSL Certificate Setup (Production)
# Run on Hetzner server: ssh root@46.224.147.252

set -e

echo "🔐 TrustCheck SSL Certificate Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Install Certbot
echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Check NGINX config
echo "🔍 Validating NGINX configuration..."
nginx -t

if [ $? -ne 0 ]; then
  echo "❌ NGINX config has errors. Fix them first!"
  exit 1
fi

# Request certificate
echo "📜 Requesting SSL certificate for trustcheck.co.il..."
certbot --nginx \
  -d trustcheck.co.il \
  -d www.trustcheck.co.il \
  --non-interactive \
  --agree-tos \
  --email admin@trustcheck.co.il \
  --redirect

# Enable auto-renewal
echo "♻️ Enabling certificate auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
echo "🧪 Testing renewal process..."
certbot renew --dry-run

# Restart NGINX
echo "🔄 Restarting NGINX..."
systemctl restart nginx

echo ""
echo "✅ SSL Certificate installed successfully!"
echo ""
echo "🌍 Your site is now available at:"
echo "   https://trustcheck.co.il"
echo "   https://www.trustcheck.co.il"
echo ""
echo "📅 Certificate auto-renewal: ENABLED"
echo "   Renewal check runs twice daily"
echo ""
echo "🔍 Verify certificate:"
echo "   curl -I https://trustcheck.co.il"
