import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change in production
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // Create session
    const session = {
      authenticated: true,
      expiresAt: Date.now() + SESSION_DURATION
    };

    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000
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
