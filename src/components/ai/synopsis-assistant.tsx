'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getSynopsisSuggestions, FormState } from '@/app/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, Loader2, AlertCircle } from 'lucide-react';

const initialState: FormState = {
  status: 'idle',
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
      {pending ? 'Analyzing...' : 'Get AI Suggestions'}
    </Button>
  );
}

export function SynopsisAssistant() {
  const [state, formAction] = useFormState(getSynopsisSuggestions, initialState);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wand2 className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">AI Writing Assistant</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Get AI-powered suggestions to improve your synopsis. The AI will check for grammar, sentence structure, and suggest new content ideas.
        </p>
        <form action={formAction} className="space-y-4">
          <Textarea
            name="synopsis"
            placeholder="Enter your book's synopsis here (at least 20 characters)..."
            rows={6}
            required
          />
          <SubmitButton />
        </form>

        {state.status === 'error' && state.message && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.status === 'success' && state.data && (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Content Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap font-body">
                {state.data.suggestions}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Grammar & Structure Improvements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap font-body">
                {state.data.grammarImprovements}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
