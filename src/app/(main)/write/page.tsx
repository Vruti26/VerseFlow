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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none opacity-40" />

      <div className="container max-w-5xl relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* 2. Left Column: Inspirational Text */}
        <div className="space-y-6 order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-700">
             <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5">
                <Sparkles className="w-3 h-3 mr-2 fill-primary" />
                New Project
             </Badge>
             
             <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
                Unleash Your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Imagination.</span>
             </h1>
             
             <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Every great story starts with a single idea. Create your book, outline your chapters, and bring your characters to life with our powerful writing tools.
             </p>

             <div className="flex flex-col gap-4 pt-4">
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
        <div className="order-1 lg:order-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="relative">
                {/* Decorative blob behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20" />
                
                <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-8 space-y-8">
                        
                        <div className="space-y-2 text-center lg:text-left">
                            <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-2">
                                <Feather className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold font-headline">Create New Book</h2>
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
                                    className="h-12 bg-background/50 border-input/60 focus:bg-background transition-all text-lg placeholder:text-muted-foreground/40"
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
                                    className="bg-background/50 border-input/60 focus:bg-background transition-all resize-none placeholder:text-muted-foreground/40"
                                />
                            </div>

                            <Button 
                                size="lg" 
                                onClick={handleCreateAndRedirect} 
                                disabled={isCreating} 
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                                        Setting up your studio...
                                    </>
                                ) : (
                                    <>
                                        Create & Start Writing <Feather className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </div>
  );
}