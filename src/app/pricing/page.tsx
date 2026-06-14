"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { Check, MoveRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  description?: string;
  isPopular?: boolean;
  buttonText?: string;
  trialText?: string;
}

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

const Counter = ({ from, to }: { from: number; to: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(from, to, {
      duration: 1,
      onUpdate(value) {
        node.textContent = value.toFixed(0);
      },
    });
    return () => controls.stop();
  }, [from, to]);
  return <span ref={nodeRef} />;
};

const PricingHeader = ({ title }: { title: string }) => (
  <div className="text-center mb-8 sm:mb-12 relative z-10 pt-10">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-block"
    >
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
        {title}
      </h1>
      <p className="text-lg text-white/50 max-w-2xl mx-auto">
        Choose the perfect plan for your needs
      </p>
    </motion.div>
  </div>
);

const PricingToggle = ({ isYearly, onToggle }: { isYearly: boolean; onToggle: () => void }) => (
  <div className="flex justify-center items-center gap-4 mb-8 relative z-10">
    <span className={`text-sm font-medium ${!isYearly ? "text-white" : "text-white/50"}`}>
      Monthly
    </span>
    <motion.button
      className="w-16 h-8 flex items-center bg-white/10 rounded-full p-1 border-2 border-white/20"
      onClick={onToggle}
    >
      <motion.div
        className="w-6 h-6 bg-white rounded-full"
        animate={{ x: isYearly ? 32 : 0 }}
      />
    </motion.button>
    <span className={`text-sm font-medium ${isYearly ? "text-white" : "text-white/50"}`}>
      Yearly
    </span>
    {isYearly && (
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-violet-400 font-medium text-sm"
      >
        Save 20%
      </motion.span>
    )}
  </div>
);

const PricingCard = ({
  plan,
  isYearly,
  index,
  isLoggedIn,
  currentPlanName,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
  isLoggedIn: boolean;
  currentPlanName: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const previousPrice = !isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  
  const isCurrentPlan = isLoggedIn && plan.name === currentPlanName;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        rotateX,
        rotateY,
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        mouseX.set((e.clientX - centerX) / rect.width);
        mouseY.set((e.clientY - centerY) / rect.height);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="relative w-full h-full"
    >
      <div 
        className={cn(
          "relative h-full flex flex-col rounded-3xl p-8 backdrop-blur-md transition-colors",
          plan.isPopular 
            ? "bg-[#0a0a0e] border-2 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.2)]" 
            : "bg-white/[0.02] border border-white/10 hover:bg-white/[0.04]"
        )}
        style={{ transform: "translateZ(30px)" }}
      >
        {plan.isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="bg-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              Most Popular
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
          {plan.description && (
            <p className="text-white/50 text-sm mt-2">{plan.description}</p>
          )}
          <div className="flex items-baseline gap-2 mt-6">
            <span className="text-5xl font-bold text-white">
              $<Counter from={previousPrice} to={currentPrice} />
            </span>
            <span className="text-white/50 font-medium">
              /{isYearly ? "year" : "month"}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <ul className="space-y-4 mb-8 flex-1">
            {plan.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + i * 0.05 }}
                className="flex items-start gap-3 text-white/80"
              >
                <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <div className="space-y-3 mt-auto">
             {isCurrentPlan ? (
               <button
                 disabled
                 className="w-full py-4 rounded-full font-bold flex items-center justify-center transition-all bg-white/5 text-white/50 border border-white/10 cursor-not-allowed"
               >
                 Current Plan
               </button>
             ) : (
               <>
                 <button
                   onClick={() => {
                     if (plan.name === "Pulse Pro") window.location.href = "/checkout?plan=pro";
                     if (plan.name === "Pulse Elite") window.location.href = "/checkout?plan=elite";
                   }}
                   className={cn(
                     "w-full py-4 rounded-full font-bold flex items-center justify-center transition-all",
                     plan.isPopular 
                       ? "bg-violet-500 text-white hover:bg-violet-600 shadow-lg" 
                       : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                   )}
                 >
                   {plan.buttonText || "Get Started"} <MoveRight className="w-4 h-4 ml-2" />
                 </button>
                 
                 {plan.trialText && (
                    <button className="w-full py-2 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
                      {plan.trialText}
                    </button>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const defaultPlans: PricingPlan[] = [
  {
    name: "Basic",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Everything you need to build your gaming identity.",
    features: [
      "Claim your custom @handle",
      "Unlimited social links & embeds",
      "Steam, Discord & Spotify integration",
      "Basic themes & colors",
      "Join unlimited Squads"
    ],
    isPopular: false,
    buttonText: "Get Started for Free"
  },
  {
    name: "Pulse Pro",
    monthlyPrice: 3,
    yearlyPrice: 30,
    description: "Level up your profile with premium cosmetics.",
    features: [
      "Everything in Basic",
      "Live video & GIF backgrounds",
      "Custom glowing profile badges",
      "Drag & Drop Bento Grid layout",
      "Advanced visitor analytics",
      "Create up to 3 Squads"
    ],
    isPopular: true,
    buttonText: "Upgrade to Pro",
    trialText: "Start 30-day Free Trial"
  },
  {
    name: "Pulse Elite",
    monthlyPrice: 8,
    yearlyPrice: 80,
    description: "The ultimate flex for hardcore creators.",
    features: [
      "Everything in Pro",
      "Live PC Sync (Discord RPC bridge)",
      "Interactive WebGL & 3D Shaders",
      "Interactive AI Profile Assistant",
      "Custom cursor & weather overlays",
      "Verified checkmark & VIP Support"
    ],
    isPopular: false,
    buttonText: "Go Elite",
    trialText: "Start 14-day Free Trial"
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Defaulting to Basic plan for logged in users since we haven't built Stripe yet
  const [currentPlanName, setCurrentPlanName] = useState("Basic");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080c] font-sans selection:bg-violet-500/30 pb-32 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] bg-violet-500/[0.04] blur-[150px] rounded-full mix-blend-screen"
         />
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-500/[0.03] blur-[120px] rounded-full mix-blend-screen"
         />
      </div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <PricingHeader title="Simple, Transparent Pricing" />
        <PricingToggle isYearly={isYearly} onToggle={() => setIsYearly(!isYearly)} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {defaultPlans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              index={index}
              isLoggedIn={isLoggedIn}
              currentPlanName={currentPlanName}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
