"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Sparkles, Users, Crown, ChevronLeft, ArrowUpRight, Share2, ShieldCheck, MapPin, Gamepad2, ExternalLink, Settings } from "lucide-react";

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Listen for logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubscribe();
  }, []);

  // 2. Fetch the Community & Roster
  useEffect(() => {
    if (!handle) return;

    const fetchCommunityData = async () => {
      try {
        const commRef = doc(db, "communities", handle.toLowerCase());
        const commSnap = await getDoc(commRef);

        if (!commSnap.exists()) {
          setError(true);
          setLoading(false);
          return;
        }

        const commData = commSnap.data();
        setCommunity(commData);

        // Fetch Member Profiles (Batching max 30 for safety)
        if (commData.members && commData.members.length > 0) {
          const uidsToFetch = commData.members.slice(0, 30);
          const q = query(collection(db, "users"), where("owner_uid", "in", uidsToFetch));
          const usersSnap = await getDocs(q);
          
          // Explicitly type the array to prevent the TS owner_uid error
          const roster: any[] = usersSnap.docs.map(d => ({
             username: d.id,
             ...d.data()
          }));
          
          // Sort so Founder is always at the top of the roster
          roster.sort((a, b) => {
             if (a.owner_uid === commData.owner_uid) return -1;
             if (b.owner_uid === commData.owner_uid) return 1;
             return 0;
          });

          setMembers(roster);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching community:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [handle]);

  // 3. Handle Join/Leave Logic
  const handleToggleJoin = async () => {
    if (!currentUser) {
       alert("You must be logged into Pulse to join this community!");
       router.push("/login");
       return;
    }

    if (!community) return;
    setIsProcessing(true);

    const commRef = doc(db, "communities", handle.toLowerCase());
    const isMember = community.members.includes(currentUser.uid);

    try {
       if (isMember) {
           // LEAVE
           if (community.owner_uid === currentUser.uid) {
               alert("The Founder cannot leave the community.");
               setIsProcessing(false);
               return;
           }
           const newMembers = community.members.filter((m: string) => m !== currentUser.uid);
           await updateDoc(commRef, { members: newMembers, memberCount: newMembers.length });
           setCommunity({ ...community, members: newMembers, memberCount: newMembers.length });
           setMembers(members.filter(m => m.owner_uid !== currentUser.uid));
       } else {
           // JOIN
           const newMembers = [...community.members, currentUser.uid];
           await updateDoc(commRef, { members: newMembers, memberCount: newMembers.length });
           setCommunity({ ...community, members: newMembers, memberCount: newMembers.length });

           // Instantly inject their profile into the grid
           const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
           const snap = await getDocs(q);
           if (!snap.empty) {
               setMembers([...members, { username: snap.docs[0].id, ...snap.docs[0].data() }]);
           }
       }
    } catch (e) {
       console.error("Join/Leave Error:", e);
       alert("Failed to update membership.");
    } finally {
       setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
     if (typeof window !== 'undefined') {
         const dummy = document.createElement('input');
         document.body.appendChild(dummy);
         dummy.value = window.location.href;
         dummy.select();
         document.execCommand('copy');
         document.body.removeChild(dummy);
         alert("Link copied to clipboard!");
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <Sparkles className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-white font-sans p-4 text-center">
        <ShieldCheck className="w-16 h-16 text-zinc-800 mb-4" />
        <h1 className="text-3xl font-black mb-2">Community Not Found</h1>
        <p className="text-zinc-500 mb-8 max-w-md">This group either doesn't exist or the handle is incorrect.</p>
        <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition">Return Home</Link>
      </div>
    );
  }

  const isMember = currentUser && community.members?.includes(currentUser.uid);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30 pb-24">
      
      {/* Top Nav */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
         <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>Pulse
         </Link>
         <button onClick={copyToClipboard} className="p-2.5 bg-black/50 hover:bg-white/10 backdrop-blur-md rounded-xl border border-white/10 transition group">
            <Share2 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
         </button>
      </nav>

      {/* Hero Banner */}
      <div className="relative h-[30vh] md:h-[40vh] w-full bg-zinc-900 group">
         <img src={community.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop"} alt="Banner" className="w-full h-full object-cover opacity-80" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/20 to-transparent"></div>
         
         {/* Overlapping Avatar */}
         <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-12">
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl border-[6px] border-[#0a0a0c] bg-zinc-900 overflow-hidden shadow-2xl relative">
               {community.avatar ? (
                  <img src={community.avatar} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-900/20 text-indigo-500">
                     <Users className="w-10 h-10 md:w-16 md:h-16 opacity-50" />
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Community Info Header */}
      <div className="pt-16 md:pt-20 px-6 md:px-12 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
            <div>
               <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight flex items-center gap-3">
                  {community.name}
               </h1>
               <div className="flex items-center gap-4 text-sm font-bold mb-4">
                  <span className="text-zinc-500 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">/c/{community.handle}</span>
                  <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                     <Users className="w-4 h-4" /> {community.memberCount || community.members?.length || 1} Members
                  </span>
               </div>
               <p className="text-zinc-300 max-w-2xl leading-relaxed text-sm md:text-base">
                  {community.description || "A gaming community on Pulse."}
               </p>
            </div>
            
            {/* Join Action */}
            <div className="shrink-0">
               <button 
                 onClick={handleToggleJoin} 
                 disabled={isProcessing}
                 className={`w-full md:w-auto px-8 py-3.5 font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
                    isMember 
                      ? 'bg-zinc-800 text-white hover:bg-red-500/20 hover:text-red-500 border border-transparent hover:border-red-500/30' 
                      : 'bg-white text-black hover:bg-indigo-50'
                 } disabled:opacity-50`}
               >
                  {isProcessing ? "Processing..." : isMember ? "Leave Group" : "Join Community"}
               </button>
            </div>
         </div>

         <div className="h-px bg-white/5 mb-8"></div>

         {/* Roster Grid */}
         <div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
               Roster <span className="text-zinc-600 text-sm font-bold">({members.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {members.map(member => (
                  <Link href={`/${member.username}`} key={member.username} className="bg-[#121214] border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 hover:bg-[#18181b] transition group relative overflow-hidden flex items-center gap-4">
                     
                     {/* Card Background Glow */}
                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                     
                     <div className="relative w-14 h-14 shrink-0 z-10">
                        {member.owner_uid === community.owner_uid && (
                           <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-500 rounded-full border-2 border-[#121214] flex items-center justify-center z-20 shadow-sm" title="Founder">
                              <Crown className="w-3 h-3 text-black" />
                           </div>
                        )}
                        <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden border-2 border-white/10 group-hover:border-indigo-500/50 transition">
                           <img 
                              src={member.theme?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                              alt={member.username} 
                              className="w-full h-full object-cover"
                           />
                        </div>
                     </div>
                     
                     <div className="flex-1 min-w-0 z-10">
                        <h4 className="font-bold text-white truncate flex items-center gap-2 text-sm group-hover:text-indigo-400 transition">
                           {member.displayName || member.username}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <p className="text-xs text-zinc-500 truncate">@{member.username}</p>
                           {member.steamId && <span title="Steam Linked" className="shrink-0 flex items-center"><Gamepad2 className="w-3 h-3 text-zinc-600" /></span>}
                           {member.socials?.discord && <span className="w-3 h-3 bg-[#5865F2]/20 rounded flex items-center justify-center shrink-0" title="Discord Linked"><svg className="w-2 h-2 text-[#5865F2] fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></span>}
                        </div>
                     </div>
                     <ArrowUpRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition z-10 shrink-0" />
                  </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}