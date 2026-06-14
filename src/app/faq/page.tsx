"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion, Plus, Mail } from "lucide-react";
import PulseLogo from "@/components/PulseLogo";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "What is Pulse?",
    answer: "Pulse is a central hub for gamers. Instead of pasting five different links in your bio, you get one beautiful, unified profile that syncs your Steam achievements, Discord status, Spotify listening, and more in real-time."
  },
  {
    question: "Is Pulse free to use?",
    answer: "Yes! Creating your gaming profile and linking your accounts is completely free. We will introduce premium cosmetic upgrades in the future, but the core features will always remain free."
  },
  {
    question: "How does the Spotify integration work?",
    answer: "When you link your Last.fm account, we use public data to show what you're currently listening to. If you aren't listening to anything, we display your top track. We do not need your Spotify password."
  },
  {
    question: "Can I create a page for my esports team?",
    answer: "Yes! You can create a 'Squad' which acts as a centralized roster for your friends, clan, or esports organization. You can assign roles, customize the banner, and show off your members."
  },
  {
    question: "Is my data safe?",
    answer: "Absolutely. We only store the data you explicitly provide (like your bio or custom links) and public-facing stats from platforms like Steam. We never sell your data to third parties."
  },
  {
    question: "How do I delete my account?",
    answer: "You can permanently delete your account and all associated data at any time from your Dashboard settings. Your handle will instantly become available again."
  }
];

function AccordionItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0], isOpen: boolean, onToggle: () => void }) {
  return (
    <div className={`border rounded-[24px] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.06]'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 md:p-8 text-left outline-none cursor-pointer"
      >
        <span className="font-semibold text-lg text-white/90">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-4 border border-white/5 shadow-sm"
        >
          <Plus className="w-4 h-4 text-white/60" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 md:px-8 pb-6 md:pb-8 text-white/60 text-base leading-relaxed">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans selection:bg-violet-500/30 pb-32 relative">
      
      {/* Soft Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-violet-500/[0.05] blur-[140px] rounded-full mix-blend-screen"></div>
         <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-fuchsia-500/[0.03] blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 relative z-10">
        
        {/* Header */}
        <div className="mb-16 text-center">
           <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-4 ring-violet-500/5">
               <MessageCircleQuestion className="w-8 h-8 text-violet-400" />
           </div>
           <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-white/90">Frequently Asked Questions</h1>
           <p className="text-white/40 text-lg font-medium">Everything you need to know about Pulse.</p>
        </div>
        
        {/* FAQ Accordion List */}
        <div className="space-y-4">
           {faqs.map((faq, index) => (
             <AccordionItem 
               key={index} 
               faq={faq} 
               isOpen={openIndex === index} 
               onToggle={() => setOpenIndex(openIndex === index ? null : index)} 
             />
           ))}
        </div>

        {/* Still need help? */}
        <div className="mt-24 relative rounded-[32px] overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-50 group-hover:opacity-100 transition duration-700"></div>
           <div className="absolute inset-0 border border-violet-500/20 rounded-[32px] pointer-events-none"></div>
           
           <div className="relative p-10 md:p-14 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-6 ring-8 ring-violet-500/5">
                 <Mail className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Still have questions?</h3>
              <p className="text-zinc-400 text-base mb-8 max-w-sm">
                 Can't find what you're looking for? Reach out to us directly and we'll help you out.
              </p>
              <a href="mailto:support@pulsegg.in" className="inline-flex items-center gap-2 bg-white text-[#08080c] px-8 py-4 rounded-full font-bold text-sm hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                 Contact Support
              </a>
           </div>
        </div>
        
      </main>
    </div>
  );
}
