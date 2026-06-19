"use client";

import {
  Tick02Icon,
  Add01Icon,
  MinusSignIcon,
  UserStoryIcon,
  CreditCardIcon,
  GiftIcon,
  ArrowLeft01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const plans = [
  {
    id: "pro",
    name: "Pulse Pro",
    description: "pro",
    monthlyPrice: 2.99,
    yearlyPrice: 24.99, // roughly $2.08/mo
    features: [
      "Animated Backgrounds & Shaders",
      "Custom Cursors",
      "Remove Watermark",
      "Live Spotify / Steam Rich Presence",
    ],
  },
  {
    id: "elite",
    name: "Pulse Elite",
    description: "elite",
    monthlyPrice: 4.99,
    yearlyPrice: 44.99, // roughly $3.75/mo
    features: [
      "Everything in Pro",
      "Custom Domain (pulse.gg/yourname)",
      "Premium Glowing Badges",
      "Priority Support",
      "Early Access to Features",
    ],
  },
];

const TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export default function CheckoutModal({ 
  onClose, 
  userDoc,
  defaultPlan = "pro"
}: { 
  onClose: () => void,
  userDoc: any,
  defaultPlan?: string
}) {
  const router = useRouter();
  const [step, setStep] = useState<"plans" | "payment">("plans");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"license" | "stripe">("license");
  const [licenseCode, setLicenseCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!;
  const currentPrice = billingCycle === "monthly" ? selectedPlanData.monthlyPrice : selectedPlanData.yearlyPrice;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError("");

    if (paymentMethod === "stripe") {
       setError("Stripe checkout is coming soon! Please use a license key.");
       setIsProcessing(false);
       return;
    }

    // License Redemption Logic
    try {
       const code = licenseCode.trim().toUpperCase();

       if (code === "PULSE-TEST-30") {
          const userRef = doc(db, "users", userDoc.id);
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + 30);
          
          await updateDoc(userRef, {
             plan: selectedPlan === "pro" ? "pro" : "elite",
             planExpiresAt: expiresAt.toISOString()
          });
          
          onClose();
          window.location.href = "/dashboard?tab=premium";
          return;
       }

       const unredeemedRef = doc(db, "licenses_unredeemed", code);
       const licenseSnap = await getDoc(unredeemedRef);

       if (!licenseSnap.exists()) {
          const redeemedRefCheck = doc(db, "licenses_redeemed", code);
          const redeemedSnap = await getDoc(redeemedRefCheck);
          
          if (redeemedSnap.exists()) {
             setError("This license code has already been redeemed.");
          } else {
             setError("Invalid license code.");
          }
          setIsProcessing(false);
          return;
       }

       const licenseData = licenseSnap.data();
       const redeemedRef = doc(db, "licenses_redeemed", code);

       // Optional: you could force the license's tier to match `selectedPlan` 
       // but typically a license code implies a specific tier. We'll use the license's tier.
       await setDoc(redeemedRef, {
          ...licenseData,
          redeemed: true,
          redeemedBy: auth.currentUser?.uid || userDoc.id,
          redeemedAt: new Date().toISOString()
       });
       await deleteDoc(unredeemedRef);

       const userRef = doc(db, "users", userDoc.id);
       const updates: any = { plan: licenseData.tier || selectedPlan };

       if (licenseData.durationSeconds) {
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + licenseData.durationSeconds);
          updates.planExpiresAt = expiresAt.toISOString();
       } else if (licenseData.durationDays) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + licenseData.durationDays);
          updates.planExpiresAt = expiresAt.toISOString();
       } else {
          updates.planExpiresAt = null;
       }

       await updateDoc(userRef, updates);
       onClose();
       window.location.href = "/dashboard?tab=premium";
    } catch (err) {
       console.error(err);
       setError("Failed to apply license. Try again.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[450px] bg-[#111115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#15151a]">
           <div className="flex items-center gap-3">
              {step === "payment" && (
                 <button onClick={() => setStep("plans")} className="text-white/50 hover:text-white transition">
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                 </button>
              )}
              <h2 className="text-lg font-bold text-white">
                 {step === "plans" ? "Select a Plan" : "Checkout"}
              </h2>
           </div>
           <button onClick={onClose} className="text-white/50 hover:text-white transition text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
           {step === "plans" && (
             <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex flex-col gap-6"
             >
                {/* Billing Toggle */}
                <div className="bg-[#1a1a20] p-1 h-12 w-full rounded-xl ring-1 ring-white/10 flex">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 h-full rounded-lg text-sm font-medium relative transition-colors duration-300 ${
                      billingCycle === "monthly" ? "text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {billingCycle === "monthly" && (
                      <motion.div
                        layoutId="tab-bg"
                        className="absolute inset-0 bg-[#25252d] rounded-lg shadow-sm ring-1 ring-white/10"
                        transition={TRANSITION}
                      />
                    )}
                    <span className="relative z-10">Monthly</span>
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 h-full rounded-lg text-sm font-medium relative transition-colors duration-300 flex items-center justify-center gap-2 ${
                      billingCycle === "yearly" ? "text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {billingCycle === "yearly" && (
                      <motion.div
                        layoutId="tab-bg"
                        className="absolute inset-0 bg-[#25252d] rounded-lg shadow-sm ring-1 ring-white/10"
                        transition={TRANSITION}
                      />
                    )}
                    <span className="relative z-10">Yearly</span>
                    <span className="relative z-10 bg-indigo-500 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase text-white tracking-tight whitespace-nowrap">
                      Save 16%
                    </span>
                  </button>
                </div>

                {/* Plans List */}
                <div className="flex flex-col gap-3">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className="relative cursor-pointer"
                      >
                        <div
                          className={`relative rounded-xl bg-[#15151a] border transition-colors duration-300 ${
                            isSelected ? "z-10 border-indigo-500 border-2" : "border-white/5"
                          }`}
                        >
                          <div className="p-5">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="mt-1 shrink-0">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                      isSelected ? "border-indigo-500" : "border-white/20"
                                    }`}
                                  >
                                    <AnimatePresence mode="wait" initial={false}>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          exit={{ scale: 0 }}
                                          className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                                          transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.2 }}
                                        />
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-white leading-tight">
                                    {plan.name}
                                  </h3>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-white flex items-center justify-end">
                                  US$
                                  <NumberFlow value={price} format={{ style: "decimal", minimumFractionDigits: 2 }} />
                                </div>
                                <div className="text-xs text-white/50 flex items-center justify-end gap-1 mt-1">
                                  {billingCycle === "monthly" ? "/Month" : "/Year"}
                                </div>
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {isSelected && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                  className="overflow-hidden w-full"
                                >
                                  <div className="pt-6 flex flex-col gap-6">
                                    <div className="flex flex-col gap-3.5">
                                      {plan.features.map((feature, idx) => (
                                        <motion.div
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                                          key={idx}
                                          className="flex items-start gap-3 text-sm text-white/80"
                                        >
                                          <HugeiconsIcon icon={Tick02Icon} size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                          {feature}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

             </motion.div>
           )}

           {step === "payment" && (
             <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="flex flex-col gap-6"
             >
                {/* Subscription Details summary */}
                <div className="bg-[#15151a] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold text-white">{selectedPlanData.name}</p>
                      <p className="text-xs text-white/50 mt-1">{billingCycle === "monthly" ? "Monthly Plan" : "Yearly Plan (Save 16%)"}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-white">US${currentPrice.toFixed(2)}</p>
                      <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Total</p>
                   </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                   <h3 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-wider">Payment Method</h3>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                         onClick={() => setPaymentMethod("stripe")}
                         className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${paymentMethod === "stripe" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-[#15151a] border-white/5 text-white/50 hover:bg-[#1a1a20]"}`}
                      >
                         <HugeiconsIcon icon={CreditCardIcon} size={24} />
                         <span className="text-xs font-bold">Credit Card</span>
                      </button>
                      <button 
                         onClick={() => setPaymentMethod("license")}
                         className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${paymentMethod === "license" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-[#15151a] border-white/5 text-white/50 hover:bg-[#1a1a20]"}`}
                      >
                         <HugeiconsIcon icon={GiftIcon} size={24} />
                         <span className="text-xs font-bold">License Key</span>
                      </button>
                   </div>
                </div>

                {/* Payment Input */}
                <div className="mt-2">
                   {paymentMethod === "license" ? (
                      <div className="space-y-3">
                         <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Enter License Code</label>
                         <input 
                            type="text" 
                            placeholder="e.g. PULSE2026"
                            value={licenseCode}
                            onChange={(e) => setLicenseCode(e.target.value)}
                            className="w-full bg-[#15151a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                         />
                         {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <div className="w-full bg-[#15151a] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                            <HugeiconsIcon icon={CreditCardIcon} size={32} className="text-white/20" />
                            <p className="text-sm text-white/50">Stripe checkout integration is coming soon. Please use a license key for now.</p>
                         </div>
                         {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                      </div>
                   )}
                </div>
             </motion.div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#15151a] flex justify-end gap-3 mt-auto">
           <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition"
           >
              Cancel
           </button>
           
           {step === "plans" ? (
              <button 
                 onClick={() => setStep("payment")}
                 className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                 Continue
              </button>
           ) : (
              <button 
                 onClick={handleCheckout}
                 disabled={isProcessing || (paymentMethod === "license" && !licenseCode)}
                 className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center gap-2"
              >
                 {isProcessing ? "Processing..." : (paymentMethod === "license" ? "Redeem License" : `Pay US$${currentPrice.toFixed(2)}`)}
              </button>
           )}
        </div>
      </motion.div>
    </div>
  );
}
