'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import UserSearchResults from '@/components/users/user-search-results';
import { Search, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      
      {/* 1. Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24 max-w-5xl">
        
        {/* 2. Hero Header */}
        <div className="text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-medium border border-primary/10 bg-primary/5 text-primary backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 mr-2" />
              Community
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline text-slate-900 dark:text-white">
            Discover <span className=" bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Authors</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Find your favorite writers, explore new voices, and build your literary network.
          </p>
        </div>

        {/* 3. Superb Search Bar */}
        <div className="max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="relative group">
            {/* Glow effect behind input */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-6 h-6 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search by username "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 pl-14 pr-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-lg shadow-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <div className="absolute right-4 animate-pulse">
                    <Sparkles className="w-5 h-5 text-primary/60" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Results Section */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 min-h-[300px]">
            {/* The Search Results Component */}
            {/* Pass a className or wrap it to ensure grid layout looks good */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8">
                <UserSearchResults searchTerm={searchTerm} />
            </div>
        </div>

      </div>
    </div>
  );
}