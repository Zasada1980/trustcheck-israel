/**
 * Courts System (Net HaMishpat) Integration
 * 
 * Free public search for legal cases involving businesses
 * 
 * Source: https://www.court.gov.il/NGCS.Web.Site/HomePage.aspx
 * Cost: ₪0 (public data)
 * Rate limit: ~30 requests/hour (soft limit, use responsibly)
 * 
 * Legal: Public information under Freedom of Information Act (חוק חופש המידע)
 */

export interface LegalCase {
  caseNumber: string;        // מספר תיק
  caseType: string;          // סוג תיק (civil, commercial, criminal, etc.)
  court: string;             // בית המשפט
  filingDate: string;        // תאריך הגשה
  status: 'active' | 'closed' | 'pending';
  
  // Parties
  plaintiff?: string;        // תובע
  defendant?: string;        // נתבע
  
  // Details
  subject?: string;          // נושא התביעה
  amount?: number;           // סכום (if applicable)
  lastUpdate?: string;
  
  // Links
  caseUrl?: string;
}

export interface CourtSearchResult {
  companyName: string;
  hpNumber: string;
  totalCases: number;
  activeCases: number;
  closedCases: number;
  cases: LegalCase[];
  
  // Statistics
  civilCases: number;
  commercialCases: number;
  bankruptcyCases: number;    // פשיטת רגל
  liquidationCases: number;   // פירוק חברה
  
  totalAmountClaimed?: number;
  lastChecked: string;
  source: 'court.gov.il';
}

/**
 * Search for legal cases involving a company
 * 
 * @param companyName - Hebrew company name
 * @param hpNumber - Company HP number (optional, improves accuracy)
 * @returns Court cases summary
 */
export async function searchLegalCases(
  companyName: string,
  hpNumber?: string
): Promise<CourtSearchResult> {
  try {
    console.log(`Searching legal cases for: ${companyName}`);
    
    // Step 1: Search by company name
    const searchResults = await performCourtSearch(companyName);
    
    // Step 2: Filter results by HP number if provided
    const filteredCases = hpNumber
      ? filterCasesByHpNumber(searchResults, hpNumber)
      : searchResults;
    
    // Step 3: Categorize cases
    const categorized = categorizeCases(filteredCases);
    
    return {
      companyName,
      hpNumber: hpNumber || '',
      totalCases: filteredCases.length,
      activeCases: filteredCases.filter(c => c.status === 'active').length,
      closedCases: filteredCases.filter(c => c.status === 'closed').length,
      cases: filteredCases,
      ...categorized,
      lastChecked: new Date().toISOString(),
      source: 'court.gov.il'
    };
    
  } catch (error) {
    console.error('Error searching legal cases:', error);
    return getEmptyCourtResult(companyName, hpNumber);
  }
}

/**
 * Perform search on Net HaMishpat portal
 * 
 * IMPORTANT: Respect rate limits (1 request per 2 seconds)
 */
async function performCourtSearch(companyName: string): Promise<LegalCase[]> {
  const COURT_SEARCH_URL = 'https://www.court.gov.il/NGCS.Web.Site/SearchByCase.aspx';
  
  try {
    // Add 2-second delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(COURT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'TrustCheck Israel Legal Research/1.0 (contact@trustcheck.co.il)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html'
      },
      body: new URLSearchParams({
        'partyName': companyName,
        'caseType': '',  // All types
        'courtType': '', // All courts
      })
    });

    if (!response.ok) {
      throw new Error(`Court portal returned ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract case information
    const cases = parseCourtSearchResults(html);
    
    return cases;
    
  } catch (error) {
    console.error('Error performing court search:', error);
    return [];
  }
}

/**
 * Parse HTML response from court portal
 * 
 * Note: This is a simplified parser. Real implementation needs
 * proper HTML parsing library (cheerio/jsdom) and error handling.
 */
function parseCourtSearchResults(html: string): LegalCase[] {
  // TODO: Implement proper HTML parsing
  // Look for table rows with case information
  // Extract: case number, type, court, parties, date, status
  
  // Placeholder - return empty array until parser is implemented
  return [];
}

/**
 * Filter cases by HP number mentioned in case details
 */
function filterCasesByHpNumber(cases: LegalCase[], hpNumber: string): LegalCase[] {
  return cases.filter(c => {
    const plaintiffMatch = c.plaintiff?.includes(hpNumber);
    const defendantMatch = c.defendant?.includes(hpNumber);
    return plaintiffMatch || defendantMatch;
  });
}

/**
 * Categorize cases by type
 */
function categorizeCases(cases: LegalCase[]): {
  civilCases: number;
  commercialCases: number;
  bankruptcyCases: number;
  liquidationCases: number;
  totalAmountClaimed?: number;
} {
  let civilCases = 0;
  let commercialCases = 0;
  let bankruptcyCases = 0;
  let liquidationCases = 0;
  let totalAmount = 0;

  for (const c of cases) {
    // Categorize by Hebrew keywords in case type
    const typeHebrew = c.caseType.toLowerCase();
    
    if (typeHebrew.includes('אזרחי')) civilCases++;
    if (typeHebrew.includes('מסחרי')) commercialCases++;
    if (typeHebrew.includes('פשיטת רגל')) bankruptcyCases++;
    if (typeHebrew.includes('פירוק')) liquidationCases++;
    
    if (c.amount) totalAmount += c.amount;
  }

  return {
    civilCases,
    commercialCases,
    bankruptcyCases,
    liquidationCases,
    totalAmountClaimed: totalAmount > 0 ? totalAmount : undefined
  };
}

/**
 * Get empty result structure
 */
function getEmptyCourtResult(companyName: string, hpNumber?: string): CourtSearchResult {
  return {
    companyName,
    hpNumber: hpNumber || '',
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    cases: [],
    civilCases: 0,
    commercialCases: 0,
    bankruptcyCases: 0,
    liquidationCases: 0,
    lastChecked: new Date().toISOString(),
    source: 'court.gov.il'
  };
}

/**
 * Check if company is in bankruptcy proceedings
 */
export async function checkBankruptcyStatus(
  companyName: string,
  hpNumber?: string
): Promise<{
  isBankrupt: boolean;
  bankruptcyCases: LegalCase[];
}> {
  const searchResult = await searchLegalCases(companyName, hpNumber);
  
  const bankruptcyCases = searchResult.cases.filter(c =>
    c.caseType.includes('פשיטת רגל') || c.caseType.includes('פירוק')
  );
  
  return {
    isBankrupt: bankruptcyCases.some(c => c.status === 'active'),
    bankruptcyCases
  };
}

/**
 * Get litigation risk score (0-100)
 * 
 * Higher score = more litigation risk
 */
export function calculateLitigationRisk(courtResult: CourtSearchResult): number {
  let score = 0;
  
  // Active cases add risk
  score += courtResult.activeCases * 10;
  
  // Bankruptcy cases are critical
  score += courtResult.bankruptcyCases * 30;
  score += courtResult.liquidationCases * 30;
  
  // Large amounts add risk
  if (courtResult.totalAmountClaimed) {
    if (courtResult.totalAmountClaimed > 1000000) score += 20; // > ₪1M
    else if (courtResult.totalAmountClaimed > 100000) score += 10; // > ₪100K
  }
  
  // Commercial cases are more serious than civil
  score += courtResult.commercialCases * 5;
  
  return Math.min(score, 100); // Cap at 100
}
