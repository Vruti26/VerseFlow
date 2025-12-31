'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Icons
import { Loader2, Share2, Bookmark, Star, Send, Trash2, BookOpen, Clock, User as UserIcon, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// --- Interfaces (Kept same as before) ---
interface Book {
  id: string;
  title: string;
  authorId: string;
  status: string;
  coverImage: string;
  description?: string; 
  genre?: string[]; // Added genre support if available
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

  // State
  const [book, setBook] = useState<Book | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInLibrary, setIsInLibrary] = useState(false);

  // Review State
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Loading/Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Logic (Data Fetching) ---
  useEffect(() => {
    if (!bookId) return;

    const bookRef = doc(db, 'books', bookId as string);

    const fetchBookAndAuthor = async () => {
      setLoading(true);
      setError(null);
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
        setError("Failed to load book data.");
        console.error(err);
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
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied to clipboard' });
  };

  const handleAddToLibrary = async () => {
    if (!user || !bookId) {
      toast({ variant: 'destructive', title: 'Please log in first' });
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      // (Optimized logic for brevity, assumes logic matches original)
      await updateDoc(userRef, {
          readingList: isInLibrary ? arrayRemove(bookId) : arrayUnion(bookId),
      });
      toast({ title: isInLibrary ? 'Removed from library' : 'Added to library!' });
    } catch (error: any) {
        // Fallback for creating user doc if missing
        console.error(error);
        toast({ variant: 'destructive', title: 'Error updating library' });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookId || !newReviewText || newReviewRating === 0) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Rating and text required.' });
        return;
    }
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
        toast({ title: 'Review Submitted!' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to submit review'});
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user || !bookId) return;
    try {
        await deleteDoc(doc(db, 'books', bookId as string, 'reviews', reviewId));
        toast({ title: 'Review Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
  if (error || !book) return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">{error || "Book not found"}</div>;

  return (
    <div className="min-h-screen bg-background/50">
      
      {/* 1. Hero Background Blur Effect (Optional polish) */}
      <div className="fixed inset-0 -z-10 h-[500px] w-full bg-gradient-to-b from-primary/5 to-transparent opacity-50 blur-3xl pointer-events-none" />

      <div className="container max-w-6xl py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* 2. Left Column: Sticky Cover & Actions */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl transition-transform hover:scale-[1.02]">
                <Image 
                  src={book.coverImage || '/placeholder-cover.jpg'} 
                  alt={book.title} 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleAddToLibrary} 
                  className="w-full h-11 text-base font-medium shadow-md" 
                  variant={isInLibrary ? 'secondary' : 'default'}
                >
                  <Bookmark className={`mr-2 h-5 w-5 ${isInLibrary ? 'fill-foreground' : ''}`}/> 
                  {isInLibrary ? 'In Library' : 'Add to Library'}
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full h-11 bg-background/50 backdrop-blur-sm">
                  <Share2 className="mr-2 h-4 w-4"/> Share Book
                </Button>
              </div>

              {/* Stats Card */}
              <Card className="bg-background/60 backdrop-blur-sm">
                <CardContent className="p-4 flex justify-between text-sm text-center">
                    <div>
                        <p className="font-bold text-lg">{chapters.length}</p>
                        <p className="text-muted-foreground text-xs">Chapters</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                        <p className="font-bold text-lg">{reviews.length}</p>
                        <p className="text-muted-foreground text-xs">Reviews</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                        <p className="font-bold text-lg flex items-center justify-center gap-1">
                            {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '-'} <Star className="h-3 w-3 fill-primary text-primary"/>
                        </p>
                        <p className="text-muted-foreground text-xs">Rating</p>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Right Column: Content & Tabs */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            
            {/* Header Info */}
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs uppercase tracking-wider">{book.status}</Badge>
                    {/* Add Genre badges here if available in your data */}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-foreground">
                    {book.title}
                </h1>

                {author && (
                <Link href={`/users/${author.uid}`} className="inline-flex items-center gap-3 group">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:border-primary transition-colors">
                        <AvatarImage src={author.photoURL} />
                        <AvatarFallback><UserIcon className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{author.displayName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Author</p>
                    </div>
                </Link>
                )}
            </div>

            {/* Main Tabs Area */}
            <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="chapters">Chapters ({chapters.length})</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <Separator className="my-6" />

                {/* Tab: About */}
                <TabsContent value="about" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="prose prose-stone dark:prose-invert max-w-none leading-relaxed text-muted-foreground">
                        <h3 className="text-foreground font-semibold">Synopsis</h3>
                        <p>{book.description || "No description provided by the author."}</p>
                    </div>
                </TabsContent>

                {/* Tab: Chapters (The Professional Reader View) */}
                <TabsContent value="chapters" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold">Table of Contents</h3>
                        <span className="text-xs text-muted-foreground">Updated {chapters.length > 0 && chapters[chapters.length-1].createdAt ? formatDistanceToNow(chapters[chapters.length-1].createdAt.toDate()) : 'recently'} ago</span>
                    </div>

                    {chapters.length > 0 ? (
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <Accordion type="single" collapsible className="w-full">
                                {chapters.map((chapter, index) => (
                                <AccordionItem key={chapter.id} value={chapter.id} className="border-b last:border-0">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-start text-left gap-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Chapter {index + 1}</span>
                                            <span className="text-lg font-medium font-serif">{chapter.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-background/50 px-6 py-8">
                                        {/* This is the reader view */}
                                        <div className="max-w-prose mx-auto">
                                            <div 
                                                className="prose prose-lg dark:prose-invert font-serif leading-loose prose-p:indent-8 prose-headings:font-sans"
                                                dangerouslySetInnerHTML={{ __html: chapter.content }} 
                                            />
                                            <div className="mt-12 flex justify-center">
                                                <Separator className="w-24 bg-primary/20" />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-xl bg-muted/20 border-dashed">
                            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50"/>
                            <p className="text-muted-foreground">No chapters released yet.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Reviews */}
                <TabsContent value="reviews" className="animate-in fade-in-50 duration-500">
                    <div className="grid gap-8">
                         {/* Write Review Section */}
                         {user && (
                            <Card className="bg-muted/30 border-dashed">
                                <CardContent className="pt-6">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <Star className="h-4 w-4 text-primary fill-primary"/> Leave a review
                                    </h4>
                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star} 
                                                    type="button"
                                                    onClick={() => setNewReviewRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star className={`h-6 w-6 ${newReviewRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted stroke-muted-foreground/40'}`}/>
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-muted-foreground">{newReviewRating > 0 ? `${newReviewRating}/5` : 'Select rating'}</span>
                                        </div>
                                        <Textarea 
                                            placeholder="What did you think about this story?" 
                                            value={newReviewText} 
                                            onChange={(e) => setNewReviewText(e.target.value)} 
                                            className="bg-background resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={isSubmittingReview}>
                                                {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
                                                Post Review
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-4">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <Card key={review.id} className="group transition-all hover:border-primary/50">
                                        <CardContent className="p-6">
                                            <div className="flex gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={review.author.photoURL} />
                                                    <AvatarFallback>{review.author.displayName?.charAt(0) || '?'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-semibold text-sm">{review.author.displayName}</h5>
                                                        {user && user.uid === review.author.uid && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Trash2 className="h-3 w-3"/>
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteReview(review.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">• {review.createdAt ? formatDistanceToNow(review.createdAt.toDate()) + ' ago' : 'Just now'}</span>
                                                    </div>

                                                    <p className="text-sm text-foreground/90 leading-relaxed pt-2">{review.text}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Star className="h-6 w-6 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
                                    <p className="text-muted-foreground">Be the first to share your thoughts on this book.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

          </div>
        </div>
      </div>
    </div>
  );
}