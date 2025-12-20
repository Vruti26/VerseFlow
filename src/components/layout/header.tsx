'use client';

import Link from 'next/link';
import { BookCopy, Feather, Library, LogIn, Menu, MessageSquare, UserPlus, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Discover', icon: BookCopy },
  { href: '/write', label: 'Write', icon: Feather },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BookCopy className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold text-foreground">VerseFlow</span>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop User Menu */}
          <div className="hidden md:flex">
             {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} />}
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'VerseFlow User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}><UserIcon className="mr-2 h-4 w-4"/> Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}><Settings className="mr-2 h-4 w-4"/> Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex items-center gap-2'>
                <Button variant="ghost" asChild>
                  <Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup"><UserPlus className="mr-2 h-4 w-4"/> Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <SheetHeader>
                 <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                    <BookCopy className="h-6 w-6 text-primary" />
                    <span className="font-headline text-xl font-bold">VerseFlow</span>
                </Link>
              </SheetHeader>

              {user ? (
                <div className="flex h-full flex-col justify-between">
                   <nav className="grid gap-4 text-base font-medium mt-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    ))}
                     <Link
                        href='/profile'
                        className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
                      >
                        <UserIcon className="h-5 w-5" />
                        Profile
                      </Link>
                      <Link
                        href='/settings'
                        className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                  </nav>
                   <div className="mt-auto mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} />}
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <p className="text-sm font-medium leading-none">{user.displayName || 'VerseFlow User'}</p>
                             <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                     <Button variant="outline" onClick={handleLogout} className="w-full"><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
                  </div>
                </div>
              ) : (
                <nav className="grid gap-4 text-base font-medium mt-4">
                   <Button variant="default" asChild className='justify-start'>
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Login</Link>
                    </Button>
                    <Button variant="secondary" asChild className='justify-start'>
                        <Link href="/signup"><UserPlus className="mr-2 h-4 w-4"/> Sign Up</Link>
                    </Button>
                </nav>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
