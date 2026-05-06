"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db, rtdb } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { ref, push, onChildAdded, onChildChanged, onChildRemoved, query as rq, limitToLast, orderByChild, update, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Send, Loader2, Reply, X, Trash2, Pencil, Check, Search, Mail, MessageSquare, Plus, Hash, Users } from "lucide-react";
import PulseLogo from "@/components/PulseLogo";
import AnimatedAvatar from "@/components/AnimatedAvatar";

interface DMConvo { id: string; otherUser: { uid: string; username: string; displayName: string; avatar: string }; lastMessage: string; lastTimestamp: number; }
interface Message { id: string; uid: string; username: string; displayName: string; avatar: string; text: string; timestamp: number; replyTo?: any; deleted?: boolean; deletedBy?: string; edited?: boolean; }

const PH = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
const COOLDOWN = 2000;

export default function DMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [convos, setConvos] = useState<DMConvo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("id"));
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lastSent, setLastSent] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(Math.max(0, lastSent + COOLDOWN - Date.now())), 100);
    return () => clearInterval(t);
  }, [cooldown, lastSent]);

  // Auth + load convos
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setCurrentUser(u);
      // Profile
      const uq = query(collection(db, "users"), where("owner_uid", "==", u.uid));
      const us = await getDocs(uq);
      if (!us.empty) { const d = us.docs[0].data(); setUserProfile({ username: us.docs[0].id, displayName: d.displayName || us.docs[0].id, avatar: d.theme?.avatar || u.photoURL || "" }); }
      // Communities
      const cq = query(collection(db, "communities"), where("members", "array-contains", u.uid));
      const cs = await getDocs(cq); setJoinedCommunities(cs.docs.map(d => ({ id: d.id, ...d.data() })));
      // DMs
      const dq = query(collection(db, "dms"), where("participants", "array-contains", u.uid));
      const ds = await getDocs(dq);
      const list: DMConvo[] = [];
      for (const d of ds.docs) {
        const data = d.data();
        const otherUid = (data.participants || []).find((p: string) => p !== u.uid);
        if (!otherUid) continue;
        const oq = query(collection(db, "users"), where("owner_uid", "==", otherUid));
        const os = await getDocs(oq);
        let ou = { uid: otherUid, username: "unknown", displayName: "Unknown", avatar: "" };
        if (!os.empty) { const od = os.docs[0].data(); ou = { uid: otherUid, username: os.docs[0].id, displayName: od.displayName || os.docs[0].id, avatar: od.theme?.avatar || "" }; }
        list.push({ id: d.id, otherUser: ou, lastMessage: data.lastMessage || "", lastTimestamp: data.lastTimestamp || 0 });
      }
      list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      setConvos(list); setLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to messages when active convo changes
  useEffect(() => {
    if (!activeId || !currentUser) return;
    setMessages([]); setReplyingTo(null); setEditingId(null); setEditText("");
    const msgRef = ref(rtdb, `dm-messages/${activeId}/messages`);
    const msgQ = rq(msgRef, orderByChild("timestamp"), limitToLast(100));
    const ids = new Set<string>();
    const unsubAdd = onChildAdded(msgQ, (s) => { const d = s.val(); const id = s.key!; if (ids.has(id)) return; ids.add(id); setMessages(p => [...p, { id, uid: d.uid, username: d.username, displayName: d.displayName, avatar: d.avatar, text: d.text, timestamp: d.timestamp || Date.now(), replyTo: d.replyTo, deleted: d.deleted, deletedBy: d.deletedBy, edited: d.edited }]); }, (err) => console.error("DM listen error:", err));
    const unsubChange = onChildChanged(msgQ, (s) => { const d = s.val(); const id = s.key!; setMessages(p => p.map(m => m.id === id ? { ...m, text: d.text, deleted: d.deleted, deletedBy: d.deletedBy, edited: d.edited } : m)); }, (err) => console.error("DM change error:", err));
    const unsubRemove = onChildRemoved(msgQ, (s) => { const id = s.key!; setMessages(p => p.filter(m => m.id !== id)); }, (err) => console.error("DM remove error:", err));
    return () => { unsubAdd(); unsubChange(); unsubRemove(); };
  }, [activeId, currentUser]);

  useEffect(() => { if (autoScroll) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const onScroll = () => { if (!chatRef.current) return; const { scrollTop, scrollHeight, clientHeight } = chatRef.current; setAutoScroll(scrollHeight - scrollTop - clientHeight < 80); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !currentUser || !activeId || sending) return;
    const now = Date.now();
    if (now - lastSent < COOLDOWN) { setCooldown(lastSent + COOLDOWN - now); return; }
    setSending(true);
    try {
      const data: any = { uid: currentUser.uid, username: userProfile?.username || "unknown", displayName: userProfile?.displayName || "User", avatar: userProfile?.avatar || "", text: newMsg.trim(), timestamp: Date.now() };
      if (replyingTo) data.replyTo = { id: replyingTo.id, username: replyingTo.username, displayName: replyingTo.displayName, text: replyingTo.text.length > 80 ? replyingTo.text.substring(0, 80) + "…" : replyingTo.text };
      await push(ref(rtdb, `dm-messages/${activeId}/messages`), data);
      try { const { updateDoc } = await import("firebase/firestore"); await updateDoc(doc(db, "dms", activeId), { lastMessage: newMsg.trim().substring(0, 50), lastTimestamp: Date.now() }); } catch {}
      setNewMsg(""); setReplyingTo(null); setLastSent(Date.now()); setAutoScroll(true);
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  const handleDelete = async (msg: Message) => { if (msg.uid !== currentUser?.uid || !activeId) return; await update(ref(rtdb, `dm-messages/${activeId}/messages/${msg.id}`), { deleted: true, deletedBy: "self", text: "" }); };
  const startEdit = (msg: Message) => { setEditingId(msg.id); setEditText(msg.text); setTimeout(() => editRef.current?.focus(), 50); };
  const cancelEdit = () => { setEditingId(null); setEditText(""); };
  const saveEdit = async () => { if (!editingId || !editText.trim() || !activeId) return; await update(ref(rtdb, `dm-messages/${activeId}/messages/${editingId}`), { text: editText.trim(), edited: true }); setEditingId(null); setEditText(""); };
  const handleReply = (msg: Message) => { setReplyingTo(msg); inputRef.current?.focus(); };

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (ts: number) => { const d = new Date(ts), t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1); if (d.toDateString() === t.toDateString()) return "Today"; if (d.toDateString() === y.toDateString()) return "Yesterday"; return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); };
  const fmtRelative = (ts: number) => { if (!ts) return ""; const d = Date.now() - ts; if (d < 60000) return "now"; if (d < 3600000) return `${Math.floor(d / 60000)}m`; if (d < 86400000) return fmtTime(ts); return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }); };

  const grouped: { date: string; msgs: Message[] }[] = [];
  let ld = "";
  for (const m of messages) { const ds = fmtDate(m.timestamp); if (ds !== ld) { grouped.push({ date: ds, msgs: [m] }); ld = ds; } else grouped[grouped.length - 1].msgs.push(m); }

  const activeConvo = convos.find(c => c.id === activeId);
  const filtered = convos.filter(c => c.otherUser.displayName.toLowerCase().includes(searchQ.toLowerCase()) || c.otherUser.username.toLowerCase().includes(searchQ.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-[#1a1a1e] flex items-center justify-center"><PulseLogo className="w-10 h-10 text-indigo-500 animate-pulse" /></div>;

  return (
    <div className="h-screen bg-[#1a1a1e] text-white font-sans flex overflow-hidden selection:bg-indigo-500/30">
      {/* Server sidebar */}
      <div className="hidden md:flex flex-col items-center w-[72px] bg-[#111113] py-3 gap-2 shrink-0 border-r border-white/5 overflow-y-auto custom-scrollbar">
        <Link href="/dashboard" className="w-12 h-12 rounded-2xl bg-[#1e1f22] hover:bg-indigo-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group mb-1" title="Dashboard"><PulseLogo className="w-6 h-6 text-zinc-400 group-hover:text-white transition" /></Link>
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-1 ring-2 ring-indigo-500" title="Direct Messages"><Mail className="w-5 h-5 text-white" /></div>
        <div className="w-8 h-0.5 bg-white/10 rounded-full mb-1" />
        {joinedCommunities.map(c => (
          <Link key={c.id} href={`/c/${c.handle || c.id}`} className="w-12 h-12 rounded-2xl hover:rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden group" title={c.name}>
            {c.avatar ? <AnimatedAvatar src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black bg-[#2b2b30] text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{(c.name || "?").substring(0, 2).toUpperCase()}</div>}
          </Link>
        ))}
        {/* Explore */}
        <Link href="/c" className="w-12 h-12 rounded-2xl bg-[#1e1f22] hover:bg-green-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group mt-1" title="Explore Communities">
          <Plus className="w-5 h-5 text-green-500 group-hover:text-white transition" />
        </Link>
      </div>

      {/* DM list sidebar */}
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-60 bg-[#141416] shrink-0 border-r border-white/5`}>
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 gap-2 focus-within:border-indigo-500 transition">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Find or start a conversation" className="flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-zinc-600" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 pt-4 pb-2 flex items-center justify-between">Direct Messages <span className="text-zinc-600">{convos.length}</span></p>
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">{searchQ ? "No results" : "No conversations yet"}</p>
          ) : filtered.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 transition group ${activeId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/5">
                <AnimatedAvatar src={c.otherUser.avatar || PH} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className={`text-[13px] font-medium truncate ${activeId === c.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'} transition`}>{c.otherUser.displayName}</p>
                  <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-2">{fmtRelative(c.lastTimestamp)}</span>
                </div>
                <p className="text-[11px] text-zinc-600 truncate">{c.lastMessage || "Start chatting"}</p>
              </div>
            </button>
          ))}
        </div>
        {currentUser && userProfile && (
          <div className="p-3 border-t border-white/5 bg-[#111113]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10"><AnimatedAvatar src={userProfile.avatar || PH} alt="" className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{userProfile.displayName}</p><p className="text-[10px] text-zinc-500 truncate">@{userProfile.username}</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {!activeId || !activeConvo ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/5"><Mail className="w-8 h-8 text-zinc-600" /></div>
            <h2 className="text-xl font-black text-white mb-1">Your Messages</h2>
            <p className="text-sm text-zinc-500 max-w-xs">Select a conversation or start a new one from a community member list.</p>
          </div>
        ) : (<>
          {/* Chat header */}
          <div className="h-12 px-4 border-b border-white/5 bg-[#1a1a1e] flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveId(null)} className="md:hidden p-1 hover:bg-white/10 rounded-lg text-zinc-400"><X className="w-5 h-5" /></button>
            <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10 shrink-0"><AnimatedAvatar src={activeConvo.otherUser.avatar || PH} alt="" className="w-full h-full object-cover" /></div>
            <Link href={`/${activeConvo.otherUser.username}`} className="font-bold text-sm hover:text-indigo-400 transition">{activeConvo.otherUser.displayName}</Link>
            <span className="text-[10px] text-zinc-600">@{activeConvo.otherUser.username}</span>
          </div>

          {/* Messages */}
          <div ref={chatRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            {/* Convo start */}
            <div className="flex flex-col items-center py-8 text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-white/10 mb-3"><AnimatedAvatar src={activeConvo.otherUser.avatar || PH} alt="" className="w-full h-full object-cover" /></div>
              <p className="font-black text-lg">{activeConvo.otherUser.displayName}</p>
              <p className="text-xs text-zinc-500 mb-1">@{activeConvo.otherUser.username}</p>
              <p className="text-xs text-zinc-600 mt-2">This is the beginning of your conversation.</p>
            </div>
            {grouped.map(g => (
              <div key={g.date}>
                <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-white/5" /><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">{g.date}</span><div className="flex-1 h-px bg-white/5" /></div>
                {g.msgs.map((msg, idx) => {
                  if (msg.deleted) return <div key={msg.id} className="pl-12 py-1.5"><div className="flex items-center gap-2"><Trash2 className="w-3 h-3 text-zinc-700" /><p className="text-xs text-zinc-600 italic">@{msg.username} deleted a message</p></div></div>;
                  const prev = idx > 0 ? g.msgs[idx - 1] : null;
                  const collapsed = prev && !prev.deleted && prev.uid === msg.uid && msg.timestamp - prev.timestamp < 120000 && !msg.replyTo;
                  const isOwn = msg.uid === currentUser?.uid;

                  const actions = !msg.deleted && (isOwn || currentUser) ? (
                    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition flex items-center bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl px-0.5 py-0.5 z-20">
                      <button onClick={() => handleReply(msg)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-indigo-400"><Reply className="w-3.5 h-3.5" /></button>
                      {isOwn && <button onClick={() => startEdit(msg)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-yellow-400"><Pencil className="w-3.5 h-3.5" /></button>}
                      {isOwn && <button onClick={() => handleDelete(msg)} className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ) : null;

                  const content = editingId === msg.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input ref={editRef} type="text" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} maxLength={500} className="flex-1 bg-white/5 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <button onClick={saveEdit} className="p-1.5 bg-indigo-600 rounded-lg text-white"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={cancelEdit} className="p-1.5 bg-white/5 rounded-lg text-zinc-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : <p className="text-sm text-zinc-300 break-words leading-relaxed mt-0.5">{msg.text}{msg.edited && <span className="text-[10px] text-zinc-600 ml-1.5">(edited)</span>}</p>;

                  return collapsed ? (
                    <div key={msg.id} className="pl-12 py-0.5 group hover:bg-white/[0.02] rounded-lg transition relative">
                      {actions}
                      <span className="absolute left-1 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition font-mono top-1/2 -translate-y-1/2">{fmtTime(msg.timestamp)}</span>
                      {content}
                    </div>
                  ) : (
                    <div key={msg.id} className="flex gap-3 py-2 group hover:bg-white/[0.02] rounded-lg transition px-1 relative">
                      {actions}
                      <Link href={`/${msg.username}`} className="shrink-0"><div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden border border-white/10 hover:border-indigo-500/50 transition mt-0.5"><AnimatedAvatar src={msg.avatar || PH} alt="" className="w-full h-full object-cover" /></div></Link>
                      <div className="flex-1 min-w-0">
                        {msg.replyTo && <div className="flex items-center gap-2 mb-1 pl-1"><div className="w-0.5 h-4 bg-indigo-500/40 rounded-full shrink-0" /><Reply className="w-3 h-3 text-indigo-400/60 shrink-0 rotate-180" /><span className="text-[11px] text-indigo-400/80 font-bold truncate">@{msg.replyTo.username}</span><span className="text-[11px] text-zinc-600 truncate">{msg.replyTo.text}</span></div>}
                        <div className="flex items-baseline gap-2"><Link href={`/${msg.username}`} className="font-bold text-sm text-white hover:text-indigo-400 transition">{msg.displayName}</Link><span className="text-[10px] text-zinc-600 font-mono">{fmtTime(msg.timestamp)}</span></div>
                        {content}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={endRef} />
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
                <input ref={inputRef} type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder={`Message @${activeConvo.otherUser.username}...`} maxLength={500}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-zinc-600" />
                <button type="submit" disabled={!newMsg.trim() || sending || cooldown > 0}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center disabled:opacity-30 shrink-0 shadow-lg shadow-indigo-500/20 active:scale-95">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldown > 0 ? <span className="text-[10px] font-bold w-4 text-center">{Math.ceil(cooldown / 1000)}</span> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}
