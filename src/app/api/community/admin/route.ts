import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json();
    const { action, communityHandle, targetUid, messageId, value, channelId, channelName } = body;

    if (!communityHandle) {
      return NextResponse.json({ error: "Missing communityHandle" }, { status: 400 });
    }

    // Fetch community data & verify admin/owner
    const commDoc = await adminDb.collection("communities").doc(communityHandle).get();
    if (!commDoc.exists) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const commData = commDoc.data()!;
    const isOwner = commData.owner_uid === uid;
    const isAdmin = isOwner || (commData.admins || []).includes(uid);

    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const commRef = adminDb.collection("communities").doc(communityHandle);

    switch (action) {
      case "delete-message": {
        if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
        const usersSnap = await adminDb.collection("users").where("owner_uid", "==", uid).limit(1).get();
        const adminUsername = usersSnap.empty ? "admin" : usersSnap.docs[0].id;

        const ch = channelId || "general";
        await adminRtdb.ref(`community-chat/${communityHandle}/channels/${ch}/messages/${messageId}`).update({
          deleted: true,
          deletedBy: "admin",
          deletedByUsername: adminUsername,
          text: "",
        });
        return NextResponse.json({ success: true });
      }

      case "kick": {
        if (!targetUid) return NextResponse.json({ error: "Missing targetUid" }, { status: 400 });
        if (targetUid === commData.owner_uid) return NextResponse.json({ error: "Cannot kick the owner" }, { status: 400 });

        const newMembers = (commData.members || []).filter((m: string) => m !== targetUid);
        const newAdmins = (commData.admins || []).filter((a: string) => a !== targetUid);
        await commRef.update({ members: newMembers, memberCount: newMembers.length, admins: newAdmins });
        return NextResponse.json({ success: true });
      }

      case "ban": {
        if (!targetUid) return NextResponse.json({ error: "Missing targetUid" }, { status: 400 });
        if (targetUid === commData.owner_uid) return NextResponse.json({ error: "Cannot ban the owner" }, { status: 400 });

        const newMembers = (commData.members || []).filter((m: string) => m !== targetUid);
        const newAdmins = (commData.admins || []).filter((a: string) => a !== targetUid);
        const banned = [...new Set([...(commData.banned || []), targetUid])];
        await commRef.update({ members: newMembers, memberCount: newMembers.length, admins: newAdmins, banned });
        return NextResponse.json({ success: true });
      }

      case "unban": {
        if (!targetUid) return NextResponse.json({ error: "Missing targetUid" }, { status: 400 });
        const banned = (commData.banned || []).filter((b: string) => b !== targetUid);
        await commRef.update({ banned });
        return NextResponse.json({ success: true });
      }

      case "promote": {
        if (!targetUid) return NextResponse.json({ error: "Missing targetUid" }, { status: 400 });
        if (!isOwner) return NextResponse.json({ error: "Only owner can promote" }, { status: 403 });
        const admins = [...new Set([...(commData.admins || []), targetUid])];
        await commRef.update({ admins });
        return NextResponse.json({ success: true });
      }

      case "demote": {
        if (!targetUid) return NextResponse.json({ error: "Missing targetUid" }, { status: 400 });
        if (!isOwner) return NextResponse.json({ error: "Only owner can demote" }, { status: 403 });
        const admins = (commData.admins || []).filter((a: string) => a !== targetUid);
        await commRef.update({ admins });
        return NextResponse.json({ success: true });
      }

      case "toggle-private": {
        if (!isOwner) return NextResponse.json({ error: "Only owner can change privacy" }, { status: 403 });
        await commRef.update({ isPrivate: !!value });
        return NextResponse.json({ success: true });
      }

      case "create-channel": {
        if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        if (!channelName) return NextResponse.json({ error: "Missing channelName" }, { status: 400 });
        const id = channelName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").substring(0, 30);
        const channels = commData.channels || [{ id: "general", name: "general" }];
        if (channels.find((c: any) => c.id === id)) return NextResponse.json({ error: "Channel already exists" }, { status: 400 });
        channels.push({ id, name: channelName.toLowerCase().substring(0, 30) });
        await commRef.update({ channels });
        return NextResponse.json({ success: true, channelId: id });
      }

      case "delete-channel": {
        if (!isOwner) return NextResponse.json({ error: "Only owner can delete channels" }, { status: 403 });
        if (!channelId || channelId === "general") return NextResponse.json({ error: "Cannot delete general channel" }, { status: 400 });
        const channels = (commData.channels || []).filter((c: any) => c.id !== channelId);
        await commRef.update({ channels });
        await adminRtdb.ref(`community-chat/${communityHandle}/channels/${channelId}`).remove();
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
