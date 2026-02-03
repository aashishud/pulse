"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft } from "lucide-react";

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHandle = searchParams.get("handle") || "";
  
  const [handle, setHandle] = useState(initialHandle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveUserProfile = async (user: any) => {
    const username = handle.toLowerCase();
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
          banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop"
        }
      });
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (handle.length < 3) {
      setError("Username must be 3+ characters.");
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", handle.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setError("Username is already taken 😔");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserProfile(userCredential.user);
      router.push("/dashboard");

    } catch (err: any) {
      console.error(err);
      if (err.message === "Username is already taken 😔") {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email already in use. Log in instead?");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");

    if (handle.length < 3) {
      setError("Please enter a username first.");
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", handle.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setError("Username is already taken 😔");
        setLoading(false);
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      router.push("/dashboard");

    } catch (err: any) {
      console.error(err);
      if (err.message) setError(err.message);
      else setError("Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-zinc-400 mb-8">Claim your handle and start building.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Username</label>
            <div className="flex bg-black/50 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition">
              <span className="pl-3 py-3 text-zinc-500">pulse.gg/</span>
              <input 
                type="text" 
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                className="flex-1 bg-transparent text-white outline-none p-3 pl-1 font-mono"
                placeholder="username"
              />
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
               <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
                  placeholder="you@example.com"
                />
            </div>

            <div>
               <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Password</label>
               <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
                  placeholder="••••••••"
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 mt-4"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#121214] text-zinc-500">Or</span></div>
          </div>

          <button 
            onClick={handleGoogleSignup}
            type="button"
            className="w-full bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-3 border border-zinc-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Sign up with Google
          </button>
          
          <p className="text-center text-zinc-500 text-sm mt-4">
            Already have an account? <Link href="/login" className="text-indigo-400 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}