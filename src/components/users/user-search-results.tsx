'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserData {
  id: string;
  displayName: string;
  photoURL: string;
}

export default function UserSearchResults({ searchTerm }: { searchTerm: string }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("displayName", ">=", searchTerm), where("displayName", "<=", searchTerm + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(usersData);
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
        fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);

  }, [searchTerm]);

  if (loading) {
    return <p className="mt-4">Searching for authors...</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {users.map(user => (
        <Link href={`/profile/${user.id}`} key={user.id}>
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors">
            <Avatar>
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.displayName}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
