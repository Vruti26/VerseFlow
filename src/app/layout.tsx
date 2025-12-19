import type { Metadata } from 'next';
import { Literata, Space_Grotesk } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import GlobalHeader from '@/components/layout/global-header';

const literata = Literata({
  subsets: ['latin'],
  variable: '--font-literata',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VerseFlow',
  description: 'Read, write, and share stories.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen bg-background font-body antialiased", 
          "flex flex-col", 
          literata.variable, 
          spaceGrotesk.variable
        )}
      >
          <AuthProvider>
            <GlobalHeader />
            <main className="flex-1">
              {children}
            </main>
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
