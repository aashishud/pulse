import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized (Fast Refresh safe)
if (!admin.apps.length) {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        
        // Handle escaped newlines from environment variables
        const privateKey = process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n')
            : undefined;

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("🔥 Firebase Admin Initialized Successfully!");
        } else {
            console.error("⚠️ Firebase Admin Init Failed: Missing Service Account Credentials in .env.local!");
            console.error("Please add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
        }
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
