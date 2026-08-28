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
  mode?: "firebase-direct" | "nvidia-nim" | "client-gemini" | "offline";
}

const DEFAULT_NVIDIA_KEY = "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";

const app = getFirebaseApp();
const functions = getFunctions(app, "asia-south1");
const askVivekAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askVivekAi");
const askDfcAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askDfcAi");

/**
 * Fetch Central AI API Key (NVIDIA / Gemini) from LocalStorage or Firestore.
 */
export async function getCentralAiKey(): Promise<string> {
  const localKey = localStorage.getItem("raildiary_gemini_api_key") || localStorage.getItem("raildiary_ai_api_key");
  if (localKey && localKey.trim()) return localKey.trim();

  try {
    const db = getFirestoreInstance();
    const snap = await getDoc(doc(db, "system_config", "ai_settings"));
    if (snap.exists()) {
      const data = snap.data();
      const firestoreKey = data?.nvidiaApiKey || data?.geminiApiKey || data?.apiKey || "";
      if (firestoreKey && firestoreKey.trim()) {
        localStorage.setItem("raildiary_ai_api_key", firestoreKey.trim());
        return firestoreKey.trim();
      }
    }
  } catch (err) {
    console.warn("Could not fetch central AI key from Firestore:", err);
  }

  // Default to the user's active NVIDIA Key
  return DEFAULT_NVIDIA_KEY;
}

/**
 * Save Central AI API Key (NVIDIA or Gemini) to Firestore & LocalStorage
 */
export async function saveCentralAiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (trimmed) {
    localStorage.setItem("raildiary_ai_api_key", trimmed);
    localStorage.setItem("raildiary_gemini_api_key", trimmed);
    try {
      const db = getFirestoreInstance();
      await setDoc(doc(db, "system_config", "ai_settings"), {
        apiKey: trimmed,
        nvidiaApiKey: trimmed.startsWith("nvapi-") ? trimmed : "",
        geminiApiKey: trimmed.startsWith("nvapi-") ? "" : trimmed,
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin"
      }, { merge: true });
    } catch (err) {
      console.warn("Could not sync central key to Firestore:", err);
    }
  } else {
    localStorage.removeItem("raildiary_ai_api_key");
    localStorage.removeItem("raildiary_gemini_api_key");
    try {
      const db = getFirestoreInstance();
      await setDoc(doc(db, "system_config", "ai_settings"), {
        apiKey: "",
        nvidiaApiKey: "",
        geminiApiKey: "",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (_) {}
  }
}

/**
 * Main query function for Vivek AI with NVIDIA NIM & Gemini engines
 */
export async function askVivekAi(question: string): Promise<AiAnswer> {
  const centralKey = await getCentralAiKey();
  const activeKey = centralKey || DEFAULT_NVIDIA_KEY;

  const systemPrompt = `You are "Vivek AI", the dedicated Super Section Engineer & DFCCIL Intelligence Assistant for IMSD SMUN Unit (Civil Engineering / P-Way).
Unit Facts:
- Section: KRJN–SMUN–SBJN–NSIR–SNL (Km 1167.210 to 1249.720, Main Line: 82.510 Km, Link Line SMUN-RPJ: 6.169 Km, Total Unit Span: 88.679 Km).
- Leadership: APM / Civil Shri Vivek Kumar Azad (Unit Incharge) & Executive / Civil Arjun Kumar.
- Infrastructure: 144 Bridges, 7 LC Gates, 18 Keyman Beats, 29 Security Patrol Shifts, 161 Turnouts/P&C, 95 Curves, 27 SEJs, Store Inventory with 196+ items.
Respond accurately, politely, professionally, and concisely in Hindi / Hinglish with bullet points where helpful.`;

  // 1. If key is NVIDIA API Key (starts with nvapi-)
  if (activeKey.startsWith("nvapi-")) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question }
          ],
          temperature: 0.2,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return { answer: text.trim(), mode: "nvidia-nim" };
        }
      } else {
        const errText = await response.text();
        console.warn("NVIDIA API response error:", response.status, errText);
      }
    } catch (nvErr) {
      console.warn("NVIDIA NIM fetch error:", nvErr);
    }
  }

  // 2. Try Firebase Cloud Function 'askVivekAi' or 'askDfcAi'
  try {
    const result = await askVivekAiCallable({ question });
    if (result?.data?.answer) {
      return result.data;
    }
  } catch (_) {
    try {
      const result = await askDfcAiCallable({ question });
      if (result?.data?.answer) {
        return result.data;
      }
    } catch (_) {}
  }

  // 3. Fallback: Google Gemini API
  if (activeKey && !activeKey.startsWith("nvapi-")) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
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
    answer: "नमस्ते! Vivek AI (NVIDIA NIM & DFCCIL Intelligence) ऑनलाइन है। आप DFCCIL SMUN यूनिट, ब्रिज, गेट, कीमैन, पेट्रोलिंग या स्टोर इन्वेंट्री के बारे में कोई भी प्रश्न पूछ सकते हैं।",
    mode: "offline"
  };
}

export const askDfcAi = askVivekAi;
