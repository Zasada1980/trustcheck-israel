import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) return false;

    const session = JSON.parse(sessionCookie.value);
    return session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

// Fetch and extract text from URL
async function scrapeUrl(url: string): Promise<{ content: string; title: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Simple HTML text extraction (remove tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return {
      content: textContent.slice(0, 5000), // First 5000 chars
      title
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 });
    }

    const vectorDbPath = path.join(process.cwd(), 'data', 'vector_db.json');
    const trainingLogsPath = path.join(process.cwd(), 'data', 'training_logs.json');

    // Scrape all URLs
    const results = await Promise.all(
      urls.slice(0, 10).map(url => scrapeUrl(url)) // Max 10 URLs per batch
    );

    const successfulScrapes = results.filter(r => r !== null);

    if (successfulScrapes.length === 0) {
      return NextResponse.json({ error: 'Failed to scrape any URLs' }, { status: 500 });
    }

    // Add scraped content to vector DB
    let vectorDb: any = { documents: [] };
    try {
      const data = await fs.readFile(vectorDbPath, 'utf-8');
      vectorDb = JSON.parse(data);
    } catch {
      // File doesn't exist
    }

    // Vectorize scraped content
    successfulScrapes.forEach((scrape) => {
      if (!scrape) return;

      // Chunk into smaller pieces
      const chunkSize = 500;
      for (let i = 0; i < scrape.content.length; i += chunkSize) {
        vectorDb.documents.push({
          content: scrape.content.slice(i, i + chunkSize),
          metadata: {
            documentId,
            title: scrape.title,
            source: 'web_scraping',
            scrapedAt: new Date().toISOString(),
            chunkIndex: Math.floor(i / chunkSize)
          }
        });
      }
    });

    await fs.writeFile(vectorDbPath, JSON.stringify(vectorDb, null, 2));

    // Log training activity
    let trainingLogs: any = { logs: [] };
    try {
      const data = await fs.readFile(trainingLogsPath, 'utf-8');
      trainingLogs = JSON.parse(data);
    } catch {
      // File doesn't exist
    }

    trainingLogs.logs.push({
      type: 'url_training',
      documentId,
      urlsProcessed: successfulScrapes.length,
      totalUrls: urls.length,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    await fs.writeFile(trainingLogsPath, JSON.stringify(trainingLogs, null, 2));

    return NextResponse.json({
      success: true,
      urlsProcessed: successfulScrapes.length,
      totalUrls: urls.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('URL training error:', error);
    return NextResponse.json(
      { error: 'Training failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
