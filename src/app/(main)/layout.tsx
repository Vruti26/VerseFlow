'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox to verify your email address.',
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send verification email. Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Verify Your Email</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Please verify your email address to continue. We've sent a verification link to{' '}
                        <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>.
                    </p>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Didn't receive the email?
                    </p>
                    <Button onClick={handleSendVerification} disabled={isSending}>
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Resend Verification Email'
                        )}
                    </Button>
                </div>
                <div className="text-center">
                    <Button variant="link" onClick={() => router.push('/login')}>
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
