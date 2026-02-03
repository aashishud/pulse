"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // CHECK: Does this user have a profile?
      const q = query(collection(db, "users"), where("owner_uid", "==", result.user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User exists -> Go to Dashboard
        router.push("/dashboard");
      } else {
        // User is new (Auth exists, but no DB Profile) -> Go to Signup to pick username
        // We pass 'isNew=true' so signup knows to expect them
        router.push("/signup");
      }
    } catch (err) {
      setError("Google Login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
          
          <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#121214] text-zinc-500">Or</span></div>
        </div>

        <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-3 border border-zinc-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Sign in with Google
          </button>

        <p className="text-center text-zinc-500 text-sm mt-6">
            Don't have an account? <Link href="/signup" className="text-indigo-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}