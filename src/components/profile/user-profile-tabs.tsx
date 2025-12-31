'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyWorks from '@/components/profile/user-works';
import UserProfileDetails from '@/components/profile/user-profile-details';
import { UserProfile } from '@/lib/types';

interface UserProfileTabsProps {
  userProfile: UserProfile;
  userId: string;
}

export default function UserProfileTabs({ userProfile, userId }: UserProfileTabsProps) {
  return (
    <Tabs defaultValue="works" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="works">Works</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="works">
        <MyWorks userId={userId} />
      </TabsContent>
      <TabsContent value="profile">
        <UserProfileDetails userProfile={userProfile} />
      </TabsContent>
    </Tabs>
  );
}
