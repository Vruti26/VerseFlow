'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Feather, Loader2, PenTool, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

export default function WritePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to access the write page.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, loading, router, toast]);


  const handleCreateAndRedirect = async () => {
    setIsCreating(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a book.' });
      setIsCreating(false);
      return;
    }
    // ... (rest of validation logic same as before)
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
            synopsis: '',
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
  
    if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }


  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col items-center justify-start">
      
      {/* Uniform Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[180vw] h-[60vh] md:w-[140vw] md:h-[80vh] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent blur-[80px] md:blur-[120px] rounded-full opacity-60 dark:opacity-40" />
      </div>

      {/* Main Content Grid - Top Aligned */}
      <div className="container max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-24 items-start pt-24 md:pt-32 px-4 pb-12">
        
        {/* Left Column (Text) */}
        <div className="space-y-6 md:space-y-8 order-1 lg:order-1 text-center lg:text-left flex flex-col">
              <div className="flex justify-center lg:justify-start">
                  <Badge variant="outline" className="px-4 py-1.5 text-xs md:text-sm rounded-full border-primary/20 bg-primary/5 text-primary backdrop-blur-md shadow-sm">
                    <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                    New Project
                  </Badge>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-headline font-black tracking-tighter leading-[1.1] text-foreground">
                 Unleash Your <br />
                 <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-600">
                   Imagination
                 </span>
              </h1>
              
              <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                 Every great story starts with a single idea. Begin your journey here with our distraction-free editor.
              </p>

              {/* Mobile Hidden / Desktop Visible Feature */}
              <div className="hidden md:flex flex-col gap-4 pt-4 items-center lg:items-start">
                 <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                     <div className="p-3 rounded-xl bg-primary/10 text-primary">
                         <PenTool className="w-6 h-6" />
                     </div>
                     <div className="text-left">
                         <h3 className="font-bold text-foreground">Distraction-free Editor</h3>
                         <p className="text-sm text-muted-foreground">Focus solely on your words.</p>
                     </div>
                 </div>
              </div>
        </div>

        {/* Right Column (Form) */}
        <div className="order-2 lg:order-2 w-full flex flex-col">
            <div className="relative group w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 hidden md:block" />
                
                <Card className="relative border-white/20 dark:border-white/10 shadow-xl md:shadow-2xl bg-white/50 dark:bg-black/40 backdrop-blur-2xl rounded-3xl md:rounded-[1.5rem] overflow-hidden">
                    <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-xl md:text-3xl font-bold font-headline tracking-tight">Name your Masterpiece</h2>
                            <p className="text-sm md:text-base text-muted-foreground">Give your story a title to get started.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2 md:space-y-3 text-left">
                                <Label htmlFor="title" className="text-sm md:text-base font-semibold ml-1">Book Title</Label>
                                <Input 
                                    id="title"
                                    placeholder="e.g. The Last Stargazer"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isCreating}
                                    className="h-12 md:h-14 rounded-xl bg-background/50 border-white/10 focus:border-primary/50 focus:bg-background/80 focus:ring-0 text-base md:text-lg shadow-inner transition-all px-4"
                                />
                            </div>

                            <Button 
                                size="lg" 
                                onClick={handleCreateAndRedirect} 
                                disabled={isCreating} 
                                className="w-full h-12 md:h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        Start Writing <Feather className="ml-2 w-5 h-5" />
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
