# Автоматический мониторинг обучения TrustCheck AI
# Показывает прогресс, GPU нагрузку и уведомляет о завершении

$LOG_FILE = "E:\LLaMA-Factory\training.log"
$CHECK_INTERVAL = 10 # секунд

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎓 TrustCheck AI Training Monitor" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

while ($true) {
    Clear-Host
    
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "🎓 TrustCheck AI Training Monitor" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    
    # Время обучения
    $elapsed = (Get-Date) - $startTime
    Write-Host "⏱️  Время обучения: " -NoNewline
    Write-Host "$($elapsed.Hours)ч $($elapsed.Minutes)м $($elapsed.Seconds)с" -ForegroundColor Yellow
    Write-Host ""
    
    # Проверка процессов
    $pythonProc = Get-Process python* -ErrorAction SilentlyContinue
    if ($pythonProc) {
        Write-Host "✅ Python процесс активен (PID: $($pythonProc.Id))" -ForegroundColor Green
        Write-Host "   CPU: $([math]::Round($pythonProc.CPU, 2))s | RAM: $([math]::Round($pythonProc.WorkingSet/1MB, 2)) MB | Threads: $($pythonProc.Threads.Count)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Python процесс не найден - обучение завершено!" -ForegroundColor Red
        break
    }
    Write-Host ""
    
    # GPU статус
    try {
        $gpuInfo = nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits
        $gpu = $gpuInfo -split ','
        $gpuUtil = [int]$gpu[0].Trim()
        $gpuMemUsed = [int]$gpu[1].Trim()
        $gpuMemTotal = [int]$gpu[2].Trim()
        $gpuTemp = [int]$gpu[3].Trim()
        
        Write-Host "🎮 GPU Status:" -ForegroundColor Cyan
        Write-Host "   Utilization: " -NoNewline
        if ($gpuUtil -gt 80) {
            Write-Host "$gpuUtil%" -ForegroundColor Green -NoNewline
        } elseif ($gpuUtil -gt 50) {
            Write-Host "$gpuUtil%" -ForegroundColor Yellow -NoNewline
        } else {
            Write-Host "$gpuUtil%" -ForegroundColor Gray -NoNewline
        }
        Write-Host " | Memory: $gpuMemUsed/$gpuMemTotal MB ($([math]::Round($gpuMemUsed/$gpuMemTotal*100, 1))%)" -ForegroundColor Gray
        Write-Host "   Temperature: $gpuTemp°C" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  GPU мониторинг недоступен" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Последние логи
    if (Test-Path $LOG_FILE) {
        Write-Host "📋 Последние логи:" -ForegroundColor Cyan
        $lastLines = Get-Content $LOG_FILE -Tail 15 -ErrorAction SilentlyContinue
        
        foreach ($line in $lastLines) {
            if ($line -match "epoch|step|loss|train") {
                Write-Host "   $line" -ForegroundColor White
            } elseif ($line -match "error|Error|ERROR") {
                Write-Host "   $line" -ForegroundColor Red
            } elseif ($line -match "warning|Warning|WARN") {
                Write-Host "   $line" -ForegroundColor Yellow
            } else {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
        
        # Парсинг прогресса
        $progressLine = $lastLines | Where-Object { $_ -match "(\d+)%\|" } | Select-Object -Last 1
        if ($progressLine) {
            if ($progressLine -match "(\d+)%") {
                $progress = $matches[1]
                Write-Host ""
                Write-Host "📊 Прогресс: $progress%" -ForegroundColor $(if ([int]$progress -gt 50) { "Green" } else { "Yellow" })
            }
        }
    } else {
        Write-Host "⚠️  Лог файл не найден: $LOG_FILE" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "-" * 60 -ForegroundColor DarkGray
    Write-Host "Обновление через $CHECK_INTERVAL секунд... (Ctrl+C для выхода)" -ForegroundColor DarkGray
    
    Start-Sleep -Seconds $CHECK_INTERVAL
}

# Обучение завершено
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ ОБУЧЕНИЕ ЗАВЕРШЕНО!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "⏱️  Общее время: $($elapsed.Hours)ч $($elapsed.Minutes)м" -ForegroundColor Yellow
Write-Host ""

# Проверка результата
$modelPath = "E:\LLaMA-Factory\saves\trustcheck-ai"
if (Test-Path $modelPath) {
    Write-Host "✅ Модель сохранена: $modelPath" -ForegroundColor Green
    
    $modelFiles = Get-ChildItem $modelPath -Recurse | Measure-Object -Property Length -Sum
    Write-Host "   Файлов: $($modelFiles.Count)" -ForegroundColor Gray
    Write-Host "   Размер: $([math]::Round($modelFiles.Sum/1MB, 2)) MB" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
    Write-Host "   1. Экспортировать модель: pwsh E:\SBF\scripts\export_model_with_timeout.ps1" -ForegroundColor White
    Write-Host "   2. Развернуть на сервере: pwsh E:\SBF\scripts\deploy_ollama_full.ps1" -ForegroundColor White
    Write-Host "   3. Протестировать чат: https://trustcheck.co.il" -ForegroundColor White
} else {
    Write-Host "⚠️  Модель не найдена в $modelPath" -ForegroundColor Yellow
    Write-Host "   Проверь логи: $LOG_FILE" -ForegroundColor Gray
}

# Звуковой сигнал
[console]::beep(1000, 500)
[console]::beep(1200, 500)
[console]::beep(1400, 500)

Write-Host ""
Write-Host "Нажми любую клавишу для выхода..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
