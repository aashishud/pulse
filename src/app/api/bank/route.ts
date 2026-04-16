import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { adminAuth } from '@/lib/firebaseAdmin';

// Helper to verify ID token
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  
  try {
    if (!adminAuth) {
        console.error("Firebase Admin not configured! Denying request.");
        return null;
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// GET or CREATE the user's game profile
export async function POST(request: Request) {
  try {
    const verifiedUid = await verifyAuth(request);
    if (!verifiedUid) return NextResponse.json({ error: "Unauthorized: Invalid or missing token" }, { status: 401 });

    const { username } = await request.json();

    // 1. Try to find the user
    let { data: userAccount, error: fetchError } = await supabaseAdmin
      .from('network_users')
      .select('*')
      .eq('firebase_uid', verifiedUid)
      .single();

    // 2. If they don't exist, create a new game profile with starter stats!
    if (!userAccount && fetchError?.code === 'PGRST116') {
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from('network_users')
        .insert([{ 
            firebase_uid: verifiedUid, 
            username: username || "Unknown Player",
            bank_balance: 150.00, // Give them $150 starter cash
            fico_score: 700,
            energy: 100,
            player_path: null
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ message: "Created", data: newAccount });
    }

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    
    // Auto-sync username if the client provides a fresh one
    if (userAccount && username && userAccount.username !== username && username !== "Agent") {
        await supabaseAdmin.from('network_users').update({ username }).eq('firebase_uid', verifiedUid);
        userAccount.username = username;
    }

    return NextResponse.json({ message: "Found", data: userAccount });

  } catch (error: any) {
    console.error("Bank API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE the user's game profile (Balance, Energy, Path)
export async function PATCH(request: Request) {
  try {
    const verifiedUid = await verifyAuth(request);
    if (!verifiedUid) return NextResponse.json({ error: "Unauthorized: Invalid or missing token" }, { status: 401 });

    const { updates } = await request.json();

    if (!updates) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('network_users')
      .update(updates)
      .eq('firebase_uid', verifiedUid)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Updated", data });

  } catch (error: any) {
    console.error("Bank API PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}