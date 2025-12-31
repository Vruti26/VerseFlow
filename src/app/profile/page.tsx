'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Library, Settings, Calendar, Mail, User as UserIcon, Shield, Trash2, Edit, ImageIcon, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Components
import UpdatePasswordForm from '@/components/profile/update-password-form';
import DeleteAccountForm from '@/components/profile/delete-account-form';
import UpdateProfileInfoForm from '@/components/profile/update-profile-info-form';
import MyWorks from '@/components/profile/my-works';
import ReadingList from '@/components/profile/reading-list';

interface UserProfileData {
  bio?: string;
  headerImageURL?: string;
  displayName?: string;
  photoURL?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch extended profile data (Bio, Header Image) from Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfileData(doc.data() as UserProfileData);
      }
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || dataLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) return null;

  // Use Firestore data if available, otherwise fallback to Auth data
  const displayName = profileData?.displayName || user.displayName || 'Anonymous Author';
  const photoURL = profileData?.photoURL || user.photoURL;
  const headerImage = profileData?.headerImageURL;
  const bio = profileData?.bio;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* 1. Hero Banner - Dynamic Image Support */}
      <div className="relative h-60 md:h-50 w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
        {headerImage ? (
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                style={{ backgroundImage: `url(${headerImage})` }}
            >
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
            </div>
        ) : (
            // Default Gradient if no header image
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-900 dark:via-purple-900 dark:to-indigo-900">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
            </div>
        )}
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 pb-20">
        
        {/* 2. Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 backdrop-blur-sm">
            
            {/* Avatar */}
            <div className="relative -mt-20 md:-mt-28 flex-shrink-0">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full">
                    <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 border-slate-100 dark:border-slate-800 shadow-inner">
                        <AvatarImage src={photoURL || undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback className="text-5xl bg-slate-100 dark:bg-slate-800 text-slate-400">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* User Info & Bio */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 w-full">
                <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <h1 className="text-3xl md:text-4xl font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                            {displayName}
                        </h1>
                        <Badge variant="secondary" className="hidden md:inline-flex bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
                            Author
                        </Badge>
                    </div>
                    
                   
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-auto text-sm font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {new Date(user.metadata.creationTime!).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Tabs */}
        <div className="mt-12">
            <Tabs defaultValue="works" className="w-full space-y-8">
            
            <TabsList className="w-full max-w-2xl grid grid-cols-3 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl mx-auto md:mx-0">
                <TabsTrigger value="works" className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                    <Book className="w-4 h-4 mr-2" /> My Works
                </TabsTrigger>
                <TabsTrigger value="reading-list" className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                    <Library className="w-4 h-4 mr-2" /> Library
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                </TabsTrigger>
            </TabsList>

            <div className="min-h-[400px]">
                <TabsContent value="works" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <MyWorks />
                </TabsContent>

                <TabsContent value="reading-list" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <ReadingList />
                </TabsContent>

                <TabsContent value="settings" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Pass the current profile data to the form so it can pre-fill */}
                    <Card className="md:col-span-1 shadow-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserIcon className="w-5 h-5 text-blue-500" /> Public Profile
                        </CardTitle>
                        <CardDescription>Update your profile name and photo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UpdateProfileInfoForm initialData={profileData} />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1 shadow-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="w-5 h-5 text-green-500" /> Security
                        </CardTitle>
                        <CardDescription>Manage password & access.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <UpdatePasswordForm />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-none border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                            <Trash2 className="w-5 h-5" /> Danger Zone
                        </CardTitle>
                        <CardDescription className="text-red-600/70 dark:text-red-400/70">Irreversible actions regarding your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <DeleteAccountForm />
                        </CardContent>
                    </Card>

                    </div>
                </TabsContent>
            </div>
            </Tabs>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="h-60 md:h-80 w-full bg-slate-200 dark:bg-slate-900 animate-pulse" />
        <div className="container max-w-6xl mx-auto px-4 -mt-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 h-48 animate-pulse mb-12" />
            <div className="grid gap-6">
                <Skeleton className="h-12 w-96 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    </div>
  );
}