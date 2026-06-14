import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle2, Lock, UserCog, Zap } from "lucide-react";
import PulseLogo from "@/components/PulseLogo";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms & Privacy | Pulse",
  description: "Terms of Service and Privacy Policy for Pulse users.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans selection:bg-violet-500/30 pb-32 relative">
      
      {/* Soft Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-violet-500/[0.04] blur-[120px] rounded-full mix-blend-screen"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-500/[0.03] blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        
        {/* Header */}
        <div className="mb-16">
           <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
               <Shield className="w-7 h-7 text-violet-400" />
           </div>
           <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-white/90">Terms & Privacy Policy</h1>
           <p className="text-white/40 text-sm font-medium">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
           </p>
        </div>
        
        <div className="space-y-12 text-zinc-300 leading-relaxed font-medium">
          
          {/* Section 1 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
               </div>
               Introduction
            </h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>Welcome to Pulse ("we," "our," or "us"). By accessing or using our website, services, and platform (collectively, the "Services"), you agree to be bound by these Terms of Service and our Privacy Policy.</p>
                <p>If you do not agree to these terms, please do not use our platform. We reserve the right to modify these terms at any time, and we will notify users of significant changes.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
               </div>
               Data Collection & Privacy
            </h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>We respect your privacy and are committed to protecting your personal data. Here is what we collect and how we use it:</p>
                <div className="space-y-3 mt-4">
                    <div className="flex gap-3">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                       <p><strong className="text-white/90 font-semibold">Account Data:</strong> We collect your email address and authentication credentials purely for account creation and login purposes via Firebase Authentication.</p>
                    </div>
                    <div className="flex gap-3">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                       <p><strong className="text-white/90 font-semibold">Profile Data:</strong> Information you voluntarily add to your profile (bio, hardware specs, custom links, themes) is stored securely in our database and made public via your profile URL.</p>
                    </div>
                    <div className="flex gap-3">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                       <p><strong className="text-white/90 font-semibold">Community Data:</strong> If you create or join a Squad/Community, your association and role are stored and displayed publicly.</p>
                    </div>
                </div>
                <p className="mt-6 text-violet-300 bg-violet-500/10 px-4 py-3 rounded-xl border border-violet-500/20">We <strong>never</strong> sell your personal data to third parties or data brokers.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
               </div>
               Third-Party Integrations
            </h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>Pulse relies on official APIs provided by third-party platforms to aggregate your gaming and music identity:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="bg-[#111114] p-5 rounded-[16px] border border-white/[0.06]">
                        <h4 className="font-semibold text-white/90 mb-2">Steam & Gaming</h4>
                        <p className="text-xs text-white/40">We utilize Steam OpenID and official web APIs to fetch public achievements and playtimes. Your login credentials are handled directly by Steam.</p>
                    </div>
                    <div className="bg-[#111114] p-5 rounded-[16px] border border-white/[0.06]">
                        <h4 className="font-semibold text-white/90 mb-2">Music Integration</h4>
                        <p className="text-xs text-white/40">We read your active listening status using public Last.fm Scrobble data and the Spotify catalog search API to display album artwork.</p>
                    </div>
                </div>
                <p className="mt-6 text-xs text-white/30 text-center">We are not affiliated with, endorsed by, or sponsored by Steam, Valve, Discord, Spotify, Last.fm, Microsoft, or Epic Games. All trademarks belong to their respective owners.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">4</div>
               User Conduct & Content
            </h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>You are responsible for the content you display on your Pulse profile and within Pulse Communities. You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2 mt-4 text-white/50 marker:text-violet-500/50">
                    <li>Use offensive, hateful, or discriminatory language in your username, bio, or community descriptions.</li>
                    <li>Impersonate other individuals, brands, or organizations.</li>
                    <li>Link to malicious software, phishing sites, or illegal content.</li>
                </ul>
                <p className="mt-4">We reserve the right to suspend or terminate accounts that violate these guidelines, and we utilize automated profanity filters to maintain a safe environment.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">5</div>
               Account Deletion
            </h2>
            <div className="space-y-4 text-sm text-white/60">
                <p>You have the right to be forgotten. You can permanently delete your Pulse account and all associated data at any time from your Dashboard settings. Upon deletion, your profile URL will be instantly released and all stored data will be wiped from our servers.</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}