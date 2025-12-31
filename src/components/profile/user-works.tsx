'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, doc, writeBatch, getDocs as getSubDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Book, Plus, Edit, Eye, Clock, Trash2 } from 'lucide-react';

interface BookData {
  id: string;
  title: string;
  description?: string;
  coverImage?: string; 
  status: 'draft' | 'published';
  updatedAt?: any;
  authorId: string;
}

interface MyWorksProps {
  userId?: string;
}

export default function MyWorks({ userId }: MyWorksProps) {
  const { user: currentUser } = useAuth();
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const targetUserId = userId || currentUser?.uid;
  const isOwner = currentUser?.uid === targetUserId;

  const fetchBooks = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    try {
      const booksRef = collection(db, 'books');
      const q = query(
        booksRef, 
        where('authorId', '==', targetUserId),
        orderBy('updatedAt', 'desc') 
      );
      const querySnapshot = await getDocs(q);
      const booksData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BookData[];
      const filteredBooks = isOwner ? booksData : booksData.filter(b => b.status === 'published');
      setBooks(filteredBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [targetUserId, isOwner]);

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this book and all its content?')) return;

    const bookRef = doc(db, 'books', bookId);
    try {
      const batch = writeBatch(db);
      const chaptersRef = collection(bookRef, 'chapters');
      const chaptersSnap = await getSubDocs(chaptersRef);
      chaptersSnap.forEach(doc => batch.delete(doc.ref));
      const reviewsRef = collection(bookRef, 'reviews');
      const reviewsSnap = await getSubDocs(reviewsRef);
      reviewsSnap.forEach(doc => batch.delete(doc.ref));
      batch.delete(bookRef);
      await batch.commit();
      toast({ title: 'Book Deleted', description: 'Your book has been permanently removed.' });
      fetchBooks(); // Re-fetch books to update the UI
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({ variant: 'destructive', title: 'Error Deleting Book' });
    }
  };


  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px]">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <Book className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isOwner ? "You haven\'t written any stories yet" : "No published stories yet"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
            {isOwner 
                ? "Start your journey as an author. Create your first book and share your world." 
                : "This author hasn\'t published any work yet. Check back later!"}
        </p>
        {isOwner && (
            <Button asChild className="mt-6">
                <Link href="/write">
                    <Plus className="mr-2 h-4 w-4" /> Create New Story
                </Link>
            </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isOwner && (
            <Link href="/write" className="group h-full min-h-[300px]">
                <Card className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                    <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-foreground">Create New</h3>
                    <p className="text-sm text-muted-foreground mt-1">Start a new draft</p>
                </Card>
            </Link>
        )}
        {books.map((book) => (
            <Card key={book.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full">
                <div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                    {book.coverImage ? (
                        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${book.coverImage})` }} />
                    ) : (
                        <div className="text-center p-6 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Book className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">No Cover</span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <Badge variant={book.status === 'published' ? 'default' : 'secondary'} className="shadow-sm backdrop-blur-md">
                            {book.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg font-bold group-hover:text-primary transition-colors">{book.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem] leading-relaxed">{book.description || "No description provided."}</p>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/50 dark:bg-slate-900/30 mt-auto flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {book.updatedAt ? new Date(book.updatedAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div className="flex gap-2">
                        {isOwner ? (
                            <>
                                <Button variant="ghost" size="sm" asChild className="h-8 px-2 hover:text-primary hover:bg-primary/10">
                                    <Link href={`/write/${book.id}`}><Edit className="w-3.5 h-3.5 mr-1.5" /> Edit</Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the book "{book.title}" and all of its content. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteBook(book.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete it</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <Button size="sm" asChild className="h-8 px-4 rounded-full text-xs shadow-sm">
                                <Link href={`/read/${book.id}`}><Eye className="w-3.5 h-3.v H-3.5 mr-1.5" /> Read</Link>
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        ))}
    </div>
  );
}
