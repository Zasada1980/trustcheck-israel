import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Simple auth check helper
async function isAuthenticated(request: NextRequest): Promise<boolean> {
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

// RAG - Search in vectorized documents
async function searchDocuments(query: string): Promise<{content: string, source: string}[]> {
  try {
    const vectorDbPath = path.join(process.cwd(), 'data', 'vector_db.json');
    
    try {
      const data = await fs.readFile(vectorDbPath, 'utf-8');
      const vectorDb = JSON.parse(data);

      // Simple keyword search (можно заменить на embedding similarity)
      const queryLower = query.toLowerCase();
      const results = vectorDb.documents
        .filter((doc: any) => 
          doc.content.toLowerCase().includes(queryLower) ||
          doc.metadata.title.toLowerCase().includes(queryLower)
        )
        .slice(0, 3) // Top 3 results
        .map((doc: any) => ({
          content: doc.content.slice(0, 500), // First 500 chars
          source: doc.metadata.title
        }));

      return results;
    } catch {
      return [];
    }
  } catch (error) {
    console.error('RAG search error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Search relevant documents (RAG)
    const relevantDocs = await searchDocuments(message);

    // Build context from documents
    const contextParts: string[] = [];
    if (relevantDocs.length > 0) {
      contextParts.push('Релевантная информация из загруженных документов:');
      relevantDocs.forEach((doc, idx) => {
        contextParts.push(`\n[Документ ${idx + 1}: ${doc.source}]`);
        contextParts.push(doc.content);
      });
    }

    // Build conversation history
    const conversationContext = history?.slice(-5).map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // Call Ollama AI
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b-instruct-q4_K_M';

    const prompt = `SYSTEM: You are a Russian-speaking AI assistant. Answer ONLY in Russian language.

CONTEXT:
${contextParts.length > 0 ? contextParts.join('\n') + '\n\n' : ''}

${conversationContext ? 'История разговора:\n' + conversationContext + '\n\n' : ''}

USER QUESTION: ${message}

RULES:
- Answer in RUSSIAN language ONLY (no Hebrew, no English)
- Be concise and helpful
- If using document context, mention the source
- For technical questions, provide detailed explanations

ASSISTANT (in Russian):`;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 300
        }
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();

    // Save chat history
    try {
      const historyPath = path.join(process.cwd(), 'data', 'admin_chat_history.json');
      await fs.mkdir(path.dirname(historyPath), { recursive: true });

      let chatHistory: any = { messages: [] };
      try {
        const existing = await fs.readFile(historyPath, 'utf-8');
        chatHistory = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      chatHistory.messages.push(
        {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          sources: relevantDocs.map(d => d.source)
        }
      );

      // Keep last 100 messages
      chatHistory.messages = chatHistory.messages.slice(-100);

      await fs.writeFile(historyPath, JSON.stringify(chatHistory, null, 2));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }

    return NextResponse.json({
      response: data.response,
      sources: relevantDocs.map(d => d.source),
      model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: (error as Error).message },
      { status: 500 }
    );
  }
}
