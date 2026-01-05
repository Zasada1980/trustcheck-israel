# 🚀 TrustCheck Local AI - Быстрый Старт

## Полный автоматический цикл (рекомендуется)

```powershell
# Проверка готовности системы
pwsh E:\SBF\scripts\MASTER_DEPLOY_PIPELINE.ps1 -TestMode

# Запуск всех этапов (обучение → экспорт → развертывание)
pwsh E:\SBF\scripts\MASTER_DEPLOY_PIPELINE.ps1
```

**Время выполнения:** ~2-3 часа

---

## Поэтапный запуск

### 1️⃣ Обучение модели (60-120 минут)
```powershell
cd E:\LLaMA-Factory
pwsh train_with_timeout.ps1 -TimeoutMinutes 120
```

**Выход:**
- ✅ Обученная модель: `E:\LLaMA-Factory\saves\trustcheck-ai/`
- 📊 Логи: `training_YYYYMMDD_HHmmss.log`

### 2️⃣ Экспорт в GGUF (10-30 минут)
```powershell
cd E:\LLaMA-Factory
pwsh export_with_timeout.ps1 -TimeoutMinutes 30
```

**Выход:**
- ✅ GGUF файл: `E:\LLaMA-Factory\exports\trustcheck-ai/*.gguf`
- 💾 Размер: ~1-3 GB

### 3️⃣ Развертывание на production (5-10 минут)
```powershell
cd E:\SBF\scripts
pwsh deploy_ollama_full.ps1
```

**Выход:**
- ✅ Ollama установлен на сервере
- ✅ Модель `trustcheck-ai` зарегистрирована
- ✅ Nginx настроен

### 4️⃣ Обновление приложения (2-5 минут)
```powershell
cd E:\SBF
git add .
git commit -m "feat: Local AI integration"
pwsh scripts\deploy_full.ps1
```

**Выход:**
- ✅ API переключен на Ollama
- ✅ Приложение развернуто на https://trustcheck.co.il

---

## Проверка работы

### Локальная проверка
```powershell
# Запуск Ollama локально
ollama serve

# Тест модели
ollama run trustcheck-ai "מה זה TrustCheck?"
```

### Production проверка
```bash
# SSH на сервер
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Проверка статуса Ollama
systemctl status ollama

# Проверка модели
ollama list
ollama run trustcheck-ai "מה זה TrustCheck?"
```

### API проверка
```powershell
# Health check
curl https://trustcheck.co.il/api/ai

# Test chat
curl -X POST https://trustcheck.co.il/api/ai `
  -H "Content-Type: application/json" `
  -d '{"message":"מה זה TrustCheck?"}'
```

---

## Таймауты и параметры

### MASTER_DEPLOY_PIPELINE.ps1
```powershell
-TrainingTimeout 120      # Таймаут обучения (минуты)
-ExportTimeout 30         # Таймаут экспорта (минуты)
-SkipTraining            # Пропустить обучение
-SkipExport              # Пропустить экспорт
-SkipDeploy              # Пропустить развертывание
-TestMode                # Только проверка готовности
```

### train_with_timeout.ps1
```powershell
-TimeoutMinutes 120      # Максимальное время обучения
-Force                   # Убить существующие процессы
```

### export_with_timeout.ps1
```powershell
-TimeoutMinutes 30       # Максимальное время экспорта
-ModelPath "saves/..."   # Путь к обученной модели
-ExportPath "exports/..." # Путь экспорта
-ExportSize 4            # Размер квантизации (4, 8, 16)
```

### deploy_ollama_full.ps1
```powershell
-SkipModelUpload         # Не загружать модель (уже на сервере)
-SkipOllamaInstall       # Не устанавливать Ollama
-TestOnly                # Только проверка SSH
```

---

## Устранение проблем

### "Обучение завис"
```powershell
# Проверить процессы
Get-Process python | Where-Object {$_.CommandLine -like "*llamafactory*"}

# Убить зависшие процессы
pwsh train_with_timeout.ps1 -Force
```

### "Модель не найдена после обучения"
```powershell
# Проверить наличие
Test-Path "E:\LLaMA-Factory\saves\trustcheck-ai\adapter_config.json"

# Список файлов
ls E:\LLaMA-Factory\saves\trustcheck-ai\
```

### "Экспорт не создал GGUF"
```powershell
# Проверить логи
cat E:\LLaMA-Factory\export_*.log.stderr

# Повторить экспорт с CPU
pwsh export_with_timeout.ps1 -TimeoutMinutes 60
```

### "Ollama не отвечает на сервере"
```bash
ssh root@46.224.147.252

# Перезапуск
systemctl restart ollama

# Логи
journalctl -u ollama -f
```

### "API возвращает 503"
```bash
# Проверить Nginx
nginx -t
systemctl status nginx

# Проверить Ollama endpoint
curl http://localhost:11434/api/tags
```

---

## Важные файлы

**Конфигурация:**
- `E:\LLaMA-Factory\trustcheck_train.yaml` - Параметры обучения
- `E:\LLaMA-Factory\data\dataset_info.json` - Регистрация датасета
- `E:\SBF\.env` - Environment variables (OLLAMA_API_URL)

**Датасет:**
- `E:\LLaMA-Factory\data\trustcheck_knowledge_base.json` - 265 записей

**Код:**
- `E:\SBF\app\api\ai\route.ts` - API endpoint (Ollama)
- `E:\SBF\components\AIChat.tsx` - UI компонент чата

**Скрипты:**
- `E:\LLaMA-Factory\train_with_timeout.ps1` - Обучение с таймаутом
- `E:\LLaMA-Factory\export_with_timeout.ps1` - Экспорт с таймаутом
- `E:\SBF\scripts\deploy_ollama_full.ps1` - Развертывание Ollama
- `E:\SBF\scripts\MASTER_DEPLOY_PIPELINE.ps1` - Полный цикл

**Логи:**
- `E:\LLaMA-Factory\training_*.log` - Логи обучения
- `E:\LLaMA-Factory\export_*.log` - Логи экспорта
- SSH: `journalctl -u ollama` - Логи Ollama на сервере

---

## Контакты и документация

**Репозиторий:** `Zasada1980/trustcheck-israel`  
**Сервер:** `46.224.147.252` (Hetzner CX23)  
**Домен:** `https://trustcheck.co.il`

**Документация:**
- `AI_TRAINING_DEPLOYMENT_GUIDE.md` - Полная документация (355 строк)
- `PHASE_1_SPECIFICATION.md` - Спецификация проекта (1240 строк)
- `.github/copilot-instructions.md` - Инструкции для Copilot

**Датасет:**
- 226 файлов проекта (код + документация)
- 35 внешних источников (data.gov.il, court.gov.il, ica.justice.gov.il)
- Формат: Alpaca (instruction/input/output/system)

**Модель:**
- Base: Qwen/Qwen2.5-1.5B-Instruct (1.5B параметров)
- Fine-tuning: LoRA (rank=8, alpha=16)
- Precision: FP16
- Training: 3 epochs, batch_size=2, lr=5e-5
