'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { SearchBar } from '@/components/search-bar'; 
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import gsap from 'gsap';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const heroTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (isLoading) return;
    gsap.fromTo(heroTextRef.current, 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  }, [isLoading]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading VerseFlow...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative min-h-[150vh] flex flex-col items-center justify-start overflow-hidden bg-background">
      
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140vw] h-[80vh] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent blur-[120px] rounded-full opacity-60 dark:opacity-40" />
      </div>

      <main className="container relative z-10 mx-auto px-4 pt-24 md:pt-32 flex flex-col items-center text-center">
        
        {/* Hero Section */}
        <div ref={heroTextRef} className="opacity-0 mb-20">
          <div className="mb-6 flex justify-center">
             <Badge variant="outline" className="px-4 py-1.5 text-sm rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md shadow-sm">
               <BookOpen className="w-3.5 h-3.5 mr-2 fill-current" />
               Discover
             </Badge>
          </div>

          <h1 className="max-w-6xl mx-auto text-5xl sm:text-6xl md:text-9xl font-headline font-black tracking-tighter leading-[1.1] md:leading-[1] mb-6 text-foreground">
            Welcome to <br className="md:hidden" />
            <span className="relative inline-block md:mt-2">
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-600">
                VerseFlow
              </span>
              <span className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-[20px] md:h-[30px] bg-primary/20 blur-2xl rounded-full" />
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-muted-foreground leading-relaxed font-light">
            Read, write, and connect. The platform where your imagination takes flight.
          </p>
        </div>

        {/* The SearchBar Component */}
        <SearchBar />

        <div className="h-[20vh]" />
      </main>
    </div>
  );
}