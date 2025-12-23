/**
 * Bank of Israel - Restricted Accounts (Mugbalim) Integration
 * 
 * Free public data source - daily updated list of accounts restricted
 * due to bounced checks (10+ returned checks).
 * 
 * Source: https://www.boi.org.il/he/DataAndStatistics/Pages/Hashbonot-Mugbalim.aspx
 * Cost: ₪0 (public data)
 * Update frequency: Daily
 */

export interface MugbalimRecord {
  id: string;           // ID number (תעודת זהות or ח.פ)
  name: string;         // Full name (Hebrew)
  type: 'individual' | 'business';
  restrictionDate: string;  // Date restriction started
  bank?: string;        // Bank that imposed restriction
  status: 'active' | 'removed';
}

export interface MugbalimCheckResult {
  isRestricted: boolean;
  records: MugbalimRecord[];
  lastUpdated: string;
  source: 'boi.org.il';
  disclaimer?: string;  // User-facing explanation when data unavailable
}

/**
 * Check if HP number or ID is in Bank of Israel restricted accounts list
 * 
 * @param idNumber - Company HP number or personal ID (ח.פ or ת.ז)
 * @returns Mugbalim status with details
 */
export async function checkMugbalimStatus(idNumber: string): Promise<MugbalimCheckResult> {
  try {
    // Import PostgreSQL pool (only when needed)
    const { pool } = await import('./db/postgres');
    
    // Query PostgreSQL cache (updated daily via scheduled job)
    const query = `
      SELECT 
        id_number,
        name_hebrew,
        name_english,
        restriction_date,
        bank_name,
        reason,
        last_updated
      FROM boi_mugbalim
      WHERE id_number = $1
      ORDER BY restriction_date DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [idNumber]);
    
    if (result.rows.length === 0) {
      // Not found in restricted accounts list (good news!)
      // NOTE: BOI removed public CSV access (2024/2025), so database may be empty
      return {
        isRestricted: false,
        records: [],
        lastUpdated: new Date().toISOString(),
        source: 'boi.org.il',
        disclaimer: 'נתוני הגבלות בנקאיות אינם זמינים כרגע. מומלץ לבדוק ישירות בבנק ישראל.'  // Bank restriction data unavailable
      };
    }

    // Found restriction(s) - transform PostgreSQL rows to MugbalimRecord format
    const records: MugbalimRecord[] = result.rows.map(row => ({
      id: row.id_number,
      name: row.name_hebrew || row.name_english || 'Unknown',
      type: 'business',  // Assume business for now (TODO: distinguish individual vs company)
      restrictionDate: row.restriction_date.toISOString().split('T')[0], // YYYY-MM-DD
      bank: row.bank_name,
      status: 'active' as const
    }));

    return {
      isRestricted: true,
      records,
      lastUpdated: result.rows[0]?.last_updated?.toISOString() || new Date().toISOString(),
      source: 'boi.org.il'
    };

  } catch (error: any) {
    console.error('[BOI Mugbalim] Error checking status:', error.message);
    
    // Graceful fallback on error (don't block user)
    return {
      isRestricted: false,
      records: [],
      lastUpdated: new Date().toISOString(),
      source: 'boi.org.il',
      disclaimer: 'שירות בדיקת הגבלות בנקאיות זמנית לא פעיל.'  // Bank restriction check temporarily unavailable
    };
  }
}

/**
 * Download and parse Bank of Israel Mugbalim file
 * 
 * This function should be called daily via cron job to update local cache.
 * File format: ZIP containing Excel/CSV with Hebrew text (Windows-1255 encoding)
 * 
 * @returns Number of records imported
 */
export async function downloadMugbalimData(): Promise<number> {
  const BOI_URL = 'https://www.boi.org.il/PublicApi/GetFile?id=HashbonotMugbalim';
  
  try {
    console.log('Downloading Mugbalim data from Bank of Israel...');
    
    const response = await fetch(BOI_URL, {
      headers: {
        'User-Agent': 'TrustCheck Israel/1.0 (contact@trustcheck.co.il)',
        'Accept': 'application/zip, application/vnd.ms-excel'
      }
    });

    if (!response.ok) {
      throw new Error(`BOI API returned ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // TODO: Parse ZIP file, extract CSV/Excel
    // TODO: Convert Windows-1255 to UTF-8
    // TODO: Import into PostgreSQL boi_mugbalim table
    // TODO: Mark old records as 'removed' if not present in new file
    
    console.log('Mugbalim data downloaded successfully');
    return 0; // Return actual count after implementation
    
  } catch (error) {
    console.error('Error downloading Mugbalim data:', error);
    throw error;
  }
}

/**
 * Get Mugbalim statistics from cache
 */
export async function getMugbalimStats(): Promise<{
  totalRestricted: number;
  businesses: number;
  individuals: number;
  lastUpdated: string;
}> {
  try {
    const { pool } = await import('./db/postgres');
    
    const query = `
      SELECT 
        COUNT(*) as total_restricted,
        MAX(last_updated) as last_updated
      FROM boi_mugbalim
    `;
    
    const result = await pool.query(query);
    const row = result.rows[0];
    
    return {
      totalRestricted: parseInt(row.total_restricted) || 0,
      businesses: 0,  // TODO: Add type column to distinguish
      individuals: 0,
      lastUpdated: row.last_updated?.toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('[BOI Mugbalim] Error getting stats:', error);
    return {
      totalRestricted: 0,
      businesses: 0,
      individuals: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}
