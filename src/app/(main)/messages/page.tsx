'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Loader2, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

export default function MessagesPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  // Fetch all users for searching
  useEffect(() => {
    if (!currentUser) return;
    setLoadingUsers(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser.uid);
      setAllUsers(users);
      setLoadingUsers(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        setLoadingUsers(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch recent chats
  useEffect(() => {
    if (!currentUser) return;

    setLoadingRecents(true);
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats = [];
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.users.find(uid => uid !== currentUser.uid);
        if (otherUserId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              chats.push({ ...chatData, id: chatDoc.id, otherUser: { id: userDoc.id, ...userDoc.data() } });
            }
          } catch (e) {
            console.error("Error fetching user for recent chat:", e)
          }
        }
      }
      chats.sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0));
      setRecentChats(chats);
      setLoadingRecents(false);
    }, (error) => {
      console.error("Error fetching recent chats:", error);
      setLoadingRecents(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // generate chatId and listen for messages
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setChatId(null);
      setMessages([]);
      return;
    };

    setLoadingMessages(true);
    const newChatId = [currentUser.uid, selectedUser.id].sort().join('_');
    setChatId(newChatId);

    const messagesRef = collection(db, 'chats', newChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingMessages(false);
    }, (error) => {
        console.error("Error fetching messages: ", error);
        setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  const searchResults = searchQuery.trim() === '' ? [] : allUsers.filter(user =>
    (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSearchQuery('');

    // Create chat doc if it doesn't exist
    const newChatId = [currentUser.uid, user.id].sort().join('_');
    const chatRef = doc(db, 'chats', newChatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
        try {
            await setDoc(chatRef, {
                users: [currentUser.uid, user.id],
                lastMessage: '',
                updatedAt: serverTimestamp()
            });
        } catch(e) {
            console.error("Error creating chat: ", e);
        }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !chatId || !currentUser) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    try {
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
  
      // Update last message in chat
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
          lastMessage: newMessage,
          updatedAt: serverTimestamp()
      });
    } catch(e) {
        console.error("Error sending message: ", e)
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId) return;
    try {
      await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
    } catch(e) {
      console.error("Error deleting message: ", e)
    }
  };

  const handleDeleteConversation = async () => {
    if (!chatId) return;

    setIsDeleting(true);
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        await Promise.all(messagesSnapshot.docs.map(d => deleteDoc(d.ref)));
        await deleteDoc(doc(db, 'chats', chatId));
        setSelectedUser(null);
    } catch(error) {
        console.error("Error deleting conversation: ", error);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <aside className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery ? (
             loadingUsers ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : searchResults.length > 0 ? (
                <ul>
                    {searchResults.map(user => (
                        <li key={user.id} onClick={() => handleSelectUser(user)} className="p-2 hover:bg-gray-200 cursor-pointer rounded-md">
                        {user.displayName || user.email}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">No users found.</p>
            )
        ) : (
             loadingRecents ? (
                 <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
             ) : (
                <>
                    <h2 className="text-lg font-semibold mb-2">Recent Chats</h2>
                    {recentChats.length > 0 ? (
                         <ul>
                            {recentChats.map(chat => (
                                <li key={chat.id} onClick={() => handleSelectUser(chat.otherUser)} className={`p-2 hover:bg-gray-200 cursor-pointer rounded-md ${selectedUser?.id === chat.otherUser.id ? 'bg-gray-300' : ''}`}>
                                    <p className="font-semibold">{chat.otherUser.displayName || chat.otherUser.email}</p>
                                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No recent chats.</p>
                    )}
                </>
             )
        )}
      </aside>
      <main className="w-3/4 flex flex-col">
        {selectedUser ? (
          <>
            <header className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{selectedUser.displayName || selectedUser.email}</h2>
              <button onClick={handleDeleteConversation} disabled={isDeleting} className="text-red-500 hover:text-red-700">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 size={20} />}
              </button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {loadingMessages ? (
                     <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 my-2 ${msg.senderId === currentUser.uid ? 'justify-end' : ''}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-lg shadow ${msg.senderId === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                                {msg.text}
                            </div>
                            {msg.senderId === currentUser.uid && (
                                <button onClick={() => handleDeleteMessage(msg.id)} className="text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-500 text-white rounded-full flex items-center gap-2 hover:bg-blue-600 disabled:bg-blue-300" disabled={!newMessage.trim()}>
                    <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
            <p>Select a user to start a conversation or search for a new one.</p>
          </div>
        )}
      </main>
    </div>
  );
}
