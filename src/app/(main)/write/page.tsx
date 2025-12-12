import { SynopsisAssistant } from '@/components/ai/synopsis-assistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Feather, Book, Tag, Save, Upload } from 'lucide-react';

export default function WritePage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <Feather className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-4xl font-bold">Writer's Dashboard</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-2xl"><Book/> Book Details</CardTitle>
              <CardDescription>
                Provide the core details of your story. A great title and synopsis are key to attracting readers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-base">Book Title</Label>
                <Input id="title" placeholder="e.g., The Last Dragon's Song" className="mt-2 text-lg h-12" />
              </div>
              
              <div>
                <Label htmlFor="hashtags" className="text-base flex items-center gap-2"><Tag/> Hashtags</Label>
                 <p className="text-sm text-muted-foreground mb-2">
                    Add up to 5 hashtags to help readers find your book.
                 </p>
                <Input id="hashtags" placeholder="#fantasy #magic #adventure" />
              </div>

               <div>
                <Label htmlFor="cover" className="text-base flex items-center gap-2"><Upload/> Book Cover</Label>
                 <p className="text-sm text-muted-foreground mb-2">
                    Upload an image for your book's cover.
                 </p>
                 <Input id="cover" type="file" />
              </div>

            </CardContent>
          </Card>
          
          <Separator/>
          
          <SynopsisAssistant />
          
          <Separator/>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Write a New Chapter</CardTitle>
              <CardDescription>
                Let your story unfold. You can save your progress at any time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="chapter-title" className="text-base">Chapter Title</Label>
                    <Input id="chapter-title" placeholder="e.g., The Awakening" className="mt-2 text-lg h-12" />
                </div>
                <div>
                    <Label htmlFor="chapter-content" className="text-base">Chapter Content</Label>
                    <Textarea id="chapter-content" rows={20} placeholder="It was a dark and stormy night..." className="mt-2 font-body text-base leading-relaxed"/>
                </div>
            </CardContent>
          </Card>
          
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button size="lg"><Save /> Save Draft</Button>
                    <Button size="lg" variant="secondary">Publish Book</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">No chapters written yet.</p>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
