import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { validateAuthSession } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { session: sessionData, error: sessionError } = await validateAuthSession();
    
    if (sessionError || !sessionData) {
      return sessionError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionData.user_type !== 'super_admin' && sessionData.user_type !== 'canteen') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const folder = formData.get('folder') as string || 'menu-items';
    const imageUrl = await uploadToCloudinary(base64, folder);

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
