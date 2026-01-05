# 🚀 Google Colab Training - Quick Start

**Status:** ✅ Ready for training  
**Time:** 15-20 minutes  
**Cost:** FREE (Tesla T4 GPU)

---

## 📋 Step-by-Step Instructions

### 1️⃣ Open Colab Notebook (1 minute)

**Option A: Upload File**
1. Go to https://colab.research.google.com/
2. File → Upload notebook
3. Upload: `E:\SBF\llamafactory\TrustCheck_Training_Colab.ipynb`

**Option B: Direct Link** (after uploading to Google Drive)
1. Upload notebook to Google Drive
2. Right-click → Open with → Google Colaboratory

---

### 2️⃣ Enable GPU (30 seconds)

1. Runtime → Change runtime type
2. Hardware accelerator: **T4 GPU**
3. Click **Save**

✅ Verify GPU:
```python
!nvidia-smi
```

---

### 3️⃣ Run Cells (15 minutes)

**Cell 1:** Install LLaMA Factory (3 minutes)
- Clones repository
- Installs dependencies

**Cell 2:** Upload Dataset (1 minute)
- Click "Choose Files"
- Select: `E:\SBF\llamafactory\data\trustcheck_knowledge_base.json`
- Wait for upload (1.15 MB)

**Cell 3:** Create Dataset Config (5 seconds)
- Auto-configures Alpaca format

**Cell 4:** Create Training Config (5 seconds)
- Sets up LoRA parameters

**Cell 5:** Train Model (8-12 minutes) ⏱️
- 238 training examples
- 27 validation examples
- 3 epochs, 45 steps
- **WAIT FOR COMPLETION**

**Cell 6:** Export Merged Model (2 minutes)
- Merges base + LoRA weights
- Creates deployment-ready model

**Cell 7:** Test Model (optional, 1 minute)
- Tests Russian question
- Verifies model works

**Cell 8:** Download Model (3-5 minutes)
- Zips trained model (~3GB)
- Downloads to local machine

---

## 📂 File Locations

**Local (Windows):**
- Notebook: `E:\SBF\llamafactory\TrustCheck_Training_Colab.ipynb`
- Dataset: `E:\SBF\llamafactory\data\trustcheck_knowledge_base.json`

**Colab (After Training):**
- Model: `/content/LLaMA-Factory/saves/qwen-1.5b-trustcheck-merged/`
- Logs: `/content/LLaMA-Factory/saves/qwen-1.5b-trustcheck/`

**Downloaded:**
- Package: `~/Downloads/trustcheck_model.zip` (~3GB)

---

## ⏱️ Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 1 min | Upload notebook to Colab |
| 2 | 30 sec | Enable T4 GPU |
| 3 | 3 min | Install LLaMA Factory (Cell 1) |
| 4 | 1 min | Upload dataset (Cell 2) |
| 5 | 10 sec | Create configs (Cells 3-4) |
| 6 | **8-12 min** | **Train model (Cell 5)** ⏳ |
| 7 | 2 min | Export merged model (Cell 6) |
| 8 | 1 min | Test model (Cell 7) |
| 9 | 3-5 min | Download model (Cell 8) |
| **TOTAL** | **15-20 min** | |

---

## 🎯 After Training

### Upload to Hetzner Server

```powershell
# From Windows (PowerShell)
cd ~/Downloads
scp -i C:\Users\zakon\.ssh\trustcheck_hetzner trustcheck_model.zip root@46.224.147.252:/root/
```

### Install Ollama on Server

```bash
# SSH to server
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Unzip model
cd /root
unzip trustcheck_model.zip

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
systemctl start ollama
systemctl enable ollama

# Create Modelfile
cat > Modelfile <<'EOF'
FROM /root/saves/qwen-1.5b-trustcheck-merged

TEMPLATE """<|im_start|>system
{{ .System }}<|im_end|>
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

PARAMETER temperature 0.7
PARAMETER top_p 0.8
PARAMETER stop <|im_start|>
PARAMETER stop <|im_end|>
EOF

# Create Ollama model
ollama create trustcheck -f Modelfile

# Test model
ollama run trustcheck "Что такое TrustCheck Israel?"
```

### Update API Endpoint

Edit: `/root/trustcheck/app/api/ai/route.ts`

```typescript
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
        stream: false
      })
    });

    const data = await response.json();
    
    return Response.json({
      message: data.response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ollama error:', error);
    return Response.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    );
  }
}
```

### Redeploy

```bash
cd /root/trustcheck
git add app/api/ai/route.ts
git commit -m "feat: Switch to local Ollama model"
docker compose down
docker compose up -d --build
```

### Test Production

```bash
# Check Ollama running
curl http://localhost:11434/api/generate -d '{
  "model": "trustcheck",
  "prompt": "Что такое TrustCheck?",
  "stream": false
}'

# Test website
curl http://46.224.147.252/api/ai -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Что такое TrustCheck Israel?"}'
```

---

## 🐛 Troubleshooting

### Cell 5 Fails (Training Error)
- **Check:** GPU enabled (Runtime → Change runtime type)
- **Fix:** Restart runtime, re-run cells 1-4

### Cell 8 Download Stuck
- **Alternative:** Copy from Colab
  ```python
  # In new cell
  from google.colab import drive
  drive.mount('/content/drive')
  !cp trustcheck_model.zip /content/drive/MyDrive/
  ```

### Model Too Large for Download
- **Solution:** Download LoRA adapter only (saves/qwen-1.5b-trustcheck/)
- Base model can be downloaded separately on server

### Ollama Can't Load Model
- **Check:** Model path in Modelfile
- **Fix:** Use absolute path `/root/saves/qwen-1.5b-trustcheck-merged`

---

## ✅ Success Checklist

- [ ] Colab notebook uploaded
- [ ] T4 GPU enabled
- [ ] LLaMA Factory installed (Cell 1)
- [ ] Dataset uploaded (Cell 2)
- [ ] Training completed (Cell 5) ⏱️ 8-12 min
- [ ] Model exported (Cell 6)
- [ ] Model tested (Cell 7)
- [ ] Model downloaded (Cell 8)
- [ ] Uploaded to Hetzner
- [ ] Ollama installed
- [ ] Model loaded in Ollama
- [ ] API endpoint updated
- [ ] Production tested

---

## 📊 Expected Results

**Training Metrics:**
- Initial loss: ~2.0
- Final loss: ~0.5-0.8 (lower = better)
- Training time: 8-12 minutes on T4

**Model Output:**
- Hebrew/Russian language support
- TrustCheck knowledge (docs, API, sources)
- Context-aware responses

**Production Performance:**
- Response time: <2 seconds
- Memory usage: ~4GB RAM
- Concurrent users: 10-20

---

## 🎉 You're Done!

**Local AI trained and deployed!**

Test it: http://46.224.147.252/

Chat widget should now use **your trained model** instead of Gemini.

---

**Questions?**
- Check training logs in Colab (Cell 5 output)
- Test model locally: Cell 7
- Verify Ollama: `ollama list` on server
