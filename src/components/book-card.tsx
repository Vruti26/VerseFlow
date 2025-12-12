import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type BookCardProps = {
  book: {
    id: string;
    title: string;
    author: string;
    coverImageId: string;
  };
};

export function BookCard({ book }: BookCardProps) {
  const coverImage = PlaceHolderImages.find(img => img.id === book.coverImageId);

  return (
    <Link href={`/books/${book.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative w-full">
            {coverImage && (
              <Image
                src={coverImage.imageUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={coverImage.imageHint}
              />
            )}
          </div>
          <div className="p-4">
            <h3 className="font-headline font-semibold truncate" title={book.title}>{book.title}</h3>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
