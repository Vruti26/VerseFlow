'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function VerifyEmailButton() {
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
    return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Email is verified.</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900">
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
  );
}
