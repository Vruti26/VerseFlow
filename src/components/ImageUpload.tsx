
'use client';

import { ChangeEvent, useState } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export default function ImageUpload({ onUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      console.error(
        'Cloudinary cloud name or API key is not configured.'
      );
      setIsUploading(false);
      return;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    try {
      const signatureResponse = await fetch('/api/sign-image', {
        method: 'POST',
        body: JSON.stringify({ paramsToSign: { timestamp } }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { signature } = await signatureResponse.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('signature', signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        const { secure_url } = await uploadResponse.json();
        onUpload(secure_url);
        console.log('Image uploaded successfully:', secure_url);
      } else {
        console.error('Failed to upload image to Cloudinary.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <p>Uploading...</p>}
    </div>
  );
}
