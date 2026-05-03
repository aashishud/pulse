"use client";

import { useEffect, useRef, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, push, onChildAdded, onChildChanged, query, limitToLast, orderByChild, update, off } from "firebase/database";
import { Send, Loader2, MessageSquare, Lock, Reply, X, Trash2 } from "lucide-react";
import Link from "next/link";

interface ReplyData {
  id: string;
  username: string;
  displayName: string;
  text: string;
}

interface Message {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  avatar: string;
  text: string;
  timestamp: number;
  replyTo?: ReplyData;
  deleted?: boolean;
}

interface CommunityChatProps {
  communityHandle: string;
  currentUser: any;
  isMember: boolean;
  /** Firestore profile of the current user (for display name / avatar) */
  userProfile?: { username: string; displayName: string; avatar: string } | null;
}

const COOLDOWN_MS = 2000; // 2 second cooldown between messages

export default function CommunityChat({ communityHandle, currentUser, isMember, userProfile }: CommunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, lastSentAt + COOLDOWN_MS - Date.now());
      setCooldownRemaining(remaining);
    }, 100);
    return () => clearInterval(timer);
  }, [cooldownRemaining, lastSentAt]);

  // Track if we should auto-scroll
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  const scrollToBottom = () => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to messages
  useEffect(() => {
    const chatRef = ref(rtdb, `community-chat/${communityHandle}/messages`);
    const chatQuery = query(chatRef, orderByChild("timestamp"), limitToLast(100));

    const messageIds = new Set<string>();

    const onAdded = onChildAdded(chatQuery, (snapshot) => {
      const data = snapshot.val();
      const id = snapshot.key!;
      if (messageIds.has(id)) return;
      messageIds.add(id);

      setMessages((prev) => [
        ...prev,
        {
          id,
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar,
          text: data.text,
          timestamp: data.timestamp || Date.now(),
          replyTo: data.replyTo || undefined,
          deleted: data.deleted || false,
        },
      ]);
    });

    const onChanged = onChildChanged(chatQuery, (snapshot) => {
      const data = snapshot.val();
      const id = snapshot.key!;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, deleted: data.deleted || false, text: data.text } : m
        )
      );
    });

    return () => {
      off(chatRef);
    };
  }, [communityHandle]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !isMember || sending) return;

    // Check cooldown
    const now = Date.now();
    if (now - lastSentAt < COOLDOWN_MS) {
      setCooldownRemaining(lastSentAt + COOLDOWN_MS - now);
      return;
    }

    setSending(true);
    try {
      const chatRef = ref(rtdb, `community-chat/${communityHandle}/messages`);
      const messageData: any = {
        uid: currentUser.uid,
        username: userProfile?.username || "unknown",
        displayName: userProfile?.displayName || currentUser.displayName || "User",
        avatar: userProfile?.avatar || currentUser.photoURL || "",
        text: newMessage.trim(),
        timestamp: Date.now(),
      };

      // Attach reply data if replying
      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          username: replyingTo.username,
          displayName: replyingTo.displayName,
          text: replyingTo.text.length > 80 ? replyingTo.text.substring(0, 80) + "…" : replyingTo.text,
        };
      }

      await push(chatRef, messageData);
      setNewMessage("");
      setReplyingTo(null);
      setLastSentAt(Date.now());
      setIsAutoScroll(true);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!currentUser || msg.uid !== currentUser.uid) return;
    try {
      const msgRef = ref(rtdb, `community-chat/${communityHandle}/messages/${msg.id}`);
      await update(msgRef, { deleted: true, text: "" });
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  // Format timestamp to readable time
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const dateStr = formatDate(msg.timestamp);
    if (dateStr !== lastDate) {
      groupedMessages.push({ date: dateStr, msgs: [msg] });
      lastDate = dateStr;
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  }

  // Render the reply context block above a message
  const renderReplyContext = (replyTo: ReplyData) => (
    <div className="flex items-center gap-2 mb-1 pl-1">
      <div className="w-0.5 h-4 bg-indigo-500/40 rounded-full shrink-0"></div>
      <Reply className="w-3 h-3 text-indigo-400/60 shrink-0 rotate-180" />
      <span className="text-[11px] text-indigo-400/80 font-bold truncate">@{replyTo.username}</span>
      <span className="text-[11px] text-zinc-600 truncate">{replyTo.text}</span>
    </div>
  );

  // Render action buttons on hover
  const renderActions = (msg: Message) => (
    <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl px-0.5 py-0.5 z-20">
      {currentUser && isMember && (
        <button
          onClick={() => handleReply(msg)}
          className="p-1.5 hover:bg-white/10 rounded-md transition text-zinc-400 hover:text-indigo-400"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}
      {currentUser && msg.uid === currentUser.uid && (
        <button
          onClick={() => handleDelete(msg)}
          className="p-1.5 hover:bg-red-500/10 rounded-md transition text-zinc-400 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[60vh] md:h-[65vh] bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden">
      
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-black/40 flex items-center gap-3 shrink-0">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Community Chat</h3>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md ml-auto">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
              <MessageSquare className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-bold text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">{group.date}</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>

              {group.msgs.map((msg, idx) => {
                // Deleted message tombstone
                if (msg.deleted) {
                  return (
                    <div key={msg.id} className="pl-12 py-1.5">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-3 h-3 text-zinc-700" />
                        <p className="text-xs text-zinc-600 italic">@{msg.username} deleted a message</p>
                      </div>
                    </div>
                  );
                }

                // Collapse avatar if same user sent consecutive messages (and no reply context)
                const prevMsg = idx > 0 ? group.msgs[idx - 1] : null;
                const prevNonDeleted = prevMsg && !prevMsg.deleted ? prevMsg : null;
                const isCollapsed = prevNonDeleted?.uid === msg.uid && msg.timestamp - prevNonDeleted!.timestamp < 120000 && !msg.replyTo;

                return isCollapsed ? (
                  // Collapsed message (no avatar, compact)
                  <div key={msg.id} className="pl-12 py-0.5 group hover:bg-white/[0.02] rounded-lg transition relative">
                    {renderActions(msg)}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition font-mono w-10 text-right shrink-0">
                        {formatTime(msg.timestamp)}
                      </span>
                      <p className="text-sm text-zinc-300 break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  // Full message with avatar
                  <div key={msg.id} className="flex gap-3 py-2 group hover:bg-white/[0.02] rounded-lg transition px-1 relative">
                    {renderActions(msg)}
                    <Link href={`/${msg.username}`} className="shrink-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden border border-white/10 hover:border-indigo-500/50 transition mt-0.5">
                        <img
                          src={msg.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                          alt={msg.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      {msg.replyTo && renderReplyContext(msg.replyTo)}
                      <div className="flex items-baseline gap-2">
                        <Link href={`/${msg.username}`} className="font-bold text-sm text-white hover:text-indigo-400 transition">
                          {msg.displayName}
                        </Link>
                        <span className="text-[10px] text-zinc-600 font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 break-words leading-relaxed mt-0.5">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 bg-black/40 shrink-0">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-0.5 h-8 bg-indigo-500 rounded-full shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Replying to @{replyingTo.username}</p>
              <p className="text-xs text-zinc-500 truncate">{replyingTo.text}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-500 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-4 py-3">
          {!currentUser ? (
            <Link href="/login" className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 rounded-xl text-zinc-400 text-sm font-bold hover:bg-white/10 transition border border-white/5">
              <Lock className="w-4 h-4" /> Login to chat
            </Link>
          ) : !isMember ? (
            <div className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 rounded-xl text-zinc-500 text-sm font-bold border border-white/5">
              <Lock className="w-4 h-4" /> Join this community to chat
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Send a message..."}
                maxLength={500}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || cooldownRemaining > 0}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-indigo-500/20 active:scale-95 relative"
                title={cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : "Send"}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cooldownRemaining > 0 ? (
                  <span className="text-[10px] font-bold w-4 text-center">{Math.ceil(cooldownRemaining / 1000)}</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
