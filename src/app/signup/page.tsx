"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, Loader2, Sparkles, LayoutTemplate, Layers, Gamepad2, ArrowRight } from "lucide-react";
import { validateHandle } from "@/lib/validation";
import ReCAPTCHA from "react-google-recaptcha";
import { getSteamLoginUrl } from "@/app/setup/actions";
import PulseLogo from "@/components/PulseLogo";

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHandle = searchParams.get("handle") || "";
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [handle, setHandle] = useState(initialHandle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const saveUserProfile = async (user: any) => {
    const username = handle.toLowerCase().trim();
    
    const validationError = validateHandle(username);
    if (validationError) throw new Error(validationError);

    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      if (userSnap.data().owner_uid !== user.uid) {
        throw new Error("Username is already taken 😔");
      }
    } else {
      await setDoc(userRef, {
        owner_uid: user.uid,
        username: username,
        email: user.email,
        steamId: "",
        createdAt: new Date().toISOString(),
        theme: {
          color: "indigo",
          primary: "#1e1f22",
          cardOpacity: 0.8,
          cardBlur: 10,
          layoutStyle: "bento", // Default, will be updated in Step 2
          shader: "none",
          banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop"
        }
      });
    }
    setUserId(username);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) { setError("Please accept the Terms of Service to continue."); return; }
    if (!captchaValue) { setError("Please verify that you are not a robot."); return; }

    const validationError = validateHandle(handle.toLowerCase().trim());
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const userRef = doc(db, "users", handle.toLowerCase().trim());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) { setError("Username is already taken 😔"); setLoading(false); return; }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserProfile(userCredential.user);
      setStep(2); // Move to Layout Selection
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError("Email already in use. Log in instead?");
      else setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    setError("");
    if (!termsAccepted) { setError("Please accept the Terms of Service to continue."); return; }

    const validationError = validateHandle(handle.toLowerCase().trim());
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const userRef = doc(db, "users", handle.toLowerCase().trim());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) { setError("Username is already taken 😔"); setLoading(false); return; }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      setStep(2); // Move to Layout Selection
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed.");
    } finally { setLoading(false); }
  };

  const selectLayout = async (style: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), { "theme.layoutStyle": style });
      setStep(3); // Move to Quick Connect
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectSteam = async () => {
    if (userId) {
       const url = await getSteamLoginUrl(userId, window.location.origin);
       window.location.href = url;
    }
  };

  const connectDiscord = () => {
    if (userId) window.location.href = `/api/auth/discord?state=${userId}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_50%)] blur-[80px]"></div>
         <div className="absolute bottom-[-10%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05)_0%,transparent_50%)] blur-[60px]"></div>
      </div>

      {/* Top Nav (Absolute) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
         <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
         </Link>
         <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
   <PulseLogo className="w-4 h-4 text-white" />
</div>
             Pulse
         </Link>
      </div>

      {/* Centered Wizard Window */}
      <div className="relative z-10 w-full max-w-[500px] bg-[#121214]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 sm:p-10 shadow-2xl mt-16 sm:mt-0">
        
        {/* STEP 1: AUTHENTICATION */}
        {step === 1 && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black mb-2 tracking-tight text-center">Claim your handle</h1>
              <p className="text-zinc-500 mb-8 text-sm font-medium text-center">Create your account to secure your URL.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Your Pulse URL</label>
                  <div className="flex bg-black/20 border border-white/5 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all text-sm shadow-inner">
                    <span className="pl-4 py-3.5 text-zinc-500 font-medium select-none">pulsegg.in/</span>
                    <input 
                      type="text" 
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase())}
                      className="flex-1 bg-transparent text-white outline-none p-3.5 pl-0 font-mono font-bold"
                      placeholder="username"
                    />
                  </div>
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-5">
                  <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                     <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-3.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-inner"
                        placeholder="you@example.com"
                      />
                  </div>

                  <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                     <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-3.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-inner"
                        placeholder="••••••••"
                      />
                  </div>

                  {error && <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>}

                  <div className="flex items-start gap-3 py-1 ml-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#0a0a0c] cursor-pointer appearance-none checked:bg-indigo-500 relative after:content-['✓'] after:absolute after:text-white after:text-[10px] after:font-black after:top-[1px] after:left-[2px] after:hidden checked:after:block"
                    />
                    <label htmlFor="terms" className="text-xs text-zinc-400 font-medium cursor-pointer select-none">
                      I agree to the <Link href="/terms" className="text-white hover:text-indigo-400 transition hover:underline">Terms of Service</Link> and <Link href="/terms" className="text-white hover:text-indigo-400 transition hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>

                  <div className="flex justify-center py-2 scale-[0.85] sm:scale-100 origin-center">
                    <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""} onChange={(val) => setCaptchaValue(val)} theme="dark" />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !captchaValue || !termsAccepted || !handle}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs"><span className="px-4 bg-[#121214] text-zinc-500 font-bold uppercase tracking-widest">Or</span></div>
                </div>

                <button 
                  onClick={handleGoogleSignup}
                  type="button"
                  className="w-full bg-white/5 text-white font-bold py-3.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-center gap-3 border border-white/5 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continue with Google
                </button>
                
                <p className="text-center text-zinc-500 text-sm font-medium mt-4">
                  Already have an account? <Link href="/login" className="text-white hover:text-indigo-400 transition hover:underline">Log in</Link>
                </p>
              </div>
           </div>
        )}

        {/* STEP 2: CHOOSE LAYOUT */}
        {step === 2 && (
           <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
              <div className="flex items-center gap-3 mb-6 text-indigo-400 justify-center">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-xs font-black">2</span>
                 <span className="text-xs font-bold uppercase tracking-widest">Profile Setup</span>
              </div>
              
              <h1 className="text-3xl font-black mb-2 tracking-tight text-center">Choose your canvas.</h1>
              <p className="text-zinc-500 mb-8 text-sm font-medium text-center">How do you want your profile to look? You can always change this later in settings.</p>

              <div className="grid grid-cols-1 gap-4">
                  <button 
                     onClick={() => selectLayout('bento')}
                     disabled={loading}
                     className="group p-6 rounded-[24px] bg-black/20 border border-white/5 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left relative overflow-hidden shadow-xl"
                  >
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                           <LayoutTemplate className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white">Bento Grid</h3>
                           <p className="text-xs text-zinc-500 font-medium">Data-heavy. Best for desktop.</p>
                        </div>
                     </div>
                     <div className="w-full h-24 bg-white/5 rounded-xl border border-white/5 grid grid-cols-3 gap-2 p-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="col-span-2 bg-white/10 rounded-xl"></div>
                        <div className="col-span-1 bg-white/10 rounded-xl"></div>
                        <div className="col-span-1 bg-white/10 rounded-xl"></div>
                        <div className="col-span-2 bg-indigo-500/40 rounded-xl"></div>
                     </div>
                  </button>

                  <button 
                     onClick={() => selectLayout('simple')}
                     disabled={loading}
                     className="group p-6 rounded-[24px] bg-black/20 border border-white/5 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left relative overflow-hidden shadow-xl"
                  >
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                           <Layers className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="flex items-center gap-2"><h3 className="text-lg font-black text-white">Simple Mode</h3><span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">New</span></div>
                           <p className="text-xs text-zinc-500 font-medium">Sleek link-tree. Best for mobile.</p>
                        </div>
                     </div>
                     <div className="w-full h-24 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2 p-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/10"></div>
                        <div className="w-24 h-2 rounded-full bg-white/10"></div>
                        <div className="w-32 h-6 rounded-lg bg-indigo-500/40"></div>
                     </div>
                  </button>
              </div>
              {loading && <p className="text-center text-xs text-zinc-500 mt-4 animate-pulse font-bold">Saving layout...</p>}
           </div>
        )}

        {/* STEP 3: QUICK CONNECT */}
        {step === 3 && (
           <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
              <div className="flex items-center gap-3 mb-6 text-indigo-400 justify-center">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-xs font-black">3</span>
                 <span className="text-xs font-bold uppercase tracking-widest">Connect Gear</span>
              </div>
              
              <h1 className="text-3xl font-black mb-2 tracking-tight text-center">Sync your stats.</h1>
              <p className="text-zinc-500 mb-8 text-sm font-medium text-center">Connect your primary accounts now so your profile isn't empty when you land on the dashboard.</p>

              <div className="space-y-4">
                 {/* Steam Connect */}
                 <div className="bg-black/20 border border-white/5 rounded-[24px] p-5 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#171a21] rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                          <Gamepad2 className="w-6 h-6 text-white" />
                       </div>
                       <div>
                          <h3 className="font-bold text-white leading-none mb-1">Steam</h3>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Games & Level</p>
                       </div>
                    </div>
                    <button onClick={connectSteam} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/5">Connect</button>
                 </div>

                 {/* Discord Connect */}
                 <div className="bg-black/20 border border-white/5 rounded-[24px] p-5 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#5865F2] rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner text-white">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                           </div>
                           <div>
                              <h3 className="font-bold text-white leading-none mb-1">Discord</h3>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Profile Link</p>
                           </div>
                        </div>
                        <button onClick={connectDiscord} className="px-4 py-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] text-xs font-bold rounded-xl transition border border-[#5865F2]/30">Connect</button>
                     </div>
                  </div>

                  <div className="mt-12 text-center">
                     <button 
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                     >
                        Go to Dashboard <ArrowRight className="w-5 h-5" />
                     </button>
                     <p className="text-xs text-zinc-500 mt-4 font-medium">You can connect more accounts later in settings.</p>
                  </div>
               </div>
            )}

      </div>

      {/* Footer Links */}
      <div className="relative z-10 mt-8 flex items-center gap-2 text-xs font-bold text-zinc-600">
         <span>© 2026 Pulse GG.</span>
         <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
         <Link href="/terms" className="hover:text-zinc-400 transition">Terms</Link>
         <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
         <Link href="/privacy" className="hover:text-zinc-400 transition">Privacy</Link>
      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white font-black animate-pulse">PULSE</div>}>
      <SignupContent />
    </Suspense>
  );
}