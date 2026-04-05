'use client';

// removed imports for auth and router since we don't need to block anyone anymore

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We removed the useAuth() check, the useEffect redirect, and the Email Verification screen.
  // Now, this layout simply renders whatever page is inside it.

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}