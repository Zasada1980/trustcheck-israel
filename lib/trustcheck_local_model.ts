/**
 * TrustCheck Hebrew Model Integration
 * Использование обученной локальной модели вместо Google Gemini
 */

import { spawn } from 'child_process';
import path from 'path';

interface BusinessDataInput {
  nameHebrew?: string;
  hpNumber?: string;
  businessType?: string;
  status?: string;
  [key: string]: any;
}

interface ModelResponse {
  success: boolean;
  report: string;
  error?: string;
  generatedBy: string;
  timestamp: string;
}

/**
 * Генерировать отчёт о компании используя обученную локальную модель
 * Альтернатива Google Gemini API (бесплатно, локально, на иврите)
 */
export async function generateTrustReportLocal(
  businessData: BusinessDataInput
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Путь к Python скрипту
      const pythonScript = path.join(
        'E:',
        'LLaMA-Factory',
        'trustcheck_model.py'
      );

      // Запустить Python процесс
      const python = spawn('python', [pythonScript], {
        cwd: 'E:\\LLaMA-Factory',
        env: {
          ...process.env,
          PYTHONPATH: 'E:\\LLaMA-Factory\\src',
        },
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python error:', errorOutput);
          reject(new Error(`Python process exited with code ${code}`));
        } else {
          // Извлечь отчёт из вывода
          const report = extractReportFromOutput(output);
          resolve(report);
        }
      });

      // Отправить данные о компании в stdin
      python.stdin.write(JSON.stringify(businessData));
      python.stdin.end();

      // Timeout на случай зависания
      setTimeout(() => {
        python.kill();
        reject(new Error('Model generation timeout'));
      }, 60000); // 60 seconds

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Экспортировать модель в GGUF формат для Ollama
 */
export async function exportModelToGGUF(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const pythonScript = path.join(
        'E:',
        'LLaMA-Factory',
        'export_model.py'
      );

      const python = spawn('python', [
        '-m',
        'llamafactory.cli',
        'export',
        '--model_name_or_path',
        'saves/qwen-trustcheck-hebrew/lora/sft',
        '--export_dir',
        'exports/trustcheck-hebrew',
        '--export_size',
        '4',
        '--export_device',
        'cpu',
      ], {
        cwd: 'E:\\LLaMA-Factory',
      });

      let output = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      python.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Model exported to GGUF');
          resolve();
        } else {
          reject(new Error(`Export failed with code ${code}`));
        }
      });

      // Timeout: 30 minutes (экспорт долгий)
      setTimeout(() => {
        python.kill();
        reject(new Error('Export timeout'));
      }, 1800000);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Загрузить модель в Ollama после GGUF экспорта
 */
export async function loadModelInOllama(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ollamaPath = 'E:\\SBF\\ollama\\bin\\ollama.exe';

      const ollama = spawn(ollamaPath, [
        'create',
        'trustcheck-hebrew',
        '-f',
        'E:\\SBF\\ollama\\config\\Modelfile',
      ]);

      let output = '';

      ollama.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      ollama.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Model loaded in Ollama');
          resolve();
        } else {
          reject(new Error(`Ollama load failed with code ${code}`));
        }
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Вспомогательная функция: извлечь отчёт из вывода Python
 */
function extractReportFromOutput(output: string): string {
  // Ищем строку "✅ Отчёт (на иврите):"
  const lines = output.split('\n');
  const reportIndex = lines.findIndex(line => line.includes('✅ Отчёт'));
  
  if (reportIndex !== -1) {
    // Взять всё после найденной строки
    return lines.slice(reportIndex + 1).join('\n').trim();
  }
  
  // Fallback: вернуть весь вывод после "📝"
  const fallbackIndex = output.indexOf('📝 Генерирую отчёт...');
  if (fallbackIndex !== -1) {
    return output.substring(fallbackIndex).trim();
  }
  
  return output;
}

/**
 * Проверить доступность модели
 */
export async function checkModelAvailability(): Promise<boolean> {
  const modelPath = 'E:\\LLaMA-Factory\\saves\\qwen-trustcheck-hebrew\\lora\\sft';
  
  const fs = require('fs').promises;
  
  try {
    const files = await fs.readdir(modelPath);
    const hasAdapterConfig = files.includes('adapter_config.json');
    const hasAdapterModel = files.includes('adapter_model.bin');
    
    return hasAdapterConfig && hasAdapterModel;
  } catch (error) {
    return false;
  }
}

/**
 * Интеграция с API маршрутом
 */
export async function apiGenerateTrustReport(businessData: BusinessDataInput): Promise<ModelResponse> {
  try {
    // Проверить доступность модели
    const available = await checkModelAvailability();
    
    if (!available) {
      return {
        success: false,
        report: '',
        error: 'Model not found. Please train model first.',
        generatedBy: 'TrustCheck Hebrew Model (Local)',
        timestamp: new Date().toISOString(),
      };
    }

    // Генерировать отчёт
    const report = await generateTrustReportLocal(businessData);
    
    return {
      success: true,
      report,
      generatedBy: 'TrustCheck Hebrew Model (Local)',
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      report: '',
      error: (error as Error).message,
      generatedBy: 'TrustCheck Hebrew Model (Local)',
      timestamp: new Date().toISOString(),
    };
  }
}
