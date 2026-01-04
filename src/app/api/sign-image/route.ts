
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const { bookId } = await request.json();

  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const public_id = `books/${bookId}/cover_${timestamp}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        public_id: public_id,
      },
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      signature,
      timestamp,
      public_id,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}
