'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Feather, Loader2, BookOpen, PenTool, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

export default function WritePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateAndRedirect = async () => {
    setIsCreating(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a book.' });
      setIsCreating(false);
      return;
    }

    if (!user.emailVerified) {
        toast({ variant: 'destructive', title: 'Email Not Verified', description: 'Please verify your email before creating a book.' });
        setIsCreating(false);
        return;
    }

    if (!title) {
        toast({ variant: 'destructive', title: 'Title is required', description: 'Please enter a title for your book.' });
        setIsCreating(false);
        return;
    }

    const newBookRef = doc(collection(db, 'books'));
    const newBookId = newBookRef.id;

    try {
        await setDoc(newBookRef, {
            id: newBookId,
            title,
            description,
            authorId: user.uid,
            author: user.displayName || 'Anonymous',
            status: 'draft',
            coverImageId: '',
            tags: [],
            chapters: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        toast({ title: 'Book Created', description: 'Redirecting you to the editor...' });
        router.push(`/write/${newBookId}`);

    } catch (error) {
        console.error("Error creating book:", error);
        toast({ variant: 'destructive', title: 'Failed to Create Book', description: 'An unexpected error occurred. Please try again.' });
        setIsCreating(false);
    }
  };

  return (
    // Changed: Removed 'items-center justify-center' to prevent scrolling issues on mobile
    // Added: 'overflow-x-hidden' to stop horizontal scrollbars from background blobs
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col py-8 px-4 md:p-8 lg:justify-center">
      
      {/* 1. Ambient Background Glows (Responsive sizing) */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-primary/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[250px] h-[250px] md:w-[600px] md:h-[600px] bg-purple-500/10 blur-[60px] md:blur-[100px] rounded-full pointer-events-none opacity-40" />

      <div className="container max-w-5xl mx-auto relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-24 items-start lg:items-center">
        
        {/* 2. Left Column: Inspirational Text */}
        {/* Changed order: Shows FIRST on mobile for context, then form below */}
        <div className="space-y-6 order-1 lg:order-1 animate-in fade-in slide-in-from-left-4 duration-700">
             
             {/* Mobile-friendly Header Group */}
             <div className="space-y-4">
                 <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5 text-xs md:text-sm">
                    <Sparkles className="w-3 h-3 mr-2 fill-primary" />
                    New Project
                 </Badge>
                 
                 <h1 className="text-3xl md:text-5xl font-headline font-bold leading-tight">
                    Unleash Your <br className="hidden md:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Imagination.</span>
                 </h1>
                 
                 <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                    Every great story starts with a single idea. Begin your journey here.
                 </p>
             </div>

             {/* Features List - Hidden on very small screens to save space, visible on tablet+ */}
             <div className="hidden md:flex flex-col gap-4 pt-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-secondary text-primary">
                        <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Distraction-free Editor</h3>
                        <p className="text-sm text-muted-foreground">Focus solely on your words.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-secondary text-primary">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Chapter Management</h3>
                        <p className="text-sm text-muted-foreground">Organize your story structure effortlessly.</p>
                    </div>
                </div>
             </div>
        </div>

        {/* 3. Right Column: The Form Card */}
        <div className="order-2 lg:order-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 w-full">
            <div className="relative">
                {/* Decorative blob behind card - visible mostly on desktop */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 hidden md:block" />
                
                <Card className="border-border/50 shadow-xl md:shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                        
                        <div className="space-y-1 md:space-y-2">
                            <div className="inline-flex p-2.5 rounded-xl bg-primary/10 text-primary mb-2">
                                <Feather className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold font-headline">Create New Book</h2>
                            <p className="text-sm text-muted-foreground">Give your story a title to get started.</p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium ml-1">Book Title <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="title"
                                    placeholder="e.g. The Last Stargazer"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isCreating}
                                    // Improved mobile input: text-base prevents auto-zoom on iOS
                                    className="h-11 md:h-12 bg-background/50 border-input/60 focus:bg-background transition-all text-base md:text-lg placeholder:text-muted-foreground/40"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium ml-1">Synopsis (Optional)</Label>
                                <Textarea 
                                    id="description"
                                    placeholder="What is your story about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isCreating}
                                    rows={4}
                                    // Improved mobile input: text-base
                                    className="bg-background/50 border-input/60 focus:bg-background transition-all resize-none text-base placeholder:text-muted-foreground/40"
                                />
                            </div>

                            <Button 
                                size="lg" 
                                onClick={handleCreateAndRedirect} 
                                disabled={isCreating} 
                                className="w-full h-11 md:h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mt-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Start Writing <Feather className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
            
            {/* Mobile-only feature hint to save space above */}
            <div className="md:hidden flex items-center justify-center gap-2 mt-8 text-xs text-muted-foreground opacity-70">
                <Sparkles className="w-3 h-3" /> Distraction-free writing environment
            </div>
        </div>

      </div>
    </div>
  );
}