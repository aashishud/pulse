"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, rtdb } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { ref, push, onChildAdded, onChildChanged, query as rtdbQuery, limitToLast, orderByChild, update, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Send, Loader2, Lock, Reply, X, Trash2, Pencil, Check, ArrowLeft, MessageSquare } from "lucide-react";
import PulseLogo from "@/components/PulseLogo";

interface Message {
  id: string; uid: string; username: string; displayName: string;
  avatar: string; text: string; timestamp: number;
  replyTo?: { id: string; username: string; displayName: string; text: string };
  deleted?: boolean; deletedBy?: string; edited?: boolean;
}

const COOLDOWN_MS = 2000;
const PLACEHOLDER = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function DMPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lastSentAt, setLastSentAt] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(() => setCooldownRemaining(Math.max(0, lastSentAt + COOLDOWN_MS - Date.now())), 100);
    return () => clearInterval(t);
  }, [cooldownRemaining, lastSentAt]);

  // Auth + load conversation
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setCurrentUser(u);

      // Get own profile
      const uq = query(collection(db, "users"), where("owner_uid", "==", u.uid));
      const us = await getDocs(uq);
      if (!us.empty) {
        const d = us.docs[0].data();
        setUserProfile({ username: us.docs[0].id, displayName: d.displayName || us.docs[0].id, avatar: d.theme?.avatar || u.photoURL || "" });
      }

      // Verify this user is a participant
      const uids = conversationId.split("_");
      if (!uids.includes(u.uid)) { setUnauthorized(true); setLoading(false); return; }

      // Get other user's profile
      const otherUid = uids.find(id => id !== u.uid)!;
      const oq = query(collection(db, "users"), where("owner_uid", "==", otherUid));
      const os = await getDocs(oq);
      if (!os.empty) {
        const od = os.docs[0].data();
        setOtherUser({ uid: otherUid, username: os.docs[0].id, displayName: od.displayName || os.docs[0].id, avatar: od.theme?.avatar || "" });
      } else {
        setOtherUser({ uid: otherUid, username: "Unknown", displayName: "Unknown User", avatar: "" });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [conversationId]);

  // Subscribe to messages
  useEffect(() => {
    if (!currentUser || unauthorized) return;
    const msgRef = ref(rtdb, `dm-messages/${conversationId}/messages`);
    const msgQuery = rtdbQuery(msgRef, orderByChild("timestamp"), limitToLast(100));
    const ids = new Set<string>();

    onChildAdded(msgQuery, (snap) => {
      const d = snap.val(); const id = snap.key!;
      if (ids.has(id)) return; ids.add(id);
      setMessages(prev => [...prev, {
        id, uid: d.uid, username: d.username, displayName: d.displayName,
        avatar: d.avatar, text: d.text, timestamp: d.timestamp || Date.now(),
        replyTo: d.replyTo, deleted: d.deleted, deletedBy: d.deletedBy, edited: d.edited,
      }]);
    });

    onChildChanged(msgQuery, (snap) => {
      const d = snap.val(); const id = snap.key!;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: d.text, deleted: d.deleted, deletedBy: d.deletedBy, edited: d.edited } : m));
    });

    return () => { off(msgRef); };
  }, [conversationId, currentUser, unauthorized]);

  // Auto-scroll
  useEffect(() => { if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const handleScroll = () => { if (!chatRef.current) return; const { scrollTop, scrollHeight, clientHeight } = chatRef.current; setAutoScroll(scrollHeight - scrollTop - clientHeight < 80); };

  // Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || sending) return;
    const now = Date.now();
    if (now - lastSentAt < COOLDOWN_MS) { setCooldownRemaining(lastSentAt + COOLDOWN_MS - now); return; }
    setSending(true);
    try {
      const msgData: any = {
        uid: currentUser.uid, username: userProfile?.username || "unknown",
        displayName: userProfile?.displayName || "User", avatar: userProfile?.avatar || "",
        text: newMessage.trim(), timestamp: Date.now(),
      };
      if (replyingTo) {
        msgData.replyTo = { id: replyingTo.id, username: replyingTo.username, displayName: replyingTo.displayName,
          text: replyingTo.text.length > 80 ? replyingTo.text.substring(0, 80) + "…" : replyingTo.text };
      }
      await push(ref(rtdb, `dm-messages/${conversationId}/messages`), msgData);
      // Update last message in Firestore
      await updateDoc(doc(db, "dms", conversationId), { lastMessage: newMessage.trim().substring(0, 50), lastTimestamp: Date.now() }).catch(() => {});
      setNewMessage(""); setReplyingTo(null); setLastSentAt(Date.now()); setAutoScroll(true);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleDelete = async (msg: Message) => {
    if (msg.uid !== currentUser?.uid) return;
    await update(ref(rtdb, `dm-messages/${conversationId}/messages/${msg.id}`), { deleted: true, deletedBy: "self", text: "" });
  };

  const startEdit = (msg: Message) => { setEditingId(msg.id); setEditText(msg.text); setTimeout(() => editInputRef.current?.focus(), 50); };
  const cancelEdit = () => { setEditingId(null); setEditText(""); };
  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await update(ref(rtdb, `dm-messages/${conversationId}/messages/${editingId}`), { text: editText.trim(), edited: true });
    setEditingId(null); setEditText("");
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts: number) => {
    const d = new Date(ts), t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const grouped: { date: string; msgs: Message[] }[] = [];
  let ld = "";
  for (const m of messages) { const ds = formatDate(m.timestamp); if (ds !== ld) { grouped.push({ date: ds, msgs: [m] }); ld = ds; } else grouped[grouped.length - 1].msgs.push(m); }

  if (loading) return <div className="min-h-screen bg-[#1a1a1e] flex items-center justify-center"><PulseLogo className="w-10 h-10 text-indigo-500 animate-pulse" /></div>;
  if (unauthorized) return (
    <div className="min-h-screen bg-[#1a1a1e] flex flex-col items-center justify-center text-white p-4">
      <Lock className="w-14 h-14 text-zinc-600 mb-4" /><h1 className="text-2xl font-black mb-2">Not Authorized</h1>
      <Link href="/" className="mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">Go Home</Link>
    </div>
  );

  return (
    <div className="h-screen bg-[#1a1a1e] text-white font-sans flex flex-col selection:bg-indigo-500/30">
      {/* Header */}
      <div className="h-12 px-4 border-b border-white/5 bg-[#141416] flex items-center gap-3 shrink-0">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-400"><ArrowLeft className="w-4 h-4" /></button>
        <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10 shrink-0">
          <img src={otherUser?.avatar || PLACEHOLDER} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/${otherUser?.username}`} className="text-sm font-bold hover:text-indigo-400 transition truncate block">{otherUser?.displayName}</Link>
          <p className="text-[10px] text-zinc-500">@{otherUser?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
        {/* Conversation start */}
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-white/10 mb-3">
            <img src={otherUser?.avatar || PLACEHOLDER} alt="" className="w-full h-full object-cover" />
          </div>
          <p className="font-black text-lg">{otherUser?.displayName}</p>
          <p className="text-xs text-zinc-500">@{otherUser?.username}</p>
          <p className="text-xs text-zinc-600 mt-2">This is the beginning of your conversation.</p>
        </div>

        {grouped.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/5" /><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">{group.date}</span><div className="flex-1 h-px bg-white/5" />
            </div>
            {group.msgs.map((msg, idx) => {
              if (msg.deleted) return (
                <div key={msg.id} className="pl-12 py-1.5"><div className="flex items-center gap-2">
                  <Trash2 className="w-3 h-3 text-zinc-700" /><p className="text-xs text-zinc-600 italic">@{msg.username} deleted a message</p>
                </div></div>
              );
              const prev = idx > 0 ? group.msgs[idx - 1] : null;
              const collapsed = prev && !prev.deleted && prev.uid === msg.uid && msg.timestamp - prev.timestamp < 120000 && !msg.replyTo;

              return collapsed ? (
                <div key={msg.id} className="pl-12 py-0.5 group hover:bg-white/[0.02] rounded-lg transition relative">
                  {renderActions(msg)}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition font-mono w-10 text-right shrink-0">{formatTime(msg.timestamp)}</span>
                    {renderContent(msg)}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3 py-2 group hover:bg-white/[0.02] rounded-lg transition px-1 relative">
                  {renderActions(msg)}
                  <Link href={`/${msg.username}`} className="shrink-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden border border-white/10 hover:border-indigo-500/50 transition mt-0.5">
                      <img src={msg.avatar || PLACEHOLDER} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    {msg.replyTo && <div className="flex items-center gap-2 mb-1 pl-1"><div className="w-0.5 h-4 bg-indigo-500/40 rounded-full shrink-0" /><Reply className="w-3 h-3 text-indigo-400/60 shrink-0 rotate-180" /><span className="text-[11px] text-indigo-400/80 font-bold truncate">@{msg.replyTo.username}</span><span className="text-[11px] text-zinc-600 truncate">{msg.replyTo.text}</span></div>}
                    <div className="flex items-baseline gap-2">
                      <Link href={`/${msg.username}`} className="font-bold text-sm text-white hover:text-indigo-400 transition">{msg.displayName}</Link>
                      <span className="text-[10px] text-zinc-600 font-mono">{formatTime(msg.timestamp)}</span>
                    </div>
                    {renderContent(msg)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 bg-[#141416] shrink-0">
        {replyingTo && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-3">
            <div className="w-0.5 h-8 bg-indigo-500 rounded-full shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Replying to @{replyingTo.username}</p><p className="text-xs text-zinc-500 truncate">{replyingTo.text}</p></div>
            <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="px-4 py-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <input ref={inputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : `Message @${otherUser?.username || ""}...`} maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-zinc-600" />
            <button type="submit" disabled={!newMessage.trim() || sending || cooldownRemaining > 0}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-indigo-500/20 active:scale-95">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldownRemaining > 0 ? <span className="text-[10px] font-bold w-4 text-center">{Math.ceil(cooldownRemaining / 1000)}</span> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  function renderActions(msg: Message) {
    if (msg.deleted || msg.uid !== currentUser?.uid) return null;
    return (
      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition flex items-center bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl px-0.5 py-0.5 z-20">
        <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-indigo-400"><Reply className="w-3.5 h-3.5" /></button>
        <button onClick={() => startEdit(msg)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-yellow-400"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(msg)} className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  function renderContent(msg: Message) {
    if (editingId === msg.id) return (
      <div className="flex items-center gap-2 mt-1">
        <input ref={editInputRef} type="text" value={editText} onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} maxLength={500}
          className="flex-1 bg-white/5 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
        <button onClick={saveEdit} className="p-1.5 bg-indigo-600 rounded-lg text-white"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={cancelEdit} className="p-1.5 bg-white/5 rounded-lg text-zinc-400"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
    return <p className="text-sm text-zinc-300 break-words leading-relaxed mt-0.5">{msg.text}{msg.edited && <span className="text-[10px] text-zinc-600 ml-1.5">(edited)</span>}</p>;
  }
}
