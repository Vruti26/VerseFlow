'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookCopy, Loader2, ChevronLeft, Quote, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 1. Visibility State
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ variant: 'success', title: "Welcome back!", description: "It's good to see you again." });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: "Invalid email or password. Please try again.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      
      {/* 1. Left Column: Branding / Visuals */}
      <div className="hidden bg-muted lg:block relative h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-500 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            <div className="flex items-center gap-2 text-lg font-bold">
                <BookCopy className="h-6 w-6" /> VerseFlow
            </div>
            
            <div className="space-y-6 max-w-lg">
                <Quote className="h-10 w-10 text-white/50" />
                <blockquote className="text-2xl font-medium leading-relaxed">
                    "A reader lives a thousand lives before he dies. The man who never reads lives only one."
                </blockquote>
                <div className="flex items-center gap-4">
                    <div className="h-px w-10 bg-white/50" />
                    <footer className="text-sm font-medium text-white/80">George R.R. Martin</footer>
                </div>
            </div>

            <div className="text-xs text-white/40">
                © {new Date().getFullYear()} VerseFlow Inc. All rights reserved.
            </div>
        </div>
      </div>

      {/* 2. Right Column: Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="mx-auto w-full max-w-[400px] space-y-8">
            
            <div className="flex flex-col space-y-2 text-center">
                <div className="flex justify-center mb-4 lg:hidden">
                    <div className="p-3 rounded-full bg-primary/10">
                        <BookCopy className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your credentials to access your library
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="h-11"
                    />
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link 
                            href="/forgot-password" 
                            className="text-xs text-primary hover:underline font-medium transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    
                    {/* Password Input with Toggle */}
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"} // Dynamic Type
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="h-11 pr-10" // Padding right to prevent text overlap
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-medium shadow-lg hover:shadow-primary/25 transition-all" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Authenticating...' : 'Log In'}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        New to VerseFlow?
                    </span>
                </div>
            </div>

            <div className="text-center">
                <Link 
                    href="/signup" 
                    className="inline-flex items-center justify-center text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
                >
                    Create an account
                </Link>
            </div>

            

        </div>
      </div>
    </div>
  );
}