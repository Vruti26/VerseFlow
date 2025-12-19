'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function useReadingList(userId?: string) {
  const [readingList, setReadingList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setReadingList([]);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setReadingList(doc.data().readingList || []);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addToReadingList = useCallback(async (bookId: string) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        readingList: arrayUnion(bookId),
      });
      toast({ title: 'Success', description: 'Book added to your reading list.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add book to reading list.' });
    }
  }, [userId, toast]);

  const removeFromReadingList = useCallback(async (bookId: string) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        readingList: arrayRemove(bookId),
      });
      toast({ title: 'Success', description: 'Book removed from your reading list.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove book from reading list.' });
    }
  }, [userId, toast]);

  const isBookInReadingList = useCallback((bookId: string) => {
    return readingList.includes(bookId);
  }, [readingList]);

  return { readingList, isLoading, addToReadingList, removeFromReadingList, isBookInReadingList };
}
