import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for TrustCheck Israel E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout для одного теста (10 сек для API)
  timeout: 15000,
  
  // Expect timeout для assertions
  expect: {
    timeout: 5000
  },

  // Запуск тестов параллельно
  fullyParallel: true,
  
  // Не останавливаться на первой ошибке
  forbidOnly: !!process.env.CI,
  
  // Retry на CI
  retries: process.env.CI ? 2 : 0,
  
  // Количество воркеров
  workers: process.env.CI ? 1 : undefined,
  
  // Репортёры
  reporter: [
    ['html'],
    ['list']
  ],

  // Глобальная настройка
  use: {
    // Base URL для тестов
    baseURL: process.env.API_URL || 'http://localhost:3001',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
  },

  // Проекты для разных окружений
  projects: [
    {
      name: 'API Tests (Tunnel)',
      use: { 
        baseURL: 'http://localhost:3001' // SSH tunnel
      },
    },
    {
      name: 'API Tests (Production)',
      use: { 
        baseURL: 'http://46.224.147.252' // Direct IP
      },
    },
  ],
});
