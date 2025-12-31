'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Loader2, Send, ArrowLeft, MoreVertical, MessageSquare } from 'lucide-react';
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
const Avatar = ({ 
    user, 
    size = "md", 
    className = "" 
}: { 
    user?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null, 
    size?: "xs" | "sm" | "md" | "lg" | "xl", 
    className?: string 
}) => {
    const sizeClasses = {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-8 h-8 text-xs",     
        md: "w-10 h-10 text-sm",   
        lg: "w-12 h-12 text-base", 
        xl: "w-24 h-24 text-3xl"   
    };

    const containerClass = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm ${className}`;

    if (user?.photoURL) {
        return (
            <div className={`${containerClass} bg-slate-50 dark:bg-slate-800`}>
                <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-full h-full object-cover" 
                />
            </div>
        );
    }

    return (
        <div className={`${containerClass} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold tracking-wider`}>
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
            className={`
                group p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                ${isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-100 dark:border-blue-900/30' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <Avatar user={chat.otherUser} size="lg" />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate transition-colors ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-200'}`}>
                            {chat.otherUser?.displayName || chat.otherUser?.email}
                        </h3>
                        {chat.updatedAt && (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                                {chat.updatedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <p className={`text-xs truncate pr-2 ${unreadCount > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {chat.lastMessage || <span className="italic opacity-70">Draft...</span>}
                        </p>
                        {unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-sm shadow-blue-200 dark:shadow-none">
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
  
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
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
  
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-blue-500 w-8 h-8"/></div>;
  }

  const searchResults = searchQuery.trim() === '' ? [] : allUsers.filter(user =>
    (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className={`
        flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-full
        ${mobileView === 'list' ? 'w-full' : 'hidden'} 
        md:flex md:w-80 lg:w-96 flex-shrink-0 z-10 transition-all duration-300
      `}>
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Messages</h1>
            <div className="relative group cursor-pointer">
                <Avatar user={currentUser} size="sm" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
            {loadingUsers || loadingRecents ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="animate-spin text-blue-500 w-6 h-6" />
                    <span className="text-xs text-slate-400 dark:text-slate-500">Loading chats...</span>
                </div>
            ) : searchQuery ? (
                <div className="animate-in fade-in duration-300">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-2 mt-2">Found Users</h3>
                    <ul>
                        {searchResults.map(user => (
                            <li key={user.id} onClick={() => handleSelectUser(user)} className="group flex items-center gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <Avatar user={user} size="md" />
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.displayName || user.email}</div>
                            </li>
                        ))}
                        {searchResults.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No users found</p>}
                    </ul>
                </div>
            ) : (
                <ul className="pb-4 animate-in fade-in duration-300">
                    {recentChats.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600"/>
                            </div>
                            <p className="mb-1 font-medium text-slate-600 dark:text-slate-400">No chats yet</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[180px]">Search for a user above to start a conversation.</p>
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
        flex flex-col h-full relative bg-white dark:bg-slate-950
        ${mobileView === 'chat' ? 'w-full fixed inset-0 z-20' : 'hidden'} 
        md:flex md:static md:flex-1
      `}>
        {selectedUser ? (
            <>
                {/* Chat Header */}
                <header className="h-[73px] flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 transition-all">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToList} className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="relative">
                            <Avatar user={selectedUser} size="md" />
                        </div>

                        <div className="flex flex-col justify-center">
                            {/* Changed to font-medium */}
                            <h2 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">{selectedUser.displayName || selectedUser.email}</h2>
                            {/* Only show if typing, otherwise empty */}
                            {isTyping && (
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold animate-pulse">Typing...</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleDeleteConversation} disabled={isDeleting} className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-full transition-all duration-200" title="Delete conversation">
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Trash2 className="w-5 h-5"/>}
                        </button>
                    </div>
                </header>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950 custom-scrollbar scroll-smooth" ref={scrollAreaRef}>
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>
                    ) : (
                        <div className="flex flex-col justify-end min-h-full pb-2">
                             {/* Profile Intro */}
                             <div className="flex flex-col items-center justify-center py-12 opacity-80">
                                <Avatar user={selectedUser} size="xl" className="mb-4 shadow-md" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{selectedUser.displayName}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This is the beginning of your conversation.</p>
                             </div>

                             {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser.uid;
                                const showSeen = isMe && msg.id === lastMyMessageId && msg.isSeen;
                                
                                const currentDate = msg.timestamp ? formatDateSeparator(msg.timestamp.toDate()) : '';
                                const prevDate = index > 0 && messages[index-1].timestamp ? formatDateSeparator(messages[index-1].timestamp.toDate()) : '';
                                const showDate = currentDate !== prevDate;

                                return (
                                    <div key={msg.id} className="animate-in slide-in-from-bottom-2 duration-300 fade-in">
                                        {showDate && (
                                            <div className="flex justify-center my-6">
                                                <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                                                    {currentDate}
                                                </span>
                                            </div>
                                        )}

                                        <div className={`flex w-full mb-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[75%] md:max-w-[65%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div 
                                                    className={`
                                                        relative px-5 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed 
                                                        break-all whitespace-pre-wrap w-fit transition-all duration-200
                                                        ${isMe 
                                                            ? 'bg-blue-600 text-white rounded-br-none border border-transparent' 
                                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700' 
                                                        }
                                                    `}
                                                >
                                                    <p>{msg.text}</p>
                                                    <div className={`text-[10px] mt-1.5 text-right font-medium opacity-70 ${isMe ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {msg.timestamp ? formatTime(msg.timestamp.toDate()) : '...'}
                                                    </div>

                                                    {/* Trash Button - Reintegrated inside Bubble area */}
                                                    {isMe && (
                                                        <button 
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out hover:scale-110 hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white shadow-sm"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {showSeen && (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 mr-1 animate-in fade-in duration-500">
                                                        Seen
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                             })}

                             {/* Typing Indicator Bubble */}
                             {isTyping && (
                                <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                             )}

                             <div ref={messagesEndRef} className="h-1" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <footer className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-30">
                    <div className="flex items-end gap-2 max-w-4xl mx-auto">
                        <button className="p-3 text-slate-400 hover:bg-slate-50 hover:text-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-full transition-colors mb-0.5">
                            <MoreVertical className="w-5 h-5 rotate-90" />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="w-full pl-6 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-[24px] focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-200 dark:focus:border-blue-900 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()} 
                                className={`
                                    absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 flex items-center justify-center
                                    ${newMessage.trim() 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 shadow-md hover:scale-105' 
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </footer>
            </>
        ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <div className="w-28 h-28 bg-white dark:bg-slate-900 shadow-lg rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50 dark:ring-slate-800/50">
                        <Send className="w-12 h-12 text-blue-500 dark:text-blue-400 ml-1.5" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Your Messages</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs text-center leading-relaxed">Select a conversation from the sidebar or start a new one to get chatting.</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}