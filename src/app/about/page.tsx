import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, PenTool, Heart, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About VerseFlow',
  description: 'Learn about the mission and vision of VerseFlow.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      
      {/* --- Hero Section --- */}
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium rounded-full mb-4">
          Our Story
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">VerseFlow</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          Where stories find their voice, and readers find their world.
        </p>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        
        {/* Mission Card (Spans full width on larger screens if desired, currently 2 cols) */}
        <Card className="md:col-span-2 border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Target className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              VerseFlow was born from a simple yet powerful idea: everyone has a story to tell, and every story deserves to be heard. Our mission is to provide a beautiful, intuitive, and empowering platform for writers of all levels—from aspiring novelists to seasoned authors—to bring their creative visions to life. We believe in the power of words to connect, inspire, and transport us to new realities.
            </p>
          </CardContent>
        </Card>

        {/* For Writers Card */}
        <Card className="border shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <PenTool className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold font-headline">For Writers, By Writers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              We're building the tools we always wished we had. VerseFlow is more than just a writing app; it's a complete ecosystem for your creative process. Draft your masterpiece, organize your thoughts, and when you're ready, publish your work for a global community of readers.
            </p>
          </CardContent>
        </Card>

        {/* Community Card */}
        <Card className="border shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
              <Heart className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold font-headline">Join Our Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Whether you're here to pen the next great epic or to discover your new favorite author, you're a vital part of the VerseFlow story. We invite you to explore, share feedback, and celebrate creativity.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Your next chapter starts here.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Footer / Signature Section --- */}
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <Separator className="w-1/2 mx-auto opacity-50" />
        <div className="space-y-2">
           <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Created with passion by
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            Vruti Rupapara
          </h3>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} VerseFlow. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}