'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { BookCard } from '@/components/book-card';
import { Book } from '@/lib/types';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function EmptyReadingList() {
    return (
        <div className="border-2 border-dashed rounded-lg p-8 text-center mt-8">
            <h3 className="text-xl font-semibold font-headline">Your Reading List is Empty</h3>
            <p className="text-sm text-muted-foreground mt-2">You haven\'t added any books to your reading list yet. Browse the library and add some stories!</p>
            <Button asChild className="mt-4">
                <Link href="/">Browse Books</Link>
            </Button>
      </div>
    )
}

function NoResults({ searchTerm, clearSearch }: { searchTerm: string, clearSearch: () => void }) {
    return (
        <div className="border-2 border-dashed rounded-lg p-8 text-center mt-8">
            <h3 className="text-xl font-semibold font-headline">No Books Found</h3>
            <p className="text-sm text-muted-foreground mt-2">No books matching "<b>{searchTerm}</b>" were found in your reading list.</p>
            <Button variant="outline" onClick={clearSearch} className="mt-4">Clear Search</Button>
      </div>
    )
}

function useReadingList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (userSnap) => {
      setIsLoading(true);
      setError(null);
      const userData = userSnap.data();
      const readingListIds = userData?.readingList || [];

      if (readingListIds.length === 0) {
        setBooks([]);
        setIsLoading(false);
        return;
      }

      const bookPromises = readingListIds.map((bookId: string) => getDoc(doc(db, 'books', bookId)));

      try {
        const bookSnaps = await Promise.all(bookPromises);
        const fetchedBooks = bookSnaps
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() } as Book));
        
        setBooks(fetchedBooks);
      } catch (e) {
        console.error("Error fetching reading list:", e);
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
        console.error("Snapshot error:", err);
        setError(err);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { books, isLoading, error };
}

export default function ReadingList() {
  const { books, isLoading, error } = useReadingList();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBooks = books.filter((book) => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(lowercasedFilter) ||
      (book.author && book.author.toLowerCase().includes(lowercasedFilter)) ||
      (book.tags && book.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter)))
    );
  });

  const handleClearSearch = () => setSearchTerm('');


  return (
    <div className="space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold font-headline">My ReadingList</h2>
                <p className="text-sm text-muted-foreground">Books you\'ve saved to read later.</p>
            </div>
            {books.length > 0 && (
                <div className="w-full max-w-xs">
                    <Input 
                        placeholder="Search your reading list..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
        </div>

        {!isLoading && error && (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md">Error loading your reading list. Please try again later.</div>
        )}

        {!isLoading && !error && (
            <> 
                {books.length === 0 ? (
                    <EmptyReadingList />
                ) : searchTerm && filteredBooks.length === 0 ? (
                    <NoResults searchTerm={searchTerm} clearSearch={handleClearSearch} />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredBooks.map(book => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
  );
}
