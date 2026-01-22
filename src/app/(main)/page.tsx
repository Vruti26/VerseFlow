'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { SearchBar } from '@/components/search-bar'; 
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2, Megaphone, X, ArrowRight, Calendar } from 'lucide-react';
import gsap from 'gsap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Types ---
interface AnnouncementData {
  content: string;
  title?: string;
  details?: string;
  date?: string;
  link?: string;
}

// --- Simplified Announcement Banner (No Dependencies) ---
const AnnouncementBanner = () => {
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docRef = doc(db, 'announcements', 'latest');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const announcement = docSnap.data() as AnnouncementData;
          const announcementId = announcement.date || announcement.title || announcement.content; // Use content as fallback ID
          const dismissedId = typeof window !== 'undefined' ? localStorage.getItem('verseflow_announcement_dismissed') : null;

          if (dismissedId !== announcementId) {
            setData(announcement);
            setIsDismissed(false);
            setTimeout(() => setIsVisible(true), 500);
          }
        }
      } catch (error) {
        console.error("Announcement fetch error:", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (data) {
      const announcementId = data.date || data.title || data.content;
      localStorage.setItem('verseflow_announcement_dismissed', announcementId);
    }
  };

  if (isDismissed || !data) return null;

  return (
    <>
      {/* --- THE STICKY BANNER --- */}
      <div 
        className={`fixed top-20 left-0 right-0 z-40 mx-auto w-full max-w-4xl px-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative overflow-hidden rounded-full bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 opacity-50" />
          
          <div className="relative flex items-center justify-between py-2 px-3 sm:px-4">
            
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-inner">
                 <Megaphone className="h-4 w-4 text-white animate-pulse" />
              </div>
              
              <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-purple-500/20 px-1.5 rounded-sm border border-purple-500/30">
                        New
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-md">
                        {data.title || data.content}
                    </span>
                  </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pl-2">
               <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group whitespace-nowrap"
               >
                  Learn more <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
               </button>

               <div className="w-[1px] h-4 bg-white/10" />

               <button 
                  onClick={handleDismiss}
                  className="group rounded-full p-1 hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
               >
                  <X className="h-4 w-4 text-slate-400 group-hover:text-white" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CUSTOM MODAL (No External Dependencies) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 pb-2">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Update</span>
                   {data.date && (
                     <span className="text-xs text-slate-500 flex items-center gap-1">
                       <Calendar className="h-3 w-3" /> {data.date}
                     </span>
                   )}
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                   <X className="h-5 w-5" />
                 </button>
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">{data.title || 'Announcement'}</h2>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-2 text-sm leading-relaxed text-slate-300 space-y-4 max-h-[60vh] overflow-y-auto">
                {(data.details || data.content || '').split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 flex justify-end gap-3 bg-[#020617]/50">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
               >
                 Close
               </button>
               {data.link && (
                 <a 
                   href={data.link} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-lg shadow-lg"
                 >
                    Visit Page <ArrowRight className="h-4 w-4" />
                 </a>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Main Home Component ---
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
        
        {/* Banner rendered here */}
        <AnnouncementBanner />

        {/* Hero Section */}
        <div ref={heroTextRef} className="opacity-0 mb-20 mt-8">
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