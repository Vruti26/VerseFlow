'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Feather, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    <div className="container py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
            <Feather className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-4xl font-bold">Start Your Next Book</h1>
        </div>

        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Create a New Book</CardTitle>
                    <CardDescription>
                        Fill in the details below to start your next masterpiece. 
                        You can always change these later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title"
                            placeholder="Your book's title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea 
                            id="description"
                            placeholder="A short summary of your book..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isCreating}
                            rows={4}
                        />
                    </div>
                    <Button size="lg" onClick={handleCreateAndRedirect} disabled={isCreating} className="w-full mt-2">
                        {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Book & Start Writing'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
