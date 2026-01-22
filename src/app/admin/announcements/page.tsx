'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Trash } from 'lucide-react';
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

const ANNOUNCEMENT_DOC_ID = 'latest';

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [announcement, setAnnouncement] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'announcements', ANNOUNCEMENT_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAnnouncement(docSnap.data().content);
      } else {
        setAnnouncement('');
      }
      setIsLoading(false);
    };

    fetchAnnouncement();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'announcements', ANNOUNCEMENT_DOC_ID);
      await setDoc(docRef, {
        content: announcement,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Announcement has been published.' });
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to publish announcement.' });
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const docRef = doc(db, 'announcements', ANNOUNCEMENT_DOC_ID);
      await deleteDoc(docRef);
      setAnnouncement('');
      toast({ title: 'Success', description: 'Announcement has been deleted.' });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete announcement.' });
    }
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Post Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea
                placeholder="Type your announcement here... (e.g. 20% off all books this weekend!)"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={6}
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || isDeleting}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSaving ? 'Publishing...' : 'Publish Announcement'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSaving || isDeleting || !announcement}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the current announcement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
