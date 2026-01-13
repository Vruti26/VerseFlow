'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Loader2, Save, Send, PlusCircle, Trash2, GripVertical, ShieldAlert, Pencil, FileText, Settings as SettingsIcon } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Textarea } from '@/components/ui/textarea';

// Dynamic import for Editor
const RichTextEditor = dynamic(() => 
  import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), 
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-4 border rounded-md min-h-[300px] text-muted-foreground bg-muted/10">Loading Editor...</div>
  }
);

interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  order: number;
}

// --- Sub-components (Defined OUTSIDE the main component to prevent re-renders) ---

const SortableChapter = ({ chapter, activeChapter, setActiveChapter, handleDeleteChapter }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: chapter?.id || 'temp-id' 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!chapter) return null;

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center justify-between bg-background rounded-md border border-border/50 hover:border-border transition-colors touch-none">
      <div className="flex items-center flex-grow overflow-hidden">
        <div {...listeners} className="cursor-grab p-3 hover:bg-muted/50 border-r border-border/50">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button 
            variant={activeChapter?.id === chapter.id ? 'secondary' : 'ghost'} 
            onClick={() => setActiveChapter(chapter)} 
            className="justify-start truncate flex-grow text-left h-auto py-3 px-3 rounded-none font-normal"
        >
            <span className="truncate">{chapter.title}</span>
        </Button>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-full px-3 text-muted-foreground hover:text-destructive rounded-l-none">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{chapter.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

  // State
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile View State
  const [mobileView, setMobileView] = useState<'write' | 'details'>('write'); 
  
  const chapterCreationTriggered = useRef(false);
  const [autosave, setAutosave] = useState(true);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    })
  );

  // --- Data Fetching Logic ---
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
            coverImage: '',
            description: ''
          });
        } catch (err) {
          console.error("Failed to create new book:", err);
          setError("There was an error creating your book.");
          setLoading(false);
        }
      }
    }, (err) => {
      console.error("Book snapshot error:", err);
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
        } catch (err) { console.error(err); }
      } else {
        const chapterData: Chapter[] = snapshot.docs.map((doc, index) => ({ 
            id: doc.id, ...doc.data(), order: doc.data().order || index + 1 
        } as Chapter));
        const sortedChapters = chapterData.sort((a, b) => a.order - b.order);
        setChapters(sortedChapters);
        
        setActiveChapter(curr => {
            if (curr && sortedChapters.find(c => c.id === curr.id)) return sortedChapters.find(c => c.id === curr.id) || null;
            return sortedChapters.length > 0 ? sortedChapters[0] : null;
        });
      }
    });
    return () => unsubscribe();
  }, [book, bookId]);

  // --- Handlers ---
  const handleCoverImageUpload = (url: string) => {
    setBook((prev: any) => ({ ...prev, coverImage: url }));
    toast({ title: 'Cover Image Updated!' });
  };

  const handleSaveDraft = async (options = { controlSavingState: true, showToast: true }) => {
    if (!bookId || !book) return;
    if (options.controlSavingState) setSaving(true);
    try {
        if (activeChapter) {
            await updateDoc(doc(db, 'books', bookId as string, 'chapters', activeChapter.id), { 
                title: activeChapter.title, content: activeChapter.content 
            });
        }
        await updateDoc(doc(db, 'books', bookId as string), { 
            updatedAt: serverTimestamp(), 
            title: book.title,
            description: book.description || '',
            coverImage: book.coverImage || ''
        });
        if (options.showToast) toast({ title: 'Saved!' });
    } catch (e: any) {
        if (options.showToast) toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
    } finally {
        if (options.controlSavingState) setSaving(false);
    }
  };

  // Debounce autosave
  useEffect(() => {
    if (autosave && book) {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            handleSaveDraft({ controlSavingState: false, showToast: false });
        }, 1000); 
    }
    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [book?.title, book?.description, book?.coverImage, activeChapter?.content, activeChapter?.title, autosave]);

  const handlePublish = async () => {
    if (!bookId || !activeChapter) return;
    if (!book.coverImage) {
        toast({ variant: 'destructive', title: 'Missing Cover Image', description: 'Please upload a cover image before publishing.' });
        return;
    }
    setSaving(true);
    try {
        await handleSaveDraft({ controlSavingState: false, showToast: false });
        await updateDoc(doc(db, 'books', bookId as string), { status: 'published', updatedAt: serverTimestamp() });
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
      const newChapterData = {
        title: `Chapter ${chapters.length + 1}`,
        content: '<p>Start writing...</p>',
        createdAt: serverTimestamp(),
        order: newOrder,
      };
      
      const docRef = await addDoc(collection(db, 'books', bookId as string, 'chapters'), newChapterData);
      const newChapterLocal = { id: docRef.id, ...newChapterData, createdAt: new Date() } as unknown as Chapter;
      
      setActiveChapter(newChapterLocal);
      setMobileView('write');
      toast({ title: 'New Chapter Created', description: 'You are now editing the new chapter.' });

    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create new chapter.' });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!bookId || chapters.length <= 1) {
        toast({ variant: 'destructive', title: 'Cannot Delete', description: 'You must have at least one chapter.' });
        return;
    }
    try {
        await deleteDoc(doc(db, 'books', bookId as string, 'chapters', chapterId));
        toast({ title: 'Chapter Deleted' });
        const remaining = chapters.filter(c => c.id !== chapterId);
        if (activeChapter?.id === chapterId) setActiveChapter(remaining[0] || null);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete chapter.' });
    }
  };

  const handleDeleteBook = async () => {
    if (!bookId) return;
    try {
      const batch = writeBatch(db);
      const bookRef = doc(db, 'books', bookId as string);
      
      const chaptersSnap = await getDocs(collection(bookRef, 'chapters'));
      chaptersSnap.forEach(doc => batch.delete(doc.ref));
      const commentsSnap = await getDocs(collection(bookRef, 'comments'));
      commentsSnap.forEach(doc => batch.delete(doc.ref));
      
      batch.delete(bookRef);
      await batch.commit();
      toast({ title: 'Book Deleted' });
      router.push('/profile');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete book.' });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = chapters.findIndex((c) => c.id === active.id);
        const newIndex = chapters.findIndex((c) => c.id === over.id);
        const newChapters = arrayMove(chapters, oldIndex, newIndex);
        setChapters(newChapters);
        try {
            const batch = writeBatch(db);
            newChapters.forEach((chapter, index) => {
                batch.update(doc(db, 'books', bookId as string, 'chapters', chapter.id), { order: index + 1 });
            });
            await batch.commit();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save order.' });
            setChapters(chapters); 
        }
    }
  };

  // useCallback for editor update to ensure stability and prevent unnecessary re-renders
  const handleEditorUpdate = useCallback((content: string) => {
    setActiveChapter((prev) => prev ? { ...prev, content } : null);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-destructive font-medium">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
        
        {/* --- Top Navigation Bar --- */}
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4">
                
                {/* Book Title Input with Edit Indication */}
                <div className="flex-1 flex items-center min-w-0 group relative">
                    <Input 
                        type="text" 
                        placeholder="Untitled Book"
                        value={book?.title || ''}
                        onChange={(e) => setBook((prev: any) => ({...prev, title: e.target.value}))}
                        className="text-lg md:text-xl font-bold border-none focus-visible:ring-0 shadow-none px-0 h-auto bg-transparent truncate pr-8 cursor-pointer hover:text-primary transition-colors"
                    />
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground absolute right-0 opacity-50 group-hover:opacity-100 pointer-events-none" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center space-x-2 mr-2">
                        <Switch id="autosave-switch" checked={autosave} onCheckedChange={setAutosave} />
                        <Label htmlFor="autosave-switch" className="text-xs text-muted-foreground cursor-pointer">Autosave</Label>
                    </div>

                    <Button 
                        onClick={() => handleSaveDraft({ controlSavingState: true, showToast: true })} 
                        disabled={saving || !book || autosave} 
                        variant="ghost" 
                        size="icon"
                        className="md:hidden"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5"/>}
                    </Button>

                    <Button 
                        onClick={() => handleSaveDraft({ controlSavingState: true, showToast: true })} 
                        disabled={saving || !book || autosave} 
                        variant="outline" 
                        size="sm"
                        className="hidden md:flex"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Save Draft
                    </Button>

                    <Button 
                        onClick={handlePublish} 
                        disabled={saving || !activeChapter} 
                        size="sm"
                        className={book?.status === 'published' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        {saving ? <Loader2 className="md:mr-2 h-4 w-4 animate-spin"/> : <Send className="md:mr-2 h-4 w-4"/>}
                        <span className="hidden md:inline">{book?.status === 'published' ? 'Update' : 'Publish'}</span>
                    </Button>
                </div>
            </div>
        </header>

        {/* --- Mobile View Toggle Tabs --- */}
        <div className="lg:hidden border-b bg-background sticky top-14 z-20">
            <div className="grid grid-cols-2">
                <button 
                    onClick={() => setMobileView('write')}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileView === 'write' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
                >
                    <FileText className="w-4 h-4"/> Write
                </button>
                <button 
                    onClick={() => setMobileView('details')}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileView === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
                >
                    <SettingsIcon className="w-4 h-4"/> Details
                </button>
            </div>
        </div>

        {/* --- Main Content Grid --- */}
        <main className="flex-1 container py-6 lg:py-8">
            <div className="grid lg:grid-cols-4 gap-8 h-full">
                
                {/* LEFT COLUMN (DETAILS SIDEBAR) 
                   - Desktop: Always visible
                   - Mobile: Visible only if 'details' tab selected
                */}
                <div className={`${mobileView === 'details' ? 'block' : 'hidden'} lg:block lg:col-span-1 h-full`}>
                    <div className="sticky top-20 flex flex-col gap-6 pb-20 lg:pb-0">
                        
                        {/* Book Details */}
                        <Card className="border-0 shadow-none lg:border lg:shadow-sm bg-transparent lg:bg-card">
                            <CardHeader className="px-0 lg:px-6">
                                <CardTitle className="text-base font-semibold">Book Details</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 lg:px-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cover Image</Label>
                                    {book?.coverImage && (
                                        <div className="relative w-full h-40 md:h-48 rounded-md overflow-hidden border bg-muted">
                                            <Image src={book.coverImage} alt="Book Cover" layout="fill" objectFit="cover"/>
                                        </div>
                                    )}
                                    <ImageUpload onUpload={handleCoverImageUpload} bookId={bookId as string} uploadType="bookCover" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Synopsis</Label>
                                    <Textarea
                                        placeholder="Write a summary..."
                                        value={book?.description || ''}
                                        onChange={(e) => setBook((prev: any) => ({ ...prev, description: e.target.value }))}
                                        className="min-h-[100px] bg-muted/30 resize-none text-sm focus-visible:ring-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Desktop Only: Chapter List (On Mobile, this is inside the 'Write' tab) */}
                        <Card className="hidden lg:flex flex-col border-0 shadow-none lg:border lg:shadow-sm bg-transparent lg:bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 lg:px-6">
                                <CardTitle className="text-base font-semibold">Chapters</CardTitle>
                                 <Button variant="outline" size="sm" onClick={handleNewChapter} className="h-8 gap-2">
                                    <PlusCircle className="w-3.5 h-3.5"/> Add
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 px-0 lg:px-6">
                                <div className="space-y-2">
                                    {chapters.length > 0 ? (
                                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                            <div className="flex flex-col gap-2">
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
                                    ) : (
                                    <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-md bg-muted/10">
                                        No chapters yet
                                    </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/30 bg-destructive/5 shadow-none mb-10 lg:mb-0">
                            <CardHeader className="pb-2 px-4 pt-4">
                                <CardTitle className="text-destructive text-sm flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4"/> Danger Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button size="sm" className="w-full  text-destructive hover:text-destructive bg-destructive/10 justify-start h-auto py-2" disabled={saving}>
                                            Delete Entire Book
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                                            <AlertDialogDescription>This action is permanent and will delete all chapters and comments.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* RIGHT COLUMN (EDITOR & MOBILE CHAPTER LIST) 
                   - Desktop: Always visible
                   - Mobile: Visible only if 'write' tab selected
                */}
                <div className={`${mobileView === 'write' ? 'block' : 'hidden'} lg:block lg:col-span-3 h-full min-h-[calc(100vh-10rem)]`}>
                    
                    {/* Mobile Only: Chapter List (Shows above editor on mobile) */}
                    <div className="lg:hidden mb-8">
                        <Card className="flex-1 flex flex-col border-0 shadow-none bg-transparent">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 px-0">
                                <CardTitle className="text-base font-semibold">Chapters</CardTitle>
                                 <Button variant="outline" size="sm" onClick={handleNewChapter} className="h-8 gap-2">
                                    <PlusCircle className="w-3.5 h-3.5"/> Add
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 px-0">
                                <div className="space-y-2">
                                    {chapters.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {chapters.map((chapter) => (
                                                // Simplified List Item for Mobile
                                                <div key={chapter.id} className="flex items-center justify-between bg-card border rounded-md p-3">
                                                    <Button 
                                                        variant={activeChapter?.id === chapter.id ? 'secondary' : 'ghost'} 
                                                        onClick={() => setActiveChapter(chapter)} 
                                                        className="justify-start truncate flex-grow text-left h-auto p-0 font-normal hover:bg-transparent"
                                                    >
                                                        {chapter.title}
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete "{chapter.title}".</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md bg-muted/10">
                                            No chapters yet
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* The Editor Area */}
                    {activeChapter ? (
                        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
                             <Input 
                                type="text" 
                                placeholder="Chapter Title" 
                                value={activeChapter.title} 
                                onChange={(e) => setActiveChapter(prev => prev ? {...prev, title: e.target.value} : null)} 
                                className="text-2xl md:text-4xl font-bold h-auto border-none focus-visible:ring-0 px-0 shadow-none bg-transparent"
                            />
                            <div className="flex-1 min-h-[500px] border rounded-lg bg-card/50 shadow-sm relative">
                                {/* Use stable handler for onUpdate */}
                                <RichTextEditor 
                                    key={activeChapter.id} 
                                    initialContent={activeChapter.content} 
                                    onUpdate={handleEditorUpdate} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px] border-2 border-dashed rounded-lg bg-muted/5 p-8">
                            <h3 className="text-xl font-medium mb-2">Select a chapter to edit</h3>
                            <p className="text-muted-foreground max-w-sm mb-4">
                                Create a new chapter or select an existing one to start writing.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
}