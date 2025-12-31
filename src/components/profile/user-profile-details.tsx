'use client';

import { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileDetailsProps {
  userProfile: UserProfile;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
}

export default function UserProfileDetails({ userProfile }: UserProfileDetailsProps) {
  return (
    <Card>
        <CardHeader>
            <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName} />
                    <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-3xl font-bold font-headline">{userProfile.displayName}</CardTitle>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {userProfile.createdAt && (
            <p className="text-muted-foreground">Member since {new Date(userProfile.createdAt.toDate()).toLocaleDateString()}</p>
          )}
        </CardContent>
    </Card>
  );
}
