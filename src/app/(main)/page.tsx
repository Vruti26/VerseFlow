'use client';

import { SearchBar } from '@/components/search-bar';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-5xl font-bold tracking-tight">Welcome to the Library</h1>
            <p className="text-xl text-muted-foreground mt-2">Discover your next great read.</p>
        </div>
        <SearchBar />
    </main>
  );
}
