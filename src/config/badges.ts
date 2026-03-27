import { Diamond, Crown, Star, Sparkles, Shield, Zap } from 'lucide-react';

// ==========================================
// PULSE CUSTOM BADGE CONFIGURATION
// ==========================================
// Add a user's lowercase handle to this object to grant them custom badges.
// You can use any Lucide icon, set custom colors, and add glowing drop shadows.

export const customBadges: Record<string, any[]> = {
  "sour": [
    { 
      id: 'premium_diamond', 
      icon: Diamond, 
      color: 'text-white', 
      fill: 'fill-white/20',
      dropShadow: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]',
      tooltip: 'Premium Member' 
    },
    { 
      id: 'founder_crown', 
      icon: Crown, 
      color: 'text-yellow-400', 
      fill: 'fill-yellow-400/20',
      dropShadow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]',
      tooltip: 'Pulse Founder' 
    }
  ],
  "altaccount": [
    {
      id: 'early_star',
      icon: Star,
      color: 'text-purple-400',
      fill: 'fill-purple-400/20',
      tooltip: 'Early Supporter'
    }
  ]
};