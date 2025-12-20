'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, where, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Share2, Bookmark, BookOpen, Star, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInLibrary, setIsInLibrary] = useState(false);

  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, () => {
        setLoading(false);
    });
    
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


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied!' });
  };

  const handleAddToLibrary = async () => {
    if (!user || !bookId) {
      toast({ variant: 'destructive', title: 'Please log in first' });
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          readingList: isInLibrary
            ? arrayRemove(bookId as string)
            : arrayUnion(bookId as string),
        });
        toast({ title: isInLibrary ? 'Removed from library' : 'Added to library!' });
      } else {
        if (!isInLibrary) {
          await setDoc(userRef, {
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            readingList: [bookId as string],
          });
          toast({ title: 'Added to library!' });
        } else {
            await setDoc(userRef, {
                displayName: user.displayName || 'Anonymous',
                photoURL: user.photoURL || '',
                readingList: [],
            });
        }
      }
    } catch (error: any) {
      console.error("Error updating library:", error);
      toast({
        variant: 'destructive',
        title: 'Error updating library',
        description: error.message,
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookId || !newReviewText || newReviewRating === 0) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a rating and a review text.' });
        return;
    }
    setIsSubmittingReview(true);
    try {
        const reviewsCol = collection(db, 'books', bookId as string, 'reviews');
        await addDoc(reviewsCol, {
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
        const reviewRef = doc(db, 'books', bookId as string, 'reviews', reviewId);
        await deleteDoc(reviewRef);
        toast({ title: 'Review Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to delete review' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
  }

  if (error) {
    return <div className="text-center py-20 font-medium text-lg px-4">{error}</div>;
  }
  
  if (!book) return null;

  return (
    <div className="container py-8 md:py-12">
      <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <Image src={book.coverImage || '/placeholder-cover.jpg'} alt={book.title} width={300} height={450} className="w-full h-auto rounded-md shadow-lg"/>
              <CardTitle className="text-2xl font-bold font-headline pt-4">{book.title}</CardTitle>
              {author && (
                 <Link href={`/users/${author.uid}`} className="hover:underline">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={author.photoURL} />
                            <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{author.displayName}</span>
                    </div>
                </Link>
              )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">{book.description || "No description available."}</p>
                <Button onClick={handleAddToLibrary} className="w-full mb-2" variant={isInLibrary ? 'secondary' : 'default'}>
                    <Bookmark className="mr-2 h-4 w-4"/> {isInLibrary ? 'In Library' : 'Add to Library'}
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4"/> Share
                </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3 space-y-8">
            <div className="prose prose-lg max-w-none">
                <h2 className="flex items-center text-3xl font-bold font-headline mb-6">
                    <BookOpen className="mr-3 h-8 w-8"/> Chapters
                </h2>
                {chapters.length > 0 ? (
                    chapters.map((chapter, index) => (
                        <details key={chapter.id} className="mb-4" open={index === 0}> 
                            <summary className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors">{chapter.title}</summary>
                            <div className="mt-2 pl-4 border-l-2 border-gray-200" dangerouslySetInnerHTML={{ __html: chapter.content }} />
                        </details>
                    ))
                ) : (
                     <p>This book doesn't have any chapters yet.</p>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reviews & Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                    {user && (
                        <form onSubmit={handleSubmitReview} className="space-y-4 mb-8">
                            <div className="flex items-center gap-2">
                                <p>Your Rating:</p>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`cursor-pointer h-6 w-6 ${newReviewRating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} onClick={() => setNewReviewRating(star)}/>
                                ))}
                            </div>
                            <Textarea placeholder="Write your review..." value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} rows={4}/>
                            <Button type="submit" disabled={isSubmittingReview}>
                                {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Submit
                            </Button>
                        </form>
                    )}
                    <div className="space-y-6">
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.author.photoURL} />
                                        <AvatarFallback>{review.author.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className='w-full'>
                                        <div className="flex items-center justify-between">
                                            <div className='flex items-center gap-2'>
                                                <p className="font-semibold">{review.author.displayName}</p>
                                                <div className="flex items-center">
                                                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current"/>)}
                                                    {[...Array(5 - review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-gray-300"/>)}
                                                </div>
                                            </div>
                                            {user && user.uid === review.author.uid && (
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete your review.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{new Date(review.createdAt?.toDate()).toLocaleDateString()}</p>
                                        <p className="mt-2">{review.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
