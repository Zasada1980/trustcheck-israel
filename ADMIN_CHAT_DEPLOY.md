# 🚀 Быстрое развертывание Admin AI Chat

## Шаг 1: Обновить сервер

```bash
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

cd /root/trustcheck
git pull origin main
```

## Шаг 2: Добавить переменные окружения

```bash
nano .env
```

Добавить:
```env
# Admin Panel (ВАЖНО: смените пароль!)
ADMIN_PASSWORD=secure_password_here

# Ollama уже настроен из предыдущего развертывания
OLLAMA_API_URL=https://leasing-richards-unity-robbie.trycloudflare.com
OLLAMA_MODEL=trustcheck:15b
```

## Шаг 3: Пересобрать и запустить

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Шаг 4: Проверить доступ

1. Откройте: `https://trustcheck.co.il/admin`
2. Введите пароль из `ADMIN_PASSWORD`
3. Готово! 🎉

## Тестирование функционала

### 1. Проверка чата
```bash
curl -X POST https://trustcheck.co.il/api/admin/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"מה זה TrustCheck?","history":[]}'
```

### 2. Загрузка тестового документа
1. Создайте `test.txt` с текстом:
```
TrustCheck Israel - платформа проверки бизнесов.
Официальный сайт: https://trustcheck.co.il
Документация: https://github.com/Zasada1980/trustcheck-israel
```

2. Загрузите через интерфейс
3. Система автоматически:
   - Извлечет 2 URL
   - Скрапит их контент
   - Добавит в базу знаний

### 3. Проверка RAG
Спросите AI: "Где найти документацию TrustCheck?"

AI ответит с указанием источника (test.txt) и правильной ссылкой.

## Структура файлов на сервере

```
/root/trustcheck/
├── data/
│   ├── uploads/              # Загруженные документы
│   ├── training/             # Training датасеты
│   ├── documents.json        # Метаданные
│   ├── vector_db.json        # Векторная база
│   ├── admin_chat_history.json  # История чата
│   └── training_logs.json    # Логи обучения
├── app/admin/                # Админ-панель
└── app/api/admin/            # API endpoints
```

## Безопасность

**КРИТИЧНО:**
1. Смените `ADMIN_PASSWORD` на случайный пароль
2. Никогда не коммитьте файлы из `data/`
3. Ограничьте доступ к `/admin` через Nginx (опционально)

## Мониторинг

```bash
# Логи контейнера
docker logs trustcheck-app --tail 50

# Размер векторной базы
du -sh /root/trustcheck/data/

# Количество документов
jq '.documents | length' /root/trustcheck/data/documents.json
```

## Устранение проблем

### "Unauthorized" при входе
```bash
# Проверить переменную
docker exec trustcheck-app env | grep ADMIN_PASSWORD

# Если пусто, добавить в .env и перезапустить
docker compose restart app
```

### "AI service unavailable"
```bash
# Проверить тунель (на локальной машине)
curl https://leasing-richards-unity-robbie.trycloudflare.com/api/tags

# Если не работает, перезапустить
pwsh scripts/START_TUNNEL.ps1
```

### Очистить все данные
```bash
cd /root/trustcheck/data
rm -rf uploads/* training/*
echo '{"documents":[]}' > documents.json
echo '{"documents":[]}' > vector_db.json
echo '{"messages":[]}' > admin_chat_history.json
echo '{"logs":[]}' > training_logs.json
```

---

**Статус:** ✅ Готово к развертыванию  
**Время развертывания:** ~5 минут  
**Требуется:** Ollama tunnel активен на локальной машине
