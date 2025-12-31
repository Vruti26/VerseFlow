'use client';

import { Book, User } from '@/lib/types';
import { BookCard } from '@/components/book-card';
import { UserCard } from '@/components/user-card';

interface SearchResultsProps {
  books: Book[];
  users: User[];
  searchQuery: string;
}

export function SearchResults({ books, users, searchQuery }: SearchResultsProps) {
  const hasBooks = books.length > 0;
  const hasUsers = users.length > 0;

  return (
    <div className="mt-10">
      {searchQuery && (
        <h2 className="font-headline text-3xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
      )}

      {hasUsers && (
        <div className="mb-10">
          
        </div>
      )}

      {hasBooks && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {!hasBooks && !hasUsers && searchQuery && (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Results Found</h3>
          <p className="text-muted-foreground mt-2">Your search for "{searchQuery}" did not return any authors or books.</p>
        </div>
      )}
    </div>
  );
}
