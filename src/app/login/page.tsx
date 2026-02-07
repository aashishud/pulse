"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSent(false);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth successful, the Dashboard's own check will handle the rest
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetSent(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // CHECK: Does this user have a profile?
      const q = query(collection(db, "users"), where("owner_uid", "==", result.user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No profile found -> Setup
        router.push("/signup");
      } else {
        // Profile exists -> Dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Google Login failed.");
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-zinc-500 mb-8">Login to manage your Pulse profile.</p>

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
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#121214] text-zinc-500">Or</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-3 border border-zinc-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M6.16 14.25c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.13-.42z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.98 2.25c.88-2.62 3.31-4.51 5.84-4.51z" /></svg>
            Continue with Google
          </button>

          <p className="text-center text-zinc-500 text-sm mt-8">
            Don't have an account? <Link href="/signup" className="text-white font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}