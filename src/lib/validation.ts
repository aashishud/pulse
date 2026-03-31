import { Filter } from 'bad-words';

let filter: any;
try {
  filter = new Filter();
} catch (error) {
  // Fallback in case initialization fails (prevents app crash)
  console.warn("Profanity filter failed to load:", error);
  filter = { isProfane: () => false }; 
}

// You can add specific gaming/internet slang here that the package might miss
// if (filter.addWords) filter.addWords('custombadword');

export const RESERVED_HANDLES = [
  // Core App Routes
  'c', 'dashboard', 'login', 'setup', 'api', 'admin', 'root',
  'register', 'signup', 'logout', 'settings', 'profile', 'home',
  
  // Static / Next.js Routes
  'static', 'public', 'assets', 'images', 'icons', '_next', '404', '500',
  
  // Database / Architecture
  'users', 'user', 'communities', 'auth', 'firebase', 'null', 'undefined',
  
  // Brand / Premium
  'pulse', 'pulsegg', 'pulsegg.in', 'pulsepro', 'premium', 'pro', 
  
  // System / Roles
  'support', 'contact', 'help', 'moderator', 'staff', 'team', 'security', 'bot', 'system',
  
  // Common internet & Domain reserves
  'about', 'terms', 'privacy', 'legal', 'blog', 'press', 'jobs', 'www', 'web', 'host'
];

export function validateHandle(username: string): string | null {
  if (!username) return "Handle cannot be empty.";
  
  const lower = username.toLowerCase().trim();
  
  // 1. Length Checks
  if (lower.length < 3) return "Username must be 3+ characters.";
  if (lower.length > 20) return "Username cannot exceed 20 characters.";
  
  // 2. Character Checks (Letters, Numbers, Dashes, Underscores)
  const validCharsRegex = /^[a-zA-Z0-9-_]+$/;
  if (!validCharsRegex.test(lower)) {
    return "Handle can only contain letters, numbers, hyphens, and underscores.";
  }

  // 3. System Reserved Words
  if (RESERVED_HANDLES.includes(lower)) {
    return "This handle is reserved by Pulse and cannot be claimed.";
  }
  
  // 4. Profanity Check (bad-words package)
  if (filter && filter.isProfane(lower)) {
    return "This username contains restricted words.";
  }

  // 5. Extra safety: Check for substrings of extreme slurs that might bypass the filter logic
  const extremeSlurs = ["nigger", "kike", "faggot"]; 
  if (extremeSlurs.some(slur => lower.includes(slur))) {
    return "This username contains restricted words.";
  }

  return null; 
}