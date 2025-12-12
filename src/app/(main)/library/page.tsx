import { BookCard } from '@/components/book-card';
import { books } from '@/lib/placeholder-data';
import { Library } from 'lucide-react';

export default function LibraryPage() {
  const libraryBooks = books.slice(0, 4);

  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <Library className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-4xl font-bold">My Library</h1>
      </div>
      
      {libraryBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {libraryBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 rounded-lg border-2 border-dashed">
            <h2 className="text-2xl font-semibold">Your library is empty</h2>
            <p className="mt-2 text-muted-foreground">Add books to your library to see them here.</p>
        </div>
      )}
    </div>
  );
}
