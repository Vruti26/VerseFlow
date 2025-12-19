import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 h-full flex flex-col rounded-lg shadow-md">
        <div className="aspect-[2/3] relative w-full">
          <Image
            src={book.coverImage || '/placeholder-cover.jpg'}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
           {book.status === 'draft' && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary">Draft</Badge>
              </div>
            )}
        </div>
        <CardContent className="p-3 flex-grow flex flex-col justify-between">
            <div>
                <h3 className="font-headline font-semibold text-lg truncate" title={book.title}>{book.title}</h3>
                {book.author && <p className="text-sm text-muted-foreground truncate">by {book.author}</p>}
            </div>
        </CardContent>
      </Card>
    </Link>
  );
}
