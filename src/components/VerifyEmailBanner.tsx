'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

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

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="w-full p-4 bg-yellow-100 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900">
      <div className="container flex flex-col items-center justify-center gap-4 text-center">
        <div className='text-amber-800 dark:text-amber-200'>
            <h4 className="font-semibold">Email Verification Required</h4>
            <p className="text-sm">
                Your email address is not verified. Please verify your email to get full access to all features.
            </p>
        </div>
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
    </div>
  );
}
