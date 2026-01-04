'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
    Share2, Bookmark, Send, 
    BookOpen, Settings, ChevronLeft, ChevronRight, 
    Type, Heart, MessageSquare, X, MessageCircle, Trash2, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';

interface Book {
  id: string;
  title: string;
  authorId: string;
  status: string;
  coverImage: string;
  description?: string; 
  likes?: string[];
  views?: number; 
}

interface Author {
    uid: string;
    displayName: string;
    photoURL?: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  order: number;
}

interface UnifiedComment {
    id: string;
    author: Author;
    text: string;
    createdAt: any;
    chapterId?: string; 
    chapterTitle?: string;
    rating?: number; 
    type: 'comment' | 'review';
}

export default function PublicBookPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [rawComments, setRawComments] = useState<UnifiedComment[]>([]);
  const [rawReviews, setRawReviews] = useState<UnifiedComment[]>([]);
  const [combinedComments, setCombinedComments] = useState<UnifiedComment[]>([]);
  
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [likes, setLikes] = useState<string[]>([]);
  const isLiked = user ? likes.includes(user.uid) : false;

  const [mainCommentText, setMainCommentText] = useState("");
  const [readerCommentText, setReaderCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showComments, setShowComments] = useState(false);

  // Reader Settings & Progress
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  
  // Ref for tracking view count per session/chapter
  const chapterViewCounted = useRef(false); 

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (!bookId) return;
    const bookRef = doc(db, 'books', bookId as string);

    const unsubscribeBook = onSnapshot(bookRef, async (snap) => {
      if (snap.exists()) {
        const bookData = snap.data() as Omit<Book, 'id'>;
        if (bookData.status === 'published') {
          setBook({ id: snap.id, ...bookData });
          setLikes(bookData.likes || []);
          
          if (bookData.authorId && !author) {
             const userRef = doc(db, 'users', bookData.authorId);
             getDoc(userRef).then(uSnap => {
                if (uSnap.exists()) setAuthor({ uid: bookData.authorId, ...uSnap.data() } as Author);
             });
          }
        } else {
           setError("This book is not published.");
        }
      } else {
        setError("Book not found.");
      }
    });

    const chaptersQuery = query(collection(bookRef, 'chapters'), orderBy('order'));
    const unsubscribeChapters = onSnapshot(chaptersQuery, (snapshot) => {
      const chaptersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setChapters(chaptersData);
    });
    
    const commentsQuery = query(collection(bookRef, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribeComments = onSnapshot(commentsQuery, async (snapshot) => {
        const commentsData: UnifiedComment[] = [];
        for (const commentDoc of snapshot.docs) {
            const cData = commentDoc.data();
            const userRef = doc(db, 'users', cData.authorId);
            const userSnap = await getDoc(userRef);
            const authorData = userSnap.exists() ? { uid: cData.authorId, ...userSnap.data() } as Author : { uid: 'anon', displayName: 'Anonymous' };
            commentsData.push({ id: commentDoc.id, author: authorData, ...cData, type: 'comment' } as UnifiedComment);
        }
        setRawComments(commentsData);
    });

    const reviewsQuery = query(collection(bookRef, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(reviewsQuery, async (snapshot) => {
        const reviewsData: UnifiedComment[] = [];
        for (const reviewDoc of snapshot.docs) {
            const rData = reviewDoc.data();
            const userRef = doc(db, 'users', rData.authorId);
            const userSnap = await getDoc(userRef);
            const authorData = userSnap.exists() ? { uid: rData.authorId, ...userSnap.data() } as Author : { uid: 'anon', displayName: 'Anonymous' };
            reviewsData.push({ id: reviewDoc.id, author: authorData, ...rData, type: 'review' } as UnifiedComment);
        }
        setRawReviews(reviewsData);
    });

    return () => {
      unsubscribeBook();
      unsubscribeChapters();
      unsubscribeComments();
      unsubscribeReviews();
    };
  }, [bookId]);

  useEffect(() => {
    const combined = [...rawComments, ...rawReviews].sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA; 
    });
    setCombinedComments(combined);
  }, [rawComments, rawReviews]);


  // --- 2. Handlers & Logic ---

  const incrementView = async () => {
      if(!bookId || chapterViewCounted.current) return;
      
      // Use localStorage to prevent spamming views on refresh
      const storageKey = `viewed_${bookId}_${activeChapterIndex}`;
      if (localStorage.getItem(storageKey)) return;

      try {
          const bookRef = doc(db, 'books', bookId as string);
          await updateDoc(bookRef, { views: increment(1) });
          chapterViewCounted.current = true;
          localStorage.setItem(storageKey, 'true');
      } catch (e) {
          console.error("Error incrementing view", e);
      }
  };

  // Reset view lock when chapter changes
  useEffect(() => {
      chapterViewCounted.current = false;
      // Scroll to top
      window.scrollTo(0,0);
  }, [activeChapterIndex]);


  const handleLike = async () => {
    if (!user || !book) {
        toast({ variant: 'destructive', title: 'Please log in to like' });
        return;
    }
    const bookRef = doc(db, 'books', book.id);
    try {
        if (isLiked) {
            await updateDoc(bookRef, { likes: arrayRemove(user.uid) });
        } else {
            await updateDoc(bookRef, { likes: arrayUnion(user.uid) });
        }
    } catch (e) {
        console.error("Error liking book:", e);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied', description: 'Book link copied to clipboard!' });
  };

  const handleAddToLibrary = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in' });
        return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userRef, {
            readingList: isInLibrary ? arrayRemove(bookId) : arrayUnion(bookId),
        });
        toast({ title: isInLibrary ? 'Removed from library' : 'Added to library!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error updating library' });
    }
  };

  const handlePostComment = async (e: React.FormEvent, isChapterComment: boolean) => {
      e.preventDefault();
      const text = isChapterComment ? readerCommentText : mainCommentText;

      if (!user || !text.trim()) return;
      
      setIsSubmitting(true);
      try {
          const commentData: any = {
              text: text,
              authorId: user.uid,
              createdAt: serverTimestamp()
          };

          if (isChapterComment && activeChapterIndex !== null) {
              commentData.chapterId = chapters[activeChapterIndex].id;
              commentData.chapterTitle = chapters[activeChapterIndex].title;
          }

          await addDoc(collection(db, 'books', bookId as string, 'comments'), commentData);
          
          if (isChapterComment) setReaderCommentText("");
          else setMainCommentText("");
          
          toast({ title: "Comment Posted" });
      } catch (e) {
          toast({ variant: 'destructive', title: "Failed to post comment" });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteComment = async (comment: UnifiedComment) => {
    if (!user || user.uid !== comment.author.uid) return;
    const collectionName = comment.type === 'review' ? 'reviews' : 'comments';
    try {
        await deleteDoc(doc(db, 'books', bookId as string, collectionName, comment.id));
        toast({ title: "Deleted", description: "Your comment has been removed." });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete comment." });
    }
  };

  // --- Reader Theme Helpers ---
  const getReaderClasses = () => {
      switch(readerTheme) {
          case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636]';
          case 'dark': return 'bg-[#1a1a1a] text-[#d1d1d1]';
          default: return 'bg-white text-slate-900';
      }
  };

  const getBorderClass = () => {
      switch(readerTheme) {
          case 'sepia': return 'border-[#5b4636]/10';
          case 'dark': return 'border-[#d1d1d1]/20';
          default: return 'border-slate-900/10';
      }
  };

  if (error || !book) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

  // ==========================================
  // RENDER: READER MODE
  // ==========================================
  if (activeChapterIndex !== null) {
      const chapter = chapters[activeChapterIndex];
      const readerClasses = getReaderClasses();
      const borderClass = getBorderClass();
      const currentChapterComments = combinedComments.filter(c => c.chapterId === chapter.id);

      return (
          <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${readerClasses}`}>
              
              {/* Toolbar */}
              <div className={`flex items-center justify-between px-4 py-2 border-b ${borderClass} backdrop-blur-md bg-inherit/95`}>
                  <Button variant="ghost" size="sm" onClick={() => setActiveChapterIndex(null)} className="gap-2 hover:bg-black/5 dark:hover:bg-white/10 -ml-2">
                      <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
                  </Button>
                  
                  <div className="flex-1 text-center mx-2 min-w-0">
                      <p className="text-xs font-medium truncate opacity-70 uppercase tracking-wider">Chapter {activeChapterIndex + 1}</p>
                      <p className="text-sm font-bold truncate hidden sm:block">{chapter.title}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 -mr-2">
                      <Button variant="ghost" size="icon" onClick={() => setShowComments(!showComments)} className={showComments ? "bg-black/10 dark:bg-white/10" : ""}>
                          <MessageSquare className="w-5 h-5" />
                      </Button>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Settings className="w-5 h-5" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 space-y-6 mr-2">
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                      <Type className="w-4 h-4" />
                                      <span className="text-xs">{fontSize}px</span>
                                  </div>
                                  <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} />
                              </div>
                              <div className="flex justify-between gap-2">
                                  <Button variant="outline" size="sm" className="w-full" onClick={() => setReaderTheme('light')}>Light</Button>
                                  <Button variant="outline" size="sm" className="w-full bg-[#f4ecd8] text-black hover:bg-[#e0d8c4] border-[#e0d8c4]" onClick={() => setReaderTheme('sepia')}>Sepia</Button>
                                  <Button variant="outline" size="sm" className="w-full bg-[#1a1a1a] text-white hover:bg-black border-black" onClick={() => setReaderTheme('dark')}>Dark</Button>
                              </div>
                          </PopoverContent>
                      </Popover>
                  </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-1 relative overflow-hidden">
                  <main 
                    className="flex-1 h-full overflow-y-auto pb-20 scroll-smooth"
                  >
                      <div className="max-w-3xl mx-auto px-6 py-10 sm:px-8 md:py-16">
                          <h1 className="text-2xl md:text-4xl font-serif font-bold text-center mb-8 md:mb-12 leading-tight">
                              {chapter.title}
                          </h1>
                          <div 
                              className="font-serif prose prose-lg max-w-none focus:outline-none leading-relaxed"
                              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, color: 'inherit' }}
                              dangerouslySetInnerHTML={{ __html: chapter.content }}
                          />
                      </div>
                      
                      {/* Chapter Navigation Footer */}
                      <div className={`py-8 md:py-12 border-t ${borderClass} mt-auto`}>
                          <div className="max-w-3xl mx-auto px-6 flex justify-between items-center">
                              <Button variant="ghost" onClick={() => { if(activeChapterIndex > 0) setActiveChapterIndex(activeChapterIndex - 1); }} disabled={activeChapterIndex === 0} className="gap-2 hover:bg-black/5 dark:hover:bg-white/10">
                                  <ChevronLeft className="w-4 h-4" /> Previous
                              </Button>
                              
                              <Button 
                                variant="default" 
                                onClick={() => { 
                                    incrementView(); // Simply count view on click
                                    if(activeChapterIndex < chapters.length - 1) setActiveChapterIndex(activeChapterIndex + 1); 
                                }} 
                                disabled={activeChapterIndex === chapters.length - 1} 
                                className="gap-2"
                              >
                                  Next <ChevronRight className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                  </main>

                  {/* Sidebar Comments */}
                  {showComments && (
                      <aside className={`w-full md:w-80 border-l ${borderClass} shadow-2xl absolute md:static inset-0 z-50 flex flex-col h-full transition-all duration-300 ${readerClasses} bg-inherit/95 backdrop-blur-sm`}>
                          <div className={`p-4 border-b ${borderClass} flex items-center justify-between bg-black/5 dark:bg-white/5`}>
                              <h3 className="font-semibold flex items-center gap-2 text-sm"><MessageSquare className="w-4 h-4"/> Discussion</h3>
                              <Button variant="ghost" size="sm" onClick={() => setShowComments(false)} className="h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10"><X className="w-4 h-4"/></Button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                              {currentChapterComments.length > 0 ? (
                                  currentChapterComments.map(comment => (
                                      <div key={comment.id} className="flex gap-3 text-sm group">
                                          <Avatar className="w-7 h-7 mt-1 border border-current/10">
                                              <AvatarImage src={comment.author.photoURL} />
                                              <AvatarFallback className="text-[10px]">{comment.author.displayName[0]}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                      <span className="font-semibold text-xs">{comment.author.displayName}</span>
                                                      <span className="text-[10px] opacity-60">
                                                          {formatDistanceToNow(comment.createdAt?.toDate() || new Date())}
                                                      </span>
                                                  </div>
                                                  {user && user.uid === comment.author.uid && (
                                                      // Made opacity-100 on mobile (no hover needed)
                                                      <button 
                                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteComment(comment)}
                                                      >
                                                          <Trash2 className="w-3 h-3 text-red-500" />
                                                      </button>
                                                  )}
                                              </div>
                                              <p className="mt-0.5 opacity-90 text-sm leading-snug">{comment.text}</p>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-center py-10 opacity-60 text-xs">
                                      No comments yet.<br/>Be the first to share your thoughts!
                                  </div>
                              )}
                          </div>

                          <div className={`p-3 border-t ${borderClass}`}>
                              {user ? (
                                  <form onSubmit={(e) => handlePostComment(e, true)} className="flex gap-2 items-end">
                                      <Input 
                                          value={readerCommentText}
                                          onChange={e => setReaderCommentText(e.target.value)}
                                          placeholder="Type a comment..." 
                                          className={`flex-1 bg-transparent border-current/20 focus-visible:ring-1 focus-visible:ring-current placeholder:text-current/40 h-9 text-sm`}
                                      />
                                      <Button type="submit" size="icon" disabled={!readerCommentText.trim() || isSubmitting} variant="ghost" className="hover:bg-current/10 h-9 w-9">
                                          <Send className="w-4 h-4" />
                                      </Button>
                                  </form>
                              ) : (
                                  <p className="text-xs text-center opacity-60">Log in to comment.</p>
                              )}
                          </div>
                      </aside>
                  )}
              </div>
          </div>
      );
  }

  // ==========================================
  // RENDER: BOOK LANDING PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-background/50 pb-20">
      <div className="container max-w-6xl py-6 md:py-16 px-4">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column (Cover & Stats) */}
          <div className="lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-6">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-xl group">
                    <Image src={book.coverImage || '/placeholder.jpg'} alt={book.title} fill className="object-cover" />
                </div>
                
                {/* Stats Block */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center justify-center bg-card border rounded-md p-3 text-center">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Heart 
                                className={`w-5 h-5 cursor-pointer transition-all active:scale-95 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} 
                                onClick={handleLike}
                            />
                            <span className="font-bold text-lg">{likes.length}</span>
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Likes</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-card border rounded-md p-3 text-center">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Eye className="w-5 h-5 text-muted-foreground" />
                            <span className="font-bold text-lg">{book.views || 0}</span>
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Reads</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {chapters.length > 0 && (
                        <Button onClick={() => setActiveChapterIndex(0)} className="w-full h-12 text-lg shadow-lg">
                            <BookOpen className="mr-2 h-5 w-5" /> Start Reading
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={handleAddToLibrary} variant={isInLibrary ? 'secondary' : 'outline'} className="flex-1">
                            <Bookmark className="mr-2 h-4 w-4" /> {isInLibrary ? 'Saved' : 'Library'}
                        </Button>
                        <Button onClick={handleShare} variant="outline" size="icon">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
             </div>
          </div>

          {/* Right Column (Details) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
             <div>
                 <h1 className="text-3xl md:text-5xl font-extrabold font-serif mb-3 leading-tight">{book.title}</h1>
                 {author && (
                     <div className="flex items-center gap-2 text-muted-foreground">
                         <Avatar className="h-6 w-6"><AvatarImage src={author.photoURL} /></Avatar>
                         <span>By <Link href={`/users/${author.uid}`} className="underline hover:text-primary font-medium">{author.displayName}</Link></span>
                     </div>
                 )}
             </div>

             <Tabs defaultValue="overview" className="w-full">
                 <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6 overflow-x-auto">
                     <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-2">Overview</TabsTrigger>
                     <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 py-2 flex items-center gap-2">
                         <MessageCircle className="w-4 h-4"/> Comments ({combinedComments.length})
                     </TabsTrigger>
                 </TabsList>

                 <TabsContent value="overview" className="mt-6 space-y-10 animate-in slide-in-from-bottom-2 duration-500">
                     <section>
                         <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Synopsis</h3>
                         <p className="leading-relaxed text-lg text-muted-foreground whitespace-pre-wrap">{book.description || "No synopsis provided."}</p>
                     </section>

                     <section>
                         <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Table of Contents</h3>
                         <div className="space-y-2">
                             {chapters.length > 0 ? (
                                 chapters.map((chapter, idx) => (
                                     <Card 
                                        key={chapter.id} 
                                        className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-transparent hover:border-l-primary group"
                                        onClick={() => setActiveChapterIndex(idx)}
                                     >
                                         <CardContent className="p-4 flex justify-between items-center">
                                             <div className="flex items-center gap-3">
                                                 <span className="text-muted-foreground/50 font-mono text-sm w-6">{idx + 1}.</span>
                                                 <h3 className="text-base md:text-lg font-medium group-hover:text-primary transition-colors">{chapter.title}</h3>
                                             </div>
                                             {/* Force opacity-100 on mobile */}
                                             <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-100 md:opacity-50 md:group-hover:text-primary md:group-hover:opacity-100" />
                                         </CardContent>
                                     </Card>
                                 ))
                             ) : (
                                 <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">No chapters published yet.</div>
                             )}
                         </div>
                     </section>
                 </TabsContent>

                 <TabsContent value="comments" className="mt-6 space-y-6">
                     {user ? (
                        <div className="border p-4 rounded-lg bg-muted/20 space-y-3">
                            <h4 className="font-semibold text-sm">Leave a Comment</h4>
                            <Textarea 
                                value={mainCommentText} 
                                onChange={e => setMainCommentText(e.target.value)} 
                                placeholder="Share your thoughts about this book..." 
                                className="bg-background min-h-[100px]"
                            />
                            <div className="flex justify-end">
                                <Button onClick={(e) => handlePostComment(e, false)} disabled={isSubmitting || !mainCommentText.trim()}>
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </Button>
                            </div>
                        </div>
                     ) : (
                         <div className="text-center p-6 bg-muted/20 rounded-md text-muted-foreground">Log in to post a comment</div>
                     )}
                     
                     <div className="space-y-6">
                        {combinedComments.length > 0 ? (
                            combinedComments.map(c => (
                                <div key={c.id} className="border-b pb-6 last:border-0 group">
                                    <div className="flex justify-between items-start gap-4">
                                        <Avatar className="h-10 w-10 border bg-muted">
                                            <AvatarImage src={c.author.photoURL} />
                                            <AvatarFallback>{c.author.displayName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link href={`/users/${c.author.uid}`} className="font-semibold text-sm hover:underline">{c.author.displayName}</Link>
                                                    
                                                    {c.chapterTitle && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 max-w-[150px] truncate">
                                                            {c.chapterTitle}
                                                        </Badge>
                                                    )}
                                                    
                                                    <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(c.createdAt?.toDate() || new Date())} ago</span>
                                                </div>
                                                
                                                {user && user.uid === c.author.uid && (
                                                    // Force opacity-100 on mobile
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDeleteComment(c)}
                                                        title="Delete Comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                <p>No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        )}
                     </div>
                 </TabsContent>

             </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}