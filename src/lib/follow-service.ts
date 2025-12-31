import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const followUser = async (followerId: string, followeeId: string) => {
  const followerRef = doc(db, 'users', followerId);
  const followeeRef = doc(db, 'users', followeeId);

  await updateDoc(followerRef, {
    following: arrayUnion(followeeId)
  });

  await updateDoc(followeeRef, {
    followers: arrayUnion(followerId)
  });
};

export const unfollowUser = async (followerId: string, followeeId: string) => {
  const followerRef = doc(db, 'users', followerId);
  const followeeRef = doc(db, 'users', followeeId);

  await updateDoc(followerRef, {
    following: arrayRemove(followeeId)
  });

  await updateDoc(followeeRef, {
    followers: arrayRemove(followerId)
  });
};
