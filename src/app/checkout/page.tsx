"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Shield, Zap, Users, ArrowRight, Lock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  trialDays: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') === 'elite' ? 'elite' : 'pro';
  
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [licenseCode, setLicenseCode] = useState('');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
         try {
            const q = query(collection(db, "users"), where("owner_uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
               setUserProfile(querySnapshot.docs[0].data());
            }
         } catch (e) {
            console.error("Error fetching profile", e);
         }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Basic',
      price: 0,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'Everything you need to build your gaming identity.',
      icon: <Zap className="w-5 h-5" />,
      trialDays: 0,
      features: [
        { text: 'Custom @handle', included: true },
        { text: 'Social links & embeds', included: true },
        { text: 'Discord & Steam integration', included: true },
        { text: 'Basic themes', included: true },
        { text: 'Live video backgrounds', included: false },
        { text: 'Discord RPC PC Sync', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pulse Pro',
      price: billingCycle === 'monthly' ? 3 : 30,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'Level up your profile with premium cosmetics.',
      icon: <Users className="w-5 h-5" />,
      popular: true,
      trialDays: 30,
      features: [
        { text: 'Custom @handle', included: true },
        { text: 'Live video & GIF backgrounds', included: true },
        { text: 'Custom glowing badges', included: true },
        { text: 'Bento Grid Layout', included: true },
        { text: 'Advanced visitor analytics', included: true },
        { text: 'Discord RPC PC Sync', included: false },
      ],
    },
    {
      id: 'elite',
      name: 'Pulse Elite',
      price: billingCycle === 'monthly' ? 8 : 80,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'The ultimate flex for hardcore creators.',
      icon: <Shield className="w-5 h-5" />,
      trialDays: 14,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Live PC Sync (Discord RPC)', included: true },
        { text: 'Interactive WebGL Shaders', included: true },
        { text: 'AI Profile Assistant', included: true },
        { text: 'Custom cursor overlays', included: true },
        { text: 'Verified checkmark', included: true },
      ],
    },
  ];

  const selectedPlanData = plans.find((p) => p.id === selectedPlan) || plans[1];
  const discount = billingCycle === 'yearly' ? selectedPlanData.price * 0.1 : 0;
  const total = selectedPlanData.price - discount;

  const handleStartTrial = async () => {
    if (!user) return;
    setIsProcessing(true);
    setMessage(null);
    try {
       const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
       const querySnapshot = await getDocs(q);
       if (querySnapshot.empty) {
          throw new Error("User profile not found. Please set up your profile first.");
       }
       const userDocId = querySnapshot.docs[0].id;
       const userRef = doc(db, "users", userDocId);
       const expiresAt = new Date();
       expiresAt.setDate(expiresAt.getDate() + selectedPlanData.trialDays);
       
       await setDoc(userRef, {
          plan: selectedPlanData.name,
          planExpiresAt: expiresAt.toISOString(),
          owner_uid: user.uid // Satisfies your security rule
       }, { merge: true });
       
       setMessage({ type: 'success', text: `Success! Your ${selectedPlanData.trialDays}-day free trial for ${selectedPlanData.name} is active.` });
       
       setTimeout(() => {
          router.push('/dashboard?tab=premium');
       }, 1500);
    } catch (error: any) {
       console.error("Trial error:", error);
       setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
    setIsProcessing(false);
  };

  const handleApplyLicense = async () => {
    if (!user || !licenseCode.trim()) return;
    setIsProcessing(true);
    setMessage(null);
    
    try {
      const code = licenseCode.trim().toUpperCase();
      const unredeemedRef = doc(db, "licenses_unredeemed", code);
      const licenseSnap = await getDoc(unredeemedRef);
      
      if (!licenseSnap.exists()) {
         // Also check if they mistakenly tried an already redeemed code for a better error message
         const redeemedRefCheck = doc(db, "licenses_redeemed", code);
         const redeemedSnap = await getDoc(redeemedRefCheck);
         
         if (redeemedSnap.exists()) {
            setMessage({ type: 'error', text: 'This license code has already been redeemed.' });
         } else {
            setMessage({ type: 'error', text: 'Invalid license code.' });
         }
         setIsProcessing(false);
         return;
      }
      
      const licenseData = licenseSnap.data();
      
      // Move the document to the redeemed collection
      const redeemedRef = doc(db, "licenses_redeemed", code);
      
      await setDoc(redeemedRef, {
         ...licenseData,
         redeemed: true,
         redeemedBy: user.uid,
         redeemedAt: new Date().toISOString()
      });
      
      // Delete from unredeemed
      await deleteDoc(unredeemedRef);
      
      // Upgrade the user
      const q = query(collection(db, "users"), where("owner_uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
         setMessage({ type: 'error', text: 'User profile not found. Please set up your profile first.' });
         setIsProcessing(false);
         return;
      }
      const userDocId = querySnapshot.docs[0].id;
      const userRef = doc(db, "users", userDocId);
      const updates: any = { 
         plan: licenseData.tier,
         owner_uid: user.uid // Satisfies your security rule
      };
      if (licenseData.durationDays) {
         const expiresAt = new Date();
         expiresAt.setDate(expiresAt.getDate() + licenseData.durationDays);
         updates.planExpiresAt = expiresAt.toISOString();
      } else {
         updates.planExpiresAt = null; // lifetime
      }
      
      await setDoc(userRef, updates, { merge: true });
      
      setMessage({ type: 'success', text: `Success! You upgraded to ${licenseData.tier}.` });
      setLicenseCode('');
      
      setTimeout(() => {
         router.push('/dashboard?tab=premium');
      }, 1500);
    } catch (error: any) {
      console.error("License error:", error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#08080c] font-sans text-white pb-32">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-[20%] w-[600px] h-[600px] bg-violet-500/[0.03] blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-500/[0.02] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-violet-500/20 text-violet-400 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Zap className="w-3 h-3 mr-1" />
            Upgrade Profile
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Start your journey with us. Cancel anytime, no questions asked.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-[10px] uppercase tracking-wider bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                Save 10%
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Plan Selection Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-white/90">Select a plan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative cursor-pointer transition-all duration-300 rounded-[24px] bg-[#0a0a0e] border ${
                    selectedPlan === plan.id
                      ? 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] scale-[1.02]'
                      : 'border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-violet-500/20 rounded-xl text-violet-400">
                        {plan.icon}
                      </div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-white/40 mb-4 h-10">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-white/40">{plan.period}</span>
                    </div>
                    <div className="h-px w-full bg-white/5 mb-4" />
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-3 text-sm font-medium ${
                            feature.included ? 'text-white/80' : 'text-white/30 line-through'
                          }`}
                        >
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${feature.included ? 'text-violet-400' : 'text-white/20'}`} />
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment / License Form */}
            <div className="mt-8 p-8 bg-white/[0.02] border border-white/[0.04] rounded-[32px] relative overflow-hidden">
              {!authLoading && !user && (
                 <div className="absolute inset-0 z-20 bg-[#08080c]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border border-white/10 rounded-[32px]">
                    <Shield className="w-12 h-12 text-violet-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Create an account first</h3>
                    <p className="text-white/50 mb-6 max-w-sm">You need a free Pulse account to upgrade and customize your profile.</p>
                    <Link href="/signup" className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                       Sign Up for Free
                    </Link>
                 </div>
              )}

              {userProfile?.plan ? (
                 <div className="absolute inset-0 z-20 bg-[#08080c]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border border-white/10 rounded-[32px]">
                    <Check className="w-12 h-12 text-green-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Already Subscribed!</h3>
                    <p className="text-white/50 mb-6 max-w-sm">You currently have an active <strong>{userProfile.plan}</strong> subscription.</p>
                    <Link href="/dashboard?tab=premium" className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                       Manage Subscription
                    </Link>
                 </div>
              ) : null}

              <h2 className="text-2xl font-bold mb-6 text-white/90">Account Details</h2>
              <div className="space-y-6 relative z-10">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/30 mt-2 flex items-center gap-1"><Lock className="w-3 h-3"/> Locked to your authenticated Pulse account.</p>
                </div>

                <div className="h-px w-full bg-white/5 my-2" />
                
                {message && (
                   <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{message.text}</p>
                   </div>
                )}

                {/* Redeem License */}
                <div>
                  <label htmlFor="licenseCode" className="block text-sm font-medium text-white/60 mb-2 flex items-center justify-between">
                     <span>License / Promo Code</span>
                     <span className="text-xs text-violet-400 font-bold">Boost Discord for a free code!</span>
                  </label>
                  <div className="flex gap-3">
                     <input
                       id="licenseCode"
                       placeholder="Enter code here..."
                       value={licenseCode}
                       onChange={(e) => setLicenseCode(e.target.value)}
                       className="flex-1 bg-[#08080c] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors uppercase"
                     />
                     <button
                        onClick={handleApplyLicense}
                        disabled={isProcessing || !licenseCode.trim()}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center min-w-[100px]"
                     >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Redeem"}
                     </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 p-8 bg-[#0a0a0e] border border-white/[0.04] rounded-[32px] shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-white">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Plan</span>
                  <span className="font-bold text-white">{selectedPlanData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Billing</span>
                  <span className="font-bold text-white capitalize">{billingCycle}</span>
                </div>
                <div className="h-px w-full bg-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="font-bold text-white">${selectedPlanData.price}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-400 font-medium">
                    <span>Yearly discount (10%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px w-full bg-white/5" />
                <div className="flex justify-between text-xl font-bold text-white pt-2">
                  <span>Total Due Today</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-sm text-white/50">
                  <span>After {selectedPlanData.trialDays} days</span>
                  <span>${total.toFixed(2)}{selectedPlanData.period}</span>
                </div>
              </div>

              <button 
                onClick={handleStartTrial}
                disabled={isProcessing || !user || userProfile?.plan}
                className="w-full mb-4 py-4 rounded-2xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-bold text-lg flex items-center justify-center transition-colors shadow-lg"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : userProfile?.plan ? 'Already Subscribed' : `Start ${selectedPlanData.trialDays}-Day Free Trial`}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/40">
                <Lock className="w-3 h-3" />
                <span>No credit card required for beta</span>
              </div>

              <div className="h-px w-full bg-white/5 my-6" />

              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white/80">What's included:</h3>
                <ul className="space-y-3">
                  {selectedPlanData.features
                    .filter((f) => f.included)
                    .map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/60 font-medium">{feature.text}</span>
                      </li>
                    ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
   return (
      <Suspense fallback={<div className="min-h-screen bg-[#08080c] flex items-center justify-center text-white/50">Loading...</div>}>
         <CheckoutContent />
      </Suspense>
   );
}
