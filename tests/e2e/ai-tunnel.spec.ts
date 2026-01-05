/**
 * E2E Tests: AI Chat via Cloudflare Tunnel
 * 
 * Purpose: Verify that the trained Qwen2.5 model (trustcheck:15b) is accessible
 * from the production server through Cloudflare Tunnel.
 * 
 * Test Flow:
 * 1. Local Machine: Ollama serves trustcheck:15b on localhost:11434
 * 2. Cloudflare Tunnel: Exposes local port to public URL
 * 3. Server (Hetzner): Calls AI API endpoint
 * 4. AI API: Fetches from OLLAMA_API_URL (tunnel)
 * 5. Response: Returns trained model output
 */

import { test, expect } from '@playwright/test';

const SERVER_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trustcheck.co.il';
const TUNNEL_URL = process.env.OLLAMA_API_URL || '';

test.describe('AI Chat via Tunnel', () => {
  test.beforeEach(() => {
    if (!TUNNEL_URL) {
      throw new Error('OLLAMA_API_URL not set. Run: pwsh scripts/START_TUNNEL.ps1');
    }
  });

  test('1. Tunnel endpoint is reachable', async ({ request }) => {
    const response = await request.get(`${TUNNEL_URL}/api/tags`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThan(0);

    // Verify trained model is available
    const modelNames = data.models.map((m: any) => m.name);
    expect(modelNames).toContain('trustcheck:15b');
  });

  test('2. AI API responds with trained model', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'Что такое TrustCheck?'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify response structure
    expect(data.response).toBeDefined();
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(10);

    // Verify model name in metadata (if available)
    if (data.model) {
      expect(data.model).toContain('trustcheck');
    }
  });

  test('3. Hebrew query triggers correct response', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'מה זה עוסק פטור?'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Hebrew response should contain Hebrew characters
    expect(data.response).toMatch(/[\u0590-\u05FF]/);
  });

  test('4. English query returns English response', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'What is TrustCheck Israel?'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should mention "business" or "verify" or "Israel"
    const text = data.response.toLowerCase();
    expect(
      text.includes('business') || 
      text.includes('verify') || 
      text.includes('israel')
    ).toBeTruthy();
  });

  test('5. Russian query returns Russian response', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'Как проверить израильский бизнес?'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Russian response should contain Cyrillic characters
    expect(data.response).toMatch(/[\u0400-\u04FF]/);
  });

  test('6. Response time is acceptable (<5s)', async ({ request }) => {
    const start = Date.now();
    
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'Quick test'
      }
    });

    const duration = Date.now() - start;
    
    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  test('7. Model handles Israeli business context', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 'מה ההבדל בין עוסק פטור לעוסק מורשה?'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Response should mention both terms
    expect(data.response).toMatch(/עוסק פטור/);
    expect(data.response).toMatch(/עוסק מורשה/);
  });

  test('8. Empty message returns error', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: ''
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('9. Invalid message type returns error', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/api/ai`, {
      data: {
        message: 12345 // should be string
      }
    });

    expect(response.status()).toBe(400);
  });

  test('10. Concurrent requests succeed', async ({ request }) => {
    const promises = Array(3).fill(0).map((_, i) => 
      request.post(`${SERVER_URL}/api/ai`, {
        data: {
          message: `Test query ${i + 1}`
        }
      })
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });
});

test.describe('Direct Tunnel API Tests', () => {
  test('Tunnel serves correct model', async ({ request }) => {
    const response = await request.get(`${TUNNEL_URL}/api/tags`);
    const data = await response.json();

    const trustcheckModel = data.models.find((m: any) => m.name === 'trustcheck:15b');
    expect(trustcheckModel).toBeDefined();
    
    // Model size should be around 3GB (3.1GB = 3,326,410,219 bytes)
    expect(trustcheckModel.size).toBeGreaterThan(3_000_000_000);
    expect(trustcheckModel.size).toBeLessThan(4_000_000_000);
  });

  test('Tunnel can generate text', async ({ request }) => {
    const response = await request.post(`${TUNNEL_URL}/api/generate`, {
      data: {
        model: 'trustcheck:15b',
        prompt: 'Test prompt',
        stream: false
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.response).toBeDefined();
    expect(typeof data.response).toBe('string');
  });
});
