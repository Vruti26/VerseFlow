'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookCopy, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-2 ring-primary/20">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Verify Your Email</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We\'ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
        </p>
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Didn\'t receive the email? Check your spam folder or request a new link.
          </p>
        </div>
        <div className="mt-10">
          <Button
            onClick={() => router.push('/login')}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Back to Login
          </Button>
        </div>
      </div>
      <div className="absolute bottom-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <BookCopy className="h-5 w-5" />
        <span>VerseFlow</span>
      </div>
    </div>
  );
}
