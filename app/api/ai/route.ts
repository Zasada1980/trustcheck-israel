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
    
    const requestBody = {
      model: process.env.OLLAMA_MODEL || 'trustcheck:15b',
      prompt: `You are TrustCheck AI - expert assistant for verifying Israeli businesses (עוסק פטור, עוסק מורשה, חברות בע"מ).

Context: TrustCheck Israel helps parents and clients verify private businesses (daycares, tutors, services) before payment. We check:
- ח.פ. (Company Number) validity
- Tax compliance (מע"מ status)
- Court cases (תיקים משפטיים)
- Business reliability

User question: ${message}

Instructions:
- Answer in the SAME language as question (Hebrew/Russian/English)
- Be concise (max 100 words)
- If asked about TrustCheck, explain: "We verify Israeli business reliability using government data (data.gov.il, courts)"
- For business checks, suggest using our search feature

Answer:`,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.8,
        top_k: 20,
        num_ctx: 2048,
        num_predict: 150
      }
    };

    console.log('[AI API] Request to:', `${ollamaUrl}/api/generate`);
    console.log('[AI API] Model:', requestBody.model);

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'TrustCheck/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30 sec timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI API] Error response:', response.status, errorText.slice(0, 200));
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    // Get response as text first to debug
    const responseText = await response.text();
    console.log('[AI API] Response length:', responseText.length);
    console.log('[AI API] Response preview:', responseText.slice(0, 100));
    
    // Validate response is not empty
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from Ollama');
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[AI API] JSON parse error:', parseError);
      console.error('[AI API] Failed to parse:', responseText.slice(0, 500));
      
      // Try to parse as NDJSON (streaming format)
      const firstLine = responseText.split('\n')[0];
      try {
        data = JSON.parse(firstLine);
      } catch {
        throw new Error(`Invalid JSON response from Ollama: ${(parseError as Error).message}`);
      }
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
