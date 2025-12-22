/**
 * Unified Data Service - Government Sources Integration
 * 
 * This module combines data from:
 * 1. PostgreSQL cache (data.gov.il datasets)
 * 2. Real-time scraping (ica.justice.gov.il)
 * 3. Court data (court.gov.il)
 * 4. Fallback to CheckID mock data
 * 
 * Strategy:
 * - First try local PostgreSQL (fast, cached)
 * - If not found or outdated → scrape government sites
 * - If scraping fails → fallback to mock data
 */

import {
  searchLocalCompany,
  getCompanyLegalCases,
  getCompanyExecutionProceedings,
  upsertCompany,
  upsertCompanyOwners,
  isCompanyDataOutdated,
  logScrapingOperation,
  checkDatabaseHealth,
  type CompanyProfile,
  type LegalCase,
  type ExecutionProceeding,
} from './db/postgres';

import { getMockBusinessData, type CheckIDBusinessData } from './checkid';

// Types for unified API
export interface UnifiedBusinessData {
  // Basic Info (from PostgreSQL or scraping)
  hpNumber: string;
  nameHebrew: string;
  nameEnglish?: string;
  companyType: string;
  status: string;
  registrationDate?: string;
  
  // Address
  address: {
    street?: string;
    city?: string;
    zipcode?: string;
  };
  
  // Contact
  phone?: string;
  website?: string;
  email?: string;
  
  // Owners (from PostgreSQL or ICA scraping)
  owners: Array<{
    name: string;
    role: string;
    sharePercentage?: number;
  }>;
  
  // Legal Issues (from PostgreSQL or Court scraping)
  legalIssues: {
    activeCases: number;
    totalCases: number;
    executionProceedings: number;
    totalDebt: number;
    recentCases: Array<{
      caseNumber: string;
      caseType: string;
      status: string;
      filingDate?: string;
    }>;
  };
  
  // Industry & Business Info
  industry?: string;
  businessPurpose?: string;
  
  // Risk Indicators (calculated)
  riskIndicators: {
    hasActiveLegalCases: boolean;
    hasExecutionProceedings: boolean;
    isCompanyViolating: boolean;
    hasHighDebt: boolean;
  };
  
  // Metadata
  dataSource: 'postgresql' | 'ica_scraping' | 'court_scraping' | 'mock_data';
  dataQuality: 'high' | 'medium' | 'low';
  lastUpdated: string;
  cacheHit: boolean;
}

/**
 * Main function to get business data
 * Implements hybrid strategy: PostgreSQL → Scraping → Mock
 */
export async function getBusinessData(
  hpNumber: string,
  options: {
    forceRefresh?: boolean;  // Force scraping even if cached
    includeLegal?: boolean;   // Include legal cases (slower)
  } = {}
): Promise<UnifiedBusinessData | null> {
  
  const startTime = Date.now();
  let dataSource: UnifiedBusinessData['dataSource'] = 'mock_data';
  let cacheHit = false;
  
  try {
    // Step 1: Check PostgreSQL cache
    if (!options.forceRefresh) {
      console.log(`[UnifiedData] Checking PostgreSQL for HP ${hpNumber}...`);
      
      const cachedCompany = await searchLocalCompany(hpNumber);
      
      if (cachedCompany) {
        const isOutdated = await isCompanyDataOutdated(hpNumber);
        
        if (!isOutdated) {
          console.log(`[UnifiedData] Cache HIT - Using PostgreSQL data`);
          
          // Get legal data if requested
          let legalCases: LegalCase[] = [];
          let executionProcs: ExecutionProceeding[] = [];
          
          if (options.includeLegal) {
            [legalCases, executionProcs] = await Promise.all([
              getCompanyLegalCases(hpNumber),
              getCompanyExecutionProceedings(hpNumber),
            ]);
          }
          
          const result = mapPostgreSQLToUnified(cachedCompany, legalCases, executionProcs);
          
          await logScrapingOperation({
            source: 'postgresql',
            operation: 'search_company',
            hpNumber,
            status: 'success',
            responseTimeMs: Date.now() - startTime,
          });
          
          return result;
        } else {
          console.log(`[UnifiedData] Data outdated (>7 days) - Will scrape`);
        }
      }
    }
    
    // Step 2: Try real-time scraping (NOT IMPLEMENTED YET)
    // TODO: Implement ICA scraper
    // const scrapedData = await scrapeICACompany(hpNumber);
    // if (scrapedData) { ... }
    
    // Step 3: Fallback to mock data
    console.log(`[UnifiedData] Using MOCK data for HP ${hpNumber}`);
    
    const mockData = getMockBusinessData(hpNumber);
    
    if (!mockData) {
      return null;
    }
    
    await logScrapingOperation({
      source: 'mock_data',
      operation: 'search_company',
      hpNumber,
      status: 'success',
      responseTimeMs: Date.now() - startTime,
    });
    
    return mapCheckIDToUnified(mockData);
    
  } catch (error) {
    console.error(`[UnifiedData] Error fetching business data:`, error);
    
    await logScrapingOperation({
      source: 'unified',
      operation: 'search_company',
      hpNumber,
      status: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    });
    
    return null;
  }
}

/**
 * Search companies by name (PostgreSQL first, then fallback)
 */
export async function searchCompaniesByName(
  name: string,
  limit: number = 10
): Promise<Array<{ hpNumber: string; nameHebrew: string; companyType: string }>> {
  
  try {
    // Check PostgreSQL health first
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      console.warn('[UnifiedData] PostgreSQL unavailable - skipping search');
      return [];
    }
    
    // Use existing PostgreSQL function
    const { searchCompaniesByName: pgSearch } = await import('./db/postgres');
    const results = await pgSearch(name, limit);
    
    return results.map(company => ({
      hpNumber: company.hpNumber,
      nameHebrew: company.nameHebrew,
      companyType: company.companyType,
    }));
    
  } catch (error) {
    console.error('[UnifiedData] Error searching companies:', error);
    return [];
  }
}

/**
 * Map PostgreSQL data to unified format
 */
function mapPostgreSQLToUnified(
  company: CompanyProfile,
  legalCases: LegalCase[],
  executionProceedings: ExecutionProceeding[]
): UnifiedBusinessData {
  
  const activeCases = legalCases.filter(c => c.caseStatus === 'פעיל').length;
  const totalDebt = executionProceedings.reduce((sum, proc) => sum + (proc.debtAmount || 0), 0);
  
  return {
    hpNumber: company.hpNumber,
    nameHebrew: company.nameHebrew,
    nameEnglish: company.nameEnglish,
    companyType: company.companyType,
    status: company.status,
    registrationDate: company.registrationDate,
    
    address: {
      street: company.addressStreet,
      city: company.addressCity,
      zipcode: company.addressZipcode,
    },
    
    phone: company.phone,
    website: company.website,
    email: company.email,
    
    owners: (company.owners || []).map(owner => ({
      name: owner.name,
      role: owner.role,
      sharePercentage: owner.sharePercentage,
    })),
    
    legalIssues: {
      activeCases,
      totalCases: legalCases.length,
      executionProceedings: executionProceedings.length,
      totalDebt,
      recentCases: legalCases.slice(0, 5).map(c => ({
        caseNumber: c.caseNumber,
        caseType: c.caseType,
        status: c.caseStatus,
        filingDate: c.filingDate,
      })),
    },
    
    industry: undefined, // TODO: Add industry classification
    businessPurpose: company.businessPurpose,
    
    riskIndicators: {
      hasActiveLegalCases: activeCases > 0,
      hasExecutionProceedings: executionProceedings.length > 0,
      isCompanyViolating: company.status === 'מפרת חוק' || company.status === 'violating',
      hasHighDebt: totalDebt > 100000, // ₪100K threshold
    },
    
    dataSource: 'postgresql',
    dataQuality: company.dataQualityScore > 70 ? 'high' : company.dataQualityScore > 40 ? 'medium' : 'low',
    lastUpdated: company.lastUpdated,
    cacheHit: true,
  };
}

/**
 * Map CheckID mock data to unified format
 */
function mapCheckIDToUnified(mockData: CheckIDBusinessData): UnifiedBusinessData {
  return {
    hpNumber: mockData.registrationNumber,
    nameHebrew: mockData.name,
    nameEnglish: undefined,
    companyType: mockData.type,
    status: mockData.status,
    registrationDate: mockData.foundedDate,
    
    address: {
      street: mockData.address?.street,
      city: mockData.address?.city,
      zipcode: mockData.address?.zipCode,
    },
    
    phone: undefined,
    website: undefined,
    email: undefined,
    
    owners: mockData.owners?.map(owner => ({
      name: owner.name,
      role: owner.role || 'Unknown',
      sharePercentage: undefined,
    })) || [],
    
    legalIssues: {
      activeCases: 0,
      totalCases: 0,
      executionProceedings: 0,
      totalDebt: 0,
      recentCases: [],
    },
    
    industry: mockData.industry,
    businessPurpose: undefined,
    
    riskIndicators: {
      hasActiveLegalCases: false,
      hasExecutionProceedings: false,
      isCompanyViolating: mockData.status === 'violating',
      hasHighDebt: false,
    },
    
    dataSource: 'mock_data',
    dataQuality: 'medium',
    lastUpdated: new Date().toISOString(),
    cacheHit: false,
  };
}

/**
 * Health check for all data sources
 */
export async function checkDataSourcesHealth() {
  const postgresql = await checkDatabaseHealth();
  
  return {
    postgresql,
    ica_scraping: false,  // TODO: Implement scraper health check
    court_scraping: false, // TODO: Implement scraper health check
    mock_data: true,
  };
}

export default {
  getBusinessData,
  searchCompaniesByName,
  checkDataSourcesHealth,
};
