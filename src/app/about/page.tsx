
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About VerseFlow',
  description: 'Learn about the mission and vision of VerseFlow.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-gray-900 dark:text-gray-100">
          About VerseFlow
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground">
          Where stories find their voice, and readers find their world.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mt-12 md:mt-16 space-y-8 text-left">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-gray-900 dark:text-gray-100">
            Our Mission
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            VerseFlow was born from a simple yet powerful idea: everyone has a story to tell, and every story deserves to be heard. Our mission is to provide a beautiful, intuitive, and empowering platform for writers of all levels—from aspiring novelists to seasoned authors—to bring their creative visions to life. We believe in the power of words to connect, inspire, and transport us to new realities.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-gray-900 dark:text-gray-100">
            For Writers, By Writers
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            We're building the tools we always wished we had. VerseFlow is more than just a writing app; it's a complete ecosystem for your creative process. Draft your masterpiece, organize your thoughts, and when you're ready, publish your work for a global community of readers.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-gray-900 dark:text-gray-100">
            Join Our Community
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Whether you're here to pen the next great epic or to discover your new favorite author, you're a vital part of the VerseFlow story. We invite you to explore our growing library, share your feedback, and become part of a community that celebrates creativity in all its forms.
          </p>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-semibold">
            Your next chapter starts here.
          </p>
        </div>
      </div>
    </div>
  );
}
