# 🚀 Запуск обучения TrustCheck Hebrew Model

## Быстрый старт (скопируйте в терминал)

```powershell
cd E:\LLaMA-Factory
llamafactory-cli train examples/train_lora/trustcheck_hebrew_lora.yaml
```

## Что происходит

1. **Загрузка модели:** Qwen/Qwen2.5-1.5B-Instruct (уже кэшировано)
2. **Загрузка датасета:** TrustCheck Hebrew JSON (10 примеров)
3. **LoRA адаптер:** Обучение только adapter весов (быстро)
4. **GPU:** RTX 5060 Ti будет активна
5. **Время:** ~30-40 минут для 3 эпох

## Мониторинг обучения

### Термина 1: Обучение
```powershell
cd E:\LLaMA-Factory
llamafactory-cli train examples/train_lora/trustcheck_hebrew_lora.yaml
```

### Терминал 2: GPU мониторинг (каждые 10 сек)
```powershell
while($true) { 
    nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits
    Start-Sleep -Seconds 10
}
```

### Терминал 3: Проверка логов
```powershell
Get-Content E:\LLaMA-Factory\saves\qwen-trustcheck-hebrew\lora\sft\trainer_state.json | ConvertFrom-Json | Select-Object epoch, global_step
```

## Результаты обучения

После завершения:
```
E:\LLaMA-Factory\saves\qwen-trustcheck-hebrew\lora\sft\
├── adapter_config.json     ✅ LoRA конфиг
├── adapter_model.bin       ✅ Обученные веса (~50MB)
├── training_loss.json      ✅ График потерь
└── trainer_state.json      ✅ Метаданные
```

## Альтернатива: Если терминал зависает

Используйте веб-интерфейс:
```powershell
cd E:\LLaMA-Factory
llamafactory-cli webui
```

Затем в браузере:
- URL: http://127.0.0.1:7860
- Выбрать конфиг: `trustcheck_hebrew_lora.yaml`
- Нажать "Start Training"

## Статус

- ✅ Конфиг готов
- ✅ Датасет готов
- ✅ Модель кэширована
- ⏳ **Ожидает запуска обучения**

---

Скопируйте команду в терминал и начните обучение!
