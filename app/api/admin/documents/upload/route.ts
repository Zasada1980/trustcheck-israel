import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  const urls = text.match(urlRegex) || [];
  return [...new Set(urls)]; // Remove duplicates
}

// Extract text from different file types
async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  try {
    if (ext === '.txt' || ext === '.md') {
      return buffer.toString('utf-8');
    } else if (ext === '.pdf') {
      // Simple PDF text extraction (fallback - just extract visible text)
      const text = buffer.toString('utf-8');
      // Remove binary junk, keep readable text
      return text.replace(/[^\x20-\x7E\n\r\u0590-\u05FF\u0400-\u04FF]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
    } else if (ext === '.doc' || ext === '.docx') {
      // Basic DOCX extraction (XML-based)
      const text = buffer.toString('utf-8');
      return text.replace(/[^\x20-\x7E\n\r\u0590-\u05FF\u0400-\u04FF]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
    } else {
      // Fallback: try to extract any text
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\u0590-\u05FF\u0400-\u04FF]/g, ' ');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    return buffer.toString('utf-8');
  }
}

// Vectorize text for RAG (simple chunking + metadata)
function vectorizeDocument(text: string, metadata: any): any[] {
  const chunkSize = 500; // characters
  const chunks: any[] = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push({
      content: text.slice(i, i + chunkSize),
      metadata: {
        ...metadata,
        chunkIndex: chunks.length
      }
    });
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique ID
    const id = crypto.randomUUID();
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    const vectorDbPath = path.join(process.cwd(), 'data', 'vector_db.json');
    const documentsDbPath = path.join(process.cwd(), 'data', 'documents.json');

    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, `${id}_${file.name}`);
    await writeFile(filePath, buffer);

    // Extract text
    const text = await extractTextFromFile(buffer, file.name);

    // Extract URLs
    const urls = extractUrls(text);

    // Create document metadata
    const document = {
      id,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      filePath: filePath,
      status: 'ready',
      vectorized: true,
      urlsExtracted: urls,
      textLength: text.length
    };

    // Save to documents DB
    let documentsDb: any = { documents: [] };
    try {
      const data = await (await import('fs/promises')).readFile(documentsDbPath, 'utf-8');
      documentsDb = JSON.parse(data);
    } catch {
      // File doesn't exist
    }

    documentsDb.documents.push(document);
    await writeFile(documentsDbPath, JSON.stringify(documentsDb, null, 2));

    // Vectorize and save to vector DB
    const chunks = vectorizeDocument(text, {
      documentId: id,
      title: file.name,
      uploadedAt: document.uploadedAt
    });

    let vectorDb: any = { documents: [] };
    try {
      const data = await (await import('fs/promises')).readFile(vectorDbPath, 'utf-8');
      vectorDb = JSON.parse(data);
    } catch {
      // File doesn't exist
    }

    vectorDb.documents.push(...chunks);
    await writeFile(vectorDbPath, JSON.stringify(vectorDb, null, 2));

    return NextResponse.json({
      id,
      name: file.name,
      size: file.size,
      uploadedAt: document.uploadedAt,
      status: 'ready',
      vectorized: true,
      urlsExtracted: urls,
      textLength: text.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
