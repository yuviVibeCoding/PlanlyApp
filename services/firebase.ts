import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// We use hardcoded values as fallbacks to ensure the app works immediately
// without relying solely on environment variable loading mechanics.

const env = (import.meta as any).env || {};

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyD-ydw36RUhFt0TFiS7wk79s0g3fex1fpE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "planly-48835.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "planly-48835",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "planly-48835.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "222090180796",
  appId: env.VITE_FIREBASE_APP_ID || "1:222090180796:web:dc3174c194860da614f8b9"
};

let app;
let db: any;

try {
    // Only initialize if we have a valid config
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE") {
        app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        console.log("Firebase Initialized for project:", FIREBASE_CONFIG.projectId);
    } else {
        console.warn("Firebase Config missing or default. Check services/firebase.ts");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export { db };
export const isConfigured = !!db;