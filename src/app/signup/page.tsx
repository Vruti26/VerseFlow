'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookCopy, Loader2, ChevronLeft, Quote, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      toast({ 
        variant: 'success', 
        title: 'Welcome to VerseFlow!', 
        description: 'Your account has been successfully created.' 
      });

      router.push('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      
      {/* 1. Left Column: Branding / Visuals */}
      <div className="hidden bg-muted lg:flex relative h-full flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900 opacity-90" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>
        
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-pink-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/30 blur-[100px] animate-pulse" style={{ animationDuration: '15s' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <BookCopy className="h-6 w-6" /> 
            </div>
            VerseFlow
        </div>
        
        {/* Testimonial */}
        <div className="relative z-10 space-y-8 max-w-lg">
            <Quote className="h-12 w-12 text-white/30" />
            <blockquote className="text-3xl font-medium leading-snug tracking-tight">
                "There is no greater agony than bearing an untold story inside you."
            </blockquote>
            <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-white/40" />
                <div className="flex flex-col">
                    <span className="text-base font-semibold">Maya Angelou</span>
                    <span className="text-xs text-white/60 uppercase tracking-widest">Poet & Author</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="relative z-2 text-xs text-white/50 font-medium">
            © {new Date().getFullYear()} VerseFlow Inc. All rights reserved.
        </div>
      </div>

      {/* 2. Right Column: Sign Up Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative">
        <div className="mx-auto w-full max-w-[440px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
                <div className="flex justify-center mb-6 lg:hidden">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <BookCopy className="h-8 w-8" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Start your writing journey today. Join a community of storytellers.
                </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSignup}>
                
                {/* Name Input */}
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            id="name"
                            placeholder="Sanne Joshi"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            className="h-11 pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                        />
                    </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="h-11 pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                        />
                    </div>
                </div>
                
                {/* Password Input */}
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="h-11 pl-10 pr-10 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-1">
                        Must be at least 6 characters long.
                    </p>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2" 
                    disabled={loading}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Creating Account...' : 'Get Started'}
                </Button>
            </form>

            {/* Footer / Login Link */}
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-muted-foreground font-medium tracking-wide">
                            Already a member?
                        </span>
                    </div>
                </div>

                <div className="text-center">
                    <Link 
                        href="/login" 
                        className="inline-flex items-center justify-center h-11 w-full rounded-md border border-muted-foreground/20 bg-background px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors hover:border-accent"
                    >
                        Log in to your account
                    </Link>
                </div>
            </div>

            {/* Mobile Back Button */}
            

        </div>
      </div>
    </div>
  );
}