import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // Default: admin
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days for persistent session

export async function POST(request: NextRequest) {
  try {
    const { password, rememberMe = true } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // Create persistent session
    const sessionDuration = rememberMe ? SESSION_DURATION : 24 * 60 * 60 * 1000;
    const session = {
      authenticated: true,
      username: 'admin',
      expiresAt: Date.now() + sessionDuration
    };

    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to 'lax' for better compatibility
      maxAge: sessionDuration / 1000,
      path: '/'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка аутентификации' },
      { status: 500 }
    );
  }
}
