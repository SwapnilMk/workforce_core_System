'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuthStore } from '@/lib/store/auth-store';
import { Hash, Send, Search, Users, ShieldAlert, Sparkles, MessageSquare, Smile, Menu, Plus, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useNotificationStore } from '@/features/notifications/utils/store';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberIds: string[];
  creatorId: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string | null;
  channelId: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ChatViewPage() {
  const { user: currentUser } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatUser | 'general' | Channel>('general');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Group / Channel creation states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [newRoomMembers, setNewRoomMembers] = useState<string[]>([]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hook into our resilient real-time engine
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:3000/api/chat/socket');

  const isChannel = (target: any): target is Channel => {
    return target && typeof target === 'object' && 'memberIds' in target;
  };

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

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/chat/channels');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.channels) {
          setChannels(data.channels);
        }
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const fetchMessages = async (target: ChatUser | 'general' | Channel) => {
    setLoadingMessages(true);
    try {
      let queryParam = '';
      if (target === 'general') {
        queryParam = 'receiverId=general';
      } else if (isChannel(target)) {
        queryParam = `channelId=${target.id}`;
      } else {
        queryParam = `receiverId=${target.id}`;
      }

      const res = await fetch(`/api/chat?${queryParam}`);
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

  const toggleMemberSelection = (userId: string) => {
    setNewRoomMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreatingRoom(true);
    try {
      const res = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim().replace(/\s+/g, '-').toLowerCase(),
          isPrivate: newRoomIsPrivate,
          memberIds: newRoomMembers
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.channel) {
        toast.success(`${newRoomIsPrivate ? 'Private group' : 'Public channel'} "${data.channel.name}" created successfully!`);
        setNewRoomName('');
        setNewRoomIsPrivate(false);
        setNewRoomMembers([]);
        setIsCreateDialogOpen(false);
        
        // Refresh channels list
        await fetchChannels();
        
        // Focus the newly created channel
        setSelectedContact(data.channel);
      } else {
        toast.error(data.error || 'Failed to create room.');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      toast.error('Failed to create room.');
    } finally {
      setCreatingRoom(false);
    }
  };

  // 1. Initial Load & Listen for fallback fast-poll triggers
  useEffect(() => {
    fetchContacts();
    fetchChannels();
    
    // Listen for custom poll updates from the hybrid websocket engine
    const handlePoll = () => {
      // Reload message thread silently without hard skeletons
      let queryParam = '';
      if (selectedContact === 'general') {
        queryParam = 'receiverId=general';
      } else if (isChannel(selectedContact)) {
        queryParam = `channelId=${selectedContact.id}`;
      } else {
        queryParam = `receiverId=${selectedContact.id}`;
      }

      fetch(`/api/chat?${queryParam}`)
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
      const isGeneralMatch = selectedContact === 'general' && lastMessage.receiverId === null && lastMessage.channelId === null;
      const isChannelMatch = isChannel(selectedContact) && lastMessage.channelId === selectedContact.id;
      const isPrivateMatch = !isChannel(selectedContact) && selectedContact !== 'general' && 
        ((lastMessage.senderId === currentUser?.id && lastMessage.receiverId === selectedContact.id) || 
         (lastMessage.senderId === selectedContact.id && lastMessage.receiverId === currentUser?.id));

      if (isGeneralMatch || isChannelMatch || isPrivateMatch) {
        // Avoid duplicate message pushing if already pulled by fallback REST intervals
        setMessages(prev => {
          if (prev.some(m => m.id === lastMessage.id)) return prev;
          return [...prev, lastMessage];
        });
        scrollToBottom();
      } else {
        // Real-time notification for messages sent in OTHER threads (browsers & APKs)
        if (lastMessage.senderId !== currentUser?.id) {
          const senderName = lastMessage.sender?.name || 'Coworker';
          const displayTitle = lastMessage.channelId 
            ? `New message in channel` 
            : `New message from ${senderName}`;
          
          toast(displayTitle, {
            description: lastMessage.content.length > 60 
              ? `${lastMessage.content.slice(0, 60)}...` 
              : lastMessage.content,
            action: {
              label: 'View',
              onClick: () => {
                // Focus the active contact/channel
                if (lastMessage.channelId) {
                  const ch = channels.find(c => c.id === lastMessage.channelId);
                  if (ch) setSelectedContact(ch);
                } else {
                  const ch = contacts.find(c => c.id === lastMessage.senderId);
                  if (ch) setSelectedContact(ch);
                }
              }
            }
          });

          // Also push to the top bell notification center dropdown in real-time
          addNotification({
            id: lastMessage.id,
            title: displayTitle,
            body: lastMessage.content.length > 60 
              ? `${lastMessage.content.slice(0, 60)}...` 
              : lastMessage.content,
            createdAt: lastMessage.createdAt || new Date().toISOString(),
            actions: [
              {
                id: 'open-chat',
                label: 'Open chat',
                type: 'redirect',
                style: 'primary'
              }
            ]
          });
        }
      }
    }
  }, [lastMessage, selectedContact, currentUser, channels, contacts, addNotification]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const contentToSend = draft;
    setDraft('');
    setSending(true);

    try {
      const bodyPayload: any = { content: contentToSend.trim() };
      if (selectedContact === 'general') {
        bodyPayload.receiverId = 'general';
      } else if (isChannel(selectedContact)) {
        bodyPayload.channelId = selectedContact.id;
      } else {
        bodyPayload.receiverId = selectedContact.id;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && data.success && data.message) {
        // Dispatch to WS for instant broadcast
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

  const renderDirectoryContent = () => {
    return (
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Channels & Users</h2>
            <p className="text-xs text-muted-foreground font-semibold">Connect with any workspace staff</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer">
                  <Plus className="w-4.5 h-4.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border border-border p-6 rounded-xl shadow-xl">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-base font-extrabold text-foreground">Create Channel or Group</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    Create a workspace room to collaborate with colleagues.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block text-left">Room Name</label>
                    <Input 
                      placeholder="e.g. general-announcements, dev-team"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="h-10 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
                    <div className="text-left">
                      <p className="text-xs font-bold text-foreground">Private Room</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Limit access to selected workspace staff</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={newRoomIsPrivate}
                      onChange={(e) => {
                        setNewRoomIsPrivate(e.target.checked);
                        if (!e.target.checked) setNewRoomMembers([]);
                      }}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </div>

                  {newRoomIsPrivate && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block text-left">Invite Coworkers</label>
                      <div className="max-h-[160px] overflow-y-auto border border-border rounded-xl p-2 space-y-1 bg-background/50">
                        {contacts.map((c) => {
                          const isSel = newRoomMembers.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleMemberSelection(c.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isSel ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-muted/50 text-foreground font-semibold'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 rounded-lg">
                                  {c.profilePicture && <AvatarImage src={c.profilePicture} alt={c.name} />}
                                  <AvatarFallback className="text-[9px] font-extrabold bg-primary/10 text-primary">
                                    {getInitials(c.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{c.name} ({getRoleLabel(c.role)})</span>
                              </div>
                              {isSel && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <DialogFooter className="pt-2 flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="h-9 px-4 text-xs font-bold rounded-lg cursor-pointer">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={creatingRoom || !newRoomName.trim()} className="h-9 px-4 text-xs font-bold rounded-lg cursor-pointer">
                      {creatingRoom ? 'Creating...' : 'Create Room'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Find coworker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Public Channels */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Public Channels</p>
            
            {/* General Lobby (Static Default) */}
            <button
              type="button"
              onClick={() => {
                setSelectedContact('general');
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                selectedContact === 'general' 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                : 'hover:bg-muted/60 text-foreground'
              }`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <span># general-lobby</span>
            </button>

            {/* Custom Public Channels */}
            {channels.filter(ch => !ch.isPrivate).map(ch => {
              const isSel = selectedContact !== 'general' && !('email' in selectedContact) && selectedContact.id === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setSelectedContact(ch);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    isSel
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <Hash className="w-4 h-4 shrink-0" />
                  <span className="truncate"># {ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Private Channels / Groups */}
          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Private Groups & Channels</p>
            {channels.filter(ch => ch.isPrivate).length === 0 ? (
              <p className="text-left text-[9px] text-muted-foreground py-2 px-3 font-semibold">No private groups joined.</p>
            ) : (
              channels.filter(ch => ch.isPrivate).map(ch => {
                const isSel = selectedContact !== 'general' && !('email' in selectedContact) && selectedContact.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setSelectedContact(ch);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isSel 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 font-bold' 
                      : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="w-4 h-4 shrink-0 text-amber-500/85" />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* DMs list */}
          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Workforce Directory</p>
            {filteredContacts.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground py-4">No staff matches.</p>
            ) : (
              filteredContacts.map(c => {
                const isSel = selectedContact !== 'general' && 'email' in selectedContact && selectedContact.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedContact(c);
                      // Clear unread badge locally
                      c.unreadCount = 0;
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
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
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] w-full p-4 md:p-6 flex flex-col">
      <div className="flex-1 flex w-full gap-5 overflow-hidden rounded-2xl border border-border/80 bg-background/50 backdrop-blur-xl p-2 sm:p-4 shadow-sm">
      {/* Left directory panel (Desktop) */}
      <div className="hidden md:flex flex-col w-[280px] shrink-0 border-r pr-4 gap-4">
        {renderDirectoryContent()}
      </div>

      {/* Main chat conversation viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-card/40 border rounded-xl overflow-hidden h-full">
        {/* Active chat header info */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Chat Switcher Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-4 bg-background border-r">
                  <SheetHeader className="mb-2">
                    <SheetTitle className="text-sm font-bold text-foreground text-left">Select Chat Room</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden h-[calc(100vh-6rem)] mt-2">
                    {renderDirectoryContent()}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              {selectedContact === 'general' ? (
                <Hash className="w-5 h-5" />
              ) : isChannel(selectedContact) ? (
                selectedContact.isPrivate ? <Lock className="w-5 h-5 text-amber-500/85" /> : <Hash className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-foreground truncate">
                {selectedContact === 'general' ? 'general-lobby' : selectedContact.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold truncate">
                {selectedContact === 'general' 
                  ? 'General workspace chat room open to all employees' 
                  : isChannel(selectedContact)
                    ? `${selectedContact.isPrivate ? 'Private Room' : 'Public Channel'} • ${selectedContact.memberIds?.length || 1} members`
                    : `${getRoleLabel(selectedContact.role)} • ${selectedContact.department?.name || 'Staff'}`
                }
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9.5px] bg-background py-0.5 shrink-0">
            {selectedContact === 'general' ? 'general' : isChannel(selectedContact) ? (selectedContact.isPrivate ? 'private-group' : 'public-channel') : 'direct-message'}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-[350px] p-0 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden"
            >
              <div className="w-[350px] h-[350px]">
                <EmojiPicker
                  theme={(resolvedTheme === 'dark' ? 'dark' : 'light') as any}
                  onEmojiClick={(emojiData) => {
                    setDraft(prev => prev + emojiData.emoji);
                  }}
                  autoFocusSearch={false}
                  height={350}
                  width="100%"
                />
              </div>
            </PopoverContent>
          </Popover>

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
            className="rounded-xl h-10 w-10 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </Button>
        </form>
      </div>
    </div>
  </div>
  );
}
