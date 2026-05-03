"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signInWithCustomToken } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Grab the redirect URL from the browser bar
  const redirectUrl = searchParams.get("redirect");

  // --- SMART BACK BUTTON LOGIC ---
  const [backUrl, setBackUrl] = useState("/");
  const [backText, setBackText] = useState("Back to Home");

  useEffect(() => {
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        setBackUrl(url.origin);
      } catch (e) {
        console.error("Invalid redirect URL:", e);
      }
    }
  }, [redirectUrl]);

  // --- AUTO SIGN-IN FROM DISCORD TOKEN ---
  useEffect(() => {
    const discordToken = searchParams.get("discord_token");
    const discordError = searchParams.get("error");
    
    if (discordError) {
      setError("Discord login failed. Please try again.");
      return;
    }
    
    if (discordToken) {
      setLoading(true);
      signInWithCustomToken(auth, discordToken)
        .then(async (result) => {
          const q = query(collection(db, "users"), where("owner_uid", "==", result.user.uid));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            if (redirectUrl) {
              router.push(`/signup?redirect=${encodeURIComponent(redirectUrl)}`);
            } else {
              router.push("/signup");
            }
          } else {
            handleSuccessfulLogin();
          }
        })
        .catch((err) => {
          console.error("Discord token sign-in failed:", err);
          setError("Discord login failed. Please try again.");
          setLoading(false);
        });
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuccessfulLogin = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSent(false);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleSuccessfulLogin();
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetSent(false);
    setLoading(true); 
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const q = query(collection(db, "users"), where("owner_uid", "==", result.user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        if (redirectUrl) {
          router.push(`/signup?redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          router.push("/signup");
        }
      } else {
        handleSuccessfulLogin();
      }
    } catch (err) {
      console.error(err);
      setError("Google Login failed.");
      setLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    setError("");
    setLoading(true);
    const state = "login";
    window.location.href = `/api/auth/discord-login?state=${state}`;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else {
        setError("Failed to send reset email.");
      }
    }
  };

  const signupLink = redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* Dynamic Back Button */}
        <Link href={backUrl} className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition gap-2 font-bold uppercase tracking-widest text-xs">
          <ArrowLeft className="w-4 h-4" /> {backText}
        </Link>

        <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-zinc-500 mb-8 font-medium">Login to manage your Pulse profile.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-bold">{error}</div>}
            {resetSent && <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm font-bold">Password reset email sent!</div>}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white placeholder:text-zinc-700 font-medium"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
                 <button type="button" onClick={handleForgotPassword} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition">Forgot Password?</button>
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500 transition text-white placeholder:text-zinc-700 font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-[#121214] text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Or</span></div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full bg-zinc-800/50 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M6.16 14.25c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.13-.42z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.98 2.25c.88-2.62 3.31-4.51 5.84-4.51z" /></svg>
              )}
              Continue with Google
            </button>

            <button 
              onClick={handleDiscordLogin}
              type="button"
              disabled={loading}
              className="w-full bg-[#5865F2]/10 text-[#5865F2] font-bold py-3 rounded-xl hover:bg-[#5865F2]/20 transition flex items-center justify-center gap-3 border border-[#5865F2]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
              )}
              Continue with Discord
            </button>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-8 font-medium">
            Don't have an account? <Link href={signupLink} className="text-white font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <LoginContent />
    </Suspense>
  );
}