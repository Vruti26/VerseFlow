'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send, PlusCircle, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';

const RichTextEditor = dynamic(() => 
  import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), 
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-4 border rounded-md min-h-[300px]">Loading Editor...</div>
  }
);

interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export default function BookEditorPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chapterCreationTriggered = useRef(false);

  useEffect(() => {
    if (!bookId || !user) {
      if (!user && !loading) router.push('/login');
      return;
    }

    const bookRef = doc(db, 'books', bookId as string);
    const unsubscribe = onSnapshot(bookRef, async (snap) => {
      if (snap.exists()) {
        const bookData = snap.data();
        if (bookData.authorId === user.uid) {
          setBook({ id: snap.id, ...bookData });
          setError(null);
        } else {
          setError("You don't have permission to edit this book.");
        }
        setLoading(false);
      } else {
        try {
          await setDoc(bookRef, {
            title: "Untitled Book",
            authorId: user.uid,
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            coverImage: ''
          });
        } catch (err) {
          console.error("Failed to create new book:", err);
          setError("There was an error creating your book.");
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Book snapshot error:", err);
      setError("An error occurred while loading the book.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookId, user, router]);

  useEffect(() => {
    if (!book) return;

    const chaptersQuery = query(collection(db, 'books', bookId as string, 'chapters'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(chaptersQuery, async (snapshot) => {
      if (snapshot.empty && !chapterCreationTriggered.current) {
        chapterCreationTriggered.current = true;
        try {
          await addDoc(collection(db, 'books', bookId as string, 'chapters'), {
            title: "Chapter 1",
            content: "<p>Start your story here...</p>",
            createdAt: serverTimestamp()
          });
        } catch (err) {
           console.error("Failed to create initial chapter:", err);
           toast({ variant: 'destructive', title: 'Error', description: 'Could not create the first chapter.' });
        }
      } else {
        const chapterData: Chapter[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
        setChapters(chapterData);
        setActiveChapter(prev => chapterData.find(c => c.id === prev?.id) || chapterData[0] || null);
      }
    });

    return () => unsubscribe();
  }, [book, bookId, toast]);

  const handleCoverImageUpload = (url: string) => {
    setBook((prev: any) => ({ ...prev, coverImage: url }));
    toast({ title: 'Cover Image Updated!' });
  };

  const handleSaveDraft = async (options: { controlSavingState: boolean } = { controlSavingState: true }) => {
    if (!bookId || !activeChapter) return;
    if (options.controlSavingState) setSaving(true);
    try {
        const chapterRef = doc(db, 'books', bookId as string, 'chapters', activeChapter.id);
        await updateDoc(chapterRef, { title: activeChapter.title, content: activeChapter.content });
        const bookRef = doc(db, 'books', bookId as string);
        await updateDoc(bookRef, { 
            updatedAt: serverTimestamp(), 
            title: book.title,
            coverImage: book.coverImage || ''
        });
        toast({ title: 'Saved!' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
    } finally {
        if (options.controlSavingState) setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!bookId || !activeChapter) return;
    if (!book.coverImage) {
        toast({ variant: 'destructive', title: 'Missing Cover Image', description: 'Please upload a cover image before publishing.' });
        return;
    }
    setSaving(true);
    try {
        await handleSaveDraft({ controlSavingState: false });
        const bookRef = doc(db, 'books', bookId as string);
        await updateDoc(bookRef, { 
            status: 'published',
            updatedAt: serverTimestamp(),
        });

        toast({ title: book.status === 'published' ? 'Changes Published!' : 'Book Published!' });
        router.push(`/profile`);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Publishing', description: e.message });
    } finally {
        setSaving(false);
    }
  };
  
  const handleNewChapter = async () => {
    if (!bookId) return;
    try {
      await addDoc(collection(db, 'books', bookId as string, 'chapters'), {
        title: `Chapter ${chapters.length + 1}`,
        content: '<p>Start writing...</p>',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create new chapter.' });
    }
  };

    const handleDeleteBook = async () => {
        if (!bookId) return;
        try {
            await deleteDoc(doc(db, 'books', bookId as string));
            toast({ title: 'Book Deleted', description: 'Your book has been permanently removed.' });
            router.push('/profile');
        } catch (error) {
            console.error("Error deleting book:", error);
            toast({ variant: 'destructive', title: 'Error Deleting Book', description: 'An unexpected error occurred. Please try again.' });
        }
    };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
  }

  if (error) {
    return <div className="text-center py-20 font-medium text-destructive">{error}</div>;
  }

  return (
    <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            {book && (
                 <Input 
                    type="text" 
                    placeholder="Untitled Book"
                    value={book.title}
                    onChange={(e) => setBook((prev: any) => ({...prev, title: e.target.value}))}
                    className="font-headline text-4xl font-bold h-auto border-none focus-visible:ring-0 shadow-none p-0"
                />
            )}
            <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 w-full md:w-auto">
                <Button onClick={() => handleSaveDraft()} disabled={saving || !activeChapter} variant="outline">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Draft
                </Button>
                <Button onClick={handlePublish} disabled={saving || !activeChapter}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                    {book?.status === 'published' ? 'Publish Changes' : 'Publish Book'}
                </Button>
                 <Button onClick={handleDeleteBook} disabled={saving} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
            </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Cover Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {book?.coverImage && (
                            <div className="relative w-full h-48 mb-4">
                                <Image
                                    src={book.coverImage}
                                    alt={book.title || "Book Cover"}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md"
                                />
                            </div>
                        )}
                        <ImageUpload onUpload={handleCoverImageUpload} />
                        {!book?.coverImage && <p className="text-xs text-muted-foreground mt-2">Upload a cover to be able to publish.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Chapters</CardTitle>
                         <Button variant="outline" size="sm" onClick={handleNewChapter} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4"/> New Chapter
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            {chapters.map((chapter) => (
                                <Button key={chapter.id} variant={activeChapter?.id === chapter.id ? 'secondary' : 'ghost'} onClick={() => setActiveChapter(chapter)} className="justify-start truncate">{chapter.title}</Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3">
                {activeChapter ? (
                    <Card>
                        <CardContent className="pt-6">
                             <Input type="text" placeholder="Chapter Title" value={activeChapter.title} onChange={(e) => setActiveChapter(prev => prev ? {...prev, title: e.target.value} : null)} className="text-2xl font-bold mb-4 h-12"/>
                            <RichTextEditor key={activeChapter.id} initialContent={activeChapter.content} onUpdate={(content) => { setActiveChapter(prev => prev ? {...prev, content} : null);}} />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center text-center py-20 border-2 border-dashed rounded-lg min-h-[500px]">
                        <div><h3 className="text-lg font-medium">{chapters.length > 0 ? 'Select a chapter' : 'Loading chapter...'}</h3></div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
