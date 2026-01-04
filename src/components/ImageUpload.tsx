'use client';

import { ChangeEvent, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  bookId: string;
}

export default function ImageUpload({ onUpload, bookId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PNG, JPG, or GIF file.' });
      return;
    }
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload an image smaller than 4MB.' });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get signature from the server
      const response = await fetch('/api/sign-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      });

      const { signature, timestamp, public_id, cloudName, apiKey } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to get upload signature.');
      }

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', apiKey);

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await uploadResponse.json();
      if (uploadResponse.ok && data.secure_url) {
        onUpload(data.secure_url);
        toast({ title: 'Success', description: 'Cover image uploaded successfully.' });
      } else {
        throw new Error(data.error?.message || 'Could not upload the image.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <Label htmlFor="file-upload" className="sr-only">Choose file</Label>
      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/png, image/jpeg, image/gif"
          className="flex-grow file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline" size="icon" className="flex-shrink-0">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="sr-only">Upload</span>
        </Button>
      </div>
      {isUploading && <p className="text-xs text-muted-foreground mt-2">Uploading, please wait...</p>}
    </div>
  );
}
