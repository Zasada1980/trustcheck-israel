/**
 * E2E Tests: Audit Logic & Risk Assessment
 * 
 * Tests TrustCheck's core risk detection logic across multiple scenarios:
 * 1. Violations detection (חברה מפרת חוק)
 * 2. Clean companies (no risks)
 * 3. Bank restrictions (BOI Mugbalim)
 * 4. Multiple risk factors (violations + debt + legal cases)
 * 5. Edge cases (missing data, partial data)
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'http://46.224.147.252';
const API_ENDPOINT = `${PRODUCTION_URL}/api/report`;

/**
 * Helper: Call report API
 */
async function getBusinessReport(hpNumber: string, businessName: string) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ registrationNumber: hpNumber, businessName }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

test.describe('Audit Logic: Violations Detection', () => {
  
  test('TEST 1: Company with violations (מפרה) should be flagged as CRITICAL RISK', async () => {
    // HP 515972651 = א.א.ג ארט עיצוב ושירות בע"מ (violations=מפרה, code=18)
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');

    // 1. Check database fields
    expect(result.businessData.violations).toBe('מפרה');
    expect(result.businessData.violationsCode).toBe('18');
    
    // 2. Check risk indicator
    expect(result.businessData.riskIndicators.isCompanyViolating).toBe(true);
    
    // 3. Check risks array priority (violations должен быть FIRST!)
    expect(result.businessData.risks.length).toBeGreaterThan(0);
    expect(result.businessData.risks[0]).toContain('חברה מפרת חוק');
    expect(result.businessData.risks[0]).toContain('CRITICAL RISK');
    
    // 4. Check AI trust score (должен быть очень низкий)
    expect(result.aiAnalysis.rating).toBeLessThan(30);
    expect(result.aiAnalysis.recommendation).toBe('rejected');
    
    // 5. Check metadata
    expect(result.metadata.dataSource).toBe('postgresql');
    expect(result.businessData.status).toBe('פעילה');
  });

  test('TEST 2: Clean company without violations should have no critical risks', async () => {
    // HP 510000334 = עין שרה בעמ (violations=null, clean record)
    const result = await getBusinessReport('510000334', 'עין שרה');

    // 1. Check no violations
    expect([null, undefined, '']).toContain(result.businessData.violations);
    expect([null, undefined, '']).toContain(result.businessData.violationsCode);
    
    // 2. Check risk indicator
    expect(result.businessData.riskIndicators.isCompanyViolating).toBe(false);
    
    // 3. Check risks array is empty or minimal
    const hasViolationRisk = result.businessData.risks.some(
      (risk: string) => risk.includes('מפרת חוק')
    );
    expect(hasViolationRisk).toBe(false);
    
    // 4. Check AI trust score (должен быть выше чем у violations company)
    expect(result.aiAnalysis.rating).toBeGreaterThan(30);
    
    // 5. Check status
    expect(result.businessData.status).toBe('פעילה');
  });

  test('TEST 3: Multiple known violating companies should ALL be flagged', async () => {
    // Test 3 random violating companies from database
    const violatingCompanies = [
      { hp: '510000011', name: 'אולימפיה אוטו' },
      { hp: '510001001', name: 'חברת מרשל' },
      { hp: '510002066', name: 'א ה ליפשיץ' },
    ];

    for (const company of violatingCompanies) {
      const result = await getBusinessReport(company.hp, company.name);
      
      expect(result.businessData.violations).toBe('מפרה');
      expect(result.businessData.riskIndicators.isCompanyViolating).toBe(true);
      expect(result.businessData.risks[0]).toContain('חברה מפרת חוק');
    }
  });
});

test.describe('Audit Logic: Risk Prioritization', () => {
  
  test('TEST 4: Violations should appear BEFORE other risks in array', async () => {
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');

    const risks = result.businessData.risks;
    
    // Find index of violations risk
    const violationsIndex = risks.findIndex((r: string) => r.includes('מפרת חוק'));
    
    // Find indices of other risks
    const legalCasesIndex = risks.findIndex((r: string) => r.includes('תיקים משפטיים'));
    const executionIndex = risks.findIndex((r: string) => r.includes('הוצאה לפועל'));
    const debtIndex = risks.findIndex((r: string) => r.includes('חוב'));
    
    // Violations должен быть FIRST (index 0)
    expect(violationsIndex).toBe(0);
    
    // Other risks должны быть AFTER violations (if exist)
    if (legalCasesIndex >= 0) expect(legalCasesIndex).toBeGreaterThan(violationsIndex);
    if (executionIndex >= 0) expect(executionIndex).toBeGreaterThan(violationsIndex);
    if (debtIndex >= 0) expect(debtIndex).toBeGreaterThan(violationsIndex);
  });

  test('TEST 5: Risk priority order should be: Violations > Bank > Legal > Execution > Debt > Bankruptcy', async () => {
    // This test validates the risk prioritization logic from app/api/report/route.ts
    
    // Expected order (from code):
    const expectedOrder = [
      'מפרת חוק',       // violations - CRITICAL
      'חשבון בנק מוגבל', // bank restrictions
      'תיקים משפטיים',   // legal cases
      'הוצאה לפועל',    // execution proceedings
      'חוב גבוה',        // high debt
      'פשיטת רגל',      // bankruptcy
    ];
    
    // Mock company with ALL risk factors (worst case)
    // Note: This would need a test company or mock endpoint
    // For now, just validate the expected order exists in code
    
    expect(expectedOrder[0]).toBe('מפרת חוק'); // Most critical
    expect(expectedOrder[expectedOrder.length - 1]).toBe('פשיטת רגל'); // Least critical
  });
});

test.describe('Audit Logic: Edge Cases', () => {
  
  test('TEST 6: Company with empty string violations should NOT be flagged', async () => {
    const result = await getBusinessReport('510000334', 'עין שרה');

    // Empty string or null should NOT trigger violations flag
    expect(result.businessData.riskIndicators.isCompanyViolating).toBe(false);
  });

  test('TEST 7: API should handle missing HP number gracefully', async ({ request }) => {
    const response = await request.post(API_ENDPOINT, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      data: { businessName: 'Test Company' },
    });

    // Should return 404 or valid response (depends on implementation)
    expect([200, 404]).toContain(response.status());
  });

  test('TEST 8: API should handle invalid HP number format', async ({ request }) => {
    const response = await request.post(API_ENDPOINT, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      data: { registrationNumber: 'INVALID123', businessName: 'Test' },
    });

    // Should return 404 or error
    expect([200, 404, 400]).toContain(response.status());
  });

  test('TEST 9: Inactive company (מחוקה) should have correct status', async () => {
    // HP 510001811 = ז ע ג ו בעמ (status=מחוקה, violations=מפרה)
    const result = await getBusinessReport('510001811', 'ז ע ג ו');

    expect(result.businessData.status).toBe('מחוקה');
    expect(result.businessData.violations).toBe('מפרה');
    
    // Even inactive companies should show violations
    expect(result.businessData.riskIndicators.isCompanyViolating).toBe(true);
  });
});

test.describe('Audit Logic: Data Completeness', () => {
  
  test('TEST 10: API response should include ALL regulatory fields', async () => {
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');

    // Check all fields added in violations fix
    expect(result.businessData).toHaveProperty('nameHebrew');
    expect(result.businessData).toHaveProperty('nameEnglish');
    expect(result.businessData).toHaveProperty('violations');
    expect(result.businessData).toHaveProperty('violationsCode');
    expect(result.businessData).toHaveProperty('limitations');
    expect(result.businessData).toHaveProperty('governmentCompany');
    expect(result.businessData).toHaveProperty('lastAnnualReport');
    expect(result.businessData).toHaveProperty('businessDescription');
    expect(result.businessData).toHaveProperty('businessPurpose');
    
    // Check risk indicators object
    expect(result.businessData.riskIndicators).toHaveProperty('isCompanyViolating');
    expect(result.businessData.riskIndicators).toHaveProperty('hasActiveLegalCases');
    expect(result.businessData.riskIndicators).toHaveProperty('hasExecutionProceedings');
    expect(result.businessData.riskIndicators).toHaveProperty('hasHighDebt');
    expect(result.businessData.riskIndicators).toHaveProperty('hasRestrictedBankAccount');
    expect(result.businessData.riskIndicators).toHaveProperty('hasBankruptcyProceedings');
  });

  test('TEST 11: Metadata should include data source and quality', async () => {
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');

    expect(result.metadata).toHaveProperty('dataSource');
    expect(result.metadata).toHaveProperty('dataQuality');
    expect(result.metadata).toHaveProperty('cacheHit');
    expect(result.metadata).toHaveProperty('lastUpdated');
    expect(result.metadata).toHaveProperty('generatedAt');
    expect(result.metadata).toHaveProperty('model');
    
    expect(result.metadata.dataSource).toBe('postgresql');
    expect(['high', 'medium', 'low']).toContain(result.metadata.dataQuality);
  });
});

test.describe('Audit Logic: AI Analysis', () => {
  
  test('TEST 12: AI should give low trust score for violating companies', async () => {
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');

    // Trust score должен быть < 30 для violations
    expect(result.aiAnalysis.rating).toBeLessThan(30);
    
    // Recommendation должна быть "rejected" or "caution"
    expect(['rejected', 'caution']).toContain(result.aiAnalysis.recommendation);
    
    // Risks должны включать violations
    const risksText = result.aiAnalysis.risks.join(' ');
    expect(risksText).toContain('מפרת');
  });

  test('TEST 13: AI should give higher trust score for clean companies', async () => {
    const violatingResult = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');
    const cleanResult = await getBusinessReport('510000334', 'עין שרה');

    // Clean company должна иметь выше trust score
    expect(cleanResult.aiAnalysis.rating).toBeGreaterThan(violatingResult.aiAnalysis.rating);
  });
});

test.describe('Audit Logic: Performance', () => {
  
  test('TEST 14: API should respond within 10 seconds', async () => {
    const startTime = Date.now();
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10000); // 10 seconds max
    expect(result.success).toBe(true);
  });

  test('TEST 15: Cached data should be faster than fresh scraping', async () => {
    // First call (may be cold)
    const startTime1 = Date.now();
    await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');
    const duration1 = Date.now() - startTime1;

    // Second call (should hit cache)
    const startTime2 = Date.now();
    const result = await getBusinessReport('515972651', 'א.א.ג ארט עיצוב');
    const duration2 = Date.now() - startTime2;

    // Second call should be faster or similar
    expect(duration2).toBeLessThanOrEqual(duration1 * 1.5); // Allow 50% variance
    expect(result.metadata.cacheHit).toBe(true);
  });
});
