'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useUserBooks } from '@/hooks/use-user-books';
import { Book } from '@/lib/types';

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge"

function DeleteBookDialog({ book, onBookDeleted }: { book: Book, onBookDeleted: () => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'books', book.id));
            toast({ title: 'Success', description: `Book "${book.title}" has been deleted.` });
            onBookDeleted(); // This will trigger a re-fetch in the parent
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete book.' });
            console.error("Error deleting book: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your book
                        and remove all of its content from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function BookList({ books, isLoading, onBookDeleted }: { books: Book[] | undefined, isLoading: boolean, onBookDeleted: () => void }) {
  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!books || books.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium">No books yet!</h3>
        <p className="text-sm text-muted-foreground">Start your writing journey by creating a new book.</p>
        <Button asChild className="mt-4"><Link href="/write">Create New Book</Link></Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map(book => (
        <Card key={book.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate font-headline">{book.title}</CardTitle>
            <CardDescription className="h-10 overflow-hidden text-ellipsis">{book.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <Badge variant={book.status === 'draft' ? 'outline' : 'default'}>{book.status}</Badge>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <Button asChild variant="secondary" className="flex-1">
                <Link href={`/write/${book.id}`}>
                    <BookOpen className="mr-2 h-4 w-4"/> Editor
                </Link>
            </Button>
            <DeleteBookDialog book={book} onBookDeleted={onBookDeleted} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


export default function MyWorks() {
  const { books, isLoading, mutate } = useUserBooks();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h2 className="text-2xl font-bold font-headline">My Authored Works</h2>
            <p className="text-sm text-muted-foreground">A list of all the books you have created.</p>
        </div>
         <Button asChild><Link href="/write">Create New Book</Link></Button>
      </div>
      <BookList books={books} isLoading={isLoading} onBookDeleted={mutate} />
    </div>
  );
}
