Pulse & Pulse Network ⚡

Pulse is a dual-platform web application built with Next.js.

At its core, Pulse is a sleek, modern "link-in-bio" profile builder. However, connected directly to these profiles is the Pulse Network, a gamified MMO life economy and tycoon simulator that turns your profile into a fully playable Wall Street experience.

🚀 Features

Core App: Pulse Profiles (pulsegg.in)

Custom Profile Builder: Create and customize a personal landing page.

Theme Engine: Switch between various dark/light modes and custom aesthetics.

Link Management: Add, edit, and track social links and portfolios.

Firebase Integration: Secure authentication and fast document storage for user profiles.

Subdomain App: Pulse Network (network.pulsegg.in)

Gamified Wall Street: A dark-mode, high-end trading terminal aesthetic inspired by Bloomberg Terminals and GTA Online.

Class Selection: Choose your playstyle:

⚡ The Street Hustler: Active gameplay. Complete "cookie-clicker" style mini-games to earn money, manage energy, and buy coffee to keep grinding.

💼 Corporate Worker: Passive gameplay. Earn a steady drip of income, but face insanely difficult "Boss Tasks" to earn promotions.

Dynamic Economy: Real-time net worth tracking, liquid cash management, and daily automated tax/rent deductions based on your chosen city.

Credit System: A dynamic FICO score that dictates your ability to take loans and buy high-end assets.

🛠️ Tech Stack & Architecture

This project utilizes a unique "Hybrid Backend" approach to maximize security and relational data structures:

Frontend: Next.js (App Router), React, Tailwind CSS, Lucide Icons.

Custom UI: Zero-dependency custom SVG charts (Area Charts & Radial Progress) for maximum performance.

Authentication: Firebase Auth. Handles secure user login, Google OAuth, and session persistence.

Social Database: Firebase Firestore. Stores standard profile data (links, bios, themes).

Game Economy Database: Supabase (PostgreSQL). Handles the complex math, transactional integrity, and relational data required for an MMO economy (balances, energy, assets).

The Auth Bridge

Because Firebase handles Auth but Supabase handles the Game Data, we built a secure Next.js API Route (/api/bank) that acts as a secure bridge. It accepts the Firebase UID from the client, securely connects to Supabase using a hidden Server Role Key, and fetches/updates the PostgreSQL game state without exposing database credentials to the browser.

💻 Getting Started

Prerequisites

Node.js 18+

A Firebase Project

A Supabase Project

Installation

Clone the repository:

git clone [https://github.com/yourusername/pulse.git](https://github.com/yourusername/pulse.git)
cd pulse


Install dependencies:

npm install


Set up your environment variables. Create a .env.local file in the root:

# Firebase Config (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase Config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_admin_key # KEEP SECRET!


Set up the Supabase Table via SQL Editor:

CREATE TABLE network_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  username TEXT,
  bank_balance DECIMAL DEFAULT 0.00,
  fico_score INTEGER DEFAULT 700,
  energy INTEGER DEFAULT 100,
  player_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);


Run the development server:

npm run dev


Open http://localhost:3000 for the main profile app, or http://network.localhost:3000 for the game dashboard.

📜 License

Distributed under the MIT License.
