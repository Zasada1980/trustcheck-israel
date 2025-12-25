/**
 * ICA Justice Portal - Company Owners Scraper
 * 
 * Source: https://ica.justice.gov.il (Israeli Companies Authority)
 * Data: Company ownership structure, shareholders, directors
 * 
 * NO CAPTCHA - Uses JSON API endpoint directly
 */

export interface ICAOwner {
  name: string;
  idNumber?: string;
  ownership?: number; // Percentage
  role?: string; // 'owner' | 'director' | 'both'
}

export interface ICACompanyData {
  hpNumber: string;
  companyName: string;
  owners: ICAOwner[];
  directors: ICAOwner[];
  registrationDate?: string;
  status?: string;
  lastUpdated: string;
}

/**
 * Fetch company ownership data from ICA Justice Portal
 * 
 * @param hpNumber - Israeli company HP number (9 digits)
 * @returns Company ownership structure or null if not found
 */
export async function fetchICAOwners(hpNumber: string): Promise<ICACompanyData | null> {
  try {
    console.log(`[ICA] Fetching owners for HP ${hpNumber}...`);

    // ICA Justice API endpoint (public, no auth required)
    const url = `https://ica.justice.gov.il/GenericCorporarionInfo/SearchCorporation`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrustCheckBot/1.0 (+https://trustcheck.co.il/about/bot)',
      },
      body: JSON.stringify({
        id: hpNumber,
        type: '1', // Company type
      }),
    });

    if (!response.ok) {
      console.log(`[ICA] ❌ HTTP ${response.status} for HP ${hpNumber}`);
      return null;
    }

    const data = await response.json();

    if (!data || !data.CorpName) {
      console.log(`[ICA] ❌ No data found for HP ${hpNumber}`);
      return null;
    }

    // Parse owners and directors
    const owners: ICAOwner[] = [];
    const directors: ICAOwner[] = [];

    // Extract shareholders (בעלי מניות)
    if (data.Shareholders && Array.isArray(data.Shareholders)) {
      for (const shareholder of data.Shareholders) {
        owners.push({
          name: shareholder.Name || 'Unknown',
          idNumber: shareholder.IDNumber,
          ownership: parseFloat(shareholder.SharePercentage) || undefined,
          role: 'owner',
        });
      }
    }

    // Extract directors (דירקטורים)
    if (data.Directors && Array.isArray(data.Directors)) {
      for (const director of data.Directors) {
        directors.push({
          name: director.Name || 'Unknown',
          idNumber: director.IDNumber,
          role: 'director',
        });
      }
    }

    console.log(`[ICA] ✅ Found ${owners.length} owners, ${directors.length} directors`);

    return {
      hpNumber,
      companyName: data.CorpName,
      owners,
      directors,
      registrationDate: data.RegistrationDate,
      status: data.Status,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`[ICA] ❌ Error fetching HP ${hpNumber}:`, error);
    return null;
  }
}

/**
 * Check if company has single owner (higher risk indicator)
 */
export function hasSingleOwner(icaData: ICACompanyData | null): boolean {
  if (!icaData) return false;
  return icaData.owners.length === 1;
}

/**
 * Check if owner is also director (good sign - involved owner)
 */
export function hasOwnerDirector(icaData: ICACompanyData | null): boolean {
  if (!icaData) return false;
  
  const ownerNames = new Set(icaData.owners.map(o => o.name));
  const directorNames = new Set(icaData.directors.map(d => d.name));
  
  for (const ownerName of ownerNames) {
    if (directorNames.has(ownerName)) return true;
  }
  
  return false;
}

/**
 * Calculate company age in years
 */
export function calculateCompanyAge(registrationDate?: string): number | null {
  if (!registrationDate) return null;
  
  const regDate = new Date(registrationDate);
  const now = new Date();
  const ageMs = now.getTime() - regDate.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  
  return Math.floor(ageYears);
}
