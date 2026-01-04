# Ollama Installation & Setup Guide for TrustCheck Israel

## Что такое Ollama?

**Ollama** — это локальный ИИ движок для запуска моделей на собственном компьютере без облака.

## Установка Ollama в E:\SBF

### Вариант 1: Загрузить установщик (Рекомендуется)

1. Перейдите на https://ollama.ai
2. Скачайте установщик для Windows
3. Установите в папку `E:\SBF\ollama\`
4. Добавьте путь в PATH для удобства

### Вариант 2: Портативная версия (без установки)

1. Скачайте ollama.exe с https://github.com/ollama/ollama/releases
2. Скопируйте в `E:\SBF\ollama\bin\`
3. Используйте полный путь: `E:\SBF\ollama\bin\ollama.exe`

## Быстрый старт

```powershell
# Запустить Ollama сервер
E:\SBF\ollama\bin\ollama serve

# Скачать модель (в другом терминале)
E:\SBF\ollama\bin\ollama pull mistral

# Запустить модель
E:\SBF\ollama\bin\ollama run mistral
```

## Интеграция с TrustCheck

После обучения модели в LLaMA Factory:

```powershell
# 1. Конвертировать в GGUF формат
python -m llamafactory.cli export \
  --model_name_or_path saves/qwen-trustcheck-hebrew/lora/sft \
  --export_dir exports/trustcheck-hebrew-gguf \
  --export_size 4 \
  --export_device cpu \
  --export_legacy_format False

# 2. Добавить в Ollama
cp exports/trustcheck-hebrew-gguf/model.gguf E:\SBF\ollama\models\trustcheck-hebrew.gguf

# 3. Создать Modelfile
cat > Modelfile << 'EOF'
FROM ./trustcheck-hebrew.gguf
PARAMETER num_ctx 2048
PARAMETER temperature 0.7
EOF

# 4. Создать модель в Ollama
E:\SBF\ollama\bin\ollama create trustcheck-hebrew -f Modelfile

# 5. Запустить локальный ИИ!
E:\SBF\ollama\bin\ollama run trustcheck-hebrew
```

## Тестирование

```powershell
# Вопрос на иврите
ollama run trustcheck-hebrew "בדוק את ח.פ. 515044532"

# Ответ должен быть на иврите о статусе компании
```

## Для веб-приложения TrustCheck

Добавьте в `lib/gemini.ts` или новый `lib/ollama.ts`:

```typescript
// Используйте локальную модель вместо Google Gemini
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'trustcheck-hebrew',
    prompt: userQuery,
    stream: false
  })
});

const data = await response.json();
return data.response; // Иврит ответ о компании
```

## Системные требования

- GPU: RTX 5060 Ti (16GB) ✅ Есть
- RAM: 16GB+ ✅ Есть
- Диск: 20GB свободного места
- ОС: Windows 10/11

## Экономия на облаке

**Было:** Google Gemini API ($$$)  
**Теперь:** Локальная модель (бесплатно!)

## Следующие шаги

1. Скачать Ollama
2. Дождаться завершения обучения LLaMA Factory
3. Экспортировать модель в GGUF
4. Загрузить в Ollama
5. Интегрировать с веб-приложением

---

**Статус:** ⏳ Готово для Ollama, ждём завершения обучения
