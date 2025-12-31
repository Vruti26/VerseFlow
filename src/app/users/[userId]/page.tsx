'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import UserProfileTabs from '@/components/profile/user-profile-tabs';

export default function UserProfilePage() {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', userId as string);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as UserProfile);
        } else {
          setError("User not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
  }

  if (error) {
    return <div className="text-center py-20 font-medium text-destructive">{error}</div>;
  }

  if (!userProfile) return null;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <UserProfileTabs userProfile={userProfile} userId={userId as string} />
    </div>
  );
}
