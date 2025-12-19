'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UpdatePasswordForm from '@/components/profile/update-password-form';
import DeleteAccountForm from '@/components/profile/delete-account-form';
import UpdateProfileInfoForm from '@/components/profile/update-profile-info-form';
import MyWorks from '@/components/profile/my-works';
import ReadingList from '@/components/profile/reading-list';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading user profile...</div>;
  }

  if (!user) {
    return null; // Auth hook handles redirect
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-24 w-24">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email!} />
            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-headline text-3xl font-bold">{user.displayName || user.email}</h1>
          <p className="text-muted-foreground">Member since {new Date(user.metadata.creationTime!).toLocaleDateString()}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">My Works</TabsTrigger>
          <TabsTrigger value="reading-list">Reading List</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="py-6">
          <MyWorks />
        </TabsContent>
        <TabsContent value="reading-list" className="py-6">
          <ReadingList />
        </TabsContent>
        <TabsContent value="settings" className="py-6">
          <div className="space-y-8">
              <UpdateProfileInfoForm />
              <UpdatePasswordForm />
              <DeleteAccountForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
