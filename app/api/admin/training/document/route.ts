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

// Create training dataset from document
async function createTrainingDataset(documentId: string): Promise<any[]> {
  try {
    const vectorDbPath = path.join(process.cwd(), 'data', 'vector_db.json');
    
    const data = await fs.readFile(vectorDbPath, 'utf-8');
    const vectorDb = JSON.parse(data);

    // Get all chunks for this document
    const chunks = vectorDb.documents.filter((doc: any) => 
      doc.metadata.documentId === documentId
    );

    // Create Q&A pairs for fine-tuning (simplified)
    const trainingData = chunks.map((chunk: any, idx: number) => ({
      instruction: `Based on the document "${chunk.metadata.title}", answer this question:`,
      input: `What information is available in chunk ${idx + 1}?`,
      output: chunk.content
    }));

    return trainingData;
  } catch (error) {
    console.error('Training dataset creation error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Create training dataset
    const trainingData = await createTrainingDataset(documentId);

    if (trainingData.length === 0) {
      return NextResponse.json({ error: 'No training data available' }, { status: 404 });
    }

    // Save training dataset
    const trainingDir = path.join(process.cwd(), 'data', 'training');
    await fs.mkdir(trainingDir, { recursive: true });

    const datasetPath = path.join(trainingDir, `${documentId}_training.jsonl`);
    const jsonlContent = trainingData
      .map(item => JSON.stringify(item))
      .join('\n');

    await fs.writeFile(datasetPath, jsonlContent);

    // Log training activity
    const trainingLogsPath = path.join(process.cwd(), 'data', 'training_logs.json');
    let trainingLogs: any = { logs: [] };
    
    try {
      const data = await fs.readFile(trainingLogsPath, 'utf-8');
      trainingLogs = JSON.parse(data);
    } catch {
      // File doesn't exist
    }

    trainingLogs.logs.push({
      type: 'document_training',
      documentId,
      samplesGenerated: trainingData.length,
      datasetPath,
      timestamp: new Date().toISOString(),
      status: 'dataset_created'
    });

    await fs.writeFile(trainingLogsPath, JSON.stringify(trainingLogs, null, 2));

    return NextResponse.json({
      success: true,
      samplesGenerated: trainingData.length,
      datasetPath,
      message: 'Training dataset created. Use Ollama modelfile to fine-tune.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Document training error:', error);
    return NextResponse.json(
      { error: 'Training failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
