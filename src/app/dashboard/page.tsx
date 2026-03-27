"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, updateEmail, updatePassword, signOut, deleteUser } from "firebase/auth";
import { getSteamLoginUrl, verifySteamLogin, verifyDiscordLogin } from "@/app/setup/actions"; 
import { Eye, EyeOff, GripVertical, ExternalLink, Settings, LogOut, Trash2, AlertTriangle, User, Shield, Link2, Palette, Swords, Youtube, Twitch, Maximize2, Minimize2, RotateCcw, Sparkles, MousePointer2, Coins, Plus, X, Cpu, Monitor, Keyboard, Mouse, Headphones, Trophy, Gamepad2, Clock, Music, Video, Users, Crown, LayoutTemplate, Layers, Activity } from "lucide-react";
import { validateHandle } from "@/lib/validation";
import AnalyticsGlobe from "@/components/AnalyticsGlobe";
import AnalyticsChart from "@/components/AnalyticsChart";
import PulseLogo from "@/components/PulseLogo";
import AvatarDecoration from "@/components/AvatarDecoration";
import LayoutBuilder, { LayoutItem } from "@/components/LayoutBuilder";

import { Filter } from 'bad-words';

const filter = new Filter();

const isProfane = (text: any) => {
  if (!text || typeof text !== 'string') return false;
  return filter.isProfane(text);
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");

  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  
  const [theme, setTheme] = useState({ 
    color: "indigo", mode: "dark", banner: "", background: "", avatar: "", avatarDecoration: "none",
    cursorTrail: "none", customCursor: "", customCursorHover: "", nameEffect: "solid",
    nameColor: "white", primary: "#1e1f22", font: "inter", cardOpacity: 0.8, cardBlur: 10, 
    layoutStyle: "bento", shader: "none", discordDecoration: ""
  });
  
  const [gear, setGear] = useState({ cpu: "", gpu: "", ram: "", mouse: "", keyboard: "", headset: "", monitor: "" });
  
  const [socials, setSocials] = useState({ 
    twitter: "", instagram: "", youtube: "", twitch: "", discord: "", 
    discordId: "", discord_avatar: "", discord_decoration: "", discord_verified: false 
  });
  
  const [gaming, setGaming] = useState({ xbox: "", epic: "", valorant: { name: "", tag: "", region: "na" } });
  const [customLinks, setCustomLinks] = useState<{label: string, url: string}[]>([]);
  const [clips, setClips] = useState<{title: string, url: string}[]>([]); 
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [primaryCommunity, setPrimaryCommunity] = useState("");
  const [lastfm, setLastfm] = useState("");

  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [commName, setCommName] = useState("");
  const [commHandle, setCommHandle] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [editingCommunity, setEditingCommunity] = useState<any>(null);
  const [editCommName, setEditCommName] = useState("");
  const [editCommDesc, setEditCommDesc] = useState("");
  const [editCommAvatar, setEditCommAvatar] = useState("");
  const [editCommBanner, setEditCommBanner] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const gradients = [
    { name: "Sunset", class: "from-orange-400 to-pink-600" },
    { name: "Ocean", class: "from-cyan-400 to-blue-600" },
    { name: "Poison", class: "from-lime-400 to-emerald-600" },
    { name: "Royal", class: "from-purple-400 to-indigo-600" },
    { name: "Fire", class: "from-yellow-400 to-red-600" },
    { name: "Steel", class: "from-gray-200 to-slate-500" },
  ];

  const solidColors = [
    { name: "White", value: "white", hex: "#ffffff" },
    { name: "Indigo", value: "indigo-500", hex: "#6366f1" },
    { name: "Pink", value: "pink-500", hex: "#ec4899" },
    { name: "Cyan", value: "cyan-400", hex: "#22d3ee" },
    { name: "Emerald", value: "emerald-400", hex: "#34d399" },
    { name: "Yellow", value: "yellow-400", hex: "#facc15" },
    { name: "Red", value: "red-500", hex: "#ef4444" },
  ];

  const cursorPresets = [
    { name: "Default", url: "", hoverUrl: "" },
    { name: "Among Us", url: "/cursors/amogus/Arrow.png", hoverUrl: "/cursors/amogus/Hand.png" },
    { name: "Banana", url: "/cursors/banana/Arrow.png", hoverUrl: "/cursors/banana/Hand.png" },
    { name: "Brainrot", url: "/cursors/brainrot/Arrow.png", hoverUrl: "/cursors/brainrot/Hand.png" },
    { name: "Bugcat", url: "/cursors/bugcat/Arrow.png", hoverUrl: "/cursors/bugcat/Hand.png" },
    { name: "Cat", url: "/cursors/cat/Arrow.png", hoverUrl: "/cursors/cat/Hand.png" },
    { name: "Catpaw", url: "/cursors/catpaw/Arrow.png", hoverUrl: "/cursors/catpaw/Hand.png" },
    { name: "Hello Kitty", url: "/cursors/hellokitty/Arrow.png", hoverUrl: "/cursors/hellokitty/Hand.png" },
    { name: "Minecraft", url: "/cursors/minecraft/Arrow.png", hoverUrl: "/cursors/minecraft/Hand.png" },
    { name: "Mochi", url: "/cursors/mochi/Arrow.png", hoverUrl: "/cursors/mochi/Hand.png" },
    { name: "Pokemon", url: "/cursors/pokemon/Arrow.png", hoverUrl: "/cursors/pokemon/Hand.png" },
    { name: "SpongeBob", url: "/cursors/spongebob/Arrow.png", hoverUrl: "/cursors/spongebob/Hand.png" },
    { name: "Sus Luffy", url: "/cursors/susluffy/Arrow.png", hoverUrl: "/cursors/susluffy/Hand.png" },
    { name: "Sus Pochi", url: "/cursors/suspochi/Arrow.png", hoverUrl: "/cursors/suspochi/Hand.png" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const openidMode = searchParams.get('openid.mode');
      const discordCode = searchParams.get('discord_code');

      if (openidMode || discordCode) {
        setLoading(true);
        if (openidMode) {
          const result = await verifySteamLogin(searchParams.toString());
          if (result.success && result.steamId) {
            const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              await updateDoc(doc(db, "users", querySnapshot.docs[0].id), { steamId: result.steamId });
            }
          }
        }
        
        if (discordCode) {
           const result = await verifyDiscordLogin(discordCode, window.location.origin);
           if (result.success && result.username) {
              const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                 await updateDoc(doc(db, "users", querySnapshot.docs[0].id), { 
                     "socials.discord": result.username,
                     "socials.discordId": result.discordId,
                     "socials.discord_avatar": result.avatarUrl,
                     "socials.discord_decoration": result.decorationUrl,
                     "socials.discord_verified": true 
                 });
              }
           }
        }
        router.replace('/dashboard');
        return;
      }

      const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const uid = querySnapshot.docs[0].id;
        setUser({ ...userData, id: uid });
        
        setDisplayName(userData.displayName || "");
        setNewUsername(userData.username || uid); 
        setBio(userData.bio || "");
        
        setTheme({ 
            color: userData.theme?.color || "indigo",
            mode: userData.theme?.mode || "dark",
            banner: userData.theme?.banner || "",
            background: userData.theme?.background || "",
            avatar: userData.theme?.avatar || "",
            avatarDecoration: userData.theme?.avatarDecoration || "none",
            cursorTrail: userData.theme?.cursorTrail || "none",
            customCursor: userData.theme?.customCursor || "",
            customCursorHover: userData.theme?.customCursorHover || "",
            nameEffect: userData.theme?.nameEffect || "solid",
            nameColor: userData.theme?.nameColor || "white",
            primary: userData.theme?.primary || "#1e1f22",
            font: userData.theme?.font || "inter",
            cardOpacity: userData.theme?.cardOpacity ?? 0.8,
            cardBlur: userData.theme?.cardBlur ?? 10,
            layoutStyle: userData.theme?.layoutStyle || "bento",
            shader: userData.theme?.shader || "none",
            discordDecoration: userData.theme?.discordDecoration || ""
        });

        setSocials({ 
            twitter: userData.socials?.twitter || "", 
            instagram: userData.socials?.instagram || "", 
            youtube: userData.socials?.youtube || "", 
            twitch: userData.socials?.twitch || "", 
            discord: userData.socials?.discord || "",
            discordId: userData.socials?.discordId || "",
            discord_avatar: userData.socials?.discord_avatar || "",
            discord_decoration: userData.socials?.discord_decoration || "",
            discord_verified: userData.socials?.discord_verified || false
        });
        
        setGaming({ ...userData.gaming || { valorant: { name: "", tag: "", region: "na" } } });
        setCustomLinks(userData.customLinks || []);
        setClips(userData.clips || []); 
        setPrimaryCommunity(userData.primaryCommunity || "");
        setLastfm(userData.lastfm || "");
        setGear(userData.gear || { cpu: "", gpu: "", ram: "", mouse: "", keyboard: "", headset: "", monitor: "" });
        setLayout(userData.layout || []); 

        try {
            const commQ = query(collection(db, "communities"), where("owner_uid", "==", currentUser.uid));
            const commSnap = await getDocs(commQ);
            setMyCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.warn("Could not fetch communities.", err);
            setMyCommunities([]);
        }

      } else {
        router.push("/setup");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  const handleSave = async () => {
    if (!user) return;

    const hasProfanity = 
      isProfane(displayName) || isProfane(bio) || Object.values(gear).some(isProfane) || Object.values(socials).some(isProfane) ||
      isProfane(gaming.xbox) || isProfane(gaming.epic) || isProfane(gaming.valorant?.name) || isProfane(gaming.valorant?.tag) ||
      isProfane(theme.customCursor) || isProfane(theme.customCursorHover) || 
      customLinks.some(link => isProfane(link.label)) || clips.some(clip => isProfane(clip.title));

    if (hasProfanity) {
      alert("⚠️ We detected inappropriate language in your profile settings. Please remove it before saving.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        displayName, bio, theme, socials, gaming, customLinks, clips, primaryCommunity, lastfm, layout, gear
      });
      
      try {
        await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: `/${user.id}` }) });
      } catch (cacheError) { console.error("Cache clear failed:", cacheError); }
      setTimeout(() => setSaving(false), 1000);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  // Dedicated Save Handler for the Grid Builder Component
  const handleSaveLayout = async (newLayout: LayoutItem[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { layout: newLayout });
      setLayout(newLayout); // Update local state so global save doesn't overwrite it
      
      try {
        await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: `/${user.id}` }) });
      } catch (cacheError) { console.error("Cache clear failed:", cacheError); }
    } catch (e) {
      console.error(e);
      alert("Failed to save layout.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCommunity = async () => {
    if (myCommunities.length >= 3) { alert("You can only create a maximum of 3 communities per account."); return; }
    if (!commName || !commHandle) return;
    if (isProfane(commName) || isProfane(commHandle) || isProfane(commDesc)) { alert("⚠️ We detected inappropriate language in your community details."); return; }
    setSaving(true);
    try {
        const cleanHandle = commHandle.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const docRef = doc(db, "communities", cleanHandle);
        const snap = await getDoc(docRef);
        if (snap.exists()) { alert("This community handle is already taken. Choose another one!"); setSaving(false); return; }
        await setDoc(docRef, {
            name: commName, handle: cleanHandle, description: commDesc, owner_uid: auth.currentUser?.uid,
            members: [auth.currentUser?.uid], created_at: serverTimestamp(), memberCount: 1,
            banner: "[https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop](https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop)", avatar: ""
        });
        alert("Community Launch Successful!");
        setIsCreatingCommunity(false);
        setCommName(""); setCommHandle(""); setCommDesc("");
        
        if (auth.currentUser) {
            try {
                const commQ = query(collection(db, "communities"), where("owner_uid", "==", auth.currentUser.uid));
                const commSnap = await getDocs(commQ);
                setMyCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.warn(err); }
        }
    } catch (e) { 
        console.error(e); 
        alert("Permission denied. Ensure your Firebase Rules are updated.");
    } finally { setSaving(false); }
  };

  const openEditModal = (comm: any) => {
     setEditingCommunity(comm);
     setEditCommName(comm.name || "");
     setEditCommDesc(comm.description || "");
     setEditCommAvatar(comm.avatar || "");
     setEditCommBanner(comm.banner || "[https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop](https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop)");
  };

  const handleUpdateCommunity = async () => {
     if (!editingCommunity) return;
     if (!editCommName) { alert("Community name cannot be empty."); return; }
     if (isProfane(editCommName) || isProfane(editCommDesc)) { alert("⚠️ We detected inappropriate language in your community details."); return; }
     setSaving(true);
     try {
         const commRef = doc(db, "communities", editingCommunity.handle);
         await updateDoc(commRef, { name: editCommName, description: editCommDesc, avatar: editCommAvatar, banner: editCommBanner });
         try {
           await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: `/c/${editingCommunity.handle}` }) });
         } catch (cacheError) { console.error("Cache clear failed:", cacheError); }
         alert("Community updated successfully!");
         setEditingCommunity(null);
         if (auth.currentUser) {
             const commQ = query(collection(db, "communities"), where("owner_uid", "==", auth.currentUser.uid));
             const commSnap = await getDocs(commQ);
             setMyCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })));
         }
     } catch (e) {
         console.error(e);
         alert("Failed to update community details.");
     } finally { setSaving(false); }
  };

  const handleDeleteCommunity = async (commHandle: string) => {
     if (!confirm(`Are you absolutely sure you want to delete the community /c/${commHandle}? This action cannot be undone.`)) return;
     setSaving(true);
     try {
         await deleteDoc(doc(db, "communities", commHandle));
         setMyCommunities(prev => prev.filter(c => c.handle !== commHandle));
         if (primaryCommunity === commHandle) {
             setPrimaryCommunity("");
             if (user?.id) { await updateDoc(doc(db, "users", user.id), { primaryCommunity: "" }); }
         }
         alert("Community permanently deleted.");
         setEditingCommunity(null); 
     } catch (e) {
         console.error(e);
         alert("Failed to delete community. Please check your connection.");
     } finally { setSaving(false); }
  };

  const handleSteamLink = async () => {
     if (user) {
        const url = await getSteamLoginUrl(user.id, window.location.origin);
        window.location.href = url;
     }
  };

  const connectDiscord = () => {
    if (!user?.id) return;
    window.location.href = `/api/auth/discord?state=${user.id}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    if (!user) return;
    setSaving(true);
    try {
        const userRef = doc(db, "users", user.id);
        if (platform === 'steam') {
            await updateDoc(userRef, { steamId: "" });
            setUser((prev: any) => ({ ...prev, steamId: "" }));
        }
        if (platform === 'discord') {
            await updateDoc(userRef, { 
              "socials.discord": "", 
              "socials.discordId": "", 
              "socials.discord_avatar": "", 
              "socials.discord_decoration": "", 
              "socials.discord_verified": false 
            });
            setSocials(prev => ({ 
              ...prev, 
              discord: "", 
              discordId: "", 
              discord_avatar: "", 
              discord_decoration: "", 
              discord_verified: false 
            }));
        }
    } catch (e) {
        console.error(e);
    } finally { setSaving(false); }
  };

  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const isOnCooldown = user?.lastUsernameChange && (Date.now() - user.lastUsernameChange < COOLDOWN_MS);
  const hoursLeft = isOnCooldown ? Math.ceil((COOLDOWN_MS - (Date.now() - user.lastUsernameChange)) / (1000 * 60 * 60)) : 0;

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername === user.username) return;
    if (isOnCooldown) {
      alert(`You can only change your username once every 12 hours. Please try again in ${hoursLeft} hours.`);
      return;
    }
    if (!confirm(`Change handle to @${newUsername}? This will change your profile URL and delete old ones.`)) return;
    const validationError = validateHandle(newUsername.toLowerCase());
    if (validationError) { alert(validationError); return; }
    if (isProfane(newUsername)) { alert("⚠️ This handle contains inappropriate language."); return; }

    setSaving(true);
    try {
      const newRef = doc(db, "users", newUsername.toLowerCase());
      const snap = await getDoc(newRef);
      if (snap.exists() && snap.data().owner_uid !== auth.currentUser?.uid) {
        alert("Username is already taken.");
        setSaving(false);
        return;
      }
      const userDataToSave = { ...user };
      userDataToSave.username = newUsername.toLowerCase();
      userDataToSave.lastUsernameChange = Date.now();
      delete userDataToSave.id; 

      await setDoc(newRef, userDataToSave);

      const q = query(collection(db, "users"), where("owner_uid", "==", auth.currentUser?.uid));
      const allMyDocs = await getDocs(q);

      const cleanupPromises = allMyDocs.docs
        .filter(docSnap => docSnap.id !== newUsername.toLowerCase()) 
        .map(docSnap => deleteDoc(doc(db, "users", docSnap.id)));

      await Promise.all(cleanupPromises);
      alert("Username changed! Reloading...");
      window.location.href = `/dashboard`;
    } catch (e: any) {
      console.error(e);
      alert("Failed to change username: " + e.message);
    } finally { setSaving(false); }
  };

  const handleUpdateAccount = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
        if (newEmail) {
            await updateEmail(auth.currentUser, newEmail);
            await updateDoc(doc(db, "users", user.id), { email: newEmail });
        }
        if (newPass) await updatePassword(auth.currentUser, newPass);
        alert("Credentials updated!");
        setNewEmail(""); setNewPass("");
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== user.id) return;
    if (!auth.currentUser) return;
    if (myCommunities.length > 0) {
        alert(`⚠️ Action Required: You currently own ${myCommunities.length} community(s).\n\nYou must delete them from the "Communities" tab before deleting your account to prevent abandoned data.`);
        setIsDeletingAccount(false);
        return;
    }
    setSaving(true);
    try {
      await deleteDoc(doc(db, "users", user.id));
      await deleteUser(auth.currentUser);
      alert("Account permanently deleted. We're sorry to see you go!");
      window.location.href = "/";
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        alert("For your security, please log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account: " + e.message);
      }
    } finally {
      setSaving(false);
      setIsDeletingAccount(false);
    }
  };

  // Base input style
  const inputStyle = "w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const cardStyle = "bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden";

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white"><Sparkles className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      {/* LIVE CURSOR PREVIEW FOR DASHBOARD (ULTRA-SAFE PNG SYNC) */}
      {(theme.customCursor || theme.customCursorHover) && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, *, .min-h-screen { cursor: url('${theme.customCursor}') 0 0, auto !important; }
          a, button, [role="button"], [class*="hover:"], .cursor-pointer, input, textarea { cursor: url('${theme.customCursorHover || theme.customCursor}') 0 0, pointer !important; }
        `}} />
      )}

      {/* Account Deletion Modal */}
      {isDeletingAccount && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-red-500/30 rounded-[32px] p-8 w-full max-w-md shadow-2xl shadow-red-500/10">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-3 text-red-500"><AlertTriangle className="w-6 h-6" /> Delete Account</h2>
                  <button onClick={() => setIsDeletingAccount(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               <div className="space-y-4">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    This action <strong className="text-white">cannot</strong> be undone. This will permanently delete your profile, unlink all connections, and remove your data from our servers.
                    <br/><br/>
                    <strong className="text-red-400">Note: You must delete all your owned communities before proceeding.</strong>
                  </p>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Type <span className="text-white select-none">{user?.id}</span> to confirm</label>
                    <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={inputStyle} placeholder={user?.id} />
                  </div>
                  <button onClick={handleDeleteAccount} disabled={saving || deleteConfirmText !== user?.id} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition shadow-lg shadow-red-500/20 disabled:opacity-50 mt-4">
                    {saving ? "Deleting..." : "Permanently Delete"}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Creation Modal */}
      {isCreatingCommunity && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Users className="w-6 h-6 text-indigo-500" /> Start Community</h2>
                  <button onClick={() => setIsCreatingCommunity(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Display Name</label>
                    <input type="text" value={commName} onChange={e => setCommName(e.target.value)} className={inputStyle} placeholder="e.g. SOUR GANG" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Community Handle (URL)</label>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <span className="text-zinc-500 text-sm">pulsegg.in/c/</span>
                      <input type="text" value={commHandle} onChange={e => setCommHandle(e.target.value.toLowerCase())} className="flex-1 bg-transparent py-2 outline-none text-sm text-white" placeholder="handle" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Short Description</label>
                    <textarea value={commDesc} onChange={e => setCommDesc(e.target.value)} rows={3} className={`${inputStyle} resize-none`} placeholder="What's this group about?" />
                  </div>
                  <button onClick={handleCreateCommunity} disabled={saving || !commName || !commHandle} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                    {saving ? "Creating..." : "Launch Community"}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Edit Community Modal */}
      {editingCommunity && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Settings className="w-6 h-6 text-indigo-500" /> Edit Community</h2>
                  <button onClick={() => setEditingCommunity(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               
               <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Display Name</label>
                    <input type="text" value={editCommName} onChange={e => setEditCommName(e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                    <textarea value={editCommDesc} onChange={e => setEditCommDesc(e.target.value)} rows={3} className={`${inputStyle} resize-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Avatar Image URL</label>
                    <input type="text" value={editCommAvatar} onChange={e => setEditCommAvatar(e.target.value)} className={inputStyle} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Banner Image URL</label>
                    <input type="text" value={editCommBanner} onChange={e => setEditCommBanner(e.target.value)} className={inputStyle} placeholder="https://..." />
                  </div>
               </div>

               <div className="flex flex-col gap-3 mt-6 shrink-0 border-t border-white/5 pt-6">
                   <button onClick={handleUpdateCommunity} disabled={saving || !editCommName} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                      {saving ? "Saving..." : "Save Changes"}
                   </button>
                   <button onClick={() => handleDeleteCommunity(editingCommunity.handle)} disabled={saving} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition border border-red-500/20 flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Community
                   </button>
               </div>
            </div>
         </div>
      )}

      {/* Top Bar - Frosted Glass */}
      <div className="sticky top-0 z-50 bg-[#0a0a0c]/60 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"><PulseLogo className="w-5 h-5 text-white" /></div>
            <span className="font-bold tracking-tight hidden md:block">Dashboard</span>
         </div>
         <div className="flex items-center gap-3">
            <a href={`/${user?.id}`} target="_blank" className="px-4 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
               <ExternalLink className="w-3 h-3" /> View Profile
            </a>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 transition disabled:opacity-50 shadow-lg shadow-white/10">
               {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => signOut(auth)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition text-zinc-500">
               <LogOut className="w-4 h-4" />
            </button>
         </div>
      </div>

      <div className="max-w-[1300px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Sidebar Nav - Frosted Premium Look */}
        <aside className="lg:col-span-3">
           <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-3xl p-3 sticky top-24 shadow-2xl">
              {[
                { id: 'analytics', icon: Activity, label: 'Analytics' },
                { id: 'identity', icon: User, label: 'Identity' },
                { id: 'gaming', icon: Gamepad2, label: 'Gaming & Socials' },
                { id: 'communities', icon: Users, label: 'Communities' },
                { id: 'gear', icon: Cpu, label: 'Hardware Setup' },
                { id: 'layout', icon: Palette, label: 'Layout & Theme' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all mb-1 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
           </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">

          {/* --- ANALYTICS TAB --- */}
          {activeTab === 'analytics' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className={cardStyle}>
                   <h2 className="text-xl font-bold text-white mb-2">Profile Analytics</h2>
                   <p className="text-zinc-400 text-sm mb-8">Track your audience and link engagement across the globe.</p>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Stats Column */}
                      <div className="flex flex-col gap-4">
                         <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                               <Eye className="w-5 h-5 text-indigo-400" />
                               <h3 className="text-sm font-bold text-zinc-400">Total Views</h3>
                            </div>
                            <p className="text-4xl font-black text-white">{Number(user?.views || 0).toLocaleString()}</p>
                            {user?.views > 0 && <p className="text-xs text-emerald-400 font-bold mt-2">+12% this week</p>}
                         </div>
                         <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                               <Users className="w-5 h-5 text-indigo-400" />
                               <h3 className="text-sm font-bold text-zinc-400">Unique Visitors</h3>
                            </div>
                            <p className="text-4xl font-black text-white">{Math.round(Number(user?.views || 0) * 0.65).toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 font-bold mt-2">Estimated reach</p>
                         </div>
                         <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                               <MousePointer2 className="w-5 h-5 text-indigo-400" />
                               <h3 className="text-sm font-bold text-zinc-400">Link Clicks</h3>
                            </div>
                            <p className="text-4xl font-black text-white">{Number(user?.views || 0) > 0 ? Math.floor(Number(user?.views) * 0.15) : 0}</p>
                            {Number(user?.views || 0) > 0 && (
                               <p className="text-xs text-emerald-400 font-bold mt-2">
                                 Top Link: {user?.steamId ? 'Steam' : user?.socials?.discord ? 'Discord' : 'Profile URL'}
                               </p>
                            )}
                         </div>
                      </div>

                      {/* Globe Column */}
                      <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[400px]">
                         <div className="absolute top-6 left-6 z-10">
                            <h3 className="text-sm font-bold text-zinc-400">Global Audience</h3>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Live Map</p>
                         </div>
                         <AnalyticsGlobe totalViews={Number(user?.views || 0)} />
                      </div>
                   </div>

                   {/* NEW AREA CHART */}
                   <div className="mt-8 bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner">
                      <div className="flex justify-between items-end mb-6">
                         <div>
                            <h3 className="text-sm font-bold text-zinc-400">Audience Growth</h3>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">30-Day Trend</p>
                         </div>
                      </div>
                      <AnalyticsChart totalViews={Number(user?.views || 0)} />
                   </div>
                </section>
             </div>
          )}

          {/* --- COMMUNITIES TAB --- */}
          {activeTab === 'communities' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                   <div className="relative z-10 flex-1">
                      <h2 className="text-2xl font-black mb-2 text-white">Build your group.</h2>
                      <p className="text-indigo-200/60 text-sm max-w-md">Create a shared space for your clan, friend group, or esports team. Display a roster of Pulse profiles on one page.</p>
                   </div>
                   <button 
                      onClick={() => setIsCreatingCommunity(true)} 
                      disabled={myCommunities.length >= 3}
                      className="relative z-10 px-8 py-4 bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black rounded-2xl hover:bg-indigo-50 transition flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95"
                   >
                      {myCommunities.length >= 3 ? "Limit Reached (3/3)" : <><Plus className="w-5 h-5" /> New Community</>}
                   </button>
                </section>

                {myCommunities.length > 0 && (
                   <section className={cardStyle}>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Represented Community</h3>
                      <p className="text-xs text-zinc-400 mb-4">Choose which community badge appears on your public profile.</p>
                      <select value={primaryCommunity} onChange={(e) => setPrimaryCommunity(e.target.value)} className={`${inputStyle} cursor-pointer`}>
                         <option value="">None (Hidden)</option>
                         {myCommunities.map(c => <option key={c.id} value={c.handle}>{c.name} (/c/{c.handle})</option>)}
                      </select>
                   </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {myCommunities.length === 0 ? (
                      <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                         <Users className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                         <p className="text-zinc-400 font-bold">You haven't founded any communities yet.</p>
                      </div>
                   ) : (
                      myCommunities.map(comm => (
                         <div key={comm.id} className={`${cardStyle} !p-6 group hover:border-indigo-500/30 transition-all hover:-translate-y-1`}>
                            <div className="flex items-start justify-between mb-4">
                               <div className="w-16 h-16 bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center text-zinc-500 shrink-0 border border-white/10 shadow-lg">
                                  {comm.avatar ? <img src={comm.avatar} className="w-full h-full object-cover" /> : <Users className="w-8 h-8" />}
                               </div>
                               <div className="flex gap-2">
                                  <a href={`/c/${comm.handle}`} target="_blank" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-white"><ExternalLink className="w-4 h-4" /></a>
                                  <button onClick={() => openEditModal(comm)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-white"><Settings className="w-4 h-4" /></button>
                               </div>
                            </div>
                            <h3 className="text-lg font-black flex items-center gap-2 truncate text-white">{comm.name} <Crown className="w-4 h-4 text-yellow-500 shrink-0 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" /></h3>
                            <p className="text-zinc-400 text-sm mt-1 mb-4 line-clamp-1">{comm.description || "A community on Pulse."}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div className="px-3 py-1.5 bg-black/40 rounded-lg text-xs font-bold text-zinc-300 border border-white/5 shadow-inner">{comm.memberCount || 1} Members</div>
                               <span className="text-xs font-mono text-indigo-400/80 bg-indigo-500/10 px-2 py-1 rounded-lg">/c/{comm.handle}</span>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          )}
          
          {/* --- IDENTITY TAB --- */}
          {activeTab === 'identity' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <section className={cardStyle}>
                  <h2 className="text-xl font-bold text-white mb-2">Profile Details</h2>
                  <p className="text-zinc-400 text-sm mb-8">How you appear to the world on your main profile.</p>
                  
                  <div className="grid gap-6">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputStyle} placeholder="Your Name" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Bio / About Me</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className={`${inputStyle} resize-none`} placeholder="Tell us about yourself..." />
                     </div>
                  </div>
                  
                  <div className="h-px bg-white/5 my-8"></div>

                  <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-white text-lg">Custom Links</h3>
                        <p className="text-xs text-zinc-500 mt-1">Add links to your portfolio, store, or other sites.</p>
                      </div>
                      <button onClick={() => setCustomLinks([...customLinks, {label: "", url: ""}])} className="text-xs font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-white transition flex items-center gap-2 border border-white/10"><Plus className="w-3 h-3" /> Add Link</button>
                  </div>
                  <div className="space-y-3">
                      {customLinks.length === 0 ? (
                         <div className="text-center py-6 bg-black/20 rounded-2xl border border-dashed border-white/10">
                            <p className="text-zinc-500 text-sm">No custom links added yet.</p>
                         </div>
                      ) : (
                        customLinks.map((link, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-black/20 p-2 rounded-2xl border border-white/5">
                                <input type="text" placeholder="Label (e.g. My Website)" value={link.label} onChange={(e) => {
                                    const newLinks = [...customLinks]; newLinks[idx].label = e.target.value; setCustomLinks(newLinks);
                                }} className="w-1/3 bg-black/40 border border-transparent rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 focus:bg-black/60 transition" />
                                <input type="text" placeholder="https://..." value={link.url} onChange={(e) => {
                                    const newLinks = [...customLinks]; newLinks[idx].url = e.target.value; setCustomLinks(newLinks);
                                }} className="flex-1 bg-black/40 border border-transparent rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 focus:bg-black/60 transition font-mono" />
                                <button onClick={() => {
                                    const newLinks = customLinks.filter((_, i) => i !== idx); setCustomLinks(newLinks);
                                }} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))
                      )}
                  </div>
               </section>
            </div>
          )}

          {/* --- GAMING TAB --- */}
          {activeTab === 'gaming' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* NEW FEATURED CLIPS SECTION */}
                <section className="bg-indigo-600/5 border border-indigo-500/20 backdrop-blur-md rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                   <div className="flex justify-between items-center mb-2 relative z-10">
                      <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                         <Video className="w-4 h-4" /> Featured Clips
                      </h2>
                      {clips.length < 3 && (
                         <button onClick={() => setClips([...clips, {title: "", url: ""}])} className="text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-indigo-500/20">
                            <Plus className="w-3 h-3" /> Add Clip
                         </button>
                      )}
                   </div>
                   <p className="text-zinc-400 text-sm mb-6 relative z-10">Paste a YouTube Short, standard YouTube video, Twitch Clip, or Medal.tv link. Maximum 3.</p>
                   
                   <div className="space-y-4 relative z-10">
                      {clips.length === 0 ? (
                         <div className="text-center py-8 bg-black/20 rounded-2xl border border-dashed border-white/10">
                            <p className="text-zinc-500 text-sm">No clips added yet. Show off your best moments!</p>
                         </div>
                      ) : (
                         clips.map((clip, idx) => (
                             <div key={idx} className="flex flex-col gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
                                <div className="flex justify-between items-center">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Clip {idx + 1}</label>
                                   <button onClick={() => {
                                       const newClips = clips.filter((_, i) => i !== idx); setClips(newClips);
                                   }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"><Trash2 className="w-3 h-3" /> Remove</button>
                                </div>
                                <input type="text" placeholder="Title (e.g., Crazy 1v5 Clutch)" value={clip.title} onChange={(e) => {
                                    const newClips = [...clips]; newClips[idx].title = e.target.value; setClips(newClips);
                                }} className={inputStyle} />
                                <input type="text" placeholder="URL (YouTube, Twitch Clip, Medal.tv)" value={clip.url} onChange={(e) => {
                                    const newClips = [...clips]; newClips[idx].url = e.target.value; setClips(newClips);
                                }} className={`${inputStyle} font-mono`} />
                             </div>
                         ))
                      )}
                   </div>
                </section>

                {/* Steam - Primary Account Style */}
                <section className={cardStyle}>
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Primary Integration</h2>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                         <div className="w-14 h-14 bg-[#171a21] rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/5">
                            <Gamepad2 className="w-7 h-7 text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg">Steam</h3>
                            <p className={user?.steamId ? "text-green-400 text-sm font-mono break-all" : "text-zinc-500 text-sm"}>{user?.steamId ? `Connected: ${user.steamId}` : "Not connected"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                         {user?.steamId && (
                            <a href={`https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition text-center flex items-center justify-center gap-2 border border-white/5">
                               <span>Visit Profile</span><ExternalLink className="w-3 h-3" />
                            </a>
                         )}
                         <button onClick={handleSteamLink} className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg ${user?.steamId ? 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5' : 'bg-white text-black hover:bg-zinc-200'}`}>
                            {user?.steamId ? "Reconnect" : "Connect Steam"}
                         </button>
                      </div>
                   </div>
                </section>

                {/* Gaming Accounts - Valorant/Xbox/Epic */}
                <section className={cardStyle}>
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Gaming Connections</h2>
                   <div className="space-y-4">
                      {/* Valorant */}
                      <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl mb-6 shadow-inner">
                         <div className="flex items-center gap-2 mb-4">
                            <Swords className="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="font-bold text-base text-red-400 tracking-wide">Valorant Stats</span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                               <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Riot Name</label>
                               <input type="text" value={gaming.valorant?.name} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, name: e.target.value}})} className={`${inputStyle} focus:border-red-500 focus:ring-red-500/20`} placeholder="e.g. TenZ" />
                            </div>
                            <div>
                               <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Tagline</label>
                               <input type="text" value={gaming.valorant?.tag} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, tag: e.target.value}})} className={`${inputStyle} focus:border-red-500 focus:ring-red-500/20`} placeholder="e.g. 001" />
                            </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Region</label>
                            <select value={gaming.valorant?.region} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, region: e.target.value}})} className={`${inputStyle} focus:border-red-500 focus:ring-red-500/20 cursor-pointer`}>
                               <option value="na">North America (NA)</option>
                               <option value="eu">Europe (EU)</option>
                               <option value="ap">Asia Pacific (AP)</option>
                               <option value="kr">Korea (KR)</option>
                            </select>
                         </div>
                      </div>

                      {/* Xbox & Epic */}
                      <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                         <div className="w-12 h-12 rounded-xl bg-[#107C10] flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-[#107C10]/20 text-xl">X</div>
                         <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Xbox Gamertag</label>
                            <input type="text" value={gaming.xbox} onChange={(e) => setGaming({...gaming, xbox: e.target.value})} className="w-full bg-transparent border-none p-0 text-white text-sm outline-none placeholder:text-zinc-600" placeholder="e.g. MasterChief" />
                         </div>
                      </div>
                      <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                         <div className="w-12 h-12 rounded-xl bg-[#313131] flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-black/50 text-xl">E</div>
                         <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Epic Games ID</label>
                            <input type="text" value={gaming.epic} onChange={(e) => setGaming({...gaming, epic: e.target.value})} className="w-full bg-transparent border-none p-0 text-white text-sm outline-none placeholder:text-zinc-600" placeholder="e.g. Ninja" />
                         </div>
                      </div>
                   </div>
                </section>

                {/* Socials & Discord */}
                <section className={cardStyle}>
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Social Integrations</h3>
                   <div className="space-y-6">
                      
                      {/* Last.fm Input */}
                      <div className="relative">
                         <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Live Music Status (Last.fm)</label>
                         <div className="flex-1 bg-black/40 border border-red-500/30 focus-within:border-red-500/80 rounded-xl p-3 text-red-500 text-sm flex items-center gap-3 transition focus-within:ring-2 focus-within:ring-red-500/20">
                            <Music className="w-5 h-5 shrink-0" />
                            <input
                              type="text"
                              value={lastfm}
                              onChange={(e) => setLastfm(e.target.value.trim())}
                              placeholder="Your Last.fm username..."
                              className="bg-transparent outline-none text-white w-full placeholder:text-zinc-600"
                            />
                         </div>
                         <p className="text-[10px] text-zinc-500 mt-2 ml-1">Connect your Spotify to Last.fm to show live music on your profile. Leave blank to disable.</p>
                      </div>

                      <div className="h-px bg-white/5"></div>

                      {/* Discord OAuth Button */}
                      <div className="relative">
                         <label className="text-xs font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Discord Status</label>
                         {socials.discord ? (
                            <div className="flex gap-3">
                               <div className="flex-1 bg-black/40 border border-indigo-500/50 rounded-xl p-4 text-indigo-400 text-sm flex items-center gap-3 shadow-inner">
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                                  Linked as <span className="font-bold text-white">{socials.discord}</span>
                               </div>
                               <button onClick={() => handleDisconnect('discord')} className="bg-red-500/10 hover:bg-red-500/20 px-6 rounded-xl text-sm text-red-500 font-bold transition border border-red-500/20">Unlink</button>
                            </div>
                         ) : (
                            <button onClick={connectDiscord} className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white p-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(88,101,242,0.3)]">
                               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                               Connect Discord Profile
                            </button>
                         )}
                      </div>

                      <div className="h-px bg-white/5"></div>

                      {/* Other Socials */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Twitter / X</label>
                            <input type="text" value={socials.twitter} onChange={(e) => setSocials({...socials, twitter: e.target.value})} className={inputStyle} placeholder="@username" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Instagram</label>
                            <input type="text" value={socials.instagram} onChange={(e) => setSocials({...socials, instagram: e.target.value})} className={`${inputStyle} focus:border-[#E1306C] focus:ring-[#E1306C]/20`} placeholder="@username" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-2 uppercase tracking-wider">YouTube</label>
                            <input type="text" value={socials.youtube} onChange={(e) => setSocials({...socials, youtube: e.target.value})} className={`${inputStyle} focus:border-red-600 focus:ring-red-600/20`} placeholder="Channel Link/Handle" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-2 uppercase tracking-wider">Twitch</label>
                            <input type="text" value={socials.twitch} onChange={(e) => setSocials({...socials, twitch: e.target.value})} className={`${inputStyle} focus:border-purple-500 focus:ring-purple-500/20`} placeholder="Username" />
                         </div>
                      </div>
                   </div>
                </section>
             </div>
          )}

          {/* --- GEAR TAB --- */}
          {activeTab === 'gear' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className={cardStyle}>
                   <h2 className="text-xl font-bold text-white mb-2">Hardware Setup</h2>
                   <p className="text-zinc-400 text-sm mb-8">Show off your specs. Any fields left blank will be hidden on your profile.</p>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> CPU
                         </label>
                         <input type="text" value={gear.cpu} onChange={e => setGear({...gear, cpu: e.target.value})} className={inputStyle} placeholder="e.g. Intel Core i9-14900K" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> GPU
                         </label>
                         <input type="text" value={gear.gpu} onChange={e => setGear({...gear, gpu: e.target.value})} className={inputStyle} placeholder="e.g. NVIDIA RTX 4090" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> RAM
                         </label>
                         <input type="text" value={gear.ram} onChange={e => setGear({...gear, ram: e.target.value})} className={inputStyle} placeholder="e.g. 64GB DDR5" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Monitor className="w-3 h-3" /> Monitor
                         </label>
                         <input type="text" value={gear.monitor} onChange={e => setGear({...gear, monitor: e.target.value})} className={inputStyle} placeholder="e.g. Alienware AW3423DW" />
                      </div>
                   </div>

                   <div className="h-px bg-white/5 my-8"></div>
                   
                   <h3 className="text-sm font-bold text-white mb-4">Peripherals</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Mouse className="w-3 h-3" /> Mouse
                         </label>
                         <input type="text" value={gear.mouse} onChange={e => setGear({...gear, mouse: e.target.value})} className={inputStyle} placeholder="e.g. Logitech G Pro X Superlight" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Keyboard className="w-3 h-3" /> Keyboard
                         </label>
                         <input type="text" value={gear.keyboard} onChange={e => setGear({...gear, keyboard: e.target.value})} className={inputStyle} placeholder="e.g. Wooting 60HE" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Headphones className="w-3 h-3" /> Headset
                         </label>
                         <input type="text" value={gear.headset} onChange={e => setGear({...gear, headset: e.target.value})} className={inputStyle} placeholder="e.g. Sennheiser HD 600" />
                      </div>
                   </div>
                </section>
             </div>
          )}

          {/* --- LAYOUT & THEME TAB --- */}
          {activeTab === 'layout' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className={cardStyle}>
                   <h2 className="text-xl font-bold text-white mb-8">Theme & Visuals</h2>
                   
                   {/* Profile Layout Selector */}
                   <div className="mb-10">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-indigo-400" /> Profile Layout Style</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                             onClick={() => setTheme({...theme, layoutStyle: 'bento'})} 
                             className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 ${theme.layoutStyle === 'bento' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/50'}`}
                          >
                              <div className="w-24 h-16 bg-white/5 rounded border border-white/10 grid grid-cols-3 gap-1 p-1.5 shadow-sm">
                                 <div className="col-span-2 bg-indigo-500/80 rounded-[2px]"></div>
                                 <div className="col-span-1 bg-white/20 rounded-[2px]"></div>
                                 <div className="col-span-1 bg-white/20 rounded-[2px]"></div>
                                 <div className="col-span-2 bg-white/20 rounded-[2px]"></div>
                              </div>
                              <div className="text-center">
                                 <span className="text-sm font-bold text-white block mb-1">Bento Grid (Default)</span>
                                 <span className="text-[10px] text-zinc-500 font-medium">Data-heavy profile with full widget support</span>
                              </div>
                          </button>
                          <button 
                             onClick={() => setTheme({...theme, layoutStyle: 'simple'})} 
                             className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 ${theme.layoutStyle === 'simple' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/50'}`}
                          >
                              <div className="w-24 h-16 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center gap-1.5 p-1.5 shadow-sm">
                                 <div className="w-6 h-6 bg-indigo-500/80 rounded-full"></div>
                                 <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                                 <div className="w-16 h-1.5 bg-white/20 rounded-full"></div>
                              </div>
                              <div className="text-center">
                                 <span className="text-sm font-bold text-white block mb-1">Simple Mode <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1 tracking-wider uppercase">New</span></span>
                                 <span className="text-[10px] text-zinc-500 font-medium">Sleek, centered, mobile-first link tree style</span>
                              </div>
                          </button>
                      </div>
                   </div>
                   
                   {/* Background Shaders */}
                   <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8 shadow-inner">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400" /> Background Shaders</h3>
                      <p className="text-xs text-zinc-500 mb-6">Add a premium animated background effect (Highly recommended for Simple Mode).</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {['none', 'aurora', 'cyber-grid', 'dots', 'noise', 'shader-animation', 'mesh-gradient', 'paper-shader', 'spooky-smoke', 'red-smoke', 'thermodynamic', 'liquid'].map(shader => (
                            <button 
                               key={shader} 
                               onClick={() => setTheme({...theme, shader})} 
                               className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${theme.shader === shader ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                            >
                               {shader.replace('-', ' ')}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="h-px bg-white/5 my-8"></div>

                   {/* Name Effects */}
                   <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8 shadow-inner">
                      <label className="block text-sm font-bold text-white mb-6">Display Name Styling</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-3 tracking-widest">Typography</label>
                            <div className="flex gap-2">
                               {['inter', 'space', 'press', 'cinzel'].map(f => (
                                  <button key={f} onClick={() => setTheme({...theme, font: f})} className={`flex-1 p-3 rounded-xl border text-xs font-bold capitalize transition-all ${theme.font === f ? 'bg-white text-black border-white shadow-md' : 'bg-black/50 text-zinc-400 border-white/10 hover:bg-white/5'}`}>{f}</button>
                               ))}
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-3 tracking-widest">Text Effect</label>
                            <div className="flex gap-2">
                               {['solid', 'gradient', 'neon'].map(effect => (
                                  <button key={effect} onClick={() => setTheme({...theme, nameEffect: effect})} className={`flex-1 p-3 rounded-xl border text-xs font-bold capitalize transition-all ${theme.nameEffect === effect ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-black/50 text-zinc-400 border-white/10 hover:bg-white/5'}`}>{effect}</button>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div>
                         <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-3 tracking-widest">Color Selection</label>
                         <div className="grid grid-cols-7 gap-3">
                            {theme.nameEffect === 'gradient' 
                               ? gradients.map(g => <button key={g.name} onClick={() => setTheme({...theme, nameColor: g.class})} className={`w-full aspect-square rounded-xl bg-gradient-to-tr ${g.class} ring-2 ring-offset-4 ring-offset-[#0a0a0c] transition-all hover:scale-110 ${theme.nameColor === g.class ? 'ring-white scale-110' : 'ring-transparent'}`} title={g.name} />) 
                               : solidColors.map(c => <button key={c.name} onClick={() => setTheme({...theme, nameColor: c.value})} style={{ backgroundColor: c.value === 'white' ? 'white' : undefined }} className={`w-full aspect-square rounded-xl ring-2 ring-offset-4 ring-offset-[#0a0a0c] transition-all hover:scale-110 ${theme.nameColor === c.value ? 'ring-white scale-110' : 'ring-transparent'} ${c.value !== 'white' ? `bg-${c.value}` : ''}`} title={c.name} />)
                            }
                         </div>
                      </div>
                   </div>

                   {/* Card Glassmorphism Controls */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                       <div className="col-span-full">
                           <h3 className="text-sm font-bold text-white mb-1">Card Aesthetics</h3>
                           <p className="text-xs text-zinc-500">Fine-tune the glassmorphism effect on your profile widgets.</p>
                       </div>
                       <div>
                          <label className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                             <span>Background Opacity</span>
                             <span className="text-indigo-400">{Math.round(theme.cardOpacity * 100)}%</span>
                          </label>
                          <input type="range" min="0" max="1" step="0.05" value={theme.cardOpacity} onChange={e => setTheme({...theme, cardOpacity: parseFloat(e.target.value)})} className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                       </div>
                       <div>
                          <label className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                             <span>Backdrop Blur</span>
                             <span className="text-indigo-400">{theme.cardBlur}px</span>
                          </label>
                          <input type="range" min="0" max="40" step="1" value={theme.cardBlur} onChange={e => setTheme({...theme, cardBlur: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Primary Accent Color</label>
                          <div className="flex gap-3">
                             <input type="color" value={theme.primary} onChange={(e) => setTheme({...theme, primary: e.target.value})} className="w-12 h-12 rounded-xl bg-transparent border border-white/10 cursor-pointer p-1" />
                             <input type="text" value={theme.primary} onChange={(e) => setTheme({...theme, primary: e.target.value})} className={`${inputStyle} font-mono`} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Background Image</label>
                          <input type="text" value={theme.background} onChange={e => setTheme({...theme, background: e.target.value})} className={inputStyle} placeholder="Image URL (Unsplash/Imgur)" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Profile Banner</label>
                          <input type="text" value={theme.banner} onChange={e => setTheme({...theme, banner: e.target.value})} className={inputStyle} placeholder="Image URL" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Custom Avatar</label>
                          <input type="text" value={theme.avatar} onChange={e => setTheme({...theme, avatar: e.target.value})} className={inputStyle} placeholder="Image URL" />
                          {socials.discord_avatar && (
                             <button 
                                onClick={() => setTheme({...theme, avatar: socials.discord_avatar})}
                                className="mt-3 w-full py-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] text-[10px] font-bold uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                             >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                               Sync Discord Avatar & Frame
                             </button>
                          )}
                      </div>
                   </div>

                   <div className="h-px bg-white/5 my-8"></div>

                   {/* Cosmetics */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       
                       {/* LIVE AVATAR PREVIEW ADDED HERE */}
                       <div className="col-span-full flex flex-col items-center justify-center bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner mb-4">
                           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Live Avatar Preview</h3>
                           <div className="relative w-32 h-32 shrink-0">
                             <AvatarDecoration type={theme.avatarDecoration}>
                               <div className="w-32 h-32 rounded-full p-1 bg-[#1e1f22] relative z-10">
                                  <div className="relative w-full h-full rounded-full z-10">
                                     <img src={theme.avatar || "[https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png](https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png)"} alt="Avatar" className="w-full h-full rounded-full object-cover bg-zinc-900" />
                                     {theme.discordDecoration && (
                                        <img src={theme.discordDecoration} alt="Decoration" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] max-w-none z-30 pointer-events-none object-contain" />
                                     )}
                                  </div>
                               </div>
                             </AvatarDecoration>
                           </div>
                       </div>

                       <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Avatar Decoration Frame</label>
                          <select value={theme.avatarDecoration} onChange={e => setTheme({...theme, avatarDecoration: e.target.value, discordDecoration: ""})} className={`${inputStyle} cursor-pointer`}>
                             <optgroup label="Standard">
                               <option value="none">None</option>
                               <option value="gold">Golden Ring</option>
                               <option value="neon">Neon Pulse</option>
                               <option value="glitch">Glitch CSS</option>
                               <option value="fire">Fire CSS</option>
                             </optgroup>
                             <optgroup label="God Tier (Animated)">
                               <option value="fire_god">Realistic Fire 🔥</option>
                               <option value="electric_god">Lightning Storm ⚡</option>
                               <option value="crown_god">King's Crown 👑</option>
                               <option value="cat_god">Cat Companion 🐱</option>
                               <option value="cherry_god">Cherry Blossoms 🌸</option>
                             </optgroup>
                          </select>

                          {/* NEW: Discord Nitro Integration Box */}
                          <div className="mt-4 p-4 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl">
                             <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-[#5865F2] fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                                <h4 className="font-bold text-[#5865F2] text-xs">Nitro Frame Sync</h4>
                             </div>
                             <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                                We can pull your active Avatar Decoration from Discord. Equip it on Discord first, then click Sync.
                             </p>
                             <div className="flex flex-col gap-2">
                                <button onClick={connectDiscord} className="w-full py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition">
                                   1. Fetch Latest from Discord
                                </button>
                                {socials.discord_decoration && (
                                   <button 
                                      onClick={() => setTheme({...theme, discordDecoration: socials.discord_decoration, avatarDecoration: 'none'})}
                                      className="w-full py-2 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition"
                                   >
                                      2. Apply Nitro Frame
                                   </button>
                                )}
                                {theme.discordDecoration && (
                                   <button 
                                      onClick={() => setTheme({...theme, discordDecoration: ""})}
                                      className="w-full py-2 mt-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg transition"
                                   >
                                      Remove Frame
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Cursor Trail Effects</label>
                          <select value={theme.cursorTrail} onChange={e => setTheme({...theme, cursorTrail: e.target.value})} className={`${inputStyle} cursor-pointer`}>
                             <option value="none">Default (None)</option>
                             <option value="ghost">Ghost Trail</option>
                             <option value="sparkle">Sparkles</option>
                             <option value="pulse">Pulse Rings</option>
                             <option value="coins">Falling Coins</option>
                             <option value="oneko">Cat Follow (Oneko)</option>
                          </select>
                       </div>
                   </div>

                   {/* DYNAMIC CUSTOM CURSORS */}
                   <div className="bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointer2 className="w-5 h-5 text-indigo-400" />
                        <label className="block text-sm font-bold text-white">Custom Mouse Cursors</label>
                      </div>
                      <p className="text-xs text-zinc-500 mb-6">Click a preset below or paste direct links to your own image files.</p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                         {cursorPresets.map(preset => (
                            <button
                               key={preset.name}
                               onClick={() => setTheme({ ...theme, customCursor: preset.url, customCursorHover: preset.hoverUrl || preset.url })}
                               className={`group p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${theme.customCursor === preset.url ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-[#0a0a0c] hover:border-white/20'}`}
                            >
                               {preset.url ? (
                                  <div className="relative w-8 h-8">
                                     <img src={preset.url.replace('.png', '.cur')} alt={`${preset.name} Idle`} className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200 group-hover:opacity-0" />
                                     <img src={(preset.hoverUrl || preset.url).replace('.png', '.cur')} alt={`${preset.name} Hover`} className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
                                  </div>
                               ) : (
                                  <MousePointer2 className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-200" />
                               )}
                               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{preset.name}</span>
                            </button>
                         ))}
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
                         <div className="flex-1">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Idle Cursor URL (.png)</label>
                            <input
                               type="text"
                               value={theme.customCursor}
                               onChange={e => setTheme({ ...theme, customCursor: e.target.value })}
                               placeholder="[https://example.com/idle.png](https://example.com/idle.png)"
                               className={`${inputStyle} font-mono text-xs`}
                            />
                         </div>
                         <div className="flex-1">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Hover / Link Cursor URL (.png)</label>
                            <input
                               type="text"
                               value={theme.customCursorHover}
                               onChange={e => setTheme({ ...theme, customCursorHover: e.target.value })}
                               placeholder="[https://example.com/hover.png](https://example.com/hover.png)"
                               className={`${inputStyle} font-mono text-xs`}
                            />
                         </div>
                      </div>
                   </div>

                </section>

                {/* --- DRAG AND DROP LAYOUT BUILDER --- */}
                <section className={cardStyle}>
                  <LayoutBuilder 
                    initialLayout={layout} 
                    onSave={handleSaveLayout} 
                    isSaving={saving} 
                  />
                </section>

             </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className={cardStyle}>
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Username / Handle</label>
                    <div className="flex gap-3">
                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} className={`${inputStyle} font-mono`} />
                        <button onClick={handleChangeUsername} disabled={saving || newUsername === user.username || isOnCooldown} className="px-6 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition shadow-lg shrink-0">Change</button>
                    </div>
                    {isOnCooldown ? (
                       <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Username change is locked. Please try again in {hoursLeft} hours.</p>
                    ) : (
                       <p className="text-xs text-orange-400 mt-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Changing this will permanently alter your public profile URL.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className={cardStyle}>
                <h2 className="text-xl font-bold text-white mb-6">Security</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Update Account Email</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputStyle} placeholder="New Email Address" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">New Password</label>
                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={inputStyle} placeholder="••••••••" />
                  </div>
                  <button onClick={handleUpdateAccount} disabled={saving} className="w-full py-4 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold rounded-xl hover:bg-indigo-600/30 hover:text-indigo-300 transition disabled:opacity-50">Save Security Changes</button>
                </div>
              </section>

              {/* DANGER ZONE - Account Deletion */}
              <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-inner">
                <h2 className="text-xl font-black text-red-500 mb-2">Danger Zone</h2>
                <p className="text-zinc-400 text-sm mb-6">Once you delete your account, there is no going back. All connections, themes, and data will be permanently erased.</p>
                <button 
                  onClick={() => setIsDeletingAccount(true)} 
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  Delete Account Permanently
                </button>
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white"><Sparkles className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}