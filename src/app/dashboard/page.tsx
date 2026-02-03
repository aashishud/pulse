"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getSteamLoginUrl, verifySteamLogin } from "../setup/actions"; 
import { ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, ExternalLink } from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form States
  const [bannerUrl, setBannerUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accentColor, setAccentColor] = useState("indigo");
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
        
        setBannerUrl(data.theme?.banner || "");
        setBackgroundUrl(data.theme?.background || "");
        setAvatarUrl(data.theme?.avatar || "");
        setAccentColor(data.theme?.color || "indigo");
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

  const handleSave = async () => {
    setSaving(true);
    const userRef = doc(db, "users", userData.id);
    await updateDoc(userRef, {
      "theme.banner": bannerUrl,
      "theme.background": backgroundUrl,
      "theme.avatar": avatarUrl,
      "theme.color": accentColor,
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

  // Dynamic URL
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'pulse.gg');
  const isVercel = rootDomain.includes('vercel.app');
  const profileUrl = isDev 
    ? `http://${userData?.username}.localhost:3000` 
    : isVercel 
      ? `https://${rootDomain}/${userData?.username}`
      : `https://${userData?.username}.${rootDomain}`;

  if (loading) return <div className="min-h-screen bg-black text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <nav className="border-b border-white/10 bg-[#121214] p-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-80 gap-4 sm:gap-0">
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
          <button 
            onClick={() => setActiveTab("overview")} 
            className={`pb-3 font-bold text-sm whitespace-nowrap ${activeTab === "overview" ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-white"}`}
          >
            Accounts & Socials
          </button>
          <button 
            onClick={() => setActiveTab("layout")} 
            className={`pb-3 font-bold text-sm whitespace-nowrap ${activeTab === "layout" ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-white"}`}
          >
            Layout & Appearance
          </button>
        </div>

        {activeTab === "overview" ? (
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
                        <p className={userData?.steamId ? "text-green-400 text-xs font-mono break-all" : "text-zinc-500 text-xs"}>
                            {userData?.steamId || "Not connected"}
                        </p>
                        </div>
                    </div>
                    
                    {/* BUTTON GROUP */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {userData?.steamId && (
                            <a 
                                href={`https://steamcommunity.com/profiles/${userData.steamId}`}
                                target="_blank"
                                rel="noopener noreferrer" 
                                className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition text-center flex items-center justify-center gap-2"
                            >
                                <span>Visit Profile</span>
                                <ExternalLink className="w-3 h-3" />
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6 h-fit">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Visuals</h2>
              <div className="space-y-6">
                
                {/* 1. Profile Picture */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Custom Profile Picture URL</label>
                  <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                  <p className="text-xs text-zinc-500 mt-2">Leave empty to use Steam avatar.</p>
                </div>

                {/* 2. Banner */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Banner Image URL</label>
                  <input type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                </div>

                {/* 3. Background Wallpaper */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Background Wallpaper URL</label>
                  <input type="text" value={backgroundUrl} onChange={(e) => setBackgroundUrl(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500" placeholder="https://..." />
                  <p className="text-xs text-zinc-500 mt-2">Leave empty to use a blurred version of your banner.</p>
                </div>

                {/* Previews */}
                <div className="h-32 w-full rounded-xl overflow-hidden relative border border-zinc-800 bg-black/50 flex items-center justify-center">
                  {backgroundUrl ? (
                    <img src={backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-900 opacity-50"></div>
                  )}
                  {bannerUrl && <img src={bannerUrl} className="h-20 w-full object-cover z-10 rounded-lg max-w-[80%]" />}
                  {avatarUrl && <img src={avatarUrl} className="absolute bottom-2 left-4 w-12 h-12 rounded-full border-2 border-white z-20" />}
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Accent Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {['indigo', 'pink', 'emerald', 'orange', 'cyan', 'red'].map(c => (
                      <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-full bg-${c}-500 ring-2 ring-offset-2 ring-offset-[#121214] ${accentColor === c ? 'ring-white' : 'ring-transparent'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6 h-fit">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Widget Layout</h2>
              <p className="text-xs text-zinc-500 mb-4">Toggle visibility or change order.</p>
              
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
                    <button onClick={() => toggleWidget(index)} className={`p-2 rounded ${widget.enabled ? 'text-green-400 bg-green-400/10' : 'text-zinc-600 bg-zinc-800'}`}>
                      {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-900/20">
                {saving ? "Saving Changes..." : "Save Layout"}
              </button>
            </section>
          </div>
        )}
      </main>
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