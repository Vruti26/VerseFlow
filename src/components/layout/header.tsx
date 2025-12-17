'use client';

import Link from 'next/link';
import { BookCopy, Feather, Library, LogIn, Menu, MessageSquare, Search, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1');
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

        <div className="flex items-center gap-4">
          <div className="relative hidden w-full max-w-sm items-center md:flex">
            <Input type="text" placeholder="Search books or authors..." className="pl-10" />
            <span className="absolute inset-y-0 left-0 flex items-center justify-center pl-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
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
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}><LogOut/> Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login"><LogIn/> Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup"><UserPlus/> Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                    <BookCopy className="h-6 w-6 text-primary" />
                    <span className="font-headline text-xl font-bold">VerseFlow</span>
                </Link>
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
                 <div className="mt-4 flex flex-col gap-2">
                    {user ? (
                       <Button variant="ghost" onClick={handleLogout}><LogOut/> Logout</Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                            <Link href="/login"><LogIn/> Login</Link>
                            </Button>
                            <Button asChild>
                            <Link href="/signup"><UserPlus/> Sign Up</Link>
                            </Button>
                        </>
                    )}
                  </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
