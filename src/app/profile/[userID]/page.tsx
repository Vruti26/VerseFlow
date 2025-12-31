'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  UserCheck, 
  Share2, 
  MessageSquare,
  PenTool,
  Book
} from 'lucide-react';

// Service functions
import { followUser, unfollowUser } from '@/lib/follow-service';

// Components
import FollowersList from '@/components/profile/followers-list';
import FollowingList from '@/components/profile/following-list';
import MyWorks from '@/components/profile/user-works'; 

interface UserProfileData {
  bio?: string;
  headerImageURL?: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  createdAt?: any;
  followers?: string[];
  following?: string[];
}

export default function UserProfilePage() {
  const { userID } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!userID) return;
    
    const userRef = doc(db, 'users', userID as string);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        setProfileData(data);
        
        if (currentUser && data.followers?.includes(currentUser.uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      } else {
        setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userID, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: "Authentication Required", description: "Please log in to follow authors." });
        return;
    }
    if (!userID) return;

    setIsActionLoading(true);
    try {
        await followUser(currentUser.uid, userID as string);
        toast({ title: "Following", description: `You are now following ${profileData?.displayName}` });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error", description: "Could not follow user." });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !userID) return;

    setIsActionLoading(true);
    try {
        await unfollowUser(currentUser.uid, userID as string);
        toast({ title: "Unfollowed", description: `You unfollowed ${profileData?.displayName}` });
    } catch (error) {
        console.error(error);
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Profile link copied to clipboard." });
  };
  
  const handleMessage = async () => {
    if (!currentUser || !userID || currentUser.uid === userID) return;

    setIsActionLoading(true);
    try {
        const chatId = currentUser.uid > (userID as string) 
            ? `${currentUser.uid}_${userID}` 
            : `${userID}_${currentUser.uid}`;

        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            const user1Ref = doc(db, 'users', currentUser.uid);
            const user2Ref = doc(db, 'users', userID as string);
            const user1Snap = await getDoc(user1Ref);
            const user2Snap = await getDoc(user2Ref);

            if(!user1Snap.exists() || !user2Snap.exists()) {
                throw new Error("One or both users not found.");
            }
            
            await setDoc(chatRef, {
                members: [currentUser.uid, userID as string],
                memberInfo: [
                    { uid: currentUser.uid, displayName: user1Snap.data().displayName, photoURL: user1Snap.data().photoURL },
                    { uid: userID, displayName: user2Snap.data().displayName, photoURL: user2Snap.data().photoURL }
                ],
                createdAt: serverTimestamp(),
                lastMessage: null,
            });
        }
        
        router.push(`/messages?chatId=${chatId}`);

    } catch (error) {
        console.error("Error creating or finding chat:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not start a conversation." });
    } finally {
        setIsActionLoading(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profileData) return <div className="flex h-screen items-center justify-center">User not found</div>;

  const displayName = profileData.displayName || 'Anonymous Author';
  const followersCount = profileData.followers?.length || 0;
  const followingCount = profileData.following?.length || 0;
  const targetId = userID as string;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative h-60 md:h-80 w-full overflow-hidden bg-slate-200 dark:bg-slate-900 z-0">
        {profileData.headerImageURL ? (
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 animate-in fade-in"
                style={{ backgroundImage: `url(${profileData.headerImageURL})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
        ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>
        )}
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 pb-20">
        
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            
            <div className="relative -mt-20 md:-mt-28 flex-shrink-0 group">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                    <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 border-slate-50 dark:border-slate-800 shadow-inner">
                        <AvatarImage src={profileData.photoURL} alt={displayName} className="object-cover" />
                        <AvatarFallback className="text-5xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 w-full">
                <div className="w-full space-y-3">
                    <div className="flex flex-col md:flex-row items-center md:justify-between w-full gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                                {displayName}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><PenTool className="w-3 h-3"/> Author</span>
                                {profileData.createdAt && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Joined {new Date(profileData.createdAt.toDate()).getFullYear()}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full gap-2 hidden sm:flex">
                                <Share2 className="w-4 h-4" /> Share
                            </Button>

                            {currentUser && currentUser.uid !== targetId && (
                                <>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="rounded-full gap-2"
                                        onClick={handleMessage}
                                        disabled={isActionLoading}
                                    >
                                        <MessageSquare className="w-4 h-4" /> Message
                                    </Button>
                                    {isFollowing ? (
                                        <Button 
                                            variant="outline" 
                                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                            onClick={handleUnfollow}
                                            disabled={isActionLoading}
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" /> Unfollow
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white-500 shadow-lg shadow-indigo-500/20"
                                            onClick={handleFollow}
                                            disabled={isActionLoading}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" /> Follow
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {profileData.bio && (
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl text-base leading-relaxed mt-2 font-light">
                            {profileData.bio}
                        </p>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                        <div className="flex flex-col items-center md:items-start">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{followersCount}</span>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Followers</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex flex-col items-center md:items-start">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{followingCount}</span>
                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Following</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-10">
            <Tabs defaultValue="works" className="w-full space-y-8">
                
                <div className="sticky top-16 z-20 -mx-4 px-4 md:mx-0 md:px-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-2">
                    <TabsList className="w-full max-w-2xl grid grid-cols-3 bg-white/50 dark:bg-slate-900/50 p-1 rounded-xl mx-auto border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                        <TabsTrigger value="works" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                            <Book className="w-4 h-4 mr-2" /> Works
                        </TabsTrigger>
                        <TabsTrigger value="followers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                            <Users className="w-4 h-4 mr-2" /> Followers
                        </TabsTrigger>
                        <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all font-medium">
                            <Users className="w-4 h-4 mr-2" /> Following
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="min-h-[400px]">
                    <TabsContent value="works" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 min-h-[200px]">
                             <MyWorks userId={targetId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="followers" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                            <FollowersList userId={targetId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="following" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                            <FollowingList userId={targetId} />
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
                <Skeleton className="h-12 w-full max-w-xl rounded-xl mx-auto" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    </div>
  );
}
