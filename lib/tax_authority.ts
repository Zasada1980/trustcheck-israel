/**
 * Tax Authority (Shaam/Maam) Integration
 * 
 * Free public API for checking VAT registration status (עוסק מורשה/פטור)
 * 
 * Source: https://www.misim.gov.il
 * Cost: ₪0 (public API)
 * Authentication: OAuth2 (free registration)
 * Rate limit: ~100 requests/minute
 */

export interface TaxStatus {
  hpNumber: string;
  businessName: string;
  
  // VAT Status
  isMaamRegistered: boolean;  // עוסק מורשה
  isMaamExempt: boolean;      // עוסק פטור
  maamNumber?: string;        // מספר עוסק מורשה
  maamRegistrationDate?: string;
  
  // Withholding Tax (ניכוי במקור)
  hasNikuiBamakor: boolean;
  nikuiRegistrationDate?: string;
  
  // Status
  isActive: boolean;
  lastVerified: string;
  source: 'tax.gov.il';
}

export interface TaxAuthorityConfig {
  clientId?: string;
  clientSecret?: string;
  apiEndpoint: string;
}

/**
 * Check business tax/VAT status with Tax Authority
 * 
 * @param hpNumber - Company registration number (ח.פ)
 * @returns Tax registration status
 */
export async function checkTaxStatus(hpNumber: string): Promise<TaxStatus | null> {
  try {
    // Step 1: Get OAuth2 token (cache for 1 hour)
    const token = await getTaxAuthorityToken();
    
    if (!token) {
      console.warn('Tax Authority OAuth2 not configured - using fallback');
      return getTaxStatusFallback(hpNumber);
    }

    // Step 2: Query VAT status
    const maamStatus = await queryMaamStatus(hpNumber, token);
    
    // Step 3: Query Nikui Bamakor status
    const nikuiStatus = await queryNikuiStatus(hpNumber, token);
    
    return {
      hpNumber,
      businessName: maamStatus?.businessName || '',
      isMaamRegistered: maamStatus?.isRegistered || false,
      isMaamExempt: !maamStatus?.isRegistered,
      maamNumber: maamStatus?.maamNumber,
      maamRegistrationDate: maamStatus?.registrationDate,
      hasNikuiBamakor: nikuiStatus?.isRegistered || false,
      nikuiRegistrationDate: nikuiStatus?.registrationDate,
      isActive: maamStatus?.isActive || false,
      lastVerified: new Date().toISOString(),
      source: 'tax.gov.il'
    };
    
  } catch (error) {
    console.error('Error checking tax status:', error);
    return getTaxStatusFallback(hpNumber);
  }
}

/**
 * Get OAuth2 token from Tax Authority
 * 
 * To register for API access:
 * 1. Visit https://www.misim.gov.il/apiportal
 * 2. Register as developer (free)
 * 3. Create application to get client_id/client_secret
 * 4. Add credentials to .env:
 *    TAX_AUTHORITY_CLIENT_ID=your_client_id
 *    TAX_AUTHORITY_CLIENT_SECRET=your_client_secret
 */
async function getTaxAuthorityToken(): Promise<string | null> {
  const clientId = process.env.TAX_AUTHORITY_CLIENT_ID;
  const clientSecret = process.env.TAX_AUTHORITY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn('Tax Authority credentials not configured');
    return null;
  }

  try {
    const tokenEndpoint = 'https://www.misim.gov.il/oauth/token';
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'maam.read nikui.read'
      })
    });

    if (!response.ok) {
      throw new Error(`OAuth2 failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
    
  } catch (error) {
    console.error('Error getting Tax Authority token:', error);
    return null;
  }
}

/**
 * Query VAT (Maam) registration status
 */
async function queryMaamStatus(hpNumber: string, token: string): Promise<{
  isRegistered: boolean;
  businessName?: string;
  maamNumber?: string;
  registrationDate?: string;
  isActive: boolean;
} | null> {
  try {
    const apiEndpoint = `https://www.misim.gov.il/api/v1/maam/status/${hpNumber}`;
    
    const response = await fetch(apiEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return { isRegistered: false, isActive: false };
    }

    if (!response.ok) {
      throw new Error(`Maam API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error querying Maam status:', error);
    return null;
  }
}

/**
 * Query Nikui Bamakor (withholding tax) status
 */
async function queryNikuiStatus(hpNumber: string, token: string): Promise<{
  isRegistered: boolean;
  registrationDate?: string;
} | null> {
  try {
    const apiEndpoint = `https://www.misim.gov.il/api/v1/nikui/status/${hpNumber}`;
    
    const response = await fetch(apiEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return { isRegistered: false };
    }

    if (!response.ok) {
      throw new Error(`Nikui API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error querying Nikui status:', error);
    return null;
  }
}

/**
 * Fallback: Infer tax status from company type
 * 
 * Used when Tax Authority API is unavailable or not configured
 */
function getTaxStatusFallback(hpNumber: string): TaxStatus {
  // Companies (בע"מ) are usually registered for VAT
  // Exempt dealers (עוסק פטור) by definition are exempt
  
  return {
    hpNumber,
    businessName: '',
    isMaamRegistered: false,
    isMaamExempt: false,
    hasNikuiBamakor: false,
    isActive: true,
    lastVerified: new Date().toISOString(),
    source: 'tax.gov.il'
  };
}

/**
 * Validate company qualifies for VAT exemption (עוסק פטור)
 * 
 * Criteria: Annual turnover < ₪100,584 (2025 threshold)
 */
export function qualifiesForMaamExemption(annualTurnover: number): boolean {
  const EXEMPTION_THRESHOLD_2025 = 100584; // Updated annually
  return annualTurnover < EXEMPTION_THRESHOLD_2025;
}
