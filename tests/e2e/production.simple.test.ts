/**
 * Simplified E2E Production Tests for TrustCheck Israel
 * Tests real API responses and AI analysis quality
 */

import { describe, it, expect } from '@jest/globals';

const PRODUCTION_URL = 'https://trustcheck.co.il';
const API_TIMEOUT = 60000; // 60 seconds

interface BusinessReport {
  businessData?: {
    hp_number: string;
    name: string;
    status: string;
    risks: string[];
    strengths: string[];
  };
  aiAnalysis?: {
    rating: number;
    risks: string[];
    strengths: string[];
    recommendation: 'approved' | 'caution' | 'rejected';
    fullReport: string;
  };
  metadata?: {
    model: string;
    dataSource: string;
  };
  error?: string;
}

describe('E2E Production Tests - TrustCheck Israel', () => {
  
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as BusinessReport;
      console.log('✅ Health check:', data);
    }, API_TIMEOUT);
  });

  describe('Business Report Generation', () => {
    
    it('should generate report for H.P. 515044532', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '515044532'
        })
      });

      expect(response.status).toBe(200);
      const report: BusinessReport = await response.json() as BusinessReport;
      
      console.log('\n📊 Report for H.P. 515044532:');
      console.log('   Business:', report.businessData?.name);
      console.log('   H.P.:', report.businessData?.hp_number);
      console.log('   Rating:', report.aiAnalysis?.rating, '/5');
      console.log('   Recommendation:', report.aiAnalysis?.recommendation);
      console.log('   Model:', report.metadata?.model);
      console.log('   Data Source:', report.metadata?.dataSource);
      
      // Validate structure
      expect(report.businessData).toBeDefined();
      expect(report.aiAnalysis).toBeDefined();
      expect(report.metadata).toBeDefined();
      
      // Validate business data
      // Note: API returns businessName directly, not in nested structure
      expect(report.businessData?.name).toBeTruthy();
      expect(report.businessData?.name.length).toBeGreaterThan(3);
      
      // Validate AI analysis
      expect(report.aiAnalysis?.rating).toBeGreaterThanOrEqual(1);
      expect(report.aiAnalysis?.rating).toBeLessThanOrEqual(5);
      expect(['approved', 'caution', 'rejected']).toContain(report.aiAnalysis?.recommendation);
      
      // Validate Hebrew content
      const hasHebrew = /[\u0590-\u05FF]/.test(report.aiAnalysis?.fullReport || '');
      expect(hasHebrew).toBe(true);
      expect(report.aiAnalysis?.fullReport.length).toBeGreaterThan(100);
      
      // Validate arrays
      expect(Array.isArray(report.aiAnalysis?.strengths)).toBe(true);
      expect(Array.isArray(report.aiAnalysis?.risks)).toBe(true);
      
      console.log('   ✅ Strengths:', report.aiAnalysis?.strengths.length);
      console.log('   ⚠️  Risks:', report.aiAnalysis?.risks.length);
      console.log('   📝 Report length:', report.aiAnalysis?.fullReport.length, 'chars');
      
    }, API_TIMEOUT);

    it('should generate report for H.P. 520012345', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '520012345'
        })
      });

      const report: BusinessReport = await response.json() as BusinessReport;
      
      console.log('\n📊 Report for H.P. 520012345:');
      console.log('   Business:', report.businessData?.name);
      console.log('   Rating:', report.aiAnalysis?.rating, '/5');
      console.log('   Recommendation:', report.aiAnalysis?.recommendation);
      
      expect(report.businessData?.name).toBeTruthy();
      expect(report.aiAnalysis?.rating).toBeGreaterThanOrEqual(1);
      
    }, API_TIMEOUT);
  });

  describe('AI Analysis Quality', () => {
    
    it('should provide context-aware recommendations', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({
          businessName: '515044532'
        })
      });

      const report: BusinessReport = await response.json() as BusinessReport;
      
      // High rating should have approved/caution
      if (report.aiAnalysis!.rating >= 4) {
        expect(['approved', 'caution']).toContain(report.aiAnalysis?.recommendation);
        console.log('\n✅ High rating (', report.aiAnalysis?.rating, ') → recommendation:', report.aiAnalysis?.recommendation);
      }
      
      // Low rating should have caution/rejected
      if (report.aiAnalysis!.rating < 3) {
        expect(['caution', 'rejected']).toContain(report.aiAnalysis?.recommendation);
        console.log('\n⚠️  Low rating (', report.aiAnalysis?.rating, ') → recommendation:', report.aiAnalysis?.recommendation);
      }
      
      // Full report should be detailed
      expect(report.aiAnalysis?.fullReport.length).toBeGreaterThan(200);
      console.log('\n✅ Full report is detailed (', report.aiAnalysis?.fullReport.length, 'chars)');
      
    }, API_TIMEOUT);
  });

  describe('Error Handling', () => {
    
    it('should handle missing businessName parameter', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustCheck-E2E-Tests/1.0'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data: BusinessReport = await response.json() as BusinessReport;
      expect(data.error).toBeDefined();
      
      console.log('\n✅ Missing parameter error:', data.error);
      
    }, API_TIMEOUT);
  });
});
