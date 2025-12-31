'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserData {
  id: string;
  displayName: string;
  photoURL: string;
}

export default function FollowingList({ userId }: { userId: string }) {
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFollowing = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.following && userData.following.length > 0) {
          const followingPromises = userData.following.map(async (followingId: string) => {
            const followingDocRef = doc(db, 'users', followingId);
            const followingDocSnap = await getDoc(followingDocRef);
            if (followingDocSnap.exists()) {
              const followingData = followingDocSnap.data();
              return { id: followingDocSnap.id, ...followingData } as UserData;
            }
            return null;
          });
          const followingData = await Promise.all(followingPromises);
          setFollowing(followingData.filter(Boolean) as UserData[]);
        }
      }
      setLoading(false);
    };

    fetchFollowing();
  }, [userId]);

  if (loading) {
    return <p>Loading following...</p>;
  }

  return (
    <div>
      {following.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {following.map(user => (
            <Link href={`/profile/${user.id}`} key={user.id}>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors">
                <Avatar>
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>Not following anyone yet.</p>
      )}
    </div>
  );
}
