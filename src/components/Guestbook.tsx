"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import Image from 'next/image';

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  authorId: string;
  timestamp: number;
}

export default function Guestbook({ profileId, isOwner, enabled }: { profileId: string, isOwner: boolean, enabled: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));

    // Listen to the 'comments' subcollection
    const q = query(
      collection(db, "users", profileId, "comments"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubComments = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(msgs);
    });

    return () => {
      unsubAuth();
      unsubComments();
    };
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "users", profileId, "comments"), {
        text: newComment.trim(),
        authorName: user.displayName || "Anonymous",
        authorAvatar: user.photoURL || "",
        authorId: user.uid,
        timestamp: Date.now()
      });
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "users", profileId, "comments", commentId));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // If disabled and not the owner, hide the section entirely
  if (!enabled && !isOwner) return null;

  return (
    <div className="bg-[#1e1f22]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" /> Guestbook
        </h3>
        {!enabled && isOwner && (
          <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">Hidden from Public</span>
        )}
      </div>

      {/* Input Form */}
      {user ? (
        enabled ? (
          <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
            <div className="relative w-10 h-10 shrink-0">
               <Image src={user.photoURL || "https://github.com/shadcn.png"} alt="Me" fill className="rounded-full object-cover border border-white/10" unoptimized />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a message..."
                className="w-full bg-[#111214] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition"
              />
              <button 
                type="submit" 
                disabled={submitting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <p className="text-zinc-500 text-sm mb-6 text-center italic">Comments are currently disabled.</p>
        )
      ) : (
        <div className="bg-[#111214] p-4 rounded-xl text-center mb-8 border border-white/5">
          <p className="text-sm text-zinc-400">Please <a href="/login" className="text-white font-bold hover:underline">login</a> to leave a comment.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-zinc-600 text-xs py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
              <div className="relative w-8 h-8 shrink-0">
                <Image 
                  src={comment.authorAvatar || "https://github.com/shadcn.png"} 
                  alt={comment.authorName} 
                  fill 
                  className="rounded-full object-cover bg-zinc-800" 
                  unoptimized 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">{comment.authorName}</span>
                  <span className="text-[10px] text-zinc-600">{new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-300 break-words leading-relaxed">{comment.text}</p>
              </div>
              
              {/* Delete Button (Only visible to Profile Owner) */}
              {isOwner && (
                <button 
                  onClick={() => handleDelete(comment.id)} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition"
                  title="Delete Comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}