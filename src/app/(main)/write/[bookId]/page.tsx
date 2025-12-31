'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  order: number;
}

const SortableChapter = ({ chapter, activeChapter, setActiveChapter, handleDeleteChapter }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center justify-between bg-background rounded-md">
      <div className="flex items-center flex-grow">
        <div {...listeners} className="cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <Button variant={activeChapter?.id === chapter.id ? 'secondary' : 'ghost'} onClick={() => setActiveChapter(chapter)} className="justify-start truncate flex-grow text-left">
            {chapter.title}
        </Button>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-2">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chapter "{chapter.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

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
  const [autosave, setAutosave] = useState(true);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before activating
      },
    })
  );

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
          setError("You don\'t have permission to edit this book.");
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

    const chaptersQuery = query(collection(db, 'books', bookId as string, 'chapters'), orderBy('order'));
    const unsubscribe = onSnapshot(chaptersQuery, async (snapshot) => {
      if (snapshot.empty && !chapterCreationTriggered.current) {
        chapterCreationTriggered.current = true;
        try {
          await addDoc(collection(db, 'books', bookId as string, 'chapters'), {
            title: "Chapter 1",
            content: "<p>Start your story here...</p>",
            createdAt: serverTimestamp(),
            order: 1,
          });
        } catch (err) {
           console.error("Failed to create initial chapter:", err);
           toast({ variant: 'destructive', title: 'Error', description: 'Could not create the first chapter.' });
        }
      } else {
        const chapterData: Chapter[] = snapshot.docs.map((doc, index) => ({ id: doc.id, ...doc.data(), order: doc.data().order || index + 1 } as Chapter));
        const sortedChapters = chapterData.sort((a, b) => a.order - b.order);
        setChapters(sortedChapters);
        if (!activeChapter) {
             setActiveChapter(sortedChapters[0] || null);
        }
      }
    });

    return () => unsubscribe();
  }, [book, bookId, toast]);

  const handleCoverImageUpload = (url: string) => {
    setBook((prev: any) => ({ ...prev, coverImage: url }));
    toast({ title: 'Cover Image Updated!' });
  };

  const handleSaveDraft = async (options: { controlSavingState: boolean, showToast: boolean } = { controlSavingState: true, showToast: true }) => {
    if (!bookId || !book) return;
    if (options.controlSavingState) setSaving(true);
    try {
        if (activeChapter) {
            const chapterRef = doc(db, 'books', bookId as string, 'chapters', activeChapter.id);
            await updateDoc(chapterRef, { title: activeChapter.title, content: activeChapter.content });
        }
        const bookRef = doc(db, 'books', bookId as string);
        await updateDoc(bookRef, { 
            updatedAt: serverTimestamp(), 
            title: book.title,
            coverImage: book.coverImage || ''
        });
        if (options.showToast) {
            toast({ title: 'Saved!' });
        }
    } catch (e: any) {
        if (options.showToast) {
            toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
        }
    } finally {
        if (options.controlSavingState) setSaving(false);
    }
  };

  useEffect(() => {
    if (autosave && book) {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            handleSaveDraft({ controlSavingState: false, showToast: false });
        }, 1000); // 1 second debounce
    }
    return () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    };
  }, [book?.title, book?.coverImage, activeChapter?.content, activeChapter?.title, autosave]);

  const handlePublish = async () => {
    if (!bookId || !activeChapter) return;
    if (!book.coverImage) {
        toast({ variant: 'destructive', title: 'Missing Cover Image', description: 'Please upload a cover image before publishing.' });
        return;
    }
    setSaving(true);
    try {
        await handleSaveDraft({ controlSavingState: false, showToast: false });
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
      const newOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) + 1 : 1;
      const newChapterRef = await addDoc(collection(db, 'books', bookId as string, 'chapters'), {
        title: `Chapter ${chapters.length + 1}`,
        content: '<p>Start writing...</p>',
        createdAt: serverTimestamp(),
        order: newOrder,
      });
      // No need to manually set active chapter, the onSnapshot will handle it.
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create new chapter.' });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!bookId) return;

    if (chapters.length <= 1) {
        toast({
            variant: 'destructive',
            title: 'Cannot Delete',
            description: 'You must have at least one chapter in your book.',
        });
        return;
    }

    try {
        await deleteDoc(doc(db, 'books', bookId as string, 'chapters', chapterId));
        toast({ title: 'Chapter Deleted' });
        const remainingChapters = chapters.filter(c => c.id !== chapterId);
        setActiveChapter(remainingChapters[0] || null);
    } catch (error) {
        console.error("Error deleting chapter:", error);
        toast({ variant: 'destructive', title: 'Error Deleting Chapter', description: 'Could not delete the chapter. Please try again.' });
    }
  };

  const handleDeleteBook = async () => {
    if (!bookId) return;
    const bookRef = doc(db, 'books', bookId as string);
    try {
      const batch = writeBatch(db);
  
      // Delete all chapters
      const chaptersRef = collection(bookRef, 'chapters');
      const chaptersSnap = await getDocs(chaptersRef);
      chaptersSnap.forEach(doc => batch.delete(doc.ref));
  
      // Delete all reviews
      const reviewsRef = collection(bookRef, 'reviews');
      const reviewsSnap = await getDocs(reviewsRef);
      reviewsSnap.forEach(doc => batch.delete(doc.ref));
  
      // Delete the book itself
      batch.delete(bookRef);
  
      await batch.commit();
  
      toast({ title: 'Book Deleted', description: 'Your book and all its content have been permanently removed.' });
      router.push('/profile');
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({ variant: 'destructive', title: 'Error Deleting Book', description: 'An unexpected error occurred. Please try again.' });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        const oldIndex = chapters.findIndex((c) => c.id === active.id);
        const newIndex = chapters.findIndex((c) => c.id === over.id);
        const newChapters = arrayMove(chapters, oldIndex, newIndex);
        setChapters(newChapters);

        try {
            const batch = writeBatch(db);
            newChapters.forEach((chapter, index) => {
                const chapterRef = doc(db, 'books', bookId as string, 'chapters', chapter.id);
                batch.update(chapterRef, { order: index + 1 });
            });
            await batch.commit();
            toast({ title: "Chapter order saved!" });
        } catch (error) {
            console.error("Error updating chapter order:", error);
            toast({ variant: 'destructive', title: 'Error Saving Order', description: 'Could not save the new chapter order.' });
            // Revert to original order on failure
            setChapters(chapters);
        }
    }
  };



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
            <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 w-full md:w-auto items-center">
                <div className="flex items-center space-x-2">
                    <Switch id="autosave-switch" checked={autosave} onCheckedChange={setAutosave} />
                    <Label htmlFor="autosave-switch">Autosave</Label>
                </div>
                <Button onClick={() => handleSaveDraft({ controlSavingState: true, showToast: true })} disabled={saving || !book || autosave} variant="outline">
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
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-col space-y-2">
                                    {chapters.map((chapter) => (
                                        <SortableChapter 
                                            key={chapter.id} 
                                            chapter={chapter} 
                                            activeChapter={activeChapter} 
                                            setActiveChapter={setActiveChapter} 
                                            handleDeleteChapter={handleDeleteChapter} 
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
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
                        <div><h3 className="text-lg font-medium">{chapters.length > 0 ? 'Select a chapter to start editing' : 'Create a chapter to begin'}</h3></div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
