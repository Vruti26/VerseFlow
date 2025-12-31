'use client';

import { SearchBar } from '@/components/search-bar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-background">
      
      {/* 1. Background Decor (Glow Effects) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

      {/* 2. Main Content Container */}
      <main className="container relative z-10 mx-auto px-4 py-16 flex flex-col items-center text-center">
        
        {/* Badge / Pill */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full mb-6 border border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="w-3 h-3 mr-2 fill-primary" />
              Discover a universe of stories
           </Badge>
        </div>

        {/* 3. Hero Headline */}
        <h1 className="max-w-4xl text-5xl md:text-7xl font-headline font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-100">
          Welcome to the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            VerseFlow Library
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-l md:text-xl text-muted-foreground mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-200">
         
        </p>

        {/* 4. Search Area */}
        <div className="w-full  animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300">
          <div className="p-2 bg-background/60 backdrop-blur-md border rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-white/5">
             <SearchBar />
          </div>
          <br></br>
          
          {/* Quick Links / Popular Genres */}
          {/* <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
             <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Trending:</span>
             {['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller'].map((genre) => (
                <span 
                  key={genre} 
                  className="cursor-pointer hover:text-primary underline decoration-dotted underline-offset-4 transition-colors"
                >
                  {genre}
                </span>
             ))}
          </div> */}
        </div>

      </main>

      {/* 5. Decorative Floating Icons (Optional polish) */}
      <BookOpen className="absolute top-1/4 left-[10%] w-12 h-12 text-primary/10 -rotate-12 animate-pulse" />
      <Sparkles className="absolute top-1/4 right-[10%] w-8 h-8 text-purple-500/20 rotate-12 animate-bounce duration-[3000ms]" />
      
    </div>
  );
}