'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { updateUserProfileDocument } from '@/lib/update-user-profile';

export default function UpdateProfileInfoForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(user, { displayName, photoURL });
      await updateUserProfileDocument(user.uid, { displayName, photoURL });
      toast({ title: 'Profile Updated', description: 'Your profile information has been successfully updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
           <div className="space-y-2">
                <Label>Profile Picture</Label>
                {photoURL && (
                    <div className="relative w-24 h-24 mb-4">
                        <Image
                            src={photoURL}
                            alt="Profile Picture"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-full"
                        />
                    </div>
                )}
                <ImageUpload onUpload={setPhotoURL} />
           </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
