"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, updateEmail, updatePassword, signOut } from "firebase/auth";
import { getSteamLoginUrl, verifySteamLogin, verifyDiscordLogin, getSpotifyTokens } from "@/app/setup/actions"; 
import { Eye, EyeOff, GripVertical, ExternalLink, Settings, LogOut, Trash2, AlertTriangle, User, Shield, Link2, Palette, Swords, Youtube, Twitch, Maximize2, Minimize2, RotateCcw, Sparkles, MousePointer2, Coins, Plus, X, Cpu, Monitor, Keyboard, Mouse, Headphones, Trophy, Gamepad2, Clock, Music, Video, Users, Crown, AlertCircle } from "lucide-react";
import { validateHandle } from "@/lib/validation";

import { Filter } from 'bad-words';

const filter = new Filter();

const isProfane = (text: any) => {
  if (!text || typeof text !== 'string') return false;
  return filter.isProfane(text);
};

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Widget Item Component ---
function SortableWidget({ widget, onToggleVisibility, onToggleSize }: { widget: any, onToggleVisibility: () => void, onToggleSize: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'hero': return <User className="w-4 h-4" />;
      case 'content': return <Link2 className="w-4 h-4" />;
      case 'spotify': return <Music className="w-4 h-4" />;
      case 'valorant': return <Swords className="w-4 h-4" />;
      case 'library': return <Gamepad2 className="w-4 h-4" />;
      case 'gear': return <Cpu className="w-4 h-4" />;
      default: return <GripVertical className="w-4 h-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-[#18181b] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="p-2 hover:bg-white/5 rounded-lg cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white transition">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="p-2 bg-white/5 rounded-lg text-zinc-400">
           {getIcon(widget.id)}
        </div>
        <div>
          <p className="font-bold text-sm capitalize text-white">{widget.id === 'gear' ? 'Hardware Setup' : widget.label || widget.id}</p>
          <p className="text-xs text-zinc-500">{widget.size === 'full' ? 'Full Width' : 'Half Width'}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button onClick={onToggleSize} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition" title="Toggle Size">
          {widget.size === 'full' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button 
          onClick={onToggleVisibility} 
          className={`p-2 rounded-lg transition ${widget.enabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
          title="Toggle Visibility"
        >
          {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("layout");

  // Auth Error state
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Form States
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  
  // Theme State
  const [theme, setTheme] = useState({ 
    color: "indigo", 
    mode: "dark", 
    banner: "", 
    background: "",
    avatar: "",
    avatarDecoration: "none",
    cursorTrail: "none",
    nameEffect: "solid",
    nameColor: "white",
    primary: "#1e1f22",
    font: "inter"
  });
  
  // Gear State
  const [gear, setGear] = useState({
    cpu: "", gpu: "", ram: "", mouse: "", keyboard: "", headset: "", monitor: ""
  });

  // Socials State
  const [socials, setSocials] = useState({ 
    twitter: "", instagram: "", youtube: "", twitch: "", discord: "", discord_verified: false 
  });
  
  // Gaming State
  const [gaming, setGaming] = useState({ 
    xbox: "", 
    epic: "", 
    valorant: { name: "", tag: "", region: "na" } 
  });
  
  const [customLinks, setCustomLinks] = useState<{label: string, url: string}[]>([]);
  const [clips, setClips] = useState<{title: string, url: string}[]>([]); 
  const [layout, setLayout] = useState<any[]>([]);
  const [primaryCommunity, setPrimaryCommunity] = useState("");

  // --- COMMUNITY STATES ---
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  
  // Creation
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [commName, setCommName] = useState("");
  const [commHandle, setCommHandle] = useState("");
  const [commDesc, setCommDesc] = useState("");

  // Editing
  const [editingCommunity, setEditingCommunity] = useState<any>(null);
  const [editCommName, setEditCommName] = useState("");
  const [editCommDesc, setEditCommDesc] = useState("");
  const [editCommAvatar, setEditCommAvatar] = useState("");
  const [editCommBanner, setEditCommBanner] = useState("");

  // Security
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      // 1. Steam Callback Check
      const openidMode = searchParams.get('openid.mode');
      if (openidMode) {
        const result = await verifySteamLogin(searchParams.toString());
        if (result.success && result.steamId) {
           const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
           const querySnapshot = await getDocs(q);
           if (!querySnapshot.empty) {
             const userDoc = querySnapshot.docs[0];
             await updateDoc(doc(db, "users", userDoc.id), { steamId: result.steamId });
             router.replace('/dashboard');
           }
        }
      }

      // 2. Discord Callback Check
      const discordCode = searchParams.get('discord_code');
      if (discordCode) {
         const result = await verifyDiscordLogin(discordCode, window.location.origin);
         if (result.success && result.username) {
            const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
               const userDoc = querySnapshot.docs[0];
               await updateDoc(doc(db, "users", userDoc.id), { 
                   "socials.discord": result.username,
                   "socials.discord_verified": true 
               });
               router.replace('/dashboard');
            }
         }
      }

      // 3. Spotify Callback Check
      const spotifyCode = searchParams.get('spotify_code');
      if (spotifyCode) {
         const redirectUri = `${window.location.origin}/api/auth/spotify/callback`;
         const result = await getSpotifyTokens(spotifyCode, redirectUri);
         
         if (result.success && result.tokens && result.profile) {
            const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
               const userDoc = querySnapshot.docs[0];
               await updateDoc(doc(db, "users", userDoc.id), { 
                   spotify: {
                       connected: true,
                       display_name: result.profile.display_name,
                       id: result.profile.id,
                       url: result.profile.url,
                       access_token: result.tokens.accessToken,
                       refresh_token: result.tokens.refreshToken,
                       expires_at: result.tokens.expiresAt
                   }
               });
               router.replace('/dashboard'); 
            }
         } else {
            console.error("Spotify Connection Error:", result.error);
            setConnectionError("Spotify connection failed. Ensure you are whitelisted in the Spotify developer dashboard.");
            router.replace('/dashboard'); // Clear the URL param so it doesn't get stuck in a loop
         }
      }

      // Fetch User Data
      const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const uid = querySnapshot.docs[0].id;
        setUser({ ...userData, id: uid });
        
        setDisplayName(userData.displayName || "");
        setNewUsername(userData.username || uid); 
        setBio(userData.bio || "");
        
        // Merge Theme defaults
        setTheme({ 
            color: userData.theme?.color || "indigo",
            mode: userData.theme?.mode || "dark",
            banner: userData.theme?.banner || "",
            background: userData.theme?.background || "",
            avatar: userData.theme?.avatar || "",
            avatarDecoration: userData.theme?.avatarDecoration || "none",
            cursorTrail: userData.theme?.cursorTrail || "none",
            nameEffect: userData.theme?.nameEffect || "solid",
            nameColor: userData.theme?.nameColor || "white",
            primary: userData.theme?.primary || "#1e1f22",
            font: userData.theme?.font || "inter"
        });

        setSocials({ ...userData.socials });
        setGaming({ ...userData.gaming || { valorant: { name: "", tag: "", region: "na" } } });
        setCustomLinks(userData.customLinks || []);
        setClips(userData.clips || []); 
        setPrimaryCommunity(userData.primaryCommunity || "");
        setGear(userData.gear || { cpu: "", gpu: "", ram: "", mouse: "", keyboard: "", headset: "", monitor: "" });

        // Ensure Layout has all widgets
        const defaultWidgets = [
            { id: 'hero', label: 'Recent Activity', enabled: true, size: 'full' },
            { id: 'content', label: 'Creator Stack', enabled: true, size: 'half' },
            { id: 'spotify', label: 'Spotify Overview', enabled: true, size: 'half' },
            { id: 'valorant', label: 'Valorant Rank', enabled: true, size: 'half' },
            { id: 'library', label: 'Game Library', enabled: true, size: 'half' },
            { id: 'gear', label: 'Hardware Setup', enabled: true, size: 'half' },
        ];

        let currentLayout = userData.layout || defaultWidgets;
        
        const existingIds = new Set(currentLayout.map((w: any) => w.id));
        defaultWidgets.forEach(dw => {
            if (!existingIds.has(dw.id)) {
                currentLayout.push(dw);
            }
        });

        setLayout(currentLayout);

        // SAFELY FETCH COMMUNITIES
        try {
            const commQ = query(collection(db, "communities"), where("owner_uid", "==", currentUser.uid));
            const commSnap = await getDocs(commQ);
            setMyCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.warn("Could not fetch communities. You need to update Firebase Security Rules:", err);
            setMyCommunities([]);
        }

      } else {
        router.push("/setup");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  // --- ACTIONS ---

  const handleSave = async () => {
    if (!user) return;

    // --- PROFANITY CHECK ---
    const hasProfanity = 
      isProfane(displayName) ||
      isProfane(bio) ||
      Object.values(gear).some(isProfane) ||
      Object.values(socials).some(isProfane) ||
      isProfane(gaming.xbox) ||
      isProfane(gaming.epic) ||
      isProfane(gaming.valorant?.name) ||
      isProfane(gaming.valorant?.tag) ||
      customLinks.some(link => isProfane(link.label)) ||
      clips.some(clip => isProfane(clip.title));

    if (hasProfanity) {
      alert("⚠️ We detected inappropriate language in your profile settings. Please remove it before saving.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        displayName,
        bio,
        theme,
        socials,
        gaming,
        customLinks,
        clips, 
        primaryCommunity,
        layout,
        gear
      });
      setTimeout(() => setSaving(false), 1000);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleCreateCommunity = async () => {
    if (!commName || !commHandle) return;

    if (isProfane(commName) || isProfane(commHandle) || isProfane(commDesc)) {
        alert("⚠️ We detected inappropriate language in your community details.");
        return;
    }

    setSaving(true);
    try {
        const cleanHandle = commHandle.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const docRef = doc(db, "communities", cleanHandle);
        const snap = await getDoc(docRef);
        if (snap.exists()) { 
           alert("This community handle is already taken. Choose another one!"); 
           setSaving(false); 
           return; 
        }

        await setDoc(docRef, {
            name: commName,
            handle: cleanHandle,
            description: commDesc,
            owner_uid: auth.currentUser?.uid,
            members: [auth.currentUser?.uid],
            created_at: serverTimestamp(),
            memberCount: 1,
            banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop",
            avatar: ""
        });

        alert("Community Launch Successful!");
        setIsCreatingCommunity(false);
        setCommName(""); setCommHandle(""); setCommDesc("");
        
        if (auth.currentUser) {
            try {
                const commQ = query(collection(db, "communities"), where("owner_uid", "==", auth.currentUser.uid));
                const commSnap = await getDocs(commQ);
                setMyCommunities(commSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.warn(err);
            }
        }
    } catch (e) { 
        console.error(e); 
        alert("Permission denied. Ensure your Firebase Rules are updated.");
    } finally { 
        setSaving(false); 
    }
  };

  const openEditModal = (comm: any) => {
     setEditingCommunity(comm);
     setEditCommName(comm.name || "");
     setEditCommDesc(comm.description || "");
     setEditCommAvatar(comm.avatar || "");
     setEditCommBanner(comm.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop");
  };

  const handleUpdateCommunity = async () => {
     if (!editingCommunity) return;
     if (!editCommName) { alert("Community name cannot be empty."); return; }

     if (isProfane(editCommName) || isProfane(editCommDesc)) {
         alert("⚠️ We detected inappropriate language in your community details.");
         return;
     }

     setSaving(true);
     try {
         const commRef = doc(db, "communities", editingCommunity.handle);
         await updateDoc(commRef, {
             name: editCommName,
             description: editCommDesc,
             avatar: editCommAvatar,
             banner: editCommBanner
         });

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
     } finally {
         setSaving(false);
     }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidgetVisibility = (index: number) => {
      const newLayout = [...layout];
      newLayout[index].enabled = !newLayout[index].enabled;
      setLayout(newLayout);
  };

  const toggleWidgetSize = (index: number) => {
      const newLayout = [...layout];
      newLayout[index].size = newLayout[index].size === 'full' ? 'half' : 'full';
      setLayout(newLayout);
  };

  const resetLayout = () => {
    if (!confirm("Reset layout to default?")) return;
    setLayout([
        { id: 'hero', label: 'Recent Activity', enabled: true, size: 'full' },
        { id: 'content', label: 'Creator Stack', enabled: true, size: 'half' },
        { id: 'spotify', label: 'Spotify Overview', enabled: true, size: 'half' },
        { id: 'valorant', label: 'Valorant Rank', enabled: true, size: 'half' },
        { id: 'library', label: 'Game Library', enabled: true, size: 'half' },
        { id: 'gear', label: 'Hardware Setup', enabled: true, size: 'half' },
    ]);
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

  const connectSpotify = () => {
    if (!user?.id) return;
    window.location.href = `/api/auth/spotify?state=${user.id}`;
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
            await updateDoc(userRef, { "socials.discord": "", "socials.discord_verified": false });
            setSocials(prev => ({ ...prev, discord: "", discord_verified: false }));
        }
        if (platform === 'spotify') {
            await updateDoc(userRef, { spotify: null });
            setUser((prev: any) => ({ ...prev, spotify: null }));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setSaving(false);
    }
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

    if (isProfane(newUsername)) {
        alert("⚠️ This handle contains inappropriate language.");
        return;
    }

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
    } finally {
      setSaving(false);
    }
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
        setNewEmail("");
        setNewPass("");
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white"><Sparkles className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      
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
                    <input type="text" value={commName} onChange={e => setCommName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white" placeholder="e.g. SOUR GANG" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Community Handle (URL)</label>
                    <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-1">
                      <span className="text-zinc-500 text-sm">pulsegg.in/c/</span>
                      <input type="text" value={commHandle} onChange={e => setCommHandle(e.target.value.toLowerCase())} className="flex-1 bg-transparent py-2 outline-none text-sm text-white" placeholder="handle" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Short Description</label>
                    <textarea value={commDesc} onChange={e => setCommDesc(e.target.value)} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition resize-none text-white" placeholder="What's this group about?" />
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
            <div className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Settings className="w-6 h-6 text-indigo-500" /> Edit Community</h2>
                  <button onClick={() => setEditingCommunity(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
               </div>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Display Name</label>
                    <input type="text" value={editCommName} onChange={e => setEditCommName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                    <textarea value={editCommDesc} onChange={e => setEditCommDesc(e.target.value)} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition resize-none text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Avatar Image URL</label>
                    <input type="text" value={editCommAvatar} onChange={e => setEditCommAvatar(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Banner Image URL</label>
                    <input type="text" value={editCommBanner} onChange={e => setEditCommBanner(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white" placeholder="https://..." />
                  </div>
                  <button onClick={handleUpdateCommunity} disabled={saving || !editCommName} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">P</div>
            <span className="font-bold tracking-tight hidden md:block">Dashboard</span>
         </div>
         <div className="flex items-center gap-3">
            <a href={`/${user?.id}`} target="_blank" className="px-4 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
               <ExternalLink className="w-3 h-3" /> View Profile
            </a>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-xs font-bold bg-white text-black rounded-lg hover:bg-zinc-200 transition disabled:opacity-50">
               {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => signOut(auth)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition text-zinc-500">
               <LogOut className="w-4 h-4" />
            </button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3">
           <div className="bg-[#121214] border border-white/5 rounded-2xl p-2 sticky top-24">
              {[
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition mb-1 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
           </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">

          {/* Connection Error Notification */}
          {connectionError && (
             <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                   <p className="text-sm font-bold text-red-500">Connection Error</p>
                   <p className="text-xs text-red-400/80 mt-1">{connectionError}</p>
                </div>
                <button onClick={() => setConnectionError(null)} className="p-1 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-red-500" /></button>
             </div>
          )}

          {/* --- COMMUNITIES TAB --- */}
          {activeTab === 'communities' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full -mr-32 -mt-32"></div>
                   <div className="relative z-10 flex-1">
                      <h2 className="text-2xl font-black mb-2">Build your group.</h2>
                      <p className="text-indigo-200/60 text-sm max-w-md">Create a shared space for your clan, friend group, or esports team. Display a roster of Pulse profiles on one page.</p>
                   </div>
                   <button onClick={() => setIsCreatingCommunity(true)} className="relative z-10 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-indigo-50 transition flex items-center gap-2 shadow-xl">
                      <Plus className="w-5 h-5" /> New Community
                   </button>
                </section>

                {myCommunities.length > 0 && (
                   <section className="bg-[#121214] border border-white/5 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Represented Community</h3>
                      <p className="text-xs text-zinc-500 mb-4">Choose which community badge appears on your public profile.</p>
                      <select 
                         value={primaryCommunity} 
                         onChange={(e) => setPrimaryCommunity(e.target.value)} 
                         className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 cursor-pointer"
                      >
                         <option value="">None (Hidden)</option>
                         {myCommunities.map(c => (
                            <option key={c.id} value={c.handle}>{c.name} (/c/{c.handle})</option>
                         ))}
                      </select>
                   </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {myCommunities.length === 0 ? (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                         <Users className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                         <p className="text-zinc-500 font-bold">You haven't founded any communities yet.</p>
                      </div>
                   ) : (
                      myCommunities.map(comm => (
                         <div key={comm.id} className="bg-[#121214] border border-white/5 rounded-3xl p-6 group hover:border-indigo-500/30 transition">
                            <div className="flex items-start justify-between mb-4">
                               <div className="w-16 h-16 bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center text-zinc-500 shrink-0">
                                  {comm.avatar ? <img src={comm.avatar} className="w-full h-full object-cover" /> : <Users className="w-8 h-8" />}
                               </div>
                               <div className="flex gap-2">
                                  <a href={`/c/${comm.handle}`} target="_blank" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"><ExternalLink className="w-4 h-4" /></a>
                                  <button onClick={() => openEditModal(comm)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"><Settings className="w-4 h-4" /></button>
                               </div>
                            </div>
                            <h3 className="text-lg font-black flex items-center gap-2 truncate">{comm.name} <Crown className="w-3 h-3 text-yellow-500 shrink-0" /></h3>
                            <p className="text-zinc-500 text-xs mt-1 mb-4 line-clamp-1">{comm.description || "A community on Pulse."}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div className="flex items-center gap-2"><div className="px-2 py-1 bg-zinc-900 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{comm.memberCount || 1} Members</div></div>
                               <span className="text-[10px] font-mono text-zinc-600">/c/{comm.handle}</span>
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
               <section className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-1">Profile Details</h2>
                  <p className="text-zinc-500 text-xs mb-6">How you appear to the world.</p>
                  
                  <div className="grid gap-6">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="Your Name" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition resize-none" placeholder="Tell us about yourself..." />
                     </div>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6"></div>

                  {/* Custom Links */}
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-white">Custom Links</h3>
                      <button onClick={() => setCustomLinks([...customLinks, {label: "", url: ""}])} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Link</button>
                  </div>
                  <div className="space-y-3">
                      {customLinks.map((link, idx) => (
                          <div key={idx} className="flex gap-2">
                              <input type="text" placeholder="Label" value={link.label} onChange={(e) => {
                                  const newLinks = [...customLinks]; newLinks[idx].label = e.target.value; setCustomLinks(newLinks);
                              }} className="w-1/3 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                              <input type="text" placeholder="URL" value={link.url} onChange={(e) => {
                                  const newLinks = [...customLinks]; newLinks[idx].url = e.target.value; setCustomLinks(newLinks);
                              }} className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                              <button onClick={() => {
                                  const newLinks = customLinks.filter((_, i) => i !== idx); setCustomLinks(newLinks);
                              }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      ))}
                  </div>
               </section>
            </div>
          )}

          {/* --- GAMING TAB --- */}
          {activeTab === 'gaming' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* NEW FEATURED CLIPS SECTION */}
                <section className="bg-[#121214] border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                   <div className="flex justify-between items-center mb-2 relative z-10">
                      <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                         <Video className="w-4 h-4" /> Featured Clips
                      </h2>
                      {clips.length < 3 && (
                         <button onClick={() => setClips([...clips, {title: "", url: ""}])} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Clip
                         </button>
                      )}
                   </div>
                   <p className="text-zinc-500 text-xs mb-6 relative z-10">Paste a YouTube Short, standard YouTube video, Twitch Clip, or Medal.tv link. Maximum 3.</p>
                   
                   <div className="space-y-3 relative z-10">
                      {clips.length === 0 ? (
                         <div className="text-center py-6 bg-black/30 rounded-xl border border-dashed border-white/10">
                            <p className="text-zinc-500 text-sm">No clips added yet. Show off your best moments!</p>
                         </div>
                      ) : (
                         clips.map((clip, idx) => (
                             <div key={idx} className="flex flex-col gap-2 p-3 bg-black/40 border border-white/5 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                   <label className="text-xs font-bold text-zinc-400">Clip {idx + 1}</label>
                                   <button onClick={() => {
                                       const newClips = clips.filter((_, i) => i !== idx); setClips(newClips);
                                   }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                                </div>
                                <input type="text" placeholder="Title (e.g., Crazy 1v5 Clutch)" value={clip.title} onChange={(e) => {
                                    const newClips = [...clips]; newClips[idx].title = e.target.value; setClips(newClips);
                                }} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500" />
                                <input type="text" placeholder="URL (YouTube, Twitch Clip, Medal.tv)" value={clip.url} onChange={(e) => {
                                    const newClips = [...clips]; newClips[idx].url = e.target.value; setClips(newClips);
                                }} className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500 font-mono" />
                             </div>
                         ))
                      )}
                   </div>
                </section>

                {/* Steam - Primary Account Style */}
                <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                   <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Primary Account</h2>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                         <div className="w-12 h-12 bg-[#171a21] rounded-lg flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-7 h-7 text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white">Steam</h3>
                            <p className={user?.steamId ? "text-green-400 text-xs font-mono break-all" : "text-zinc-500 text-xs"}>{user?.steamId || "Not connected"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                         {user?.steamId && (
                            <a href={`https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition text-center flex items-center justify-center gap-2">
                               <span>Visit</span><ExternalLink className="w-3 h-3" />
                            </a>
                         )}
                         <button onClick={handleSteamLink} className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold transition ${user?.steamId ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-white text-black hover:bg-gray-200'}`}>
                            {user?.steamId ? "Reconnect" : "Connect"}
                         </button>
                      </div>
                   </div>
                </section>

                {/* Gaming Accounts - Valorant/Xbox/Epic */}
                <section className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                   <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Gaming Accounts</h2>
                   <div className="space-y-4">
                      {/* Valorant */}
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                         <div className="flex items-center gap-2 mb-3">
                            <Swords className="w-5 h-5 text-red-500" />
                            <span className="font-bold text-sm text-red-400">Valorant Integration</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                               <label className="text-xs font-bold text-zinc-500 block mb-1">Riot Name</label>
                               <input type="text" value={gaming.valorant?.name} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, name: e.target.value}})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-red-500" placeholder="TenZ" />
                            </div>
                            <div>
                               <label className="text-xs font-bold text-zinc-500 block mb-1">Tagline</label>
                               <input type="text" value={gaming.valorant?.tag} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, tag: e.target.value}})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-red-500" placeholder="001" />
                            </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Region</label>
                            <select value={gaming.valorant?.region} onChange={e => setGaming({...gaming, valorant: {...gaming.valorant, region: e.target.value}})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-red-500">
                               <option value="na">North America (NA)</option>
                               <option value="eu">Europe (EU)</option>
                               <option value="ap">Asia Pacific (AP)</option>
                               <option value="kr">Korea (KR)</option>
                            </select>
                         </div>
                      </div>

                      {/* Xbox & Epic */}
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-[#107C10] flex items-center justify-center text-white font-bold shrink-0">X</div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Xbox Gamertag</label>
                            <input type="text" value={gaming.xbox} onChange={(e) => setGaming({...gaming, xbox: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-[#107C10]" placeholder="e.g. MasterChief" />
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-[#313131] flex items-center justify-center text-white font-bold shrink-0">E</div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Epic Games ID</label>
                            <input type="text" value={gaming.epic} onChange={(e) => setGaming({...gaming, epic: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-white" placeholder="e.g. Ninja" />
                         </div>
                      </div>
                   </div>
                </section>

                {/* Socials & Discord */}
                <section className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                   <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Social Connections</h3>
                   <div className="space-y-4">
                      
                      {/* Spotify OAuth Button */}
                      <div className="relative mb-6">
                         <label className="text-xs font-bold text-zinc-500 block mb-1">Spotify</label>
                         {user?.spotify?.connected ? (
                            <div className="flex gap-2">
                               <div className="flex-1 bg-black/50 border border-[#1DB954]/50 rounded-lg p-3 text-[#1DB954] text-sm flex items-center gap-2">
                                  <Music className="w-4 h-4" /> Connected as <span className="font-bold text-white">{user.spotify.display_name || 'Spotify User'}</span>
                               </div>
                               <button onClick={() => handleDisconnect('spotify')} className="bg-red-500/10 hover:bg-red-500/20 px-4 rounded-lg text-sm text-red-500 font-bold transition">Unlink</button>
                            </div>
                         ) : (
                            <button onClick={connectSpotify} className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black p-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20">
                               <Music className="w-5 h-5"/> Connect Spotify Profile
                            </button>
                         )}
                      </div>

                      {/* Discord OAuth Button */}
                      <div className="relative mb-6">
                         <label className="text-xs font-bold text-zinc-500 block mb-1">Discord</label>
                         {user?.socials?.discord ? (
                            <div className="flex gap-2">
                               <div className="flex-1 bg-black/50 border border-indigo-500/50 rounded-lg p-3 text-indigo-400 text-sm flex items-center gap-2">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                                  Linked as <span className="font-bold text-white">{socials.discord}</span>
                               </div>
                               <button onClick={() => handleDisconnect('discord')} className="bg-red-500/10 hover:bg-red-500/20 px-4 rounded-lg text-sm text-red-500 font-bold transition">Unlink</button>
                            </div>
                         ) : (
                            <button onClick={connectDiscord} className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white p-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/20">Connect Discord Profile</button>
                         )}
                      </div>

                      <div className="h-px bg-white/5 my-4"></div>

                      {/* Other Socials */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Twitter / X</label>
                            <input type="text" value={socials.twitter} onChange={(e) => setSocials({...socials, twitter: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-white" placeholder="@username" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Instagram</label>
                            <input type="text" value={socials.instagram} onChange={(e) => setSocials({...socials, instagram: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-[#E1306C]" placeholder="@username" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">YouTube</label>
                            <input type="text" value={socials.youtube} onChange={(e) => setSocials({...socials, youtube: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-red-600" placeholder="Channel Link/Handle" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Twitch</label>
                            <input type="text" value={socials.twitch} onChange={(e) => setSocials({...socials, twitch: e.target.value})} className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500" placeholder="Username" />
                         </div>
                      </div>
                   </div>
                </section>
             </div>
          )}

          {/* --- GEAR TAB --- */}
          {activeTab === 'gear' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                   <h2 className="text-lg font-bold text-white mb-2">Hardware Setup</h2>
                   <p className="text-zinc-500 text-xs mb-6">Show off your specs. Leave blank to hide.</p>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> CPU
                         </label>
                         <input type="text" value={gear.cpu} onChange={e => setGear({...gear, cpu: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. Intel Core i9-14900K" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> GPU
                         </label>
                         <input type="text" value={gear.gpu} onChange={e => setGear({...gear, gpu: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. NVIDIA RTX 4090" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> RAM
                         </label>
                         <input type="text" value={gear.ram} onChange={e => setGear({...gear, ram: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. 64GB DDR5" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Monitor className="w-3 h-3" /> Monitor
                         </label>
                         <input type="text" value={gear.monitor} onChange={e => setGear({...gear, monitor: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. Alienware AW3423DW" />
                      </div>
                   </div>

                   <div className="h-px bg-white/5 my-6"></div>
                   
                   <h3 className="text-sm font-bold text-white mb-4">Peripherals</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Mouse className="w-3 h-3" /> Mouse
                         </label>
                         <input type="text" value={gear.mouse} onChange={e => setGear({...gear, mouse: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. Logitech G Pro X Superlight" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Keyboard className="w-3 h-3" /> Keyboard
                         </label>
                         <input type="text" value={gear.keyboard} onChange={e => setGear({...gear, keyboard: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. Wooting 60HE" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Headphones className="w-3 h-3" /> Headset
                         </label>
                         <input type="text" value={gear.headset} onChange={e => setGear({...gear, headset: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="e.g. Sennheiser HD 600" />
                      </div>
                   </div>
                </section>
             </div>
          )}

          {/* --- LAYOUT & THEME TAB --- */}
          {activeTab === 'layout' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                   <h2 className="text-lg font-bold text-white mb-6">Theme & Visuals</h2>
                   
                   {/* Name Effects */}
                   <div className="bg-black/30 p-4 rounded-xl border border-zinc-700 mb-6">
                      <label className="block text-sm font-bold text-white mb-4">Display Name Style</label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Font</label>
                            <div className="flex gap-2">
                               {['inter', 'space', 'press', 'cinzel'].map(f => (
                                  <button key={f} onClick={() => setTheme({...theme, font: f})} className={`flex-1 p-2 rounded-lg border text-xs font-bold capitalize transition ${theme.font === f ? 'bg-white text-black border-white' : 'bg-black/50 text-zinc-400 border-zinc-700'}`}>{f}</button>
                               ))}
                            </div>
                         </div>
                         <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Effect</label>
                            <div className="flex gap-2">
                               {['solid', 'gradient', 'neon'].map(effect => (
                                  <button key={effect} onClick={() => setTheme({...theme, nameEffect: effect})} className={`flex-1 p-2 rounded-lg border text-xs font-bold capitalize transition ${theme.nameEffect === effect ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/50 text-zinc-400 border-zinc-700'}`}>{effect}</button>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div>
                         <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Color / Gradient</label>
                         <div className="grid grid-cols-6 gap-2">
                            {theme.nameEffect === 'gradient' ? gradients.map(g => <button key={g.name} onClick={() => setTheme({...theme, nameColor: g.class})} className={`w-full aspect-square rounded-lg bg-gradient-to-r ${g.class} ring-2 ring-offset-2 ring-offset-[#121214] ${theme.nameColor === g.class ? 'ring-white' : 'ring-transparent'}`} />) : solidColors.map(c => <button key={c.name} onClick={() => setTheme({...theme, nameColor: c.value})} style={{ backgroundColor: c.value === 'white' ? 'white' : undefined }} className={`w-full aspect-square rounded-lg ring-2 ring-offset-2 ring-offset-[#121214] ${theme.nameColor === c.value ? 'ring-white' : 'ring-transparent'} ${c.value !== 'white' ? `bg-${c.value}` : ''}`} />)}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Primary Color</label>
                          <div className="flex gap-2">
                             <input type="color" value={theme.primary} onChange={(e) => setTheme({...theme, primary: e.target.value})} className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                             <input type="text" value={theme.primary} onChange={(e) => setTheme({...theme, primary: e.target.value})} className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm font-mono" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Background Image</label>
                          <input type="text" value={theme.background} onChange={e => setTheme({...theme, background: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="Image URL (Unsplash/Imgur)" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Profile Banner</label>
                          <input type="text" value={theme.banner} onChange={e => setTheme({...theme, banner: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="Image URL" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Custom Avatar</label>
                          <input type="text" value={theme.avatar} onChange={e => setTheme({...theme, avatar: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition" placeholder="Image URL" />
                      </div>
                   </div>

                   <div className="h-px bg-white/5 my-8"></div>

                   {/* Cosmetics */}
                   <div className="grid grid-cols-2 gap-4 mb-8">
                       <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Avatar Frame</label>
                          <select value={theme.avatarDecoration} onChange={e => setTheme({...theme, avatarDecoration: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm">
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
                       </div>
                       
                       <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cursor</label>
                          <select value={theme.cursorTrail} onChange={e => setTheme({...theme, cursorTrail: e.target.value})} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white text-sm">
                             <option value="none">Default</option>
                             <option value="ghost">Ghost Trail</option>
                             <option value="sparkle">Sparkles</option>
                             <option value="pulse">Pulse</option>
                             <option value="coins">Coins</option>
                          </select>
                       </div>
                   </div>

                   <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-white">Grid Layout</h2>
                      <button onClick={resetLayout} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset Default</button>
                   </div>
                   <p className="text-zinc-500 text-xs mb-4">Drag to reorder widgets on your profile.</p>

                   <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={layout.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {layout.map((widget, index) => (
                             <SortableWidget 
                               key={widget.id} 
                               widget={widget} 
                               onToggleVisibility={() => toggleWidgetVisibility(index)}
                               onToggleSize={() => toggleWidgetSize(index)}
                             />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                </section>
             </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Username / Handle</label>
                    <div className="flex gap-2">
                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 font-mono" />
                        <button onClick={handleChangeUsername} disabled={saving || newUsername === user.username || isOnCooldown} className="px-4 bg-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-700 disabled:opacity-50 transition">Change</button>
                    </div>
                    {isOnCooldown ? (
                       <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Username change is locked. Please try again in {hoursLeft} hours.</p>
                    ) : (
                       <p className="text-xs text-orange-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Changing this will change your profile URL.</p>
                    )}
                  </div>
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
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white"><Sparkles className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}