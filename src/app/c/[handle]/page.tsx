"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, collection, query, where, getDocs, updateDoc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import {
  Users, Crown, Share2, ShieldCheck, Settings, MessageSquare, Shield,
  Lock, Eye, UserMinus, Ban, ChevronUp, ChevronDown, X, Menu, Plus, Hash, Mail, Trash2, Search
} from "lucide-react";
import CommunityChat from "@/components/CommunityChat";
import PulseLogo from "@/components/PulseLogo";
import AnimatedAvatar from "@/components/AnimatedAvatar";

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const handle = (params.handle as string).toLowerCase();

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ username: string; displayName: string; avatar: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [actionTarget, setActionTarget] = useState<any>(null);
  const [bannedProfiles, setBannedProfiles] = useState<any[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [joinHandle, setJoinHandle] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // Auth + profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (u) {
        const q = query(collection(db, "users"), where("owner_uid", "==", u.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUserProfile({ username: snap.docs[0].id, displayName: d.displayName || snap.docs[0].id, avatar: d.theme?.avatar || u.photoURL || "" });
        }
        // Fetch all communities user is in
        const cq = query(collection(db, "communities"), where("members", "array-contains", u.uid));
        const cSnap = await getDocs(cq);
        setJoinedCommunities(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    return () => unsub();
  }, []);

  // Real-time community listener
  useEffect(() => {
    if (!handle) return;
    const unsub = onSnapshot(doc(db, "communities", handle), async (commSnap) => {
      if (!commSnap.exists()) { setError(true); setLoading(false); return; }
      const cd = commSnap.data();
      setCommunity(cd);
      if (cd.members?.length > 0) {
        const uids = cd.members.slice(0, 30);
        const q = query(collection(db, "users"), where("owner_uid", "in", uids));
        const snap = await getDocs(q);
        const roster: any[] = snap.docs.map(d => ({ username: d.id, ...d.data() }));
        roster.sort((a, b) => {
          if (a.owner_uid === cd.owner_uid) return -1;
          if (b.owner_uid === cd.owner_uid) return 1;
          if ((cd.admins || []).includes(a.owner_uid)) return -1;
          if ((cd.admins || []).includes(b.owner_uid)) return 1;
          return 0;
        });
        setMembers(roster);
      }
      if (cd.banned?.length > 0) {
        const bq = query(collection(db, "users"), where("owner_uid", "in", cd.banned.slice(0, 30)));
        const bs = await getDocs(bq);
        setBannedProfiles(bs.docs.map(d => ({ username: d.id, ...d.data() })));
      } else setBannedProfiles([]);
      setLoading(false);
    });
    return () => unsub();
  }, [handle]);

  const isMember = currentUser && community?.members?.includes(currentUser.uid);
  const isOwner = currentUser && community?.owner_uid === currentUser.uid;
  const isAdmin = isOwner || (currentUser && (community?.admins || []).includes(currentUser.uid));
  const isBanned = currentUser && (community?.banned || []).includes(currentUser.uid);
  const isPrivate = community?.isPrivate;

  const handleToggleJoin = async () => {
    if (!currentUser) { router.push("/login"); return; }
    if (isBanned) { alert("You are banned from this community."); return; }
    if (!community) return;
    setIsProcessing(true);
    try {
      const ref = doc(db, "communities", handle);
      if (isMember) {
        if (isOwner) { alert("The Founder cannot leave."); setIsProcessing(false); return; }
        const nm = community.members.filter((m: string) => m !== currentUser.uid);
        await updateDoc(ref, { members: nm, memberCount: nm.length });
      } else {
        const nm = [...community.members, currentUser.uid];
        await updateDoc(ref, { members: nm, memberCount: nm.length });
      }
    } catch { alert("Failed to update membership."); }
    finally { setIsProcessing(false); }
  };

  const adminAction = async (action: string, data: any = {}) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const res = await fetch("/api/community/admin", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, communityHandle: handle, ...data }),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error || "Action failed");
  };

  const getRole = (uid: string) => {
    if (uid === community?.owner_uid) return "owner";
    if ((community?.admins || []).includes(uid)) return "admin";
    return "member";
  };

  // Start or open a DM conversation
  const startDM = async (targetUid: string, targetProfile: any) => {
    if (!currentUser) return;
    const uids = [currentUser.uid, targetUid].sort();
    const convId = uids.join("_");
    // Create DM doc if it doesn't exist
    const dmRef = doc(db, "dms", convId);
    const dmSnap = await getDoc(dmRef);
    if (!dmSnap.exists()) {
      await setDoc(dmRef, {
        participants: uids,
        lastMessage: "",
        lastTimestamp: Date.now(),
      });
    }
    router.push(`/dm/${convId}`);
  };

  if (loading) return <div className="min-h-screen bg-[#1a1a1e] flex items-center justify-center"><PulseLogo className="w-10 h-10 text-indigo-500 animate-pulse" /></div>;

  if (error || !community) return (
    <div className="min-h-screen bg-[#1a1a1e] flex flex-col items-center justify-center text-white p-4 text-center">
      <ShieldCheck className="w-14 h-14 text-zinc-700 mb-4" /><h1 className="text-2xl font-black mb-2">Community Not Found</h1>
      <Link href="/" className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition">Go Home</Link>
    </div>
  );

  if (isBanned) return (
    <div className="min-h-screen bg-[#1a1a1e] flex flex-col items-center justify-center text-white p-4 text-center">
      <Ban className="w-14 h-14 text-red-500/50 mb-4" /><h1 className="text-2xl font-black mb-2">You're Banned</h1>
      <p className="text-zinc-500 mb-6">You've been banned from <span className="text-white font-bold">{community.name}</span>.</p>
      <Link href="/" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition">Go Home</Link>
    </div>
  );

  if (isPrivate && !isMember && !isAdmin) return (
    <div className="min-h-screen bg-[#1a1a1e] flex flex-col items-center justify-center text-white p-4 text-center">
      <Lock className="w-14 h-14 text-zinc-600 mb-4" /><h1 className="text-2xl font-black mb-2">{community.name}</h1>
      <p className="text-zinc-500 text-sm mb-1">{community.description || "A private community on Pulse."}</p>
      <p className="text-zinc-600 text-xs mb-6 flex items-center gap-1"><Lock className="w-3 h-3" /> Private · {community.memberCount || 1} members</p>
      <button onClick={handleToggleJoin} disabled={isProcessing} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition disabled:opacity-50">
        {isProcessing ? "..." : "Request to Join"}
      </button>
    </div>
  );

  const owner = members.filter(m => m.owner_uid === community.owner_uid);
  const admins = members.filter(m => (community.admins || []).includes(m.owner_uid) && m.owner_uid !== community.owner_uid);
  const regulars = members.filter(m => m.owner_uid !== community.owner_uid && !(community.admins || []).includes(m.owner_uid));

  return (
    <div className="h-screen bg-[#1a1a1e] text-white font-sans flex overflow-hidden selection:bg-indigo-500/30">

      {/* ===== LEFT: Server Sidebar (Discord-style) ===== */}
      <div className="hidden md:flex flex-col items-center w-[72px] bg-[#111113] py-3 gap-2 shrink-0 border-r border-white/5 overflow-y-auto custom-scrollbar">
        {/* Home / DMs */}
        <Link href="/dashboard" className="w-12 h-12 rounded-2xl bg-[#1e1f22] hover:bg-indigo-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group mb-1" title="Dashboard">
          <PulseLogo className="w-6 h-6 text-zinc-400 group-hover:text-white transition" />
        </Link>
        <Link href="/dm" className="w-12 h-12 rounded-2xl bg-[#1e1f22] hover:bg-indigo-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group mb-1" title="Direct Messages">
          <Mail className="w-5 h-5 text-zinc-400 group-hover:text-white transition" />
        </Link>
        <div className="w-8 h-0.5 bg-white/10 rounded-full mb-1" />

        {/* Joined Communities */}
        {joinedCommunities.map(c => (
          <Link key={c.id} href={`/c/${c.handle || c.id}`}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 overflow-hidden group relative ${c.id === handle || c.handle === handle ? 'rounded-xl ring-2 ring-indigo-500' : 'hover:rounded-xl'}`}
            title={c.name}>
            {/* Active indicator */}
            {(c.id === handle || c.handle === handle) && <div className="absolute left-[-22px] w-1 h-8 bg-white rounded-r-full" />}
            {c.avatar ? (
              <AnimatedAvatar src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-xs font-black ${c.id === handle || c.handle === handle ? 'bg-indigo-600 text-white' : 'bg-[#2b2b30] text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white'} transition-all`}>
                {(c.name || "?").substring(0, 2).toUpperCase()}
              </div>
            )}
          </Link>
        ))}

        {/* Join by handle */}
        <button onClick={() => setShowJoinPopup(true)} className="w-12 h-12 rounded-2xl bg-[#1e1f22] hover:bg-green-600 hover:rounded-xl flex items-center justify-center transition-all duration-200 group mt-1" title="Join a Community">
          <Plus className="w-5 h-5 text-green-500 group-hover:text-white transition" />
        </button>
      </div>

      {/* Join Popup */}
      {showJoinPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowJoinPopup(false)} />
          <div className="relative bg-[#1e1f22] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-1">Join a Community</h2>
            <p className="text-xs text-zinc-500 mb-5">Enter the community handle to join</p>
            <form onSubmit={(e) => { e.preventDefault(); if (joinHandle.trim()) { router.push(`/c/${joinHandle.trim().toLowerCase()}`); setShowJoinPopup(false); setJoinHandle(""); }}} className="flex gap-2">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3 gap-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input type="text" value={joinHandle} onChange={e => setJoinHandle(e.target.value)} placeholder="community-handle" className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-600" autoFocus />
              </div>
              <button type="submit" disabled={!joinHandle.trim()} className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-500 transition disabled:opacity-30">Go</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MIDDLE: Channel Sidebar ===== */}
      <div className="hidden md:flex flex-col w-60 bg-[#141416] shrink-0 border-r border-white/5">
        {/* Community header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition cursor-default">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
            {community.avatar ? <img src={community.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-900/30"><Users className="w-4 h-4 text-indigo-400" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate flex items-center gap-1.5">{community.name} {isPrivate && <Lock className="w-3 h-3 text-zinc-500" />}</h2>
            <p className="text-[10px] text-zinc-500">{community.memberCount || 1} members</p>
          </div>
          {isAdmin && <button onClick={() => setShowSettings(true)} className="p-1 hover:bg-white/10 rounded-lg transition text-zinc-500 hover:text-white"><Settings className="w-4 h-4" /></button>}
        </div>

        {/* Channels list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Text Channels</p>
            {isAdmin && <button onClick={() => setShowCreateChannel(true)} className="p-0.5 hover:bg-white/10 rounded transition text-zinc-600 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>}
          </div>
          {(community.channels || [{ id: 'general', name: 'general' }]).map((ch: any) => (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition group mb-0.5 ${activeChannel === ch.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
              <Hash className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="truncate">{ch.name}</span>
              {isOwner && ch.id !== 'general' && (
                <Trash2 onClick={(e) => { e.stopPropagation(); adminAction('delete-channel', { channelId: ch.id }); if (activeChannel === ch.id) setActiveChannel('general'); }}
                  className="w-3 h-3 text-zinc-600 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition shrink-0" />
              )}
            </button>
          ))}
          {/* Create channel inline */}
          {showCreateChannel && (
            <form onSubmit={async (e) => { e.preventDefault(); if (!newChannelName.trim()) return; await adminAction('create-channel', { channelName: newChannelName.trim() }); setNewChannelName(''); setShowCreateChannel(false); }} className="mt-1 px-1">
              <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="channel-name" maxLength={30}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600" autoFocus
                onKeyDown={e => { if (e.key === 'Escape') { setShowCreateChannel(false); setNewChannelName(''); }}} />
            </form>
          )}
        </div>

        {/* User card at bottom */}
        {currentUser && userProfile && (
          <div className="p-3 border-t border-white/5 bg-[#111113]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                <img src={userProfile.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userProfile.displayName}</p>
                <p className="text-[10px] text-zinc-500 truncate">@{userProfile.username}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT: Main Content (Chat + Members) ===== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="h-12 px-4 border-b border-white/5 bg-[#1a1a1e] flex items-center gap-3 shrink-0">
          <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="md:hidden p-1 hover:bg-white/10 rounded-lg transition text-zinc-400"><Menu className="w-5 h-5" /></button>
          <Hash className="w-5 h-5 text-zinc-500" />
          <span className="font-bold text-white text-sm">{activeChannel}</span>
          <div className="hidden sm:block h-5 w-px bg-white/10 mx-1" />
          <span className="hidden sm:block text-xs text-zinc-500 truncate">{community.description || "Community chat"}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("Link copied!"))} className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white"><Share2 className="w-4 h-4" /></button>
            <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white"><Users className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chat + Members Row */}
        <div className="flex-1 flex min-h-0">
          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#1a1a1e]">
            <CommunityChat communityHandle={handle} channelId={activeChannel} currentUser={currentUser} isMember={!!isMember} isAdmin={!!isAdmin} userProfile={userProfile} />
          </div>

          {/* Members sidebar — desktop */}
          <aside className="hidden lg:block w-60 bg-[#141416] border-l border-white/5 overflow-y-auto custom-scrollbar py-4">
            {renderSection("Owner", <Crown className="w-3 h-3 text-yellow-500" />, owner)}
            {renderSection("Admins", <Shield className="w-3 h-3 text-indigo-400" />, admins)}
            {renderSection("Members", <Users className="w-3 h-3 text-zinc-500" />, regulars)}
          </aside>
        </div>

        {/* Mobile join bar */}
        {!isMember && (
          <div className="md:hidden p-3 border-t border-white/5 bg-[#111113]">
            <button onClick={handleToggleJoin} disabled={isProcessing} className="w-full py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-500 transition disabled:opacity-50">
              {isProcessing ? "Processing..." : "Join Community"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile sidebar drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileSidebar(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-[#141416] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Members</span>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
              {renderSection("Owner", <Crown className="w-3 h-3 text-yellow-500" />, owner)}
              {renderSection("Admins", <Shield className="w-3 h-3 text-indigo-400" />, admins)}
              {renderSection("Members", <Users className="w-3 h-3 text-zinc-500" />, regulars)}
            </div>
          </aside>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-[#1e1f22] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-400" /> Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            {isOwner && (
              <div className="mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-sm font-bold flex items-center gap-2">{isPrivate ? <Lock className="w-4 h-4 text-yellow-500" /> : <Eye className="w-4 h-4 text-green-500" />} Privacy</h3>
                    <p className="text-xs text-zinc-500 mt-1">{isPrivate ? "Members only" : "Public"}</p></div>
                  <button onClick={() => adminAction("toggle-private", { value: !isPrivate })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${isPrivate ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {isPrivate ? "Make Public" : "Make Private"}
                  </button>
                </div>
              </div>
            )}
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Banned ({bannedProfiles.length})</h3>
            {bannedProfiles.length === 0 ? <p className="text-xs text-zinc-600 py-3 text-center">None</p> : (
              <div className="space-y-2">{bannedProfiles.map(bp => (
                <div key={bp.username} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0"><img src={bp.theme?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{bp.displayName || bp.username}</p><p className="text-[10px] text-zinc-500">@{bp.username}</p></div>
                  <button onClick={() => adminAction("unban", { targetUid: bp.owner_uid })} className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/20 transition">Unban</button>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {/* Member action modal */}
      {actionTarget && currentUser && actionTarget.owner_uid !== currentUser.uid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActionTarget(null)} />
          <div className="relative bg-[#1e1f22] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0"><img src={actionTarget.theme?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-full h-full object-cover" /></div>
              <div><p className="font-bold">{actionTarget.displayName || actionTarget.username}</p><p className="text-xs text-zinc-500">@{actionTarget.username} · {getRole(actionTarget.owner_uid)}</p></div>
              <button onClick={() => setActionTarget(null)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg text-zinc-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {/* DM — available to all members */}
              <button onClick={async () => { await startDM(actionTarget.owner_uid, actionTarget); setActionTarget(null); }}
                className="w-full p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-sm font-bold text-indigo-400 flex items-center gap-3 border border-indigo-500/10">
                <Mail className="w-4 h-4" /> Message
              </button>
              {/* View Profile */}
              <button onClick={() => { router.push(`/${actionTarget.username}`); setActionTarget(null); }}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 flex items-center gap-3">
                <Users className="w-4 h-4" /> View Profile
              </button>
              {/* Admin actions */}
              {isAdmin && isOwner && getRole(actionTarget.owner_uid) !== "owner" && (
                getRole(actionTarget.owner_uid) === "admin"
                  ? <button onClick={async () => { await adminAction("demote", { targetUid: actionTarget.owner_uid }); setActionTarget(null); }} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 flex items-center gap-3"><ChevronDown className="w-4 h-4 text-yellow-500" /> Demote</button>
                  : <button onClick={async () => { await adminAction("promote", { targetUid: actionTarget.owner_uid }); setActionTarget(null); }} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 flex items-center gap-3"><ChevronUp className="w-4 h-4 text-indigo-400" /> Promote to Admin</button>
              )}
              {isAdmin && getRole(actionTarget.owner_uid) !== "owner" && (<>
                <button onClick={async () => { await adminAction("kick", { targetUid: actionTarget.owner_uid }); setActionTarget(null); }} className="w-full p-3 bg-white/5 hover:bg-orange-500/10 rounded-xl text-sm font-bold text-zinc-300 hover:text-orange-400 flex items-center gap-3"><UserMinus className="w-4 h-4" /> Kick</button>
                <button onClick={async () => { await adminAction("ban", { targetUid: actionTarget.owner_uid }); setActionTarget(null); }} className="w-full p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-sm font-bold text-red-400 flex items-center gap-3"><Ban className="w-4 h-4" /> Ban</button>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderSection(title: string, icon: React.ReactNode, list: any[]) {
    if (!list.length) return null;
    return (
      <div className="mb-4 px-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">{icon} {title} — {list.length}</p>
        {list.map(m => (
          <button key={m.username} onClick={() => currentUser && m.owner_uid !== currentUser?.uid ? setActionTarget(m) : router.push(`/${m.username}`)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 hover:bg-white/5 rounded-lg transition group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/5 group-hover:border-indigo-500/30 transition">
              <AnimatedAvatar src={m.theme?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[13px] font-medium text-zinc-400 group-hover:text-white transition truncate">{m.displayName || m.username}</span>
            {m.owner_uid === community.owner_uid && <Crown className="w-3 h-3 text-yellow-500 shrink-0 ml-auto" />}
            {(community.admins || []).includes(m.owner_uid) && m.owner_uid !== community.owner_uid && <Shield className="w-3 h-3 text-indigo-400 shrink-0 ml-auto" />}
          </button>
        ))}
      </div>
    );
  }
}