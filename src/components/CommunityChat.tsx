"use client";

import { useEffect, useRef, useState } from "react";
import { rtdb, auth as firebaseAuth } from "@/lib/firebase";
import { ref, push, onChildAdded, onChildChanged, onChildRemoved, query, limitToLast, orderByChild, update, off } from "firebase/database";
import { Send, Loader2, MessageSquare, Lock, Reply, X, Trash2, Pencil, Check, ShieldAlert } from "lucide-react";
import Link from "next/link";
import AnimatedAvatar from "@/components/AnimatedAvatar";

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
  deletedBy?: "self" | "admin";
  deletedByUsername?: string;
  edited?: boolean;
}

interface CommunityChatProps {
  communityHandle: string;
  channelId: string;
  currentUser: any;
  isMember: boolean;
  isAdmin: boolean;
  userProfile?: { username: string; displayName: string; avatar: string } | null;
}

const COOLDOWN_MS = 2000;

export default function CommunityChat({ communityHandle, channelId, currentUser, isMember, isAdmin, userProfile }: CommunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lastSentAt, setLastSentAt] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining(Math.max(0, lastSentAt + COOLDOWN_MS - Date.now()));
    }, 100);
    return () => clearInterval(timer);
  }, [cooldownRemaining, lastSentAt]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  const scrollToBottom = () => {
    if (isAutoScroll) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Subscribe to messages — reset on channel change
  useEffect(() => {
    setMessages([]); setReplyingTo(null); setEditingId(null); setEditText("");
    const chatRef = ref(rtdb, `community-chat/${communityHandle}/channels/${channelId}/messages`);
    const chatQuery = query(chatRef, orderByChild("timestamp"), limitToLast(100));
    const ids = new Set<string>();

    const unsubAdd = onChildAdded(chatQuery, (snap) => {
      const d = snap.val(); const id = snap.key!;
      if (ids.has(id)) return; ids.add(id);
      setMessages(prev => [...prev, {
        id, uid: d.uid, username: d.username, displayName: d.displayName,
        avatar: d.avatar, text: d.text, timestamp: d.timestamp || Date.now(),
        replyTo: d.replyTo || undefined, deleted: d.deleted || false,
        deletedBy: d.deletedBy || undefined, deletedByUsername: d.deletedByUsername || undefined,
        edited: d.edited || false,
      }]);
    }, (err) => console.error("Chat listen error:", err));

    const unsubChange = onChildChanged(chatQuery, (snap) => {
      const d = snap.val(); const id = snap.key!;
      setMessages(prev => prev.map(m => m.id === id ? {
        ...m, text: d.text, deleted: d.deleted || false,
        deletedBy: d.deletedBy || undefined, deletedByUsername: d.deletedByUsername || undefined,
        edited: d.edited || false,
      } : m));
    }, (err) => console.error("Chat change error:", err));

    const unsubRemove = onChildRemoved(chatQuery, (snap) => {
      const id = snap.key!;
      setMessages(prev => prev.filter(m => m.id !== id));
    }, (err) => console.error("Chat remove error:", err));

    return () => { unsubAdd(); unsubChange(); unsubRemove(); };
  }, [communityHandle, channelId]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !isMember || sending) return;
    const now = Date.now();
    if (now - lastSentAt < COOLDOWN_MS) { setCooldownRemaining(lastSentAt + COOLDOWN_MS - now); return; }

    setSending(true);
    try {
      const msgData: any = {
        uid: currentUser.uid,
        username: userProfile?.username || "unknown",
        displayName: userProfile?.displayName || currentUser.displayName || "User",
        avatar: userProfile?.avatar || currentUser.photoURL || "",
        text: newMessage.trim(), timestamp: Date.now(),
      };
      if (replyingTo) {
        msgData.replyTo = {
          id: replyingTo.id, username: replyingTo.username,
          displayName: replyingTo.displayName,
          text: replyingTo.text.length > 80 ? replyingTo.text.substring(0, 80) + "…" : replyingTo.text,
        };
      }
      await push(ref(rtdb, `community-chat/${communityHandle}/channels/${channelId}/messages`), msgData);
      setNewMessage(""); setReplyingTo(null); setLastSentAt(Date.now()); setIsAutoScroll(true);
    } catch (err) { console.error("Send failed:", err); }
    finally { setSending(false); }
  };

  // Self-delete
  const handleDelete = async (msg: Message) => {
    if (!currentUser || msg.uid !== currentUser.uid) return;
    await update(ref(rtdb, `community-chat/${communityHandle}/channels/${channelId}/messages/${msg.id}`), {
      deleted: true, deletedBy: "self", text: "",
    });
  };

  // Admin delete (via API)
  const handleAdminDelete = async (msg: Message) => {
    if (!currentUser || !isAdmin) return;
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/community/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "delete-message", communityHandle, messageId: msg.id, channelId }),
    });
  };

  // Edit message
  const startEdit = (msg: Message) => { setEditingId(msg.id); setEditText(msg.text); setTimeout(() => editInputRef.current?.focus(), 50); };
  const cancelEdit = () => { setEditingId(null); setEditText(""); };
  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await update(ref(rtdb, `community-chat/${communityHandle}/channels/${channelId}/messages/${editingId}`), {
      text: editText.trim(), edited: true,
    });
    setEditingId(null); setEditText("");
  };

  const handleReply = (msg: Message) => { setReplyingTo(msg); inputRef.current?.focus(); };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts: number) => {
    const d = new Date(ts), today = new Date(), yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Group by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const ds = formatDate(msg.timestamp);
    if (ds !== lastDate) { grouped.push({ date: ds, msgs: [msg] }); lastDate = ds; }
    else grouped[grouped.length - 1].msgs.push(msg);
  }

  const renderReply = (r: ReplyData) => (
    <div className="flex items-center gap-2 mb-1 pl-1">
      <div className="w-0.5 h-4 bg-indigo-500/40 rounded-full shrink-0" />
      <Reply className="w-3 h-3 text-indigo-400/60 shrink-0 rotate-180" />
      <span className="text-[11px] text-indigo-400/80 font-bold truncate">@{r.username}</span>
      <span className="text-[11px] text-zinc-600 truncate">{r.text}</span>
    </div>
  );

  const renderActions = (msg: Message) => {
    if (msg.deleted) return null;
    const isOwn = currentUser?.uid === msg.uid;
    if (!isOwn && !isAdmin) return null;
    return (
      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition flex items-center bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl px-0.5 py-0.5 z-20">
        {currentUser && isMember && (
          <button onClick={() => handleReply(msg)} className="p-1.5 hover:bg-white/10 rounded-md transition text-zinc-400 hover:text-indigo-400" title="Reply">
            <Reply className="w-3.5 h-3.5" />
          </button>
        )}
        {isOwn && (
          <button onClick={() => startEdit(msg)} className="p-1.5 hover:bg-white/10 rounded-md transition text-zinc-400 hover:text-yellow-400" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {isOwn && (
          <button onClick={() => handleDelete(msg)} className="p-1.5 hover:bg-red-500/10 rounded-md transition text-zinc-400 hover:text-red-400" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {isAdmin && !isOwn && (
          <button onClick={() => handleAdminDelete(msg)} className="p-1.5 hover:bg-red-500/10 rounded-md transition text-zinc-400 hover:text-red-400" title="Delete as Admin">
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const renderTombstone = (msg: Message) => (
    <div key={msg.id} className="pl-12 py-1.5">
      <div className="flex items-center gap-2">
        {msg.deletedBy === "admin" ? (
          <><ShieldAlert className="w-3 h-3 text-red-500/60" /><p className="text-xs text-red-400/60 italic">Message removed by admin ({msg.deletedByUsername || "mod"})</p></>
        ) : (
          <><Trash2 className="w-3 h-3 text-zinc-700" /><p className="text-xs text-zinc-600 italic">@{msg.username} deleted a message</p></>
        )}
      </div>
    </div>
  );

  const renderMessageContent = (msg: Message) => {
    if (editingId === msg.id) {
      return (
        <div className="flex items-center gap-2 mt-1">
          <input ref={editInputRef} type="text" value={editText} onChange={e => setEditText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
            maxLength={500} className="flex-1 bg-white/5 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
          <button onClick={saveEdit} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={cancelEdit} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      );
    }
    return (
      <p className="text-sm text-zinc-300 break-words leading-relaxed mt-0.5">
        {msg.text}
        {msg.edited && <span className="text-[10px] text-zinc-600 ml-1.5">(edited)</span>}
      </p>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
              <MessageSquare className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-bold text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">{group.date}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              {group.msgs.map((msg, idx) => {
                if (msg.deleted) return renderTombstone(msg);
                const prev = idx > 0 ? group.msgs[idx - 1] : null;
                const prevOk = prev && !prev.deleted ? prev : null;
                const collapsed = prevOk?.uid === msg.uid && msg.timestamp - prevOk!.timestamp < 120000 && !msg.replyTo;

                return collapsed ? (
                  <div key={msg.id} className="pl-12 py-0.5 group hover:bg-white/[0.02] rounded-lg transition relative">
                    {renderActions(msg)}
                    <span className="absolute left-1 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition font-mono top-1/2 -translate-y-1/2">{formatTime(msg.timestamp)}</span>
                    {renderMessageContent(msg)}
                  </div>
                ) : (
                  <div key={msg.id} className="flex gap-3 py-2 group hover:bg-white/[0.02] rounded-lg transition px-1 relative">
                    {renderActions(msg)}
                    <Link href={`/${msg.username}`} className="shrink-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden border border-white/10 hover:border-indigo-500/50 transition mt-0.5">
                        <AnimatedAvatar src={msg.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt={msg.username} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      {msg.replyTo && renderReply(msg.replyTo)}
                      <div className="flex items-baseline gap-2">
                        <Link href={`/${msg.username}`} className="font-bold text-sm text-white hover:text-indigo-400 transition">{msg.displayName}</Link>
                        <span className="text-[10px] text-zinc-600 font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      {renderMessageContent(msg)}
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
      <div className="border-t border-white/5 bg-[#0c0c0e] shrink-0">
        {replyingTo && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-0.5 h-8 bg-indigo-500 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Replying to @{replyingTo.username}</p>
              <p className="text-xs text-zinc-500 truncate">{replyingTo.text}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-500 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
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
              <input ref={inputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Send a message..."} maxLength={500}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-zinc-600" />
              <button type="submit" disabled={!newMessage.trim() || sending || cooldownRemaining > 0}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-indigo-500/20 active:scale-95"
                title={cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : "Send"}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldownRemaining > 0 ? <span className="text-[10px] font-bold w-4 text-center">{Math.ceil(cooldownRemaining / 1000)}</span> : <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
