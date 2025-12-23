/**
 * Execution Office (Hotzaa LaPoal) Integration
 * 
 * Free public API for checking debt enforcement proceedings
 * 
 * Source: https://www.court.gov.il/hoza
 * Also available via: data.gov.il Open Data Portal
 * Cost: ₪0 (public data)
 * 
 * Data includes: Active debt collection cases, amounts owed, creditors
 */

export interface ExecutionProceeding {
  proceedingNumber: string;   // מספר תיק הוצל"פ
  debtorName: string;          // שם החייב
  debtorId: string;            // ת.ז or ח.פ
  
  creditorName: string;        // שם הזוכה (creditor)
  
  amount: number;              // סכום החוב (₪)
  filingDate: string;          // תאריך פתיחה
  status: 'active' | 'closed' | 'suspended';
  
  executionOffice: string;     // משרד ההוצל"פ
  lastAction?: string;         // פעולה אחרונה
  lastActionDate?: string;
  
  paymentPlan?: {
    hasActivePlan: boolean;
    monthlyPayment?: number;
  };
}

export interface ExecutionSearchResult {
  debtorName: string;
  hpNumber: string;
  
  totalProceedings: number;
  activeProceedings: number;
  totalDebt: number;           // Total amount owed (₪)
  
  proceedings: ExecutionProceeding[];
  
  // Risk indicators
  hasActiveDebt: boolean;
  hasPaymentPlan: boolean;
  averageDebtAge: number;      // Days
  
  lastChecked: string;
  source: 'hotzaa.court.gov.il' | 'data.gov.il';
}

/**
 * Search for execution proceedings against a company
 * 
 * @param hpNumber - Company HP number
 * @param companyName - Hebrew company name (fallback if HP not found)
 * @returns Execution proceedings summary
 */
export async function searchExecutionProceedings(
  hpNumber: string,
  companyName?: string
): Promise<ExecutionSearchResult> {
  try {
    console.log(`Searching execution proceedings for HP: ${hpNumber}`);
    
    // Try data.gov.il first (faster, cached data)
    let proceedings = await searchDataGovIl(hpNumber);
    
    // Fallback to real-time scraping if needed
    if (proceedings.length === 0 && companyName) {
      proceedings = await searchHotzaaPortal(companyName, hpNumber);
    }
    
    // Calculate statistics
    const stats = calculateExecutionStats(proceedings);
    
    return {
      debtorName: companyName || '',
      hpNumber,
      totalProceedings: proceedings.length,
      activeProceedings: proceedings.filter(p => p.status === 'active').length,
      totalDebt: stats.totalDebt,
      proceedings,
      hasActiveDebt: stats.hasActiveDebt,
      hasPaymentPlan: stats.hasPaymentPlan,
      averageDebtAge: stats.averageDebtAge,
      lastChecked: new Date().toISOString(),
      source: 'data.gov.il'
    };
    
  } catch (error) {
    console.error('Error searching execution proceedings:', error);
    return getEmptyExecutionResult(hpNumber, companyName);
  }
}

/**
 * Search data.gov.il Open Data Portal for execution data
 * 
 * Advantage: Fast, no rate limits, updated weekly
 */
async function searchDataGovIl(hpNumber: string): Promise<ExecutionProceeding[]> {
  const DATA_GOV_API = 'https://data.gov.il/api/3/action/datastore_search';
  
  try {
    // Resource ID for Hotzaa LaPoal dataset
    // NOTE: Find actual resource_id at https://data.gov.il/dataset/execution-office
    const RESOURCE_ID = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
    
    const response = await fetch(`${DATA_GOV_API}?resource_id=${RESOURCE_ID}&filters=${JSON.stringify({
      debtor_id: hpNumber
    })}&limit=100`, {
      headers: {
        'User-Agent': 'datagov-external-client TrustCheck/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`data.gov.il returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.result?.records) {
      return [];
    }

    // Transform data.gov.il format to our format
    return data.result.records.map((record: any) => ({
      proceedingNumber: record.case_number || '',
      debtorName: record.debtor_name || '',
      debtorId: record.debtor_id || hpNumber,
      creditorName: record.creditor_name || '',
      amount: parseFloat(record.amount) || 0,
      filingDate: record.filing_date || '',
      status: mapStatus(record.status),
      executionOffice: record.office_name || '',
      lastAction: record.last_action,
      lastActionDate: record.last_action_date
    }));
    
  } catch (error) {
    console.error('Error querying data.gov.il execution data:', error);
    return [];
  }
}

/**
 * Search Hotzaa LaPoal portal (real-time, more accurate)
 * 
 * Rate limit: 1 request per 2 seconds
 */
async function searchHotzaaPortal(
  companyName: string,
  hpNumber: string
): Promise<ExecutionProceeding[]> {
  const HOTZAA_SEARCH_URL = 'https://www.court.gov.il/hoza/Search.aspx';
  
  try {
    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(HOTZAA_SEARCH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'TrustCheck Israel Debt Research/1.0 (contact@trustcheck.co.il)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html'
      },
      body: new URLSearchParams({
        'debtorName': companyName,
        'debtorId': hpNumber
      })
    });

    if (!response.ok) {
      throw new Error(`Hotzaa portal returned ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML results
    const proceedings = parseHotzaaResults(html);
    
    return proceedings;
    
  } catch (error) {
    console.error('Error searching Hotzaa portal:', error);
    return [];
  }
}

/**
 * Parse HTML from Hotzaa portal
 */
function parseHotzaaResults(html: string): ExecutionProceeding[] {
  // TODO: Implement proper HTML parsing
  // Look for table rows with proceeding information
  
  return [];
}

/**
 * Map status string to enum
 */
function mapStatus(status: string): 'active' | 'closed' | 'suspended' {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('פעיל') || statusLower.includes('active')) {
    return 'active';
  }
  if (statusLower.includes('סגור') || statusLower.includes('closed')) {
    return 'closed';
  }
  if (statusLower.includes('מושהה') || statusLower.includes('suspended')) {
    return 'suspended';
  }
  
  return 'active'; // Default
}

/**
 * Calculate execution statistics
 */
function calculateExecutionStats(proceedings: ExecutionProceeding[]): {
  totalDebt: number;
  hasActiveDebt: boolean;
  hasPaymentPlan: boolean;
  averageDebtAge: number;
} {
  let totalDebt = 0;
  let hasActiveDebt = false;
  let hasPaymentPlan = false;
  let totalAgeDays = 0;
  let ageCount = 0;

  for (const proc of proceedings) {
    if (proc.status === 'active') {
      totalDebt += proc.amount;
      hasActiveDebt = true;
    }
    
    if (proc.paymentPlan?.hasActivePlan) {
      hasPaymentPlan = true;
    }
    
    if (proc.filingDate) {
      const filingTime = new Date(proc.filingDate).getTime();
      const now = Date.now();
      const ageDays = (now - filingTime) / (1000 * 60 * 60 * 24);
      totalAgeDays += ageDays;
      ageCount++;
    }
  }

  return {
    totalDebt,
    hasActiveDebt,
    hasPaymentPlan,
    averageDebtAge: ageCount > 0 ? Math.round(totalAgeDays / ageCount) : 0
  };
}

/**
 * Get empty result
 */
function getEmptyExecutionResult(
  hpNumber: string,
  companyName?: string
): ExecutionSearchResult {
  return {
    debtorName: companyName || '',
    hpNumber,
    totalProceedings: 0,
    activeProceedings: 0,
    totalDebt: 0,
    proceedings: [],
    hasActiveDebt: false,
    hasPaymentPlan: false,
    averageDebtAge: 0,
    lastChecked: new Date().toISOString(),
    source: 'data.gov.il'
  };
}

/**
 * Calculate debt severity score (0-100)
 * 
 * Higher score = more serious debt issues
 */
export function calculateDebtSeverity(executionResult: ExecutionSearchResult): number {
  let score = 0;
  
  // Active proceedings add risk
  score += executionResult.activeProceedings * 10;
  
  // Large total debt
  if (executionResult.totalDebt > 500000) score += 30; // > ₪500K
  else if (executionResult.totalDebt > 100000) score += 20; // > ₪100K
  else if (executionResult.totalDebt > 50000) score += 10; // > ₪50K
  
  // Old debt is worse
  if (executionResult.averageDebtAge > 365) score += 20; // > 1 year
  else if (executionResult.averageDebtAge > 180) score += 10; // > 6 months
  
  // Payment plan reduces risk slightly
  if (executionResult.hasPaymentPlan) score -= 10;
  
  return Math.max(0, Math.min(score, 100)); // Clamp to 0-100
}

/**
 * Check if company has critical debt issues
 */
export function hasCriticalDebtIssues(executionResult: ExecutionSearchResult): boolean {
  // Critical if:
  // - More than 3 active proceedings, OR
  // - Total debt > ₪200K, OR
  // - Average debt age > 1 year
  
  return (
    executionResult.activeProceedings > 3 ||
    executionResult.totalDebt > 200000 ||
    executionResult.averageDebtAge > 365
  );
}
