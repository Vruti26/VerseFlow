import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/book-card';
import { books, hashtags } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  
  return (
    <div className="flex flex-col gap-12 md:gap-16 lg:gap-20 py-8 md:py-12">
      {/* Hero Section */}
      <section className="container">
        <div className="relative rounded-lg overflow-hidden p-8 md:p-16 min-h-[400px] flex items-center">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                priority
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
            <div className="relative z-10 max-w-2xl">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
                Dive into a Universe of Stories
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
                Read, write, and share your own narratives. VerseFlow is where stories come to life.
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild>
                  <Link href="/write">Start Writing <ArrowRight/></Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="#trending">Explore Stories</Link>
                </Button>
              </div>
            </div>
        </div>
      </section>

      {/* Trending Books Section */}
      <section id="trending" className="container">
        <h2 className="font-headline text-3xl font-bold mb-6">Trending Books</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.slice(0, 6).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* Browse by Hashtag Section */}
      <section className="container">
        <h2 className="font-headline text-3xl font-bold mb-6">Trending Hashtags</h2>
        <div className="flex flex-wrap gap-3">
          {hashtags.map((hashtag) => (
            <Badge key={hashtag.tag} variant="secondary" className="text-base px-4 py-2 transition-transform hover:scale-105 hover:bg-accent hover:text-accent-foreground cursor-pointer">
              {hashtag.tag}
            </Badge>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="container">
        <h2 className="font-headline text-3xl font-bold mb-6">New Arrivals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.slice(3, 9).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
