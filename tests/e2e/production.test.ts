/**
 * E2E Production Tests for TrustCheck Israel
 * 
 * Tests real HTTP requests to production server (https://trustcheck.co.il)
 * Validates:
 * 1. API response format
 * 2. AI agent information extraction accuracy
 * 3. Risk analysis correctness
 * 4. Data completeness
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const PRODUCTION_URL = 'https://trustcheck.co.il';
const API_TIMEOUT = 30000; // 30 seconds for AI generation

interface BusinessReport {
  businessData?: {
    hp_number: string;
    name: string;
    status: string;
    address?: any;
    zipCode?: string;
    industry?: string;
    owners?: any[];
    risks: string[];
    strengths: string[];
    legalIssues?: any;
    riskIndicators?: any;
  };
  aiAnalysis?: {
    rating: number; // 1-5
    risks: string[];
    strengths: string[];
    recommendation: 'approved' | 'caution' | 'rejected';
    fullReport: string;
  };
  metadata?: {
    generatedAt: string;
    model: string;
    dataSource: string;
    dataQuality: string;
    cacheHit: boolean;
    lastUpdated: string;
  };
  error?: string;
}

// Test cases with known Israeli businesses
const TEST_BUSINESSES = [
  {
    id: 'test_1_large_company',
    hpNumber: '520012345', // Example: Large established company
    expectedType: 'company' as const,
    expectedTrustRange: [3.0, 5.0], // Should be reliable
    expectedDataSources: ['companies_registry'],
    validationRules: {
      mustHaveName: true,
      mustHaveBusinessType: true,
      mustHaveTrustScore: true,
      mustHaveStrengths: true,
      mustHaveRisks: true,
    }
  },
  {
    id: 'test_2_osek_morsheh',
    hpNumber: '515044532', // Example: VAT dealer (authorized business)
    expectedType: 'osek_morsheh' as const,
    expectedTrustRange: [2.0, 5.0],
    expectedDataSources: ['vat_dealers', 'osek_morsheh'],
    validationRules: {
      mustHaveName: true,
      mustHaveBusinessType: true,
      mustHaveTrustScore: true,
      mustHaveStrengths: true,
      mustHaveRisks: false, // May not have risks
    }
  },
  {
    id: 'test_3_inactive_company',
    hpNumber: '510123456', // Example: Inactive/problematic company
    expectedType: 'company' as const,
    expectedTrustRange: [1.0, 3.0], // Should be low trust
    expectedDataSources: ['companies_registry'],
    validationRules: {
      mustHaveName: true,
      mustHaveBusinessType: true,
      mustHaveTrustScore: true,
      mustHaveStrengths: false, // May not have strengths
      mustHaveRisks: true, // Must identify risks
    }
  },
];

describe('E2E Production Tests - TrustCheck Israel', () => {
  
  beforeAll(() => {
    console.log(`\n🔍 Testing production server: ${PRODUCTION_URL}`);
    console.log(`⏱️  Timeout per test: ${API_TIMEOUT}ms\n`);
  });

  describe('Health Check', () => {
    it('should return healthy status from /api/health', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'TrustCheck-E2E-Tests/1.0' }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.status).toBe('healthy');
      expect(data.services).toBeDefined();
      expect(data.services.gemini).toBe(true);
      expect(data.services.postgres).toBe(true);
    }, API_TIMEOUT);
  });

  describe('Business Report Generation', () => {
    
    TEST_BUSINESSES.forEach((testCase) => {
      
      describe(`Test Case: ${testCase.id}`, () => {
        let report: BusinessReport;

        it(`should generate report for H.P. ${testCase.hpNumber}`, async () => {
          const response = await fetch(`${PRODUCTION_URL}/api/report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'TrustCheck-E2E-Tests/1.0'
            },
            body: JSON.stringify({
              businessName: testCase.hpNumber
            })
          });

          expect(response.status).toBe(200);
          report = await response.json() as BusinessReport;
          
          console.log(`\n✅ Report generated for ${testCase.id}:`);
          console.log(`   Business: ${report.businessData?.name}`);
          console.log(`   H.P.: ${report.businessData?.hp_number}`);
          console.log(`   Rating: ${report.aiAnalysis?.rating}/5`);
          console.log(`   Recommendation: ${report.aiAnalysis?.recommendation}`);
        }, API_TIMEOUT);

        it('should have valid response structure', () => {
          expect(report.businessData).toBeDefined();
          expect(report.aiAnalysis).toBeDefined();
          expect(report.metadata).toBeDefined();
          expect(report.error).toBeUndefined();
        });

        it('should extract business name correctly', () => {
          if (testCase.validationRules.mustHaveName) {
            expect(report.businessData?.name).toBeDefined();
            expect(report.businessData?.name).not.toBe('');
            expect(report.businessData?.name.length).toBeGreaterThan(3);
            
            console.log(`   ✓ Business name: "${report.businessData?.name}"`);
          }
        });

        it('should have valid H.P. number format', () => {
          expect(report.businessData?.hp_number).toBeDefined();
          expect(report.businessData?.hp_number).toMatch(/^\d{9}$/);
          
          console.log(`   ✓ H.P. number: ${report.businessData?.hp_number}`);
        });

        it('should provide valid AI rating', () => {
          if (testCase.validationRules.mustHaveTrustScore) {
            const rating = report.aiAnalysis?.rating;
            expect(rating).toBeDefined();
            expect(rating).toBeGreaterThanOrEqual(1);
            expect(rating).toBeLessThanOrEqual(5);
            
            // Check if rating is within expected range
            const [min, max] = testCase.expectedTrustRange;
            expect(rating).toBeGreaterThanOrEqual(min);
            expect(rating).toBeLessThanOrEqual(max);
            
            console.log(`   ✓ AI rating ${rating} is within range [${min}, ${max}]`);
          }
        });

        it('should have valid recommendation', () => {
          const recommendation = report.aiAnalysis?.recommendation;
          expect(recommendation).toBeDefined();
          expect(['approved', 'caution', 'rejected']).toContain(recommendation);
          
          console.log(`   ✓ Recommendation: "${recommendation}"`);
        });
        });

        it('should generate Hebrew summary (fullReport)', () => {
          const fullReport = report.aiAnalysis?.fullReport;
          expect(fullReport).toBeDefined();
          expect(fullReport!.length).toBeGreaterThan(50);
          
          // Check for Hebrew characters
          const hasHebrew = /[\u0590-\u05FF]/.test(fullReport || '');
          expect(hasHebrew).toBe(true);
          
          console.log(`   ✓ Full report length: ${fullReport?.length} chars (Hebrew: ${hasHebrew})`);
        });

        it('should identify business strengths', () => {
          if (testCase.validationRules.mustHaveStrengths) {
            expect(report.aiAnalysis?.strengths).toBeDefined();
            expect(Array.isArray(report.aiAnalysis?.strengths)).toBe(true);
            expect(report.aiAnalysis!.strengths.length).toBeGreaterThan(0);
            
            report.aiAnalysis?.strengths.forEach((strength, index) => {
              expect(strength).toBeDefined();
              expect(strength.length).toBeGreaterThan(5);
              
              // Check for Hebrew
              const hasHebrew = /[\u0590-\u05FF]/.test(strength);
              expect(hasHebrew).toBe(true);
            });
            
            console.log(`   ✓ Strengths identified: ${report.aiAnalysis?.strengths.length}`);
            console.log(`      - ${report.aiAnalysis?.strengths[0]?.substring(0, 60)}...`);
          }
        });

        it('should identify business risks', () => {
          if (testCase.validationRules.mustHaveRisks) {
            expect(report.aiAnalysis?.risks).toBeDefined();
            expect(Array.isArray(report.aiAnalysis?.risks)).toBe(true);
            expect(report.aiAnalysis!.risks.length).toBeGreaterThan(0);
            
            report.aiAnalysis?.risks.forEach((risk, index) => {
              expect(risk).toBeDefined();
              expect(risk.length).toBeGreaterThan(5);
              
              // Check for Hebrew
              const hasHebrew = /[\u0590-\u05FF]/.test(risk);
              expect(hasHebrew).toBe(true);
            });
            
            console.log(`   ✓ Risks identified: ${report.aiAnalysis?.risks.length}`);
            console.log(`      - ${report.aiAnalysis?.risks[0]?.substring(0, 60)}...`);
          }
        });

        it('should track data sources', () => {
          expect(report.metadata?.dataSource).toBeDefined();
          expect(['postgresql', 'mock_data', 'checkid_api']).toContain(report.metadata?.dataSource);
          
          console.log(`   ✓ Data source: ${report.metadata?.dataSource}`);
        });
          
          console.log(`   ✓ Recommendations provided: ${report.data?.recommendations.length}`);
        });

        it('should indicate correct data sources', () => {
          expect(report.data?.dataSource).toBeDefined();
          
          testCase.expectedDataSources.forEach((source) => {
            if (report.data?.dataSource) {
              const sourceKey = source as keyof typeof report.data.dataSource;
              expect(report.data.dataSource[sourceKey]).toBe(true);
            }
          });
          
          const sources = Object.entries(report.data?.dataSource || {})
            .filter(([_, value]) => value)
            .map(([key]) => key);
          
          console.log(`   ✓ Data sources used: ${sources.join(', ')}`);
        });

        it('should have valid H.P. number format', () => {
          const hpNumber = report.data?.hpNumber;
          expect(hpNumber).toBeDefined();
          
          // Israeli H.P. number is 9 digits
          expect(/^\d{9}$/.test(hpNumber || '')).toBe(true);
          expect(hpNumber).toBe(testCase.hpNumber);
          
          console.log(`   ✓ H.P. number validated: ${hpNumber}`);
        });
      });
    });
  });

  describe('Error Handling', () => {
    
    it('should return error for invalid H.P. number', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '123' // Too short
        })
      });

      const data = await response.json() as BusinessReport;
      expect(data.error).toBeDefined();
      
      console.log(`\n✅ Error handling works: "${data.error}"`);
    }, API_TIMEOUT);

    it('should return error for non-existent business', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '999999999' // Non-existent H.P.
        })
      });

      const data = await response.json() as BusinessReport;
      // Should still generate report but with low rating
      expect(data.aiAnalysis?.rating).toBeDefined();
      
      console.log(`\n✅ Non-existent business handled: rating=${data.aiAnalysis?.rating}`);
    }, API_TIMEOUT);

    it('should handle missing query parameter', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          // Missing 'businessName' field
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json() as BusinessReport;
      expect(data.error).toBeDefined();
      
      console.log(`\n✅ Missing parameter error: "${data.error}"`);
    }, API_TIMEOUT);
  });

  describe('AI Analysis Quality', () => {
    
    it('should provide context-aware recommendations', async () => {
      // Test with a business and check if recommendations match risk level
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '515044532', // Test business
          
        })
      });

      const data = await response.json() as BusinessReport;
      
      if (data.success && data.data) {
        const { trustScore, recommendations, risks } = data.data;
        
        // High trust score should have encouraging recommendations
        if (trustScore >= 4.0) {
          const hasPositiveRec = recommendations.some(rec => 
            rec.includes('מומלץ') || rec.includes('בטוח') || rec.includes('אמין')
          );
          expect(hasPositiveRec).toBe(true);
          
          console.log(`\n✅ High trust business has positive recommendations`);
        }
        
        // Low trust score should have warning recommendations
        if (trustScore < 2.5 && risks.length > 0) {
          const hasWarningRec = recommendations.some(rec => 
            rec.includes('זהירות') || rec.includes('לא מומלץ') || rec.includes('סיכון')
          );
          expect(hasWarningRec).toBe(true);
          
          console.log(`\n✅ Low trust business has warning recommendations`);
        }
        
        // Recommendations should be specific, not generic
        recommendations.forEach(rec => {
          expect(rec.length).toBeGreaterThan(20); // Not too short
          expect(rec.length).toBeLessThan(500); // Not too long
        });
        
        console.log(`\n✅ Recommendations are appropriately sized (${recommendations.length} items)`);
      }
    }, API_TIMEOUT);

    it('should identify business age correctly', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '520012345', // Established company
          
        })
      });

      const data = await response.json() as BusinessReport;
      
      if (data.aiAnalysis) {
        const fullReport = data.aiAnalysis.fullReport.toLowerCase();
        
        // Should mention business age/establishment
        const hasAgeInfo = 
          /\d+\s*(שנ|חודש|ימ)/.test(fullReport) || // "X years/months/days"
          /הוקמ|נוסד|פעיל/.test(fullReport); // "established/founded/active"
        
        expect(hasAgeInfo).toBe(true);
        
        console.log(`\n✅ AI correctly identifies business age in report`);
      }
    }, API_TIMEOUT);
  });

  describe('Performance Benchmarks', () => {
    
    it('should generate report within 10 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '515044532',
          
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
      
      console.log(`\n✅ Report generated in ${duration}ms (target: <10000ms)`);
    }, API_TIMEOUT);

    it('should handle concurrent requests', async () => {
      const requests = [
        { businessName: '515044532',  },
        { businessName: '520012345',  },
        { query: '510123456',  },
      ];

      const startTime = Date.now();
      
      const promises = requests.map(body =>
        fetch(`${PRODUCTION_URL}/api/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TrustCheck-E2E-Tests/1.0'
          },
          body: JSON.stringify(body)
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // All 3 requests should complete within 15 seconds
      expect(duration).toBeLessThan(15000);
      
      console.log(`\n✅ ${requests.length} concurrent requests completed in ${duration}ms`);
    }, API_TIMEOUT * 2);
  });
});


