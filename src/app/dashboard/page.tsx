"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, updateEmail, updatePassword } from "firebase/auth";
import { getSteamLoginUrl, verifySteamLogin } from "../setup/actions"; 
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, ExternalLink, Settings, LogOut, Trash2, AlertTriangle, User, Shield, Link2, Palette } from "lucide-react";
import { validateHandle } from "@/lib/validation";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form States
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accentColor, setAccentColor] = useState("indigo");
  
  // Theme Engine
  const [selectedFont, setSelectedFont] = useState("inter");
  const [nameEffect, setNameEffect] = useState("solid");
  const [nameColor, setNameColor] = useState("white");
  const [primaryColor, setPrimaryColor] = useState("#1e1f22"); 

  // Auth Update State
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");

  // Socials State
  const [xbox, setXbox] = useState("");
  const [epic, setEpic] = useState("");
  const [discord, setDiscord] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [widgets, setWidgets] = useState([
    { id: "hero", label: "Recent Activity (Hero)", enabled: true },
    { id: "stats", label: "Stats Overview", enabled: true },
    { id: "socials", label: "Linked Accounts", enabled: true },
    { id: "library", label: "Game Library", enabled: true },
  ]);

  // Gradients & Colors
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

  // 1. Check Auth & Fetch Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        setUserData({ id: docSnap.id, ...data });
        
        setDisplayName(data.displayName || "");
        setNewUsername(data.username || "");
        setBannerUrl(data.theme?.banner || "");
        setBackgroundUrl(data.theme?.background || "");
        setAvatarUrl(data.theme?.avatar || "");
        setAccentColor(data.theme?.color || "indigo");
        setSelectedFont(data.theme?.font || "inter");
        setNameEffect(data.theme?.nameEffect || "solid");
        setNameColor(data.theme?.nameColor || "white");
        setPrimaryColor(data.theme?.primary || "#1e1f22");

        setXbox(data.gaming?.xbox || "");
        setEpic(data.gaming?.epic || "");
        setDiscord(data.socials?.discord || "");
        setTwitter(data.socials?.twitter || "");
        setInstagram(data.socials?.instagram || "");
        if (data.layout) setWidgets(data.layout);
        setLoading(false);
      } else {
        router.push("/signup");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Handle Steam Return
  useEffect(() => {
    const checkSteamReturn = async () => {
      if (searchParams.get('openid.mode') && userData) {
        const result = await verifySteamLogin(searchParams.toString());
        if (result.success && result.steamId) {
          const userRef = doc(db, "users", userData.id);
          await updateDoc(userRef, { steamId: result.steamId });
          setUserData((prev: any) => ({ ...prev, steamId: result.steamId }));
          router.replace('/dashboard');
        }
      }
    };
    if (userData) checkSteamReturn();
  }, [searchParams, userData, router]);

  // --- ACTIONS ---

  const handleSave = async () => {
    setSaving(true);
    const userRef = doc(db, "users", userData.id);
    await updateDoc(userRef, {
      displayName: displayName, 
      "theme.banner": bannerUrl,
      "theme.background": backgroundUrl,
      "theme.avatar": avatarUrl,
      "theme.color": accentColor,
      "theme.font": selectedFont,
      "theme.nameEffect": nameEffect,
      "theme.nameColor": nameColor,
      "theme.primary": primaryColor, 
      "gaming.xbox": xbox,
      "gaming.epic": epic,
      "socials.discord": discord, 
      "socials.twitter": twitter,
      "socials.instagram": instagram,
      "layout": widgets
    });
    setSaving(false);
    alert("Profile Updated!");
  };

  const handleUpdateAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (newEmail) {
        await updateEmail(user, newEmail);
        const userRef = doc(db, "users", userData.id);
        await updateDoc(userRef, { email: newEmail });
      }
      if (newPass) {
        await updatePassword(user, newPass);
      }
      alert("Account credentials updated!");
      setNewPass(""); 
    } catch (e: any) {
      alert("Error: " + e.message + " (Try logging out and back in first)");
    }
    setSaving(false);
  };

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername === userData.username) return;
    const confirm = window.confirm(`Change handle to @${newUsername}? This will change your profile URL.`);
    if (!confirm) return;

    // VALIDATE USERNAME before doing anything
    const validationError = validateHandle(newUsername.toLowerCase());
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);
    try {
      const newRef = doc(db, "users", newUsername.toLowerCase());
      const snap = await getDoc(newRef);
      if (snap.exists()) {
        alert("Username is already taken.");
        setSaving(false);
        return;
      }

      const newData = { ...userData, username: newUsername.toLowerCase(), id: newUsername.toLowerCase() };
      await setDoc(newRef, newData);
      await deleteDoc(doc(db, "users", userData.id));

      alert("Username changed! Reloading...");
      window.location.href = `/dashboard`;
    } catch (e) {
      console.error(e);
      alert("Failed to change username.");
      setSaving(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    setSaving(true);
    const userRef = doc(db, "users", userData.id);
    
    if (platform === 'steam') {
      await updateDoc(userRef, { steamId: "" });
      setUserData((prev: any) => ({ ...prev, steamId: "" }));
    }
    if (platform === 'discord') {
      await updateDoc(userRef, { "socials.discord": "", "socials.discord_verified": false });
      setUserData((prev: any) => ({ 
        ...prev, 
        socials: { ...prev.socials, discord: "", discord_verified: false } 
      }));
      setDiscord("");
    }
    
    setSaving(false);
  };

  const connectSteam = async () => {
    if (!userData) return;
    const url = await getSteamLoginUrl(userData.username, window.location.origin);
    window.location.href = url;
  };

  const connectDiscord = () => {
    if (!userData?.id) return;
    window.location.href = `/api/auth/discord?state=${userData.id}`;
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newWidgets.length) {
      [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
      setWidgets(newWidgets);
    }
  };

  const toggleWidget = (index: number) => {
    const newWidgets = [...widgets];
    newWidgets[index].enabled = !newWidgets[index].enabled;
    setWidgets(newWidgets);
  };

  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'pulse.gg');
  
  // FIX: Force path-based routing (pulse.gg/username) instead of subdomain (username.pulse.gg)
  // This ensures the link in the dashboard always points to the correct path
  const profileUrl = isDev 
    ? `http://localhost:3000/${userData?.username}`
    : `https://${rootDomain}/${userData?.username}`;

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Loading...</div>;

  // Background Style
  const dashBgStyle = backgroundUrl 
    ? { backgroundImage: `url(${backgroundUrl})` } 
    : bannerUrl 
      ? { backgroundImage: `url(${bannerUrl})` } 
      : {};

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans relative">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 blur-3xl scale-110" 
            style={dashBgStyle}
         ></div>
         <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/10 bg-[#121214]/80 p-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 backdrop-blur-md gap-4 sm:gap-0">
          <div className="font-bold text-xl flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
            Pulse Dashboard
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <a href={profileUrl} target="_blank" className="text-indigo-400 hover:text-white text-sm font-medium transition">
              View Page ↗
            </a>
            <button onClick={() => auth.signOut()} className="text-zinc-500 hover:text-white text-sm">Logout</button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto p-4 md:p-6">
          
          <div className="flex gap-4 mb-8 border-b border-zinc-800 overflow-x-auto">
            {['overview', 'layout', 'settings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`pb-3 font-bold text-sm whitespace-nowrap capitalize ${activeTab === tab ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-white"}`}
              >
                {tab === 'overview' ? 'Accounts & Socials' : tab === 'layout' ? 'Layout & Visuals' : 'Account Settings'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6 md:space-y-8">
                <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6">
                   <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Primary Account</h2>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                          <div className="w-12 h-12 bg-[#171a21] rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white">Steam</h3>
                          <p className={userData?.steamId ? "text-green-400 text-xs font-mono break-all" : "text-zinc-500 text-xs"}>{userData?.steamId || "Not connected"}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                          {userData?.steamId && (
                              <a href={`https://steamcommunity.com/profiles/${userData.steamId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition text-center flex items-center justify-center gap-2">
                                  <span>Visit</span><ExternalLink className="w-3 h-3" />
                              </a>
                          )}
                          <button onClick={connectSteam} className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold transition ${userData?.steamId ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-white text-black hover:bg-gray-200'}`}>
                          {userData?.steamId ? "Reconnect" : "Connect"}
                          </button>
                      </div>
                   </div>
                </section>

                <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Gaming Accounts</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#107C10] flex items-center justify-center text-white font-bold shrink-0">X</div>
                       <div className="flex-1">
                         <label className="text-xs font-bold text-zinc-500 block mb-1">Xbox Gamertag</label>
                         <input type="text" value={xbox} onChange={(e) => setXbox(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-[#107C10]" placeholder="e.g. MasterChief" />
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#313131] flex items-center justify-center text-white font-bold shrink-0">E</div>
                       <div className="flex-1">
                         <label className="text-xs font-bold text-zinc-500 block mb-1">Epic Games ID</label>
                         <input type="text" value={epic} onChange={(e) => setEpic(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-white" placeholder="e.g. Ninja" />
                       </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6 md:space-y-8">
                <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Social Links</h2>
                  <div className="space-y-4">
                    <div className="relative">
                       <label className="text-xs font-bold text-zinc-500 block mb-1">Discord</label>
                       {discord ? (
                         <div className="flex gap-2">
                           <input disabled type="text" value={discord} className="w-full bg-black/50 border border-green-500/50 rounded-lg p-2 text-green-400 text-sm outline-none" />
                           <button onClick={() => setDiscord("")} className="bg-zinc-800 p-2 rounded-lg text-xs hover:bg-red-900 text-white font-medium">Unlink</button>
                         </div>
                       ) : (
                         <button onClick={connectDiscord} className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white p-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2">Connect Discord</button>
                       )}
                    </div>
                    <div className="relative">
                       <label className="text-xs font-bold text-zinc-500 block mb-1">Twitter / X Handle</label>
                       <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-white" placeholder="@username" />
                    </div>
                    <div className="relative">
                       <label className="text-xs font-bold text-zinc-500 block mb-1">Instagram Handle</label>
                       <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-[#E1306C]" placeholder="@username" />
                    </div>
                  </div>
                </section>
                <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-900/20">
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6 h-fit">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Visuals</h2>
                <div className="space-y-6">
                  
                  {/* --- CARD THEME PICKER --- */}
                  <div className="bg-black/30 p-4 rounded-xl border border-zinc-700">
                    <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2"><Palette className="w-4 h-4"/> Card / Panel Color</label>
                    <p className="text-xs text-zinc-500 mb-3">Choose the background color for your widgets.</p>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent p-0"
                      />
                      <input 
                        type="text" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="flex-1 bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm font-mono uppercase"
                      />
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {['#1e1f22', '#000000', '#09090b', '#1a1a1a', '#ffffff', '#2a2d3d'].map(color => (
                         <button 
                           key={color} 
                           onClick={() => setPrimaryColor(color)}
                           className="w-8 h-8 rounded-full border border-white/20 hover:scale-110 transition shadow-lg"
                           style={{ backgroundColor: color }}
                           title={color}
                         />
                      ))}
                    </div>
                  </div>

                  {/* Other Inputs */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Custom Avatar</label>
                    <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Banner</label>
                    <input type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Wallpaper</label>
                    <input type="text" value={backgroundUrl} onChange={(e) => setBackgroundUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                  </div>

                  {/* PREVIEW CARD */}
                  <div className="h-32 w-full rounded-xl overflow-hidden relative border border-zinc-800 bg-black/50 flex items-center justify-center">
                    {/* Wallpaper Layer */}
                    {backgroundUrl ? (
                      <img src={backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Wallpaper Preview" />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-900 opacity-50"></div>
                    )}
                    
                    {/* Banner Layer */}
                    {bannerUrl && <img src={bannerUrl} className="h-20 w-[80%] object-cover z-10 rounded-lg shadow-xl" alt="Banner Preview" />}
                    
                    {/* Avatar Layer */}
                    {avatarUrl ? (
                      <img src={avatarUrl} className="absolute bottom-2 left-4 w-12 h-12 rounded-full border-2 border-white z-20 bg-zinc-800" alt="Avatar" />
                    ) : (
                        <div className="absolute bottom-2 left-4 w-12 h-12 rounded-full border-2 border-white z-20 bg-zinc-700 flex items-center justify-center text-[10px]">PFP</div>
                    )}
                  </div>

                  {/* Name Styler UI */}
                  <div className="bg-black/30 p-4 rounded-xl border border-zinc-700">
                    <label className="block text-sm font-bold text-white mb-4">Display Name Style</label>
                    <div className="mb-4">
                      <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Font</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['inter', 'space', 'press', 'cinzel'].map(f => (
                          <button key={f} onClick={() => setSelectedFont(f)} className={`p-2 rounded-lg border text-xs font-bold capitalize transition ${selectedFont === f ? 'bg-white text-black border-white' : 'bg-black/50 text-zinc-400 border-zinc-700'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Effect</label>
                      <div className="flex gap-2">
                        {['solid', 'gradient', 'neon'].map(effect => (
                          <button key={effect} onClick={() => setNameEffect(effect)} className={`flex-1 p-2 rounded-lg border text-xs font-bold capitalize transition ${nameEffect === effect ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/50 text-zinc-400 border-zinc-700'}`}>{effect}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Color / Gradient</label>
                      <div className="grid grid-cols-6 gap-2">
                        {nameEffect === 'gradient' ? gradients.map(g => <button key={g.name} onClick={() => setNameColor(g.class)} className={`w-full aspect-square rounded-lg bg-gradient-to-r ${g.class} ring-2 ring-offset-2 ring-offset-[#121214] ${nameColor === g.class ? 'ring-white' : 'ring-transparent'}`} />) : solidColors.map(c => <button key={c.name} onClick={() => setNameColor(c.value)} style={{ backgroundColor: c.value === 'white' ? 'white' : undefined }} className={`w-full aspect-square rounded-lg ring-2 ring-offset-2 ring-offset-[#121214] ${nameColor === c.value ? 'ring-white' : 'ring-transparent'} ${c.value !== 'white' ? `bg-${c.value}` : ''}`} />)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6 h-fit">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Widget Layout</h2>
                <div className="space-y-3">
                  {widgets.map((widget, index) => (
                    <div key={widget.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                      <div className="text-zinc-500 cursor-grab"><GripVertical className="w-5 h-5" /></div>
                      <span className="flex-1 font-medium text-sm text-zinc-300">{widget.label}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveWidget(index, 'up')} disabled={index === 0} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveWidget(index, 'down')} disabled={index === widgets.length - 1} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                      </div>
                      <div className="w-px h-6 bg-zinc-800 mx-2"></div>
                      <button onClick={() => toggleWidget(index)} className={`p-2 rounded ${widget.enabled ? 'text-green-400 bg-green-400/10' : 'text-zinc-600 bg-zinc-800'}`}>{widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                    </div>
                  ))}
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-900/20">{saving ? "Saving..." : "Save Layout"}</button>
              </section>
            </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400"><Settings className="w-5 h-5" /></div>
                  <div><h2 className="text-lg font-bold text-white">Profile Identity</h2><p className="text-sm text-zinc-500">Manage how you appear on Pulse.</p></div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="Your Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Username</label>
                    <div className="flex gap-2">
                      <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 font-mono" />
                      <button onClick={handleChangeUsername} disabled={saving || newUsername === userData.username} className="px-4 bg-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-700 disabled:opacity-50 transition">Change</button>
                    </div>
                    <p className="text-xs text-orange-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Changing this will change your profile URL.</p>
                  </div>
                  <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50">Save Profile Info</button>
                </div>
              </section>
              
              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Security</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Update Email</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="New Email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">New Password</label>
                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="••••••••" />
                  </div>
                  <button onClick={handleUpdateAccount} disabled={saving} className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition disabled:opacity-50">Update Credentials</button>
                </div>
              </section>

              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Manage Connections</h2>
                <div className="space-y-3">
                  {userData?.steamId && (
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#171a21] rounded flex items-center justify-center"><svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.979 0C5.352 0 .002 5.35.002 11.95c0 5.63 3.863 10.33 9.056 11.59-.115-.815-.04-1.637.28-2.392l.84-2.81c-.244-.765-.333-1.683-.153-2.61.547-2.66 3.102-4.32 5.714-3.715 2.613.604 4.234 3.25 3.687 5.91-.4 1.94-2.022 3.355-3.86 3.593l-.865 2.92c4.467-1.35 7.9-5.26 8.3-9.98.028-.27.042-.54.042-.814C23.956 5.35 18.605 0 11.98 0zm6.54 12.35c.78.18 1.265.98 1.085 1.776-.18.797-.97.94-1.75.76-.78-.18-1.264-.98-1.085-1.776.18-.798.97-.94 1.75-.76zm-5.46 3.7c-.035 1.54 1.06 2.87 2.53 3.11l.245-.82c-.815-.224-1.423-1.04-1.396-1.99.027-.95.7-1.706 1.543-1.83l.255-.86c-1.472.03-2.65 1.13-3.176 2.39zm-3.045 2.5c-.755.12-1.395-.385-1.43-1.127-.035-.742.53-1.413 1.285-1.532.755-.12 1.394.385 1.43 1.127.034.74-.53 1.41-1.285 1.53z"/></svg></div><span className="font-bold text-sm">Steam</span></div>
                      <button onClick={() => handleDisconnect('steam')} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/> Disconnect</button>
                    </div>
                  )}
                  {userData?.socials?.discord && (
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#5865F2] rounded flex items-center justify-center text-white"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></div><span className="font-bold text-sm">Discord</span></div>
                      <button onClick={() => handleDisconnect('discord')} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"><LogOut className="w-3 h-3"/> Disconnect</button>
                    </div>
                  )}
                  {!userData?.steamId && !userData?.socials?.discord && <p className="text-sm text-zinc-500 italic">No active connections.</p>}
                </div>
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
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}