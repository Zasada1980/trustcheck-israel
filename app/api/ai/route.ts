// Local Ollama AI endpoint for TrustCheck
// Replaces Gemini API with trained local model

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call local Ollama model via Tunnel
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'trustcheck:15b',
        prompt: `You are TrustCheck AI - expert assistant for verifying Israeli businesses (עוסק פטור, עוסק מורשה, חברות בע"מ).

Context: TrustCheck Israel helps parents and clients verify private businesses (daycares, tutors, services) before payment. We check:
- ח.פ. (Company Number) validity
- Tax compliance (מע"מ status)
- Court cases (תיקים משפטיים)
- Business reliability

User question: ${message}

Instructions:
- Answer in the SAME language as question (Hebrew/Russian/English)
- Be concise and professional
- If asked about TrustCheck, explain: "We verify Israeli business reliability using government data (data.gov.il, courts)"
- For business checks, suggest using our search feature

Answer:`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.8,
          top_k: 20,
          num_ctx: 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    // Ollama может вернуть streaming даже с stream:false - обрабатываем оба случая
    const responseText = await response.text();
    
    // Если ответ пустой или не JSON
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from Ollama');
    }

    // Пробуем распарсить как JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Если не JSON, возможно streaming - берём первую строку
      const firstLine = responseText.split('\n')[0];
      data = JSON.parse(firstLine);
    }
    
    return Response.json({
      message: data.response || 'No response from model',
      model: 'qwen2.5-1.5b-local',
      timestamp: new Date().toISOString(),
      tokens: data.eval_count || 0
    });
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('AI API error:', err);
    
    return Response.json(
      { 
        error: 'AI service unavailable',
        details: err.message,
        fallback: 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
}
