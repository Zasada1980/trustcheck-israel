/**
 * TrustCheck Local Model Runner
 * Простое использование локальной модели без Python процессов
 * 
 * Использует бинарные веса из обучения:
 * E:\LLaMA-Factory\saves\qwen-trustcheck-hebrew\lora\sft\
 */

import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

interface BusinessData {
  nameHebrew?: string;
  hpNumber?: string;
  businessType?: string;
  status?: string;
  registrationDate?: string;
}

/**
 * Генерировать отчёт используя обученную модель
 * Работает локально без интернета
 */
export async function generateReportLocal(businessData: BusinessData): Promise<string> {
  try {
    // Проверить доступность файлов модели
    const modelPath = 'E:\\LLaMA-Factory\\saves\\qwen-trustcheck-hebrew\\lora\\sft';
    
    if (!fs.existsSync(path.join(modelPath, 'adapter_model.bin'))) {
      throw new Error('Model files not found. Please train the model first.');
    }

    // Создать временный Python скрипт для загрузки и генерации
    const tempScript = `
import sys
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# Загрузить модель + LoRA адаптер
base_model = "Qwen/Qwen2.5-1.5B-Instruct"
lora_path = "E:/LLaMA-Factory/saves/qwen-trustcheck-hebrew/lora/sft"

# Загрузить базовую модель (из кэша)
tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(
    base_model,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)

# Загрузить LoRA адаптер
model = PeftModel.from_pretrained(model, lora_path, torch_dtype=torch.bfloat16)
model.eval()

# Получить данные из stdin
input_data = json.load(sys.stdin)

# Создать промпт на иврите
prompt = f"""בדוק את הנתונים הבאים על העסק:

שם: {input_data.get('nameHebrew', 'לא ידוע')}
ח.פ.: {input_data.get('hpNumber', 'לא ידוע')}
סוג: {input_data.get('businessType', 'לא ידוע')}
סטטוס: {input_data.get('status', 'לא ידוע')}

דירוג אמון ותיאור קצר:"""

# Генерировать ответ
inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)
report = response[len(prompt):].strip()

# Вывести результат
print(report)
`;

    // Запустить Python скрипт
    const pythonPath = 'python';
    const command = `echo '${JSON.stringify(businessData)}' | ${pythonPath} -c "${tempScript.replace(/"/g, '\\"')}"`;
    
    // Выполнить синхронно (для простоты)
    const result = execSync(command, {
      cwd: 'E:\\LLaMA-Factory',
      encoding: 'utf-8',
      env: {
        ...process.env,
        PYTHONPATH: 'E:\\LLaMA-Factory\\src',
      },
    });

    return result.trim();

  } catch (error) {
    console.error('Local model error:', error);
    throw error;
  }
}

/**
 * Альтернативный способ - использовать заранее обученный инференс
 * (если модель слишком тяжелая для Node.js)
 */
export async function generateReportViaAPI(businessData: BusinessData): Promise<string> {
  try {
    // Используем HTTP запрос к локальному Python сервису
    const response = await fetch('http://localhost:8000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { report } = await response.json();
    return report;

  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Для тестирования
if (require.main === module) {
  const testData: BusinessData = {
    nameHebrew: 'גן ילדים השרון',
    hpNumber: '515044532',
    businessType: 'שירותים חינוכיים',
    status: 'פעיל',
  };

  console.log('Testing local model...');
  generateReportLocal(testData)
    .then((report) => {
      console.log('Report:', report);
    })
    .catch((error) => {
      console.error('Error:', error.message);
    });
}
