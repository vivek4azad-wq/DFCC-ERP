import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirebaseApp, getFirestoreInstance } from "./firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AiSource {
  collection: string;
  id: string;
}

export interface AiAnswer {
  answer: string;
  sources?: AiSource[];
  mode?: "firebase-direct" | "firebase+gemini" | "client-gemini" | "offline";
}

const app = getFirebaseApp();
const functions = getFunctions(app, "asia-south1");
const askVivekAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askVivekAi");
const askDfcAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askDfcAi");

/**
 * Fetch Central Gemini API Key from Firestore so it works seamlessly on all computers/devices.
 */
export async function getCentralAiKey(): Promise<string> {
  const localKey = localStorage.getItem("raildiary_gemini_api_key");
  if (localKey && localKey.trim()) return localKey.trim();

  try {
    const db = getFirestoreInstance();
    const snap = await getDoc(doc(db, "system_config", "ai_settings"));
    if (snap.exists()) {
      const data = snap.data();
      const firestoreKey = data?.geminiApiKey || "";
      if (firestoreKey && firestoreKey.trim()) {
        localStorage.setItem("raildiary_gemini_api_key", firestoreKey.trim());
        return firestoreKey.trim();
      }
    }
  } catch (err) {
    console.warn("Could not fetch central AI key from Firestore:", err);
  }
  return "";
}

/**
 * Save Central Gemini API Key to Firestore & LocalStorage
 */
export async function saveCentralAiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (trimmed) {
    localStorage.setItem("raildiary_gemini_api_key", trimmed);
    try {
      const db = getFirestoreInstance();
      await setDoc(doc(db, "system_config", "ai_settings"), {
        geminiApiKey: trimmed,
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin"
      }, { merge: true });
    } catch (err) {
      console.warn("Could not sync central key to Firestore:", err);
    }
  } else {
    localStorage.removeItem("raildiary_gemini_api_key");
    try {
      const db = getFirestoreInstance();
      await setDoc(doc(db, "system_config", "ai_settings"), {
        geminiApiKey: "",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (_) {}
  }
}

/**
 * Main query function for Vivek AI
 */
export async function askVivekAi(question: string): Promise<AiAnswer> {
  // 1. Try Firebase Cloud Function 'askVivekAi'
  try {
    const result = await askVivekAiCallable({ question });
    if (result?.data?.answer) {
      return result.data;
    }
  } catch (_) {
    // 2. Try alias 'askDfcAi'
    try {
      const result = await askDfcAiCallable({ question });
      if (result?.data?.answer) {
        return result.data;
      }
    } catch (_) {}
  }

  // 3. Fallback: Client-side Gemini with Central Key
  const centralKey = await getCentralAiKey();
  if (centralKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${centralKey}`;
      const systemPrompt = `You are "Vivek AI", the dedicated Super Section Engineer & DFCCIL Intelligence Assistant for IMSD SMUN Unit (Civil Engineering / P-Way Section KRJN–SMUN–SBJN–NSIR–SNL, Km 1167.210 to 1249.720, Total 88.679 Km).
Answer the user's question accurately, professionally, and concisely using verified Indian Railway / DFCCIL engineering standards. Reply in clear Hindi / Hinglish.`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nQUESTION: ${question}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { answer: text, mode: "client-gemini" };
        }
      }
    } catch (clientErr) {
      console.warn("Client Gemini fallback error:", clientErr);
    }
  }

  return {
    answer: "Vivek AI: Firebase database aur Google Gemini se connect ho raha hai. Kripya thodi der me query dobara bhejein.",
    mode: "offline"
  };
}

export const askDfcAi = askVivekAi;
