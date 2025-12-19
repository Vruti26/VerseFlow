'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Book } from '@/lib/types';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const booksCollectionRef = collection(db, 'books');
    const q = query(booksCollectionRef, where('status', '==', 'published'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(booksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching published books: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { books, isLoading };
}
