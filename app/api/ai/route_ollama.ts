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

    // Call local Ollama model
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b-instruct-q4_K_M',
        prompt: `You are TrustCheck AI assistant for Israeli business verification.

User question: ${message}

Answer in the same language as the question (Hebrew/Russian/English). Be helpful and concise.`,
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

    const data = await response.json();
    
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
