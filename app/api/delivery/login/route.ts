import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    // Check delivery man credentials
    const { data: deliveryMan, error } = await supabaseAdmin
      .from('delivery_man')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();

    if (error || !deliveryMan) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!deliveryMan.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Please contact admin.' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, deliveryMan.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userId = deliveryMan.id;
    const userName = deliveryMan.name;

    // Generate session token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    // Create session in database
    const { error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .insert({
        user_id: userId,
        user_type: 'delivery',
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: userId,
        phone: deliveryMan.phone,
        name: userName,
        type: 'delivery',
      }
    });

    // Set auth cookies
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    response.cookies.set('user_type', 'delivery', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
