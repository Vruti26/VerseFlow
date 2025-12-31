'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useBooks } from '@/hooks/use-books';
import { useUsers } from '@/hooks/use-users';
import { Book, User } from '@/lib/types';
import { SearchResults } from '@/components/search-results';

export function SearchBar() {
  const { books, isLoading: booksLoading } = useBooks();
  const { users, isLoading: usersLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      
      const bookResults = books.filter(book => 
        book.title.toLowerCase().includes(lowercasedQuery) ||
        (book.author && book.author.toLowerCase().includes(lowercasedQuery)) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
      );
      setFilteredBooks(bookResults);

      const userResults = users.filter(user => 
        user.displayName.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredUsers(userResults);

    } else {
      setFilteredBooks(books);
      setFilteredUsers(users);
    }
  }, [searchQuery, books, users]);

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
      
      {booksLoading || usersLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary"/>
        </div>
      ) : (
        <SearchResults 
          books={filteredBooks} 
          users={filteredUsers} 
          searchQuery={searchQuery} 
        />
      )}
    </div>
  );
}
