'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useBooks } from '@/hooks/use-books'; // We will create this hook
import { BookCard } from '@/components/book-card';
import { Book } from '@/lib/types';

export function SearchBar() {
  const { books, isLoading } = useBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const results = books.filter(book => 
        book.title.toLowerCase().includes(lowercasedQuery) ||
        (book.author && book.author.toLowerCase().includes(lowercasedQuery)) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
      );
      setFilteredBooks(results);
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for books, authors, or tags..."
          className="w-full rounded-full bg-background pl-12 pr-4 py-6 text-lg shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="mt-10">
        <h2 className="font-headline text-3xl font-bold mb-6">{searchQuery ? 'Search Results' : 'Discover Books'}</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
          </div>
        ) : (
            filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                    {filteredBooks.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
             ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No Results Found</h3>
                    <p className="text-muted-foreground mt-2">Your search for "{searchQuery}" did not return any books.</p>
                </div>
            )
        )}
      </div>
    </div>
  );
}
