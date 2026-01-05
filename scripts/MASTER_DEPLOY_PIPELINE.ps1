# MASTER PIPELINE: Training → Export → Deploy
# Полный автоматизированный цикл от обучения до production

param(
    [int]$TrainingTimeout = 120,
    [int]$ExportTimeout = 30,
    [switch]$SkipTraining,
    [switch]$SkipExport,
    [switch]$SkipDeploy,
    [switch]$TestMode
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║  🚀 TRUSTCHECK AI - MASTER DEPLOYMENT PIPELINE 🚀         ║
║  Обучение → Экспорт → Развертывание                       ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

if ($TestMode) {
    Write-Host "🧪 Проверка готовности системы..." -ForegroundColor Yellow
    Write-Host ""
    
    # Датасет
    if (Test-Path "E:\LLaMA-Factory\data\trustcheck_knowledge_base.json") {
        Write-Host "✅ Датасет (265 записей)" -ForegroundColor Green
    } else {
        Write-Host "❌ Датасет не найден" -ForegroundColor Red
        exit 1
    }
    
    # Конфиг
    if (Test-Path "E:\LLaMA-Factory\trustcheck_train.yaml") {
        Write-Host "✅ Конфигурация обучения" -ForegroundColor Green
    } else {
        Write-Host "❌ Конфиг не найден" -ForegroundColor Red
        exit 1
    }
    
    # GPU
    nvidia-smi --query-gpu=name --format=csv,noheader 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GPU доступен" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GPU не найден (обучение на CPU)" -ForegroundColor Yellow
    }
    
    # SSH
    ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252 "echo OK" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Production сервер доступен" -ForegroundColor Green
    } else {
        Write-Host "❌ Сервер недоступен" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Система готова! Запусти: pwsh $PSCommandPath" -ForegroundColor Green
    exit 0
}

# ЭТАП 1: ОБУЧЕНИЕ
if (-not $SkipTraining) {
    Write-Host ""
    Write-Host "═══ ЭТАП 1/3: ОБУЧЕНИЕ ═══" -ForegroundColor Blue
    Write-Host ""
    
    pwsh "E:\LLaMA-Factory\train_with_timeout.ps1" -TimeoutMinutes $TrainingTimeout
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Обучение не удалось" -ForegroundColor Red
        exit 1
    }
}

# ЭТАП 2: ЭКСПОРТ
if (-not $SkipExport) {
    Write-Host ""
    Write-Host "═══ ЭТАП 2/3: ЭКСПОРТ ═══" -ForegroundColor Blue
    Write-Host ""
    
    pwsh "E:\LLaMA-Factory\export_with_timeout.ps1" -TimeoutMinutes $ExportTimeout
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Экспорт не удался" -ForegroundColor Red
        exit 1
    }
}

# ЭТАП 3: РАЗВЕРТЫВАНИЕ
if (-not $SkipDeploy) {
    Write-Host ""
    Write-Host "═══ ЭТАП 3/3: РАЗВЕРТЫВАНИЕ ═══" -ForegroundColor Blue
    Write-Host ""
    
    pwsh "E:\SBF\scripts\deploy_ollama_full.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Развертывание не удалось" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🚀 Финальное развертывание приложения..." -ForegroundColor Cyan
    
    Set-Location "E:\SBF"
    git add .
    git commit -m "feat: Local AI integration complete"
    
    pwsh "E:\SBF\scripts\deploy_full.ps1"
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          🎉 ВСЕ ЭТАПЫ ЗАВЕРШЕНЫ! 🎉                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Проверь: https://trustcheck.co.il" -ForegroundColor Cyan
Write-Host "💬 Тест чата: Нажми кнопку AI (левый нижний угол)" -ForegroundColor Cyan
