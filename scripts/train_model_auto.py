"""
Автоматическое обучение модели TrustCheck AI через LLaMA Factory CLI
Без необходимости запуска LLaMA Board GUI
"""

import subprocess
import sys
import json
import os
from pathlib import Path

# Конфигурация обучения
LLAMAFACTORY_PATH = Path("E:/LLaMA-Factory")
CONFIG = {
    "model_name_or_path": "Qwen/Qwen2.5-1.5B-Instruct",
    "stage": "sft",
    "do_train": True,
    "finetuning_type": "lora",
    "lora_target": "all",
    
    # Dataset
    "dataset": "trustcheck_knowledge",
    "template": "qwen",
    "cutoff_len": 4096,
    "overwrite_cache": True,
    
    # Training params
    "per_device_train_batch_size": 2,
    "gradient_accumulation_steps": 4,
    "learning_rate": 5e-5,
    "num_train_epochs": 3,
    "lr_scheduler_type": "cosine",
    "warmup_ratio": 0.1,
    
    # LoRA params
    "lora_rank": 8,
    "lora_alpha": 16,
    "lora_dropout": 0.05,
    
    # Output
    "output_dir": "saves/trustcheck-ai",
    "logging_steps": 10,
    "save_steps": 100,
    "save_total_limit": 3,
    
    # Optimization
    "fp16": True,
    "ddp_timeout": 180000000,
    
    # Other
    "plot_loss": True,
    "overwrite_output_dir": True,
}

def main():
    print("=" * 60)
    print("🚀 TrustCheck AI - Automatic Training")
    print("=" * 60)
    
    # 1. Проверка датасета
    print("\n1️⃣ Проверка датасета...")
    dataset_path = LLAMAFACTORY_PATH / "data" / "trustcheck_knowledge_base.json"
    if not dataset_path.exists():
        print(f"❌ Датасет не найден: {dataset_path}")
        sys.exit(1)
    
    dataset_size = dataset_path.stat().st_size / 1024 / 1024
    print(f"✅ Датасет найден: {dataset_size:.2f} MB")
    
    # 2. Проверка dataset_info.json
    print("\n2️⃣ Проверка конфигурации датасета...")
    dataset_info_path = LLAMAFACTORY_PATH / "data" / "dataset_info.json"
    
    if dataset_info_path.exists():
        with open(dataset_info_path, 'r', encoding='utf-8') as f:
            dataset_info = json.load(f)
        
        if "trustcheck_knowledge" not in dataset_info:
            print("⚠️ Добавление trustcheck_knowledge в dataset_info.json...")
            dataset_info["trustcheck_knowledge"] = {
                "file_name": "trustcheck_knowledge_base.json",
                "formatting": "alpaca",
                "columns": {
                    "prompt": "instruction",
                    "query": "input",
                    "response": "output",
                    "system": "system"
                }
            }
            with open(dataset_info_path, 'w', encoding='utf-8') as f:
                json.dump(dataset_info, f, ensure_ascii=False, indent=2)
        
        print("✅ Датасет зарегистрирован")
    else:
        print("❌ dataset_info.json не найден!")
        sys.exit(1)
    
    # 3. Сохранить конфиг обучения
    print("\n3️⃣ Создание конфига обучения...")
    config_path = LLAMAFACTORY_PATH / "trustcheck_train_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(CONFIG, f, indent=2)
    print(f"✅ Конфиг сохранен: {config_path}")
    
    # 4. Запуск обучения
    print("\n4️⃣ Запуск обучения...")
    print("⏳ Это займет ~30-60 минут (в зависимости от GPU)")
    print("-" * 60)
    
    os.chdir(LLAMAFACTORY_PATH)
    
    cmd = [
        sys.executable,
        "-m", "llamafactory.cli.train",
        str(config_path)
    ]
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            print(line, end='')
        
        process.wait()
        
        if process.returncode == 0:
            print("\n" + "=" * 60)
            print("✅ Обучение завершено успешно!")
            print("=" * 60)
            print(f"\n📁 Модель сохранена: {CONFIG['output_dir']}")
            return True
        else:
            print("\n❌ Обучение завершилось с ошибкой")
            return False
            
    except KeyboardInterrupt:
        print("\n⚠️ Обучение прервано пользователем")
        process.terminate()
        return False
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
