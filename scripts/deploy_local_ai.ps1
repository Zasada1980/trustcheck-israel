# 🚀 TrustCheck Local AI - Automated Deployment
# Deploys trained model to Hetzner server with Ollama

Write-Host "`n🎉 TrustCheck AI Deployment Script" -ForegroundColor Green
Write-Host "="*70 -ForegroundColor Gray

# Configuration
$SERVER = "46.224.147.252"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"
$LOCAL_MODEL = "E:\SBF\llamafactory\saves\trustcheck_qwen_lora"
$SERVER_PATH = "/root/trustcheck"

# Step 1: Export merged model
Write-Host "`n[1/7] Exporting merged model..." -ForegroundColor Cyan
$exportPath = "E:\SBF\llamafactory\saves\trustcheck_merged"

if (Test-Path $exportPath) {
    Write-Host "⚠️  Merged model already exists. Skipping export." -ForegroundColor Yellow
} else {
    Write-Host "⏳ Merging base model + LoRA adapter..."
    
    cd E:\SBF\llamafactory
    
    $exportCmd = @"
llamafactory-cli export ``
    --model_name_or_path Qwen/Qwen2.5-1.5B-Instruct ``
    --adapter_name_or_path $LOCAL_MODEL ``
    --template qwen ``
    --export_dir $exportPath ``
    --export_size 2 ``
    --export_legacy_format false
"@
    
    Invoke-Expression $exportCmd
    
    if (Test-Path $exportPath) {
        Write-Host "✅ Model exported to: $exportPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Export failed!" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Create ZIP archive
Write-Host "`n[2/7] Creating ZIP archive..." -ForegroundColor Cyan
$zipPath = "E:\SBF\llamafactory\saves\trustcheck_model.zip"

if (Test-Path $zipPath) {
    Write-Host "⚠️  ZIP already exists. Deleting old version..." -ForegroundColor Yellow
    Remove-Item $zipPath -Force
}

Write-Host "⏳ Compressing model (this may take 2-3 minutes)..."
Compress-Archive -Path $exportPath -DestinationPath $zipPath -CompressionLevel Optimal

if (Test-Path $zipPath) {
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "✅ ZIP created: $zipPath ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ ZIP creation failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Upload to Hetzner
Write-Host "`n[3/7] Uploading to Hetzner..." -ForegroundColor Cyan
Write-Host "⏳ Uploading $([math]::Round($zipSize, 2)) MB to $SERVER..."

$scpCmd = "scp -i $SSH_KEY $zipPath root@${SERVER}:/root/"
Invoke-Expression $scpCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Upload complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Install Ollama on server
Write-Host "`n[4/7] Installing Ollama on server..." -ForegroundColor Cyan

$installScript = @'
#!/bin/bash
set -e

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama already installed"
    ollama --version
else
    echo "⏳ Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    systemctl start ollama
    systemctl enable ollama
    echo "✅ Ollama installed"
fi

# Unzip model
echo "⏳ Extracting model..."
cd /root
unzip -o trustcheck_model.zip

echo "✅ Model extracted to /root/trustcheck_merged"
'@

$installScript | ssh -i $SSH_KEY root@$SERVER 'bash -s'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama installed" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Create Ollama model
Write-Host "`n[5/7] Creating Ollama model..." -ForegroundColor Cyan

$modelfileScript = @'
#!/bin/bash
set -e

cat > /root/Modelfile <<'EOF'
FROM /root/trustcheck_merged

TEMPLATE """<|im_start|>system
{{ .System }}<|im_end|>
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

SYSTEM """You are TrustCheck AI, an assistant specializing in Israeli business verification. You help users check company reliability using data from government sources like data.gov.il, ica.justice.gov.il, and court.gov.il."""

PARAMETER temperature 0.7
PARAMETER top_p 0.8
PARAMETER top_k 20
PARAMETER stop <|im_start|>
PARAMETER stop <|im_end|>
EOF

echo "⏳ Creating Ollama model 'trustcheck'..."
ollama create trustcheck -f /root/Modelfile

echo "✅ Model created"
ollama list
'@

$modelfileScript | ssh -i $SSH_KEY root@$SERVER 'bash -s'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Ollama model created" -ForegroundColor Green
} else {
    Write-Host "❌ Model creation failed!" -ForegroundColor Red
    exit 1
}

# Step 6: Update API endpoint
Write-Host "`n[6/7] Updating API endpoint..." -ForegroundColor Cyan

$apiUpdate = @'
#!/bin/bash
set -e

cd /root/trustcheck

# Backup original
cp app/api/ai/route.ts app/api/ai/route.ts.backup

# Create new route
cat > app/api/ai/route.ts <<'EOF'
export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Call local Ollama model
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'trustcheck',
        prompt: message,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.8,
          top_k: 20
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return Response.json({
      message: data.response,
      model: 'trustcheck-qwen-1.5b',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI API error:', error);
    return Response.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ API endpoint updated"
'@

$apiUpdate | ssh -i $SSH_KEY root@$SERVER 'bash -s'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API updated" -ForegroundColor Green
} else {
    Write-Host "❌ API update failed!" -ForegroundColor Red
    exit 1
}

# Step 7: Rebuild Docker
Write-Host "`n[7/7] Rebuilding Docker containers..." -ForegroundColor Cyan

$dockerRebuild = @'
#!/bin/bash
set -e

cd /root/trustcheck

echo "⏳ Rebuilding containers..."
docker compose down
docker compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Containers rebuilt"
docker compose ps
'@

$dockerRebuild | ssh -i $SSH_KEY root@$SERVER 'bash -s'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker rebuilt" -ForegroundColor Green
} else {
    Write-Host "❌ Docker rebuild failed!" -ForegroundColor Red
    exit 1
}

# Step 8: Test deployment
Write-Host "`n[8/7] Testing deployment..." -ForegroundColor Cyan

$testScript = @'
#!/bin/bash

echo "🧪 Testing Ollama model..."
ollama run trustcheck "Что такое TrustCheck?" --verbose=false | head -n 5

echo -e "\n🧪 Testing API endpoint..."
curl -s http://localhost:3000/api/ai -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}' | jq -r '.message' | head -n 3

echo -e "\n✅ Deployment test complete"
'@

Write-Host "`n📊 Test Results:" -ForegroundColor Cyan
$testScript | ssh -i $SSH_KEY root@$SERVER 'bash -s'

# Summary
Write-Host "`n" + "="*70 -ForegroundColor Gray
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "="*70 -ForegroundColor Gray

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Model trained: Qwen2.5-1.5B + LoRA" -ForegroundColor White
Write-Host "  ✅ Uploaded to: $SERVER" -ForegroundColor White
Write-Host "  ✅ Ollama installed: /root/trustcheck_merged" -ForegroundColor White
Write-Host "  ✅ API updated: /root/trustcheck/app/api/ai/route.ts" -ForegroundColor White
Write-Host "  ✅ Docker rebuilt: Running" -ForegroundColor White

Write-Host "`n🌐 Production URLs:" -ForegroundColor Cyan
Write-Host "  Website: http://$SERVER/" -ForegroundColor White
Write-Host "  API: http://$SERVER/api/ai" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test AI chat on website" -ForegroundColor White
Write-Host "  2. Monitor performance (docker compose logs -f app)" -ForegroundColor White
Write-Host "  3. Collect user feedback" -ForegroundColor White
Write-Host "  4. Retrain model v2 with more data" -ForegroundColor White

Write-Host "`n✅ All done! Local AI is now running on production." -ForegroundColor Green
Write-Host ""
