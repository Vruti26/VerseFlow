'use client';

import { useState, useEffect } from 'react';
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
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Define the shape of the data passed in
interface UserProfileData {
    displayName?: string | null;
    photoURL?: string | null;
}

// Define the props for the component
interface UpdateProfileInfoFormProps {
    initialData: UserProfileData | null;
}

export default function UpdateProfileInfoForm({ initialData }: UpdateProfileInfoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize state from initialData, falling back to auth user
  const [displayName, setDisplayName] = useState(initialData?.displayName || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(initialData?.photoURL || user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if the initialData or user context changes
  useEffect(() => {
    if (initialData) {
        setDisplayName(initialData.displayName || '');
        setPhotoURL(initialData.photoURL || '');
    } else if (user) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
    }
  }, [initialData, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
        return;
    };

    setIsSaving(true);
    try {
        const newDisplayName = displayName.trim();
        // Check if display name is taken, only if it has changed
        if (newDisplayName !== (initialData?.displayName || user?.displayName)) {
            if (newDisplayName) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("displayName", "==", newDisplayName));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    toast({ variant: 'destructive', title: 'Display Name Taken', description: `The name "${newDisplayName}" is already in use. Please choose another.` });
                    setIsSaving(false);
                    return; // Block the update
                }
            }
        }

      // Create an object with the fields to update
      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      if (newDisplayName !== (user.displayName || '')) {
        profileUpdates.displayName = newDisplayName;
      }
      if (photoURL !== (user.photoURL || '')) {
        profileUpdates.photoURL = photoURL;
      }

      // Only update if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(user, { displayName: newDisplayName, photoURL });
        await updateUserProfileDocument(user.uid, { displayName: newDisplayName, photoURL });
        toast({ title: 'Profile Updated', description: 'Your profile information has been successfully updated.' });
      } else {
        toast({ title: 'No Changes', description: 'There were no changes to save.' });
      }
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
