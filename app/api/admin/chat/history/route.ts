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

export async function GET() {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const historyPath = path.join(process.cwd(), 'data', 'admin_chat_history.json');

    try {
      const data = await fs.readFile(historyPath, 'utf-8');
      const chatHistory = JSON.parse(data);
      return NextResponse.json(chatHistory);
    } catch {
      return NextResponse.json({ messages: [] });
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
