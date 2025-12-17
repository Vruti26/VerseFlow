import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
