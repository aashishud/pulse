import Link from "next/link";
import { Sparkles, ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Terms & Privacy | Pulse",
  description: "Terms of Service and Privacy Policy for Pulse users.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30 pb-24">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      </div>

      <nav className="w-full max-w-4xl mx-auto px-6 py-8 flex justify-between items-center z-50 relative">
        <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 group hover:opacity-80 transition">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Pulse</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white transition flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </nav>
      
      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8">
            <Shield className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Terms & Privacy Policy</h1>
        <p className="text-zinc-500 font-mono text-sm mb-16 border-b border-white/5 pb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="space-y-16 text-zinc-300 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">1</span>
               Introduction
            </h2>
            <div className="space-y-4 text-sm bg-white/5 p-6 rounded-2xl border border-white/5">
                <p>Welcome to Pulse ("we," "our," or "us"). By accessing or using our website, services, and platform (collectively, the "Services"), you agree to be bound by these Terms of Service and our Privacy Policy.</p>
                <p>If you do not agree to these terms, please do not use our platform. We reserve the right to modify these terms at any time, and we will notify users of significant changes.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">2</span>
               Data Collection & Privacy
            </h2>
            <div className="space-y-4 text-sm">
                <p>We respect your privacy and are committed to protecting your personal data. Here is what we collect and how we use it:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-400 marker:text-indigo-500">
                    <li><strong className="text-white">Account Data:</strong> We collect your email address and authentication credentials purely for account creation and login purposes via Firebase Authentication.</li>
                    <li><strong className="text-white">Profile Data:</strong> Information you voluntarily add to your profile (bio, hardware specs, custom links) is stored securely in our database and made public via your profile URL.</li>
                    <li><strong className="text-white">Third-Party Data:</strong> When you link external platforms (Steam, Discord, Last.fm, Xbox, etc.), we only fetch and store public-facing data (e.g., game libraries, currently playing status) required to render your profile widgets.</li>
                </ul>
                <p className="mt-4">We <strong>never</strong> sell your personal data to third parties or data brokers.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">3</span>
               Third-Party Integrations
            </h2>
            <div className="space-y-4 text-sm">
                <p>Pulse relies on official APIs provided by third-party platforms to aggregate your gaming and music identity:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#121214] p-4 rounded-xl border border-white/5">
                        <h4 className="font-bold text-white mb-1">Steam & Gaming</h4>
                        <p className="text-xs text-zinc-500">We utilize Steam OpenID and official web APIs to fetch public achievements and playtimes. Your login credentials are handled directly by Steam.</p>
                    </div>
                    <div className="bg-[#121214] p-4 rounded-xl border border-white/5">
                        <h4 className="font-bold text-white mb-1">Music (Last.fm/Spotify)</h4>
                        <p className="text-xs text-zinc-500">We read your active listening status using public Last.fm Scrobble data and the Spotify catalog search API to display album artwork.</p>
                    </div>
                </div>
                <p className="mt-4 text-xs text-zinc-500">We are not affiliated with, endorsed by, or sponsored by Steam, Valve, Discord, Spotify, Last.fm, Microsoft, or Epic Games. All trademarks belong to their respective owners.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">4</span>
               User Conduct & Content
            </h2>
            <div className="space-y-4 text-sm">
                <p>You are responsible for the content you display on your Pulse profile and within Pulse Communities. You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2 text-zinc-400 marker:text-indigo-500">
                    <li>Use offensive, hateful, or discriminatory language in your username, bio, or community descriptions.</li>
                    <li>Impersonate other individuals, brands, or organizations.</li>
                    <li>Link to malicious software, phishing sites, or illegal content.</li>
                </ul>
                <p>We reserve the right to suspend or terminate accounts that violate these guidelines, and we utilize automated profanity filters to maintain a safe environment.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">5</span>
               Account Deletion
            </h2>
            <div className="space-y-4 text-sm">
                <p>You have the right to be forgotten. You can permanently delete your Pulse account and all associated data at any time from your Dashboard settings. Upon deletion, your profile URL will be instantly released and all stored data will be wiped from our servers.</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}