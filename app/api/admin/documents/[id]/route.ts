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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const documentsDbPath = path.join(process.cwd(), 'data', 'documents.json');
    const vectorDbPath = path.join(process.cwd(), 'data', 'vector_db.json');

    // Load documents DB
    let documentsDb: any = { documents: [] };
    try {
      const data = await fs.readFile(documentsDbPath, 'utf-8');
      documentsDb = JSON.parse(data);
    } catch {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Find and remove document
    const docIndex = documentsDb.documents.findIndex((d: any) => d.id === id);
    if (docIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = documentsDb.documents[docIndex];

    // Delete physical file
    try {
      await fs.unlink(doc.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Remove from documents DB
    documentsDb.documents.splice(docIndex, 1);
    await fs.writeFile(documentsDbPath, JSON.stringify(documentsDb, null, 2));

    // Remove from vector DB
    try {
      const vectorData = await fs.readFile(vectorDbPath, 'utf-8');
      const vectorDb = JSON.parse(vectorData);
      vectorDb.documents = vectorDb.documents.filter((d: any) => d.metadata.documentId !== id);
      await fs.writeFile(vectorDbPath, JSON.stringify(vectorDb, null, 2));
    } catch (error) {
      console.error('Failed to clean vector DB:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
