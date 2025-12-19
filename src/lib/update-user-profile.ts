
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Updates or creates a user's public profile document in Firestore.
 * This is useful for displaying user information publicly without exposing sensitive auth data.
 * @param userId The ID of the user.
 * @param data The public data to store (e.g., displayName, photoURL).
 */
export const updateUserProfileDocument = async (userId: string, data: { displayName?: string | null; photoURL?: string | null; }) => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, data, { merge: true });
};
