'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onIdTokenChanged, User, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // If user is new (first sign-in) and email is not verified, send verification email
        if (user.metadata.creationTime === user.metadata.lastSignInTime && !user.emailVerified) {
            try {
                await sendEmailVerification(user);
            } catch (error) {
                console.error("Error sending verification email automatically:", error);
            }
        }

        // User is signed in, manage their document in the users collection
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const usersRef = collection(db, 'users');

        if (!userDocSnap.exists()) {
          // If the document doesn't exist, create it.
          const newDisplayName = user.displayName;
          let finalDisplayName = 'Anonymous';

          if (newDisplayName && newDisplayName !== 'Anonymous') {
              const q = query(usersRef, where("displayName", "==", newDisplayName));
              const querySnapshot = await getDocs(q);
              if (querySnapshot.empty) {
                  finalDisplayName = newDisplayName;
              } else {
                  toast({
                      variant: "destructive",
                      title: "Display Name Taken",
                      description: `The name "${newDisplayName}" is already in use. Please choose another one in your profile settings.`,
                  });
              }
          }

          try {
            await setDoc(userDocRef, {
              displayName: finalDisplayName,
              photoURL: user.photoURL || '',
              readingList: [], // Initialize with an empty reading list
              followers: [],
              following: [],
            });
          } catch (error) {
            console.error("Error creating user document:", error);
          }

        } else {
          // If document exists and displayName is a placeholder, update it with auth data.
          const userData = userDocSnap.data();
          if (userData.displayName === 'Anonymous' && user.displayName && user.displayName !== 'Anonymous') {
              const q = query(usersRef, where("displayName", "==", user.displayName));
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                  try {
                      await updateDoc(userDocRef, { displayName: user.displayName });
                  } catch (error) {
                      console.error("Error updating user displayName:", error);
                  }
              } else {
                toast({
                    variant: "destructive",
                    title: "Display Name Taken",
                    description: `The name "${user.displayName}" from your account is already in use. Your name remains "Anonymous". Please set a unique name in your profile settings.`,
                });
              }
          }
        }

        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8">
          <Skeleton className="h-96 w-full" />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
