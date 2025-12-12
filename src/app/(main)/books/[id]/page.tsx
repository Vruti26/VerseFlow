import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Bookmark, Library, MessageCircle, Share2, Star } from 'lucide-react';
import { books } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

export default function BookPage({ params }: { params: { id: string } }) {
  const book = books.find((b) => b.id === params.id);
  
  if (!book) {
    notFound();
  }

  const coverImage = PlaceHolderImages.find(img => img.id === book.coverImageId);
  const authorAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-2');

  return (
    <div className="container py-8 md:py-12">
      <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24 flex flex-col gap-4">
            <Card className="overflow-hidden">
                {coverImage && (
                  <Image
                    src={coverImage.imageUrl}
                    alt={`Cover of ${book.title}`}
                    width={400}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                    data-ai-hint={coverImage.imageHint}
                  />
                )}
            </Card>
            <div className="grid grid-cols-2 gap-2">
                <Button size="lg"><BookOpen/>Read Now</Button>
                <Button size="lg" variant="outline"><Library/>Add to Library</Button>
            </div>
            <Button variant="secondary"><Share2/>Share</Button>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          <h1 className="font-headline text-4xl lg:text-5xl font-bold">{book.title}</h1>
          <div className="flex items-center gap-2 mt-2 mb-4 text-lg text-muted-foreground">
            <span>by</span>
            <span className="font-semibold text-foreground">{book.author}</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5"><Star className="text-yellow-500 fill-yellow-500" /> 4.7 (1.2k reviews)</div>
              <div className="flex items-center gap-1.5"><BookOpen /> {book.chapters.length} Chapters</div>
              <div className="flex items-center gap-1.5"><Bookmark /> {Math.floor(Math.random() * 5000) + 1000} Reads</div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {book.hashtags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          <Separator />

          <div className="prose prose-stone dark:prose-invert max-w-none py-8 font-body text-base">
            <h2 className="font-headline text-2xl font-bold mb-4">Synopsis</h2>
            <p>{book.synopsis}</p>
          </div>

          <Separator/>
          
          <div className="py-8">
            <h2 className="font-headline text-2xl font-bold mb-4">Chapters</h2>
            <div className="flex flex-col gap-4">
                {book.chapters.length > 0 ? book.chapters.map((chapter, index) => (
                    <Card key={chapter.id} className="transition-colors hover:bg-secondary">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div>
                                <CardTitle className="text-lg font-medium">Chapter {index + 1}: {chapter.title}</CardTitle>
                                <CardDescription>{chapter.wordCount.toLocaleString()} words</CardDescription>
                            </div>
                            <Button variant="ghost">Read</Button>
                        </CardHeader>
                    </Card>
                )) : (
                    <p className="text-muted-foreground">This story has no chapters yet.</p>
                )}
            </div>
          </div>
          
          <Separator/>

          <div className="py-8">
            <h2 className="font-headline text-2xl font-bold mb-4">About the Author</h2>
            <Card>
                <CardContent className="p-6 flex items-start gap-6">
                    <Avatar className="w-16 h-16">
                        {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={book.author}/>}
                        <AvatarFallback>{book.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-headline text-xl font-bold">{book.author}</h3>
                        <p className="text-muted-foreground mt-2">A passionate storyteller exploring the depths of fantasy and the mysteries of the human heart. Follow for more adventures!</p>
                        <Button variant="outline" className="mt-4">Follow</Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
