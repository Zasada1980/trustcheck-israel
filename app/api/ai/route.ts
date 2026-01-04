import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini_chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, system } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Использовать Gemini для генерации ответа
    const response = await generateChatResponse(prompt, system);

    return NextResponse.json({
      response: response,
      model: 'gemini-2.0-flash',
      created_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI API Error:', error);

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      model: 'gemini-2.0-flash',
      provider: 'Google Gemini',
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Cannot connect to Gemini' },
      { status: 503 }
    );
  }
}
