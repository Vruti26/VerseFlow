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
import { Button } from '@/components/ui/button';
import { 
  Book, 
  Library, 
  Settings, 
  Calendar, 
  Mail, 
  User as UserIcon, 
  Shield, 
  Trash2, 
  Users, 
  Share2,
  PenTool
} from 'lucide-react';

// Components
import UpdatePasswordForm from '@/components/profile/update-password-form';
import DeleteAccountForm from '@/components/profile/delete-account-form';
import UpdateProfileInfoForm from '@/components/profile/update-profile-info-form';
import MyWorks from '@/components/profile/user-works';
import ReadingList from '@/components/profile/reading-list';
import VerifyEmailButton from '@/components/profile/verify-email-button';
import FollowersList from '@/components/profile/followers-list';
import FollowingList from '@/components/profile/following-list';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData {
  bio?: string;
  headerImageURL?: string;
  displayName?: string;
  photoURL?: string;
  followers?: string[];
  following?: string[];
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  // Fetch extended profile data from Firestore
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Profile link copied to clipboard." });
  };

  if (authLoading || dataLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) return null;

  const displayName = profileData?.displayName || user.displayName || 'Anonymous Author';
  const photoURL = profileData?.photoURL || user.photoURL;
  const headerImage = profileData?.headerImageURL;
  const followersCount = profileData?.followers?.length || 0;
  const followingCount = profileData?.following?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* 1. Hero Banner */}
      <div className="relative h-60 md:h-80 w-full overflow-hidden bg-slate-200 dark:bg-slate-900 z-0">
        {headerImage ? (
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 animate-in fade-in"
                style={{ backgroundImage: `url(${headerImage})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
        ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 dark:from-violet-900 dark:via-fuchsia-900 dark:to-indigo-900">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
            </div>
        )}
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 pb-20">
        
        {/* 2. Profile Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            
            {/* Avatar Section */}
            <div className="relative -mt-20 md:-mt-28 flex-shrink-0 group">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                    <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 border-slate-50 dark:border-slate-800 shadow-inner">
                        <AvatarImage src={photoURL || undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback className="text-5xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-headline">
                            {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 w-full">
                <div className="w-full space-y-2">
                    <div className="flex flex-col md:flex-row items-center md:justify-between w-full gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                                {displayName}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {user.email}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Joined {new Date(user.metadata.creationTime!).getFullYear()}</span>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                            {/* You could add an 'Edit Profile' button here that switches tab to settings */}
                        </div>
                    </div>

                    {/* Bio */}
                    {profileData?.bio && (
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl text-base leading-relaxed mt-2 font-light">
                            {profileData.bio}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                        <div className="flex flex-col items-center md:items-start cursor-pointer group">
                            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{followersCount}</span>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Followers</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex flex-col items-center md:items-start cursor-pointer group">
                            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{followingCount}</span>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Following</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100/50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/30 text-violet-700 dark:text-violet-300">
                            <PenTool className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">Author</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Main Content Tabs */}
        <div className="mt-10">
            <Tabs defaultValue="works" className="w-full space-y-8">
            
            {/* Sticky Tab Bar for better UX on scroll */}
            <div className="sticky top-16 z-20 -mx-4 px-4 md:mx-0 md:px-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-2">
                <TabsList className="w-full max-w-4xl grid grid-cols-4 bg-white/50 dark:bg-slate-900/50 p-1 rounded-xl mx-auto border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <TabsTrigger value="works" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium data-[state=active]:text-primary">
                        <Book className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">My</span> Works
                    </TabsTrigger>
                    <TabsTrigger value="reading-list" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium data-[state=active]:text-primary">
                        <Library className="w-4 h-4 mr-2" /> Library
                    </TabsTrigger>
                    <TabsTrigger value="network" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium data-[state=active]:text-primary">
                        <Users className="w-4 h-4 mr-2" /> Network
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium data-[state=active]:text-primary">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="min-h-[500px]">
                {/* MY WORKS TAB */}
                <TabsContent value="works" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold font-headline">Published Stories</h2>
                        {/* Optional: Add a 'Create New' button here if MyWorks doesn't have one */}
                    </div>
                    {/* Assuming MyWorks renders a responsive grid of Book Cards */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-2 md:p-6 border border-slate-100 dark:border-slate-800/50 min-h-[300px]">
                        <MyWorks />
                    </div>
                </TabsContent>

                {/* READING LIST TAB */}
                <TabsContent value="reading-list" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-2 md:p-6 border border-slate-100 dark:border-slate-800/50">
                        <ReadingList />
                    </div>
                </TabsContent>

                {/* NETWORK TAB */}
                <TabsContent value="network" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                        <Tabs defaultValue="followers" className="w-full">
                            <div className="flex justify-center mb-6">
                                <TabsList className="grid w-full max-w-sm grid-cols-2">
                                    <TabsTrigger value="followers">Followers</TabsTrigger>
                                    <TabsTrigger value="following">Following</TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="followers" className="mt-0">
                                <FollowersList userId={user.uid} />
                            </TabsContent>
                            <TabsContent value="following" className="mt-0">
                                <FollowingList userId={user.uid} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserIcon className="w-5 h-5 text-blue-500" /> Public Profile
                                </CardTitle>
                                <CardDescription>Update your profile name, bio and visuals.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UpdateProfileInfoForm initialData={profileData} />
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Shield className="w-5 h-5 text-green-500" /> Security
                                </CardTitle>
                                <CardDescription>Manage your password and authentication.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <UpdatePasswordForm />
                                <VerifyEmailButton />
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 shadow-sm border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
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
                <Skeleton className="h-12 w-full max-w-2xl rounded-xl mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    </div>
  );
}