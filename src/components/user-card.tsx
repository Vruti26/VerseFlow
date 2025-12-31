'use client';

import Link from 'next/link';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface UserCardProps {
  user: User;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/users/${user.id}`}>
      <Card className="p-4 flex flex-col items-center text-center transition-all hover:shadow-lg">
        <Avatar className="w-20 h-20 mb-4">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <h4 className="font-semibold text-lg truncate">{user.displayName}</h4>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </Card>
    </Link>
  );
}
