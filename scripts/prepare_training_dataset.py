"""
Скрипт подготовки датасета для обучения локальной модели TrustCheck AI
Собирает все файлы проекта + контент по ссылкам в единый JSON датасет
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Конфигурация
PROJECT_ROOT = Path("E:/SBF")
OUTPUT_DIR = Path("E:/LLaMA-Factory/data")
OUTPUT_FILE = OUTPUT_DIR / "trustcheck_knowledge_base.json"

# Расширения файлов для обучения
ALLOWED_EXTENSIONS = [
    '.md', '.txt', '.sql', '.ts', '.tsx', '.js', '.jsx', 
    '.py', '.yml', '.yaml', '.json', '.env.example'
]

# Исключаемые директории
EXCLUDED_DIRS = [
    'node_modules', '.git', '.next', 'dist', 'build', 
    '__pycache__', '.venv', 'venv', 'archive'
]

def extract_urls_from_text(text: str) -> List[str]:
    """Извлечь все URL из текста"""
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\])]+'
    return re.findall(url_pattern, text)

def fetch_webpage_content(url: str, timeout: int = 10) -> str:
    """Загрузить контент веб-страницы"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Удалить скрипты и стили
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Извлечь текст
        text = soup.get_text(separator='\n', strip=True)
        
        # Очистить от лишних пробелов
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return '\n'.join(lines)
    
    except Exception as e:
        print(f"  ❌ Ошибка загрузки {url}: {e}")
        return ""

def collect_project_files() -> List[Dict]:
    """Собрать все файлы проекта"""
    print("📂 Сканирование файлов проекта...")
    
    files_data = []
    file_count = 0
    
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Исключить ненужные директории
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            # Проверить расширение
            if not any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                continue
            
            file_path = Path(root) / file
            relative_path = file_path.relative_to(PROJECT_ROOT)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                files_data.append({
                    "file_path": str(relative_path),
                    "content": content,
                    "type": "project_file"
                })
                
                file_count += 1
                if file_count % 50 == 0:
                    print(f"  Собрано: {file_count} файлов...")
            
            except Exception as e:
                print(f"  ⚠️ Пропуск {relative_path}: {e}")
    
    print(f"✅ Собрано файлов: {file_count}")
    return files_data

def extract_and_fetch_urls(files_data: List[Dict]) -> List[Dict]:
    """Извлечь URL из файлов и загрузить их контент"""
    print("\n🌐 Извлечение внешних ссылок...")
    
    all_urls = set()
    
    # Собрать все уникальные URL
    for file_data in files_data:
        urls = extract_urls_from_text(file_data['content'])
        all_urls.update(urls)
    
    print(f"  Найдено уникальных URL: {len(all_urls)}")
    
    # Фильтрация - только важные домены
    important_domains = [
        'data.gov.il',
        'ica.justice.gov.il',
        'taxes.gov.il',
        'court.gov.il',
        'boi.org.il',
        'docs.python.org',
        'nextjs.org',
        'postgresql.org',
        'github.com/Zasada1980'
    ]
    
    filtered_urls = [
        url for url in all_urls 
        if any(domain in url for domain in important_domains)
    ]
    
    print(f"  Отфильтровано важных URL: {len(filtered_urls)}")
    
    # Загрузить контент
    url_data = []
    for i, url in enumerate(filtered_urls, 1):
        print(f"  [{i}/{len(filtered_urls)}] Загрузка: {url[:60]}...")
        
        content = fetch_webpage_content(url)
        if content:
            url_data.append({
                "url": url,
                "content": content,
                "type": "external_webpage"
            })
    
    print(f"✅ Загружено страниц: {len(url_data)}")
    return url_data

def create_training_dataset(files_data: List[Dict], url_data: List[Dict]) -> List[Dict]:
    """Создать датасет в формате LLaMA Factory (Alpaca)"""
    print("\n📝 Формирование датасета для обучения...")
    
    dataset = []
    
    # 1. Файлы проекта
    for file_data in files_data:
        instruction = f"Объясни содержимое файла {file_data['file_path']} в проекте TrustCheck Israel"
        
        dataset.append({
            "instruction": instruction,
            "input": "",
            "output": file_data['content'][:4000],  # Лимит токенов
            "system": "Ты - AI ассистент проекта TrustCheck Israel. Знаешь всю кодовую базу и документацию."
        })
    
    # 2. Внешние страницы
    for url_data_item in url_data:
        instruction = f"Какая информация доступна по ссылке {url_data_item['url']}?"
        
        dataset.append({
            "instruction": instruction,
            "input": "",
            "output": url_data_item['content'][:4000],
            "system": "Ты - AI ассистент проекта TrustCheck Israel с доступом к внешним источникам данных."
        })
    
    # 3. FAQ по проекту
    faq_data = [
        {
            "instruction": "Что такое TrustCheck Israel?",
            "output": "TrustCheck Israel - это B2C платформа для проверки надежности израильских бизнесов. Целевая аудитория: родители, проверяющие частные бизнесы (детские сады, репетиторы) перед оплатой. Стек: Next.js 14 + PostgreSQL + Google Gemini AI + Docker."
        },
        {
            "instruction": "Какие типы бизнесов проверяет TrustCheck?",
            "output": "TrustCheck проверяет 3 типа бизнесов: עוסק פטור (exempt business), עוסק מורשה (registered business), חברות בע״מ (Israeli LLC)."
        },
        {
            "instruction": "Откуда берутся данные для проверки?",
            "output": "Данные собираются из 3 источников: 1) PostgreSQL кэш (datasets с data.gov.il - 716K компаний), 2) Real-time scraping (ica.justice.gov.il, court.gov.il), 3) Mock data для разработки (lib/checkid.ts)."
        },
        {
            "instruction": "Как работает система оценки надежности?",
            "output": "Система использует Google Gemini 2.0 Flash для генерации Hebrew trust reports. Gemini анализирует unified data (companies_registry, legal_cases, execution_proceedings) и выдает trust score от 1.0 до 5.0 звезд."
        }
    ]
    
    for faq in faq_data:
        dataset.append({
            "instruction": faq["instruction"],
            "input": "",
            "output": faq["output"],
            "system": "Ты - AI ассистент проекта TrustCheck Israel."
        })
    
    print(f"✅ Создано записей датасета: {len(dataset)}")
    return dataset

def save_dataset(dataset: List[Dict]):
    """Сохранить датасет в файл"""
    print(f"\n💾 Сохранение датасета в {OUTPUT_FILE}...")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    
    file_size = OUTPUT_FILE.stat().st_size / 1024 / 1024
    print(f"✅ Датасет сохранен: {file_size:.2f} MB")
    print(f"📊 Записей: {len(dataset)}")

def main():
    print("=" * 60)
    print("🚀 TrustCheck AI Training Dataset Preparation")
    print("=" * 60)
    
    # 1. Собрать файлы проекта
    files_data = collect_project_files()
    
    # 2. Извлечь и загрузить внешние ссылки
    url_data = extract_and_fetch_urls(files_data)
    
    # 3. Создать датасет для обучения
    dataset = create_training_dataset(files_data, url_data)
    
    # 4. Сохранить
    save_dataset(dataset)
    
    print("\n" + "=" * 60)
    print("✅ Подготовка завершена!")
    print("=" * 60)
    print("\n📋 Следующий шаг:")
    print("1. Проверь датасет: E:/LLaMA-Factory/data/trustcheck_knowledge_base.json")
    print("2. Зарегистрируй в LLaMA Factory: data/dataset_info.json")
    print("3. Запусти обучение через LLaMA Board")

if __name__ == "__main__":
    main()
