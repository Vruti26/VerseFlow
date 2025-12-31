'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    Share2, Bookmark, Star, Send, Trash2, 
    BookOpen, Clock, User as UserIcon, Settings, 
    ChevronLeft, ChevronRight, Moon, Sun, Type 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Book {
  id: string;
  title: string;
  authorId: string;
  status: string;
  coverImage: string;
  description?: string; 
}

interface Author {
    uid: string;
    displayName: string;
    photoURL?: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

interface Review {
    id: string;
    author: Author;
    rating: number;
    text: string;
    createdAt: any;
}

export default function PublicBookPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review State
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reader Settings State
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  // --- Data Fetching (Same as before) ---
  useEffect(() => {
    if (!bookId) return;
    const bookRef = doc(db, 'books', bookId as string);

    const fetchBookAndAuthor = async () => {
      setLoading(true);
      try {
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) {
          const bookData = bookSnap.data() as Omit<Book, 'id'>;
          if (bookData.status === 'published') {
            setBook({ id: bookSnap.id, ...bookData });
            if (bookData.authorId) {
              const userRef = doc(db, 'users', bookData.authorId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                setAuthor({ uid: bookData.authorId, ...userSnap.data() } as Author);
              }
            }
          } else {
            setError(`This book is not published.`);
          }
        } else {
          setError(`Book not found.`);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load book.");
      }
    };

    fetchBookAndAuthor();

    const chaptersQuery = query(collection(bookRef, 'chapters'), orderBy('createdAt'));
    const chaptersUnsubscribe = onSnapshot(chaptersQuery, (snapshot) => {
      const chaptersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
      setChapters(chaptersData);
    }, () => setLoading(false));
    
    const reviewsQuery = query(collection(bookRef, 'reviews'), orderBy('createdAt', 'desc'));
    const reviewsUnsubscribe = onSnapshot(reviewsQuery, async (snapshot) => {
        const reviewsData: Review[] = [];
        for (const reviewDoc of snapshot.docs) {
            const reviewData = reviewDoc.data();
            const userRef = doc(db, 'users', reviewData.authorId);
            const userSnap = await getDoc(userRef);
            const authorData = userSnap.exists() ? { uid: reviewData.authorId, ...userSnap.data() } as Author : { uid: 'anon', displayName: 'Anonymous' };
            reviewsData.push({ id: reviewDoc.id, author: authorData, ...reviewData } as Review);
        }
        setReviews(reviewsData);
        setLoading(false);
    });

    return () => {
      chaptersUnsubscribe();
      reviewsUnsubscribe();
    };
  }, [bookId]);

  // Check Library Status
  useEffect(() => {
    if (!user || !bookId) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
        const readingList = snap.data()?.readingList || [];
        setIsInLibrary(readingList.includes(bookId as string));
    });
    return () => unsubscribe();
  }, [user, bookId]);

  // --- Handlers ---
  const handleAddToLibrary = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in' });
        return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userRef, {
            readingList: isInLibrary ? arrayRemove(bookId) : arrayUnion(bookId),
        });
        toast({ title: isInLibrary ? 'Removed from library' : 'Added to library!' });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error updating library' });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied' });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReviewText || newReviewRating === 0) return;
    setIsSubmittingReview(true);
    try {
        await addDoc(collection(db, 'books', bookId as string, 'reviews'), {
            authorId: user.uid,
            rating: newReviewRating,
            text: newReviewText,
            createdAt: serverTimestamp()
        });
        setNewReviewText('');
        setNewReviewRating(0);
        toast({ title: 'Review Submitted' });
    } catch {
        toast({ variant: 'destructive', title: 'Failed to submit' });
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
        await deleteDoc(doc(db, 'books', bookId as string, 'reviews', reviewId));
        toast({ title: 'Review Deleted' });
    } catch {
        toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  // --- Reader Functions ---
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goToNextChapter = () => {
    if (activeChapterIndex !== null && activeChapterIndex < chapters.length - 1) {
        setActiveChapterIndex(activeChapterIndex + 1);
        scrollToTop();
    }
  };

  const goToPrevChapter = () => {
    if (activeChapterIndex !== null && activeChapterIndex > 0) {
        setActiveChapterIndex(activeChapterIndex - 1);
        scrollToTop();
    }
  };

  // Determine Reader Classes based on Theme
  const getReaderClasses = () => {
      switch(readerTheme) {
          case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636]';
          case 'dark': return 'bg-[#1a1a1a] text-[#d1d1d1]';
          default: return 'bg-white text-slate-900';
      }
  };

  
  if (error || !book) return <div className="flex h-screen items-center justify-center">{error}</div>;

  // --- RENDER: READER MODE (If a chapter is active) ---
  if (activeChapterIndex !== null) {
      const chapter = chapters[activeChapterIndex];
      return (
          <div className={`min-h-screen flex flex-col transition-colors duration-300 ${getReaderClasses()}`}>
              
              {/* Sticky Reading Toolbar */}
              <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 backdrop-blur-md bg-inherit/80">
                  <Button variant="ghost" size="sm" onClick={() => setActiveChapterIndex(null)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back to Book
                  </Button>
                  
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-medium hidden sm:inline-block">
                          Chapter {activeChapterIndex + 1} of {chapters.length}
                      </span>
                      
                      {/* Reader Settings Popover */}
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Settings className="w-5 h-5" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 space-y-6">
                             
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                      <Type className="w-4 h-4" />
                                      <span className="text-xs">{fontSize}px</span>
                                  </div>
                                  <Slider 
                                      value={[fontSize]} 
                                      min={14} max={32} step={1} 
                                      onValueChange={(val) => setFontSize(val[0])} 
                                  />
                              </div>
                          </PopoverContent>
                      </Popover>
                  </div>
              </div>

              {/* Reading Content */}
              <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 sm:px-8 md:py-16">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 leading-tight">
                      {chapter.title}
                  </h1>
                  
                  <div 
                      className="font-serif prose prose-lg max-w-none focus:outline-none"
                      style={{ 
                          fontSize: `${fontSize}px`, 
                          lineHeight: lineHeight,
                          // Override prose colors for dynamic theme support
                          color: 'inherit',
                          '--tw-prose-body': 'inherit',
                          '--tw-prose-headings': 'inherit',
                          '--tw-prose-bold': 'inherit',
                      } as React.CSSProperties}
                      dangerouslySetInnerHTML={{ __html: chapter.content }}
                  />
              </main>

              {/* Navigation Footer */}
              <div className="py-12 border-t border-black/5 dark:border-white/5 mt-auto">
                  <div className="max-w-3xl mx-auto px-6 flex justify-between items-center">
                      <Button 
                          variant="ghost" 
                          onClick={goToPrevChapter} 
                          disabled={activeChapterIndex === 0}
                          className="gap-2"
                      >
                          <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>
                      
                      <span className="text-sm opacity-50">
                          {Math.round(((activeChapterIndex + 1) / chapters.length) * 100)}% Completed
                      </span>

                      <Button 
                          variant={activeChapterIndex === chapters.length - 1 ? "secondary" : "default"}
                          onClick={goToNextChapter}
                          disabled={activeChapterIndex === chapters.length - 1} // Or change to "Finish" action
                          className="gap-2"
                      >
                          Next <ChevronRight className="w-4 h-4" />
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: DEFAULT BOOK LANDING PAGE ---
  return (
    <div className="min-h-screen bg-background/50 pb-20">
      {/* (Same Hero/Left Column as previous response, keeping it concise here) */}
      <div className="container max-w-6xl py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column (Cover) */}
          <div className="lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-6">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-xl">
                    <Image src={book.coverImage || '/placeholder.jpg'} alt={book.title} fill className="object-cover" />
                </div>
                <div className="space-y-3">
                    {/* Primary Action: Read First Chapter */}
                    {chapters.length > 0 && (
                        <Button onClick={() => setActiveChapterIndex(0)} className="w-full h-12 text-lg shadow-lg">
                            <BookOpen className="mr-2 h-5 w-5" /> Start Reading
                        </Button>
                    )}
                    <Button onClick={handleAddToLibrary} variant={isInLibrary ? 'secondary' : 'outline'} className="w-full">
                        <Bookmark className="mr-2 h-4 w-4" /> {isInLibrary ? 'In Library' : 'Add to Library'}
                    </Button>
                    <Button onClick={handleShare} variant="ghost" className="w-full">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
             </div>
          </div>

          {/* Right Column (Details) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
             <div>
                 <h1 className="text-4xl font-extrabold font-serif mb-2">{book.title}</h1>
                 {author && (
                     <div className="flex items-center gap-2 text-muted-foreground">
                         <Avatar className="h-6 w-6"><AvatarImage src={author.photoURL} /></Avatar>
                         <span>By <Link href={`/users/${author.uid}`} className="underline hover:text-primary">{author.displayName}</Link></span>
                     </div>
                 )}
             </div>

             <Tabs defaultValue="chapters" className="w-full">
                 <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
                     <TabsTrigger value="chapters" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Chapters</TabsTrigger>
                     <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">About</TabsTrigger>
                     <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-- py-2">Reviews</TabsTrigger>
                 </TabsList>

                 <TabsContent value="chapters" className="mt-6 space-y-2">
                     {chapters.length > 0 ? (
                         chapters.map((chapter, idx) => (
                             <Card 
                                key={chapter.id} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                                onClick={() => setActiveChapterIndex(idx)}
                             >
                                 <CardContent className="p-4 flex justify-between items-center">
                                     <div>
                                         <p className="text-xs font-medium text-muted-foreground uppercase">Chapter {idx + 1}</p>
                                         <h3 className="text-lg font-medium">{chapter.title}</h3>
                                     </div>
                                     <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                                 </CardContent>
                             </Card>
                         ))
                     ) : (
                         <div className="text-center py-10 text-muted-foreground">No chapters published yet.</div>
                     )}
                 </TabsContent>

                 <TabsContent value="about" className="mt-6">
                     <p className="leading-relaxed text-lg text-muted-foreground">{book.description}</p>
                 </TabsContent>

                 <TabsContent value="reviews" className="mt-6">
                     {/* (Insert existing Reviews UI here for brevity) */}
                     {/* Use the Review Form & List from previous response */}
                     <div className="space-y-6">
                        {user && (
                            <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                <h4 className="font-semibold">Write a Review</h4>
                                <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`h-5 w-5 cursor-pointer ${newReviewRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} onClick={() => setNewReviewRating(s)}/>)}</div>
                                <Textarea value={newReviewText} onChange={e => setNewReviewText(e.target.value)} placeholder="Your thoughts..." />
                                <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>Post</Button>
                            </div>
                        )}
                        {reviews.map(r => (
                            <div key={r.id} className="border-b pb-4">
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{r.author.displayName}</span>
                                        <div className="flex"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400"/><span className="text-xs ml-1">{r.rating}</span></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(r.createdAt?.toDate() || new Date())} ago</span>
                                </div>
                                <p className="mt-2 text-sm">{r.text}</p>
                            </div>
                        ))}
                     </div>
                 </TabsContent>
             </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}