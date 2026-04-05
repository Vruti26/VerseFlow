'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import UserSearchResults from '@/components/users/user-search-results';
import { Search, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !user) {
    return (
        <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading community...</p>
            </div>
        </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect message, but useEffect should handle it
  }

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col items-center justify-start">
      
      {/* Uniform Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[180vw] h-[60vh] md:w-[140vw] md:h-[80vh] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent blur-[80px] md:blur-[120px] rounded-full opacity-60 dark:opacity-40" />
      </div>

      <div className="container relative z-10 mx-auto max-w-5xl px-4 pt-24 md:pt-32">
        
        {/* Hero Header */}
        <div className="text-center space-y-6 md:space-y-8 mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-center">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border-primary/20 bg-primary/5 text-primary backdrop-blur-md shadow-sm">
              <Users className="w-3.5 h-3.5 mr-2 fill-current" />
              Community
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-headline font-black tracking-tighter leading-[1.1] text-foreground">
             Discover <br className="hidden md:block" />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-600">
               Authors & Readers
             </span>
          </h1>
          
          <p className="text-base md:text-xl text-muted-foreground max-w-md md:max-w-2xl mx-auto leading-relaxed">
            Find your favorite writers, explore new voices, and build your literary network.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="max-w-2xl mx-auto mb-10 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="relative group px-2 md:px-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[1.5rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-500 hidden md:block" />
            
            <div className="relative flex items-center">
              <Search className="absolute left-4 md:left-5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 md:h-14 pl-12 md:pl-14 pr-6 rounded-2xl border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-xl text-base md:text-lg shadow-xl focus:ring-0 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 min-h-[300px] mb-20">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-3xl md:rounded-[2rem] p-4 md:p-8 shadow-sm">
                <UserSearchResults searchTerm={searchTerm} />
            </div>
        </div>

      </div>
    </div>
  );
}
