
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function verifyIdToken(token: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const user = data.users?.[0];
    return user ? { uid: user.localId } : null;
  } catch (error) {
    console.error('Error verifying ID token with Firebase REST API:', error);
    return null;
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Authorization header is missing' }, { status: 401 });
  }

  const token = authorization.split('Bearer ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Bearer token is missing' }, { status: 401 });
  }

  const decodedUser = await verifyIdToken(token);
  if (!decodedUser) {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }

  const userId = decodedUser.uid;

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const public_id = `users/${userId}/profile_${timestamp}`;

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
