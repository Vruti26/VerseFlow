'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookCopy, Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { debounce } from 'lodash';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.emailVerified) {
      router.push('/');
    }
  }, [user, router]);

  const checkNameAvailability = useCallback(
    debounce(async (name: string) => {
      if (name.length > 3) {
        setNameStatus('checking');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("displayName", "==", name));
        const querySnapshot = await getDocs(q);
        setNameStatus(querySnapshot.empty ? 'available' : 'taken');
      } else {
        setNameStatus('idle');
      }
    }, 500),[]
  );

  useEffect(() => {
    checkNameAvailability(name);
  }, [name, checkNameAvailability]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameStatus !== 'available') {
        toast({
            variant: 'destructive',
            title: 'Username already exist',
            description: 'Please choose a different name.',
        });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      toast({ 
        variant: 'success', 
        title: 'Welcome to VerseFlow!', 
        description: 'Your account has been successfully created.' 
      });

      router.push('/verify-email');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (user && user.emailVerified) return null;

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden bg-muted lg:flex relative h-full flex-col justify-between p-12 text-white overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900 opacity-90" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <BookCopy className="h-6 w-6" /> 
              </div>
              VerseFlow
          </div>
          <div className="relative z-10 text-xs text-white/50 font-medium">
              © {new Date().getFullYear()} VerseFlow Inc. All rights reserved.
          </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative">
        <div className="mx-auto w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Join a community of storytellers.
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                    <Label htmlFor="name">Username</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="name"
                            placeholder="Choose a unique username"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            className="h-11 pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {nameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {nameStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {nameStatus === 'taken' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                    </div>
                    <div className="text-xs h-4 px-1 mt-1">
                        {name.length > 3 && nameStatus === 'taken' && (
                            <span className="text-red-500 font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Username already exist.
                            </span>
                        )}
                        {name.length > 3 && nameStatus === 'available' && (
                            <span className="text-green-500 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3"/> Username is available!
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                     <p className="text-[11px] text-muted-foreground ml-1">Must be at least 6 characters long.</p>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium shadow-lg transition-all mt-2"
                    disabled={loading || nameStatus !== 'available'}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Creating Account...' : 'Get Started'}
                </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
                Already a member? <Link href="/login" className="font-semibold text-primary hover:underline">Log In</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
