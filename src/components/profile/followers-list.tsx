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

export default function FollowersList({ userId }: { userId: string }) {
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.followers && userData.followers.length > 0) {
          const followerPromises = userData.followers.map(async (followerId: string) => {
            const followerDocRef = doc(db, 'users', followerId);
            const followerDocSnap = await getDoc(followerDocRef);
            if (followerDocSnap.exists()) {
              const followerData = followerDocSnap.data();
              return { id: followerDocSnap.id, ...followerData } as UserData;
            }
            return null;
          });
          const followersData = await Promise.all(followerPromises);
          setFollowers(followersData.filter(Boolean) as UserData[]);
        }
      }
      setLoading(false);
    };

    fetchFollowers();
  }, [userId]);

  if (loading) {
    return <p>Loading followers...</p>;
  }

  return (
    <div>
      {followers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {followers.map(follower => (
            <Link href={`/profile/${follower.id}`} key={follower.id}>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors">
                <Avatar>
                  <AvatarImage src={follower.photoURL} />
                  <AvatarFallback>{follower.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{follower.displayName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>No followers yet.</p>
      )}
    </div>
  );
}
