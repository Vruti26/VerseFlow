
import { doc, setDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Updates or creates a user's public profile document in Firestore.
 * This is useful for displaying user information publicly without exposing sensitive auth data.
 * @param userId The ID of the user.
 * @param data The public data to store (e.g., displayName, photoURL).
 */
export const updateUserProfileDocument = async (userId: string, data: { displayName?: string | null; photoURL?: string | null; }) => {
  const userDocRef = doc(db, 'users', userId);
  
  const batch = writeBatch(db);

  batch.set(userDocRef, data, { merge: true });

  if (data.displayName) {
    const booksQuery = query(collection(db, 'books'), where('authorId', '==', userId));
    try {
      const querySnapshot = await getDocs(booksQuery);
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { author: data.displayName });
      });
    } catch (error) {
      console.error("Error updating books for user: ", error);
      throw new Error('Failed to update author names in books.');
    }
  }
  
  await batch.commit();
};
