'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Plus, Edit, Eye, Clock } from 'lucide-react';

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
  userId?: string; // Optional: If provided, fetches specific user's works. If undefined, fetches current user's.
}

export default function MyWorks({ userId }: MyWorksProps) {
  const { user: currentUser } = useAuth();
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Determine which User ID to query
  // If a userId prop is passed (public profile), use it. Otherwise use logged-in user (my profile).
  const targetUserId = userId || currentUser?.uid;
  const isOwner = currentUser?.uid === targetUserId;

  useEffect(() => {
    if (!targetUserId) {
        setLoading(false);
        return;
    }

    const fetchBooks = async () => {
      try {
        const booksRef = collection(db, 'books');
        
        // 2. Query Firestore
        // Note: You might need a composite index in Firestore for 'authorId' + 'updatedAt'
        // If the query fails in the console, remove 'orderBy' temporarily.
        const q = query(
            booksRef, 
            where('authorId', '==', targetUserId),
            orderBy('updatedAt', 'desc') 
        );

        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BookData[];

        // 3. Filter visibility
        // If viewing someone else's profile, hide 'draft' status books
        const filteredBooks = isOwner 
            ? booksData 
            : booksData.filter(b => b.status === 'published');

        setBooks(filteredBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [targetUserId, isOwner]);

  // --- LOADING STATE ---
  if (loading) {
    return <MyWorksSkeleton />;
  }

  // --- EMPTY STATE ---
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px]">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <Book className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isOwner ? "You haven't written any stories yet" : "No published stories yet"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
            {isOwner 
                ? "Start your journey as an author. Create your first book and share your world." 
                : "This author hasn't published any work yet. Check back later!"}
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

  // --- BOOK GRID ---
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* "Create New" Card - Only visible to Owner */}
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

        {/* Book Cards */}
        {books.map((book) => (
            <Card key={book.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full">
                
                {/* Cover Area */}
                <div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                    {book.coverImage ? (
                        <div 
                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                            style={{ backgroundImage: `url(${book.coverImage})` }}
                        />
                    ) : (
                        <div className="text-center p-6 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Book className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">No Cover</span>
                        </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        <Badge variant={book.status === 'published' ? 'default' : 'secondary'} className="shadow-sm backdrop-blur-md">
                            {book.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg font-bold group-hover:text-primary transition-colors">
                        {book.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem] leading-relaxed">
                        {book.description || "No description provided."}
                    </p>
                </CardContent>

                <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/50 dark:bg-slate-900/30 mt-auto flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {book.updatedAt ? new Date(book.updatedAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </div>

                    <div className="flex gap-2">
                        {isOwner ? (
                            <Button variant="ghost" size="sm" asChild className="h-8 px-2 hover:text-primary hover:bg-primary/10">
                                <Link href={`/write/${book.id}`}>
                                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                </Link>
                            </Button>
                        ) : (
                            <Button size="sm" asChild className="h-8 px-4 rounded-full text-xs shadow-sm">
                                <Link href={`/read/${book.id}`}>
                                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Read
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        ))}
    </div>
  );
}

function MyWorksSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card text-card-foreground shadow-sm h-[380px] flex flex-col">
                    <Skeleton className="h-48 w-full rounded-t-xl" />
                    <div className="p-6 space-y-4 flex-1">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-8 w-1/3 ml-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
}
