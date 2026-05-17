'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuthStore } from '@/lib/store/auth-store';
import { Hash, Send, Search, Users, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture: string | null;
  unreadCount?: number;
  department?: {
    name: string;
  } | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ChatViewPage() {
  const { user: currentUser } = useAuthStore();
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatUser | 'general'>('general');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hook into our resilient real-time engine
  // Connect to standard relative socket url or dynamic localhost
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:3000/api/chat/socket');

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/chat/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.users) {
          setContacts(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to load chat contacts:', err);
    }
  };

  const fetchMessages = async (target: ChatUser | 'general') => {
    setLoadingMessages(true);
    try {
      const receiverParam = target === 'general' ? 'general' : target.id;
      const res = await fetch(`/api/chat?receiverId=${receiverParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 1. Initial Load & Listen for fallback fast-poll triggers
  useEffect(() => {
    fetchContacts();
    
    // Listen for custom poll updates from the hybrid websocket engine
    const handlePoll = () => {
      // Reload message thread silently without hard skeletons
      const receiverParam = selectedContact === 'general' ? 'general' : selectedContact.id;
      fetch(`/api/chat?receiverId=${receiverParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages) {
            // Only update state if message length or latest content changed to prevent flicker
            if (data.messages.length !== messages.length || 
                (data.messages.length > 0 && messages.length > 0 && 
                 data.messages[data.messages.length - 1].id !== messages[messages.length - 1].id)) {
              setMessages(data.messages);
              scrollToBottom();
            }
          }
        });
    };

    window.addEventListener('egc_poll_chat', handlePoll);
    return () => {
      window.removeEventListener('egc_poll_chat', handlePoll);
    };
  }, [selectedContact, messages]);

  // 2. Fetch messages whenever selected contact target shifts
  useEffect(() => {
    fetchMessages(selectedContact);
  }, [selectedContact]);

  // 3. React instantly to local Tab-syncing or incoming WebSocket payloads
  useEffect(() => {
    if (lastMessage) {
      // Ensure the received message matches our currently opened channel
      const isGeneralMatch = selectedContact === 'general' && lastMessage.receiverId === null;
      const isPrivateMatch = selectedContact !== 'general' && 
        ((lastMessage.senderId === currentUser?.id && lastMessage.receiverId === selectedContact.id) || 
         (lastMessage.senderId === selectedContact.id && lastMessage.receiverId === currentUser?.id));

      if (isGeneralMatch || isPrivateMatch) {
        // Avoid duplicate message pushing if already pulled by fallback REST intervals
        setMessages(prev => {
          if (prev.some(m => m.id === lastMessage.id)) return prev;
          return [...prev, lastMessage];
        });
        scrollToBottom();
      }
    }
  }, [lastMessage, selectedContact, currentUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const contentToSend = draft;
    setDraft('');
    setSending(true);

    try {
      const receiverId = selectedContact === 'general' ? 'general' : selectedContact.id;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSend,
          receiverId
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.message) {
        // Dispatch to WS for instant broadcast or cross-tab local syncing
        sendMessage(data.message);
        
        // Append locally instantly for zero-latency feedback
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      } else {
        toast.error('Failed to deliver message.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    (c.department?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'Owner';
    if (role === 'ADMIN') return 'Admin';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] w-full gap-5 overflow-hidden rounded-2xl border border-border/80 bg-background/50 backdrop-blur-xl p-2 sm:p-4">
      {/* Left directory panel */}
      <div className="hidden md:flex flex-col w-[280px] shrink-0 border-r pr-4 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Channels & Users</h2>
            <p className="text-xs text-muted-foreground font-semibold">Connect with any workspace staff</p>
          </div>
          <Badge variant="outline" className={`px-2 py-0.5 text-[9.5px] font-bold ${isConnected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
            {isConnected ? 'Real-time Sync' : 'Connecting...'}
          </Badge>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Find coworker or channel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Public Lobby list */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Public Channels</p>
            <button
              onClick={() => setSelectedContact('general')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                selectedContact === 'general' 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                : 'hover:bg-muted/60 text-foreground'
              }`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <span># general-lobby</span>
            </button>
          </div>

          {/* DMs list */}
          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Workforce Directory</p>
            {filteredContacts.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground py-4">No staff matches.</p>
            ) : (
              filteredContacts.map(c => {
                const isSel = selectedContact !== 'general' && selectedContact.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContact(c);
                      // Clear unread badge locally for zero latency
                      c.unreadCount = 0;
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                      isSel 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 font-bold' 
                      : 'hover:bg-muted/60 text-foreground font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 rounded-lg shrink-0">
                        {c.profilePicture && (
                          <AvatarImage src={c.profilePicture} alt={c.name} className="object-cover rounded-lg" />
                        )}
                        <AvatarFallback className={`text-[10px] rounded-lg font-extrabold ${isSel ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'}`}>
                          {getInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-none">{c.name}</p>
                        <p className={`text-[9.5px] truncate mt-0.5 opacity-80 font-medium ${isSel ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          {getRoleLabel(c.role)} • {c.department?.name || 'Staff'}
                        </p>
                      </div>
                    </div>
                    {c.unreadCount !== undefined && c.unreadCount > 0 && (
                      <Badge className={`text-[9px] font-extrabold h-4.5 min-w-4.5 flex items-center justify-center rounded-full px-1 shadow-sm shrink-0 ml-2 ${isSel ? 'bg-primary-foreground text-primary hover:bg-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                        {c.unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main chat conversation viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-card/40 border rounded-xl overflow-hidden h-full">
        {/* Active chat header info */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              {selectedContact === 'general' ? <Hash className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">
                {selectedContact === 'general' ? 'general-lobby' : selectedContact.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {selectedContact === 'general' 
                  ? 'General workspace chat room open to all employees' 
                  : `${getRoleLabel(selectedContact.role)} • ${selectedContact.department?.name || 'Staff'}`
                }
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9.5px] bg-background py-0.5">
            {selectedContact === 'general' ? 'general' : 'direct-message'}
          </Badge>
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
          {loadingMessages ? (
            <div className="space-y-4 pt-4">
              <div className="h-10 w-2/3 bg-muted animate-pulse rounded-2xl" />
              <div className="h-10 w-1/2 bg-muted animate-pulse rounded-2xl ml-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Sparkles className="w-10 h-10 text-primary/45 mb-2 animate-bounce" />
              <h4 className="font-bold text-sm text-foreground">Start of a new conversation</h4>
              <p className="text-[11px] text-muted-foreground font-medium max-w-xs mt-1">
                Send the first message to kickstart dynamic real-time communication!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser?.id;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <Avatar className="h-7 w-7 rounded-lg shrink-0">
                      <AvatarFallback className="text-[10px] rounded-lg font-bold bg-primary/10 text-primary">
                        {getInitials(m.sender.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col max-w-[70%] gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 px-1.5 text-[9.5px] font-semibold text-muted-foreground leading-none">
                      {!isMe && <span>{m.sender.name}</span>}
                      {!isMe && <Badge className="text-[8px] scale-90 py-0 leading-none bg-muted hover:bg-muted font-bold text-foreground border border-border/80 capitalize">{m.sender.role.toLowerCase()}</Badge>}
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/80 text-foreground rounded-tl-none border border-border/50'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSend} className="p-3 border-t bg-muted/10 flex items-center gap-2 shrink-0">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${selectedContact === 'general' ? '#general-lobby' : selectedContact.name}...`}
            className="flex-1 rounded-xl h-10 border border-border/85 bg-background text-xs font-semibold"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!draft.trim() || sending}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </Button>
        </form>
      </div>
    </div>
  );
}
