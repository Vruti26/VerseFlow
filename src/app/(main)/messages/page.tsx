'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Loader2, Send, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  addDoc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

// --- Types ---
interface User {
  id: string;
  // Update: Allow null | undefined to match Firebase Auth types
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null; 
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
  isSeen: boolean;
}

interface Chat {
  id: string;
  users: string[];
  lastMessage: string;
  updatedAt: Timestamp;
  otherUser?: User;
}

// --- Helper Functions ---
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (date: Date) => {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => {
  return name ? name.substring(0, 2).toUpperCase() : '??';
};

// --- Reusable Avatar Component ---
// FIX: We defined a structural type for 'user' here. 
// This allows it to accept both the local 'User' interface (which has 'id') 
// and the Firebase 'currentUser' object (which has 'uid' but no 'id'), 
// as long as they have the display properties we care about.
const Avatar = ({ 
    user, 
    size = "md", 
    className = "" 
}: { 
    user?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null, 
    size?: "sm" | "md" | "lg" | "xl", 
    className?: string 
}) => {
    // Size mapping
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",     
        md: "w-10 h-10 text-sm",   
        lg: "w-12 h-12 text-base", 
        xl: "w-20 h-20 text-2xl"   
    };

    const containerClass = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`;

    if (user?.photoURL) {
        return (
            <div className={`${containerClass} bg-gray-100`}>
                <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-full h-full object-cover" 
                />
            </div>
        );
    }

    // Fallback to Initials
    return (
        <div className={`${containerClass} bg-slate-200 text-slate-600 font-bold`}>
            {getInitials(user?.displayName || user?.email || '')}
        </div>
    );
};

// --- Component: Unread Badge & List Item ---
const ChatListItem = ({ 
    chat, 
    currentUserId, 
    isSelected, 
    onClick 
}: { 
    chat: Chat, 
    currentUserId: string, 
    isSelected: boolean, 
    onClick: () => void 
}) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const messagesRef = collection(db, 'chats', chat.id, 'messages');
        const q = query(
            messagesRef, 
            where('senderId', '!=', currentUserId),
            where('isSeen', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [chat.id, currentUserId]);

    return (
        <li 
            onClick={onClick} 
            className={`p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-slate-50 ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
        >
            <div className="flex items-center gap-3">
                {/* User Avatar */}
                <Avatar user={chat.otherUser} size="lg" />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                            {chat.otherUser?.displayName || chat.otherUser?.email}
                        </h3>
                        {chat.updatedAt && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                {chat.updatedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <p className={`text-sm truncate pr-2 ${unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                            {chat.lastMessage || <span className="italic">No messages yet</span>}
                        </p>
                        {unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
};

// --- Main Page Component ---
export default function MessagesPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // UI State
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  // Data State
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);
  
  // Typing State
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
    setTimeout(() => scrollToBottom('smooth'), 100);
  }, [messages, isTyping, chatId]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Data Fetching
  useEffect(() => {
    if (!currentUser) return;
    setLoadingUsers(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users: User[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(user => user.id !== currentUser.uid);
      setAllUsers(users);
      setLoadingUsers(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoadingRecents(true);
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats: Chat[] = [];
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.users.find((uid: string) => uid !== currentUser.uid);
        if (otherUserId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              chats.push({ 
                  ...chatData, 
                  id: chatDoc.id, 
                  otherUser: { id: userDoc.id, ...userDoc.data() } as User 
              } as Chat);
            }
          } catch (e) { console.error(e) }
        }
      }
      chats.sort((a, b) => (b.updatedAt?.toDate().getTime() || 0) - (a.updatedAt?.toDate().getTime() || 0));
      setRecentChats(chats);
      setLoadingRecents(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

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
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(newMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (!chatId || !selectedUser) return;
    const typingRef = doc(db, 'chats', chatId, 'typing', selectedUser.id);
    const unsubscribe = onSnapshot(typingRef, (docSnap) => {
        setIsTyping(docSnap.exists() && docSnap.data().isTyping === true);
    });
    return () => unsubscribe();
  }, [chatId, selectedUser]);

  useEffect(() => {
    if (!chatId || !currentUser || messages.length === 0) return;
    const markAsSeen = async () => {
        const batch = writeBatch(db);
        let hasUpdates = false;
        messages.forEach((msg) => {
            if (msg.senderId !== currentUser.uid && !msg.isSeen) {
                const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
                batch.update(msgRef, { isSeen: true });
                hasUpdates = true;
            }
        });
        if (hasUpdates) await batch.commit().catch(e => console.error(e));
    };
    markAsSeen();
  }, [messages, chatId, currentUser]);

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setMobileView('chat');
    
    const newChatId = [currentUser!.uid, user.id].sort().join('_');
    const chatRef = doc(db, 'chats', newChatId);
    try {
        await setDoc(chatRef, { 
            users: [currentUser!.uid, user.id], 
            updatedAt: serverTimestamp() 
        }, { merge: true });
    } catch(e) { console.error(e); }
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedUser(null);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!chatId || !currentUser) return;

    const typingRef = doc(db, 'chats', chatId, 'typing', currentUser.uid);
    await setDoc(typingRef, { isTyping: true }, { merge: true });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
        await setDoc(typingRef, { isTyping: false }, { merge: true });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !chatId || !currentUser) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const typingRef = doc(db, 'chats', chatId, 'typing', currentUser.uid);
    setDoc(typingRef, { isTyping: false }, { merge: true });

    const msgText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msgText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        isSeen: false,
      });
      await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: msgText,
          updatedAt: serverTimestamp()
      });
    } catch(e) { console.error(e); }
  };

  const handleDeleteConversation = async () => {
    if (!chatId || !currentUser) return;
    if(!confirm("Are you sure you want to delete this conversation?")) return;

    setIsDeleting(true);
    try {
        const batch = writeBatch(db);
        const msgs = await getDocs(collection(db, 'chats', chatId, 'messages'));
        msgs.forEach(d => batch.delete(d.ref));
        batch.delete(doc(db, 'chats', chatId));
        batch.delete(doc(db, 'chats', chatId, 'typing', currentUser.uid));
        if (selectedUser) batch.delete(doc(db, 'chats', chatId, 'typing', selectedUser.id));
        
        await batch.commit();
        handleBackToList();
    } catch(e) { console.error(e); } 
    finally { setIsDeleting(false); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!chatId) return;
    try { await deleteDoc(doc(db, 'chats', chatId, 'messages', msgId)); } 
    catch(e) { console.error(e); }
  };

  const lastMyMessageId = messages.findLast(m => m.senderId === currentUser?.uid)?.id;

  if (authLoading || !currentUser) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500 w-8 h-8"/></div>;
  }

  const searchResults = searchQuery.trim() === '' ? [] : allUsers.filter(user =>
    (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans text-gray-900">
      
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className={`
        flex flex-col border-r border-gray-200 bg-white h-full
        ${mobileView === 'list' ? 'w-full' : 'hidden'} 
        md:flex md:w-80 lg:w-96 flex-shrink-0 z-10
      `}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            
            {/* Current User Profile Pic */}
            <Avatar user={currentUser} size="sm" />
        </div>

        <div className="px-4 py-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search people..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingUsers || loadingRecents ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500 w-6 h-6" /></div>
            ) : searchQuery ? (
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">Found Users</h3>
                    <ul>
                        {searchResults.map(user => (
                            <li key={user.id} onClick={() => handleSelectUser(user)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                                <Avatar user={user} size="md" />
                                <div className="text-sm font-medium">{user.displayName || user.email}</div>
                            </li>
                        ))}
                        {searchResults.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No users found</p>}
                    </ul>
                </div>
            ) : (
                <ul>
                    {recentChats.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center px-6">
                            <p className="mb-2">No conversations yet.</p>
                            <p className="text-sm">Search for a user to start chatting.</p>
                         </div>
                    ) : (
                        recentChats.map(chat => (
                            <ChatListItem 
                                key={chat.id} 
                                chat={chat} 
                                currentUserId={currentUser.uid}
                                isSelected={selectedUser?.id === chat.otherUser?.id}
                                onClick={() => handleSelectUser(chat.otherUser!)}
                            />
                        ))
                    )}
                </ul>
            )}
        </div>
      </aside>

      {/* ---------------- MAIN CHAT AREA ---------------- */}
      <main className={`
        flex flex-col h-full relative bg-slate-50
        ${mobileView === 'chat' ? 'w-full fixed inset-0 z-20' : 'hidden'} 
        md:flex md:static md:flex-1
      `}>
        {selectedUser ? (
            <>
                {/* Chat Header */}
                <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBackToList} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        {/* Selected User Header Avatar */}
                        <Avatar user={selectedUser} size="md" />

                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-gray-800">{selectedUser.displayName || selectedUser.email}</h2>
                            {isTyping && (
                                <span className="text-xs text-blue-500 font-medium animate-pulse">Typing...</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                        <button onClick={handleDeleteConversation} disabled={isDeleting} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Trash2 className="w-5 h-5"/>}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar" ref={scrollAreaRef}>
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>
                    ) : (
                        <div className="flex flex-col justify-end min-h-full pb-2">
                             {/* Chat Intro / Profile View */}
                             <div className="text-center py-10">
                                <div className="mx-auto w-fit mb-3">
                                    <Avatar user={selectedUser} size="xl" />
                                </div>
                                <h3 className="text-gray-900 font-medium">You're chatting with {selectedUser.displayName}</h3>
                                <p className="text-sm text-gray-500 mt-1">Say hi to start the conversation!</p>
                             </div>

                             {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser.uid;
                                const showSeen = isMe && msg.id === lastMyMessageId && msg.isSeen;
                                
                                const currentDate = msg.timestamp ? formatDateSeparator(msg.timestamp.toDate()) : '';
                                const prevDate = index > 0 && messages[index-1].timestamp ? formatDateSeparator(messages[index-1].timestamp.toDate()) : '';
                                const showDate = currentDate !== prevDate;

                                return (
                                    <div key={msg.id} className="mb-4">
                                        {showDate && (
                                            <div className="flex justify-center mb-6 mt-2">
                                                <span className="text-[11px] bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium shadow-sm">
                                                    {currentDate}
                                                </span>
                                            </div>
                                        )}

                                        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div 
                                                    className={`group relative px-4 py-2 rounded-2xl shadow-sm text-sm break-words
                                                    ${isMe 
                                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                                    }`}
                                                >
                                                    <p>{msg.text}</p>
                                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {msg.timestamp ? formatTime(msg.timestamp.toDate()) : '...'}
                                                    </div>

                                                    {isMe && (
                                                        <button 
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {showSeen && (
                                                    <span className="text-[10px] text-gray-400 font-medium mt-1 mr-1 transition-all">
                                                        Seen
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                             })}

                             {isTyping && (
                                <div className="flex justify-start mb-4">
                                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                             )}

                             <div ref={messagesEndRef} className="h-1" />
                        </div>
                    )}
                </div>

                <footer className="bg-white p-4 border-t border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full pl-5 pr-12 py-3 bg-gray-100 text-gray-900 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()} 
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors flex items-center justify-center
                                ${newMessage.trim() 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </footer>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-10 h-10 text-gray-300 ml-1" />
                </div>
                <h3 className="text-lg font-medium text-gray-600">Your Messages</h3>
                <p className="text-sm text-gray-400 mt-2">Send photos and private messages to a friend.</p>
            </div>
        )}
      </main>
    </div>
  );
}