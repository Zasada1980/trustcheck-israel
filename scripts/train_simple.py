"""
Упрощенный скрипт обучения через llamafactory-cli
"""

import subprocess
import sys
import json
from pathlib import Path

LLAMAFACTORY_PATH = Path("E:/LLaMA-Factory")

# Создать YAML конфиг (LLaMA Factory использует YAML)
YAML_CONFIG = """### model
model_name_or_path: Qwen/Qwen2.5-1.5B-Instruct

### method
stage: sft
do_train: true
finetuning_type: lora
lora_target: all

### dataset
dataset: trustcheck_knowledge
template: qwen
cutoff_len: 4096
overwrite_cache: true
preprocessing_num_workers: 4

### output
output_dir: saves/trustcheck-ai
logging_steps: 10
save_steps: 500
plot_loss: true
overwrite_output_dir: true

### train
per_device_train_batch_size: 2
gradient_accumulation_steps: 4
learning_rate: 5.0e-5
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true

### lora
lora_rank: 8
lora_alpha: 16
lora_dropout: 0.05
"""

def check_dataset():
    """Проверить наличие датасета"""
    dataset_path = LLAMAFACTORY_PATH / "data" / "trustcheck_knowledge_base.json"
    if not dataset_path.exists():
        print(f"❌ Датасет не найден: {dataset_path}")
        return False
    
    dataset_size = dataset_path.stat().st_size / 1024 / 1024
    print(f"✅ Датасет: {dataset_size:.2f} MB")
    
    # Проверить dataset_info.json
    info_path = LLAMAFACTORY_PATH / "data" / "dataset_info.json"
    with open(info_path, 'r', encoding='utf-8') as f:
        info = json.load(f)
    
    if "trustcheck_knowledge" not in info:
        print("⚠️ Добавляю датасет в dataset_info.json...")
        info["trustcheck_knowledge"] = {
            "file_name": "trustcheck_knowledge_base.json",
            "formatting": "alpaca",
            "columns": {
                "prompt": "instruction",
                "query": "input",
                "response": "output",
                "system": "system"
            }
        }
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(info, f, ensure_ascii=False, indent=2)
    
    print("✅ Датасет зарегистрирован")
    return True

def train():
    """Запустить обучение"""
    print("=" * 60)
    print("🚀 TrustCheck AI Training")
    print("=" * 60)
    
    if not check_dataset():
        return False
    
    # Сохранить YAML конфиг
    config_path = LLAMAFACTORY_PATH / "trustcheck_config.yaml"
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(YAML_CONFIG)
    
    print(f"\n✅ Конфиг: {config_path}")
    print("\n🎯 Запуск обучения (30-60 минут)...")
    print("-" * 60)
    
    # Запустить через llamafactory-cli train
    cmd = [
        "llamafactory-cli", "train",
        str(config_path)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=str(LLAMAFACTORY_PATH),
            check=True,
            text=True,
            capture_output=False
        )
        
        print("\n✅ Обучение завершено!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Ошибка обучения: {e}")
        return False
    except FileNotFoundError:
        print("\n❌ llamafactory-cli не найден!")
        print("Попробуй: pip install llamafactory-cli")
        return False

if __name__ == "__main__":
    success = train()
    sys.exit(0 if success else 1)
