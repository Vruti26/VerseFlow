'use client';

import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Book } from '@/lib/types';

const fetcher = async ([, userId]: [string, string]): Promise<Book[]> => {
  if (!userId) return [];

  const q = query(
    collection(db, 'books'), 
    where('authorId', '==', userId), 
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
};

export function useUserBooks(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.uid;

  const { data, error, isLoading, mutate } = useSWR(id ? ['user-books', id] : null, fetcher);

  return {
    books: data,
    isLoading,
    isError: error,
    mutate
  };
}
