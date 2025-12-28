import { NextResponse } from 'next/server';

export async function GET() {
  // Simplified health check for MVP
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TrustCheck Israel API',
    version: '1.0.0-mvp',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      gemini: !!process.env.GOOGLE_API_KEY,
      checkid: 'limited', // Production mode: Limited mock fallback (real data from PostgreSQL)
      app: true,
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
