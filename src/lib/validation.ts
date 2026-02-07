// FIX: Changed from default import to named import based on the error
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
  "dashboard", "login", "signup", "api", "admin", "settings", 
  "profile", "home", "about", "contact", "support", "help", "pulse",
  "auth", "user", "users", "404", "500", "null", "undefined",
  "moderator", "staff", "team", "security", "bot", "system",
  // ADDED: Domain safety reserves
  "pulsegg", "pulsegg.in", "www", "web", "host"
];

export function validateHandle(username: string): string | null {
  const lower = username.toLowerCase();
  
  // 1. Length Checks
  if (lower.length < 3) return "Username must be 3+ characters.";
  if (lower.length > 20) return "Username is too long.";
  
  // 2. Character Checks (Letters, Numbers, Dashes, Underscores)
  if (!/^[a-zA-Z0-9-_]+$/.test(lower)) return "Only letters, numbers, and dashes allowed.";

  // 3. System Reserved Words
  if (RESERVED_HANDLES.includes(lower)) return "This handle is reserved.";
  
  // 4. Profanity Check (bad-words package)
  if (filter && filter.isProfane(lower)) {
    return "This username contains restricted words.";
  }

  // Extra safety: Check for substrings of extreme slurs that might bypass the filter logic
  const extremeSlurs = ["nigger", "kike", "faggot"]; 
  if (extremeSlurs.some(slur => lower.includes(slur))) {
    return "This username contains restricted words.";
  }

  return null;
}