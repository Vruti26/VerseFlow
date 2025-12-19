'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookCard } from '@/components/book-card';
import { Book } from '@/lib/types';

interface UserProfile {
    displayName: string;
    photoURL?: string;
    createdAt: any; // Assuming it exists from user document
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
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

          // Fetch user's published books
          const booksQuery = query(
            collection(db, 'books'), 
            where("authorId", "==", userId),
            where("status", "==", "published")
          );
          const booksSnap = await getDocs(booksQuery);
          const booksData = booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
          setUserBooks(booksData);

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
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-24 w-24">
            <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />
            <AvatarFallback>{userProfile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-headline text-3xl font-bold">{userProfile.displayName}</h1>
          {/* Assuming you might want to show this - requires adding it to the user doc */}
          {/* <p className="text-muted-foreground">Member since {new Date(userProfile.createdAt?.toDate()).toLocaleDateString()}</p> */}
        </div>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">Published Works</h2>
        {userBooks.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
        ) : (
            <p className="text-muted-foreground">This author hasn't published any books yet.</p>
        )}
      </div>
    </div>
  );
}
