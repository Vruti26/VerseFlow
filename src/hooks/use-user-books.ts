'use client';

import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Book } from '@/lib/types';

// The fetcher function is responsible for getting the data.
const fetcher = async ([, userId]: [string, string]): Promise<Book[]> => {
  if (!userId) {
    return [];
  }

  const q = query(collection(db, 'books'), where('authorId', '==', userId));
  const querySnapshot = await getDocs(q);
  const books: Book[] = [];
  querySnapshot.forEach(doc => {
    books.push({ id: doc.id, ...doc.data() } as Book);
  });

  return books;
};

export function useUserBooks() {
  const { user } = useAuth();

  // useSWR will cache the data and automatically re-fetch it in the background.
  const { data, error, isLoading, mutate } = useSWR(user ? ['user-books', user.uid] : null, fetcher);

  return {
    books: data,
    isLoading,
    isError: error,
    mutate
  };
}
