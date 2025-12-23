/**
 * E2E Tests for TrustCheck Israel API
 * Tests real data flow: PostgreSQL → Gemini AI → Response
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('TrustCheck API E2E Tests', () => {
  
  test('Health endpoint returns correct status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.service).toBe('TrustCheck Israel API');
    expect(data.checks.gemini).toBe(true); // Gemini должен быть активен
    expect(data.checks.app).toBe(true);
  });

  test('Report API returns real company data (HP 515972651)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: '515972651'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Проверяем структуру ответа
    expect(data).toHaveProperty('businessData');
    expect(data).toHaveProperty('aiAnalysis');
    expect(data).toHaveProperty('metadata');

    // Проверяем реальные данные компании (НЕ MOCK)
    expect(data.businessData.name).toContain('א.א.ג ארט עיצוב ושירות'); // Partial match (кодировка)
    expect(data.businessData.registrationNumber).toBe('515972651');
    expect(data.businessData.status).toBe('פעילה');
    
    // Проверяем, что это НЕ mock данные
    expect(data.businessData.name).not.toBe('בית ספר פרטי אופק');
  });

  test('Report API handles invalid input', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: ''
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('Business name is required');
  });

  test('Report API returns AI analysis with trust score', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: '515972651'
      }
    });

    const data = await response.json();
    
    // Проверяем AI analysis (реальная структура API)
    expect(data.aiAnalysis).toHaveProperty('fullReport');
    expect(data.aiAnalysis).toHaveProperty('rating');
    expect(data.aiAnalysis).toHaveProperty('recommendation');
    
    // Rating должен быть числом от 1 до 5
    expect(data.aiAnalysis.rating).toBeGreaterThanOrEqual(1);
    expect(data.aiAnalysis.rating).toBeLessThanOrEqual(5);
    
    // Отчет должен быть на иврите
    expect(data.aiAnalysis.fullReport).toMatch(/[א-ת]/); // Hebrew characters
  });

  test('Report API processes company by name (Hebrew search)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: 'א.א.ג ארט'
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.businessData.name).toContain('א.א.ג ארט');
  });

  test('Performance: Report generation under 10 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: '515972651'
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(10000); // < 10 секунд
    
    console.log(`Report generation time: ${duration}ms`);
  });

  test('PostgreSQL BIGINT casting works correctly', async ({ request }) => {
    // Тест фикса e27e107: hp_number должен кастоваться к BIGINT
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: '515972651' // String input
      }
    });

    const data = await response.json();
    
    // Должна вернуться реальная компания из PostgreSQL (НЕ MOCK)
    expect(data.businessData.name).toContain('א.א.ג ארט');
    expect(data.businessData.registrationNumber).toBe('515972651');
    expect(data.businessData.name).not.toBe('בית ספר פרטי אופק'); // Not mock
  });

  test('Gemini API key is valid (not expired)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/report`, {
      data: {
        businessName: '515972651'
      }
    });

    const data = await response.json();
    
    // Если ключ expired, AI analysis будет пустым или fallback
    expect(data.aiAnalysis.fullReport).toBeTruthy();
    expect(data.aiAnalysis.fullReport.length).toBeGreaterThan(100); // Реальный AI отчет
    
    // Не должно быть ошибки "API key expired"
    expect(data.aiAnalysis.fullReport).not.toContain('API key expired');
  });
});
