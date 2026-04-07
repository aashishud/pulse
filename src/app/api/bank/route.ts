import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET or CREATE the user's game profile
export async function POST(request: Request) {
  try {
    const { firebaseUid, username } = await request.json();

    if (!firebaseUid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

    // 1. Try to find the user
    let { data: userAccount, error: fetchError } = await supabaseAdmin
      .from('network_users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    // 2. If they don't exist, create a new game profile with starter stats!
    if (!userAccount && fetchError?.code === 'PGRST116') {
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from('network_users')
        .insert([{ 
            firebase_uid: firebaseUid, 
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
    return NextResponse.json({ message: "Found", data: userAccount });

  } catch (error: any) {
    console.error("Bank API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE the user's game profile (Balance, Energy, Path)
export async function PATCH(request: Request) {
  try {
    const { firebaseUid, updates } = await request.json();

    if (!firebaseUid || !updates) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('network_users')
      .update(updates)
      .eq('firebase_uid', firebaseUid)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Updated", data });

  } catch (error: any) {
    console.error("Bank API PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}