'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, writeBatch, getDocs } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Book {
    id: string;
    title: string;
    authorId: string;
    chapters: string[];
    coverImage: string;
    status: string;
}

export default function AdminBooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(collection(db, 'books'));
                const snapshotUnsubscribe = onSnapshot(q, (snapshot) => {
                    const booksData: Book[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Book));
                    setBooks(booksData);
                    setLoading(false);
                });
                return () => snapshotUnsubscribe();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, status: string) => {
        const bookRef = doc(db, 'books', id);
        await updateDoc(bookRef, { status });
        toast({ title: 'Success', description: `Book has been ${status}.` });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this book and ALL its content? This action cannot be undone.')) {
            const bookRef = doc(db, 'books', id);
            try {
                const batch = writeBatch(db);

                // Delete all chapters in the subcollection
                const chaptersRef = collection(bookRef, 'chapters');
                const chaptersSnap = await getDocs(chaptersRef);
                chaptersSnap.forEach(doc => batch.delete(doc.ref));

                // Delete all reviews in the subcollection
                const reviewsRef = collection(bookRef, 'reviews');
                const reviewsSnap = await getDocs(reviewsRef);
                reviewsSnap.forEach(doc => batch.delete(doc.ref));

                // Delete the book document itself
                batch.delete(bookRef);

                await batch.commit();

                toast({ 
                    variant: 'destructive', 
                    title: 'Book Deleted', 
                    description: 'The book and all its content have been permanently removed.' 
                });
            } catch (error) {
                console.error("Error deleting book from admin:", error);
                toast({ 
                    variant: 'destructive', 
                    title: 'Error Deleting Book', 
                    description: 'An unexpected error occurred while deleting the book.' 
                });
            }
        }
    };

    

    return (
        <div>
            <h1 className="font-headline text-3xl font-bold mb-6">Book Management</h1>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Chapters</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {books.map(book => (
                            <TableRow key={book.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Image src={book.coverImage || '/placeholder-cover.jpg'} alt={book.title} width={40} height={60} className="rounded-sm object-cover"/>
                                        <span className="font-medium">{book.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {book.status}
                                    </span>
                                </TableCell>
                                <TableCell>{book.chapters?.length || 0}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <Link href={`/books/${book.id}`} passHref><DropdownMenuItem>View Book</DropdownMenuItem></Link>
                                            {book.status !== 'published' &&
                                                <DropdownMenuItem onClick={() => handleStatusChange(book.id, 'published')}>Publish Book</DropdownMenuItem>
                                            }
                                            {book.status === 'published' &&
                                                <DropdownMenuItem onClick={() => handleStatusChange(book.id, 'draft')}>Unpublish Book</DropdownMenuItem>
                                            }
                                            <DropdownMenuItem onClick={() => handleDelete(book.id)} className="text-destructive">Delete Book</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
