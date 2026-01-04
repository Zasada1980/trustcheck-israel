# TrustCheck Ollama Integration Script
# Скрипт для скачивания и запуска Ollama локально

Write-Host "🚀 TrustCheck Ollama Integration" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Проверить папку Ollama
$ollama_dir = "E:\SBF\ollama"
$bin_dir = "$ollama_dir\bin"

if (-not (Test-Path $bin_dir)) {
    Write-Host "❌ Папка Ollama не найдена: $bin_dir" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Скачайте Ollama с https://ollama.ai" -ForegroundColor Yellow
    Write-Host "📦 Или скачайте ollama.exe отсюда:" -ForegroundColor Yellow
    Write-Host "   https://github.com/ollama/ollama/releases" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Скопируйте ollama.exe в: $bin_dir" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Папка Ollama найдена" -ForegroundColor Green
Write-Host ""

# Запустить Ollama сервер
Write-Host "⏳ Запуск Ollama сервера на localhost:11434..." -ForegroundColor Yellow
Write-Host ""

& "$bin_dir\ollama.exe" serve

Write-Host ""
Write-Host "✅ Ollama запущена!" -ForegroundColor Green
Write-Host "🌐 Web UI: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📡 API: http://localhost:11434" -ForegroundColor Cyan
Write-Host ""
