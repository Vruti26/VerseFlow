'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    // Query for conversations where the user is a participant
    const q = query(conversationsRef, where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unreadCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        // A conversation is considered "unread" if the last message exists and was not sent by the current user.
        // This is a simpler, more robust check than relying on a `read` flag that might not be consistently updated.
        if (data.lastMessage && data.lastMessage.senderId !== user.uid) {
          // We also need to check if the user has read it from the participantsRead map
          if (!data.participantsRead || !data.participantsRead[user.uid]) {
             unreadCount++;
          }
        }
      });
      setTotalUnread(unreadCount);
    }, (error) => {
      console.error("Error fetching unread messages:", error);
      setTotalUnread(0);
    });

    return () => unsubscribe();
  }, [user]);

  return totalUnread;
}
