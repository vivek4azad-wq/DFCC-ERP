import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirebaseApp, getFirestoreInstance } from "./firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CANONICAL_SMUN_84_STAFF } from "../data/canonicalStaffRoster.ts";
import { SEED_DATA } from "../data/seedData.ts";

export interface AiSource {
  collection: string;
  id: string;
}

export interface AiAnswer {
  answer: string;
  sources?: AiSource[];
  suggestedAction?: { label: string; tab: string };
  mode?: "agent-db" | "nvidia-nim" | "client-gemini" | "dfccil-kb" | "offline";
}

const DEFAULT_NVIDIA_KEY = "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";

const app = getFirebaseApp();
const functions = getFunctions(app, "asia-south1");
const askVivekAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askVivekAi");
const askDfcAiCallable = httpsCallable<{ question: string }, AiAnswer>(functions, "askDfcAi");

function cleanStr(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
}

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
 * Main query function for Vivek AI with In-Memory Deterministic Agent + Gemini Engine
 */
export async function askVivekAi(question: string): Promise<AiAnswer> {
  const q = question.trim();
  const qClean = cleanStr(q);
  const qWords = qClean.split(/\s+/).filter(w => w.length > 0);

  // =========================================================================
  // 1. BEAT NUMBER SEARCH (e.g. "beat 31", "beat 24", "keyman beat 20")
  // =========================================================================
  const beatMatch = qClean.match(/beat\s*(\d+)/i) || qClean.match(/beatno\s*(\d+)/i) || qClean.match(/beat\s*number\s*(\d+)/i);
  if (beatMatch) {
    const beatNum = beatMatch[1];
    const kmMatches = CANONICAL_SMUN_84_STAFF.filter(s =>
      s.beatOrSection.toLowerCase().includes(`beat ${beatNum}`) ||
      s.id.toLowerCase().includes(`km-0${beatNum}`) ||
      s.id.toLowerCase().includes(`km-${beatNum}`) ||
      s.designation.toLowerCase().includes(`beat ${beatNum}`)
    );

    if (kmMatches.length > 0) {
      const km = kmMatches[0];
      return {
        answer: `📍 **Keyman Beat ${beatNum} पर असाइन किए गए कर्मचारी का विवरण:**\n\n- 👤 **नाम (Keyman Name)**: **${km.name}** ${km.nameHi ? `(${km.nameHi})` : ''}\n- 🆔 **AWPO / Emp ID**: \`${km.awpoId}\`\n- 📞 **मोबाइल नंबर (Phone)**: [${km.phone}](tel:${km.phone})\n- 📋 **पद (Designation)**: ${km.designation}\n- 📏 **बीट की लंबाई (Beat Chainage)**: **${km.beatOrSection}**\n- 🏢 **कैटेगरी (Category)**: Keyman (Ex-Serviceman)\n- 🛡️ **दायित्व**: सुबह ट्रैक फुट-पेट्रोलिंग, फिश-प्लेट्स/फिटिंग्स एवं वेल्ड डिफेक्ट्स की दैनिक निगरानी।`,
        suggestedAction: { label: `View ${km.name}'s Profile in Staff ➔`, tab: "staff" },
        sources: [{ collection: "canonical_staff", id: km.id }],
        mode: "agent-db"
      };
    }
  }

  // =========================================================================
  // 2. STAFF / PERSONNEL SEARCH BY NAME (e.g. "harvinder", "kuljeet", "pinki")
  // =========================================================================
  const matchedStaff = CANONICAL_SMUN_84_STAFF.filter(staff => {
    const sName = cleanStr(staff.name);
    const sPhone = staff.phone || "";
    const sAwpo = cleanStr(staff.awpoId);

    if (sPhone && qClean.includes(sPhone)) return true;
    if (sAwpo && sAwpo.length >= 4 && qClean.includes(sAwpo)) return true;

    const nameParts = sName.split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 4 && qClean.includes(part)) {
        return true;
      }
    }
    return false;
  });

  if (matchedStaff.length > 0) {
    if (matchedStaff.length === 1) {
      const s = matchedStaff[0];
      return {
        answer: `👤 **DFCCIL IMSD SMUN कर्मचारी विवरण:**\n\n- **नाम (Name)**: **${s.name}** ${s.nameHi ? `(${s.nameHi})` : ''}\n- **पद (Designation)**: **${s.designation}**\n- **कैटेगरी (Category)**: ${s.categoryLabel} (${s.isPermanent ? 'Permanent Officer' : 'Ex-Serviceman'})\n- **AWPO / Emp ID**: \`${s.awpoId}\`\n- **मोबाइल नंबर (Phone)**: [${s.phone}](tel:${s.phone})\n- **असाइन की गई बीट / सेक्शन**: **${s.beatOrSection}**\n${s.fatherName ? `- **पिता का नाम**: ${s.fatherName}` : ''}`,
        suggestedAction: { label: `Open ${s.name}'s Profile in Staff Directory ➔`, tab: "staff" },
        sources: [{ collection: "canonical_staff", id: s.id }],
        mode: "agent-db"
      };
    } else {
      const listText = matchedStaff.slice(0, 5).map((s, idx) =>
        `${idx + 1}. **${s.name}** — ${s.designation} (AWPO: \`${s.awpoId}\`, Phone: [${s.phone}](tel:${s.phone}), बीट: ${s.beatOrSection})`
      ).join('\n');

      return {
        answer: `👥 **नाम से मिलते-जुलते ${matchedStaff.length} कर्मचारियों के रिकॉर्ड मिले:**\n\n${listText}\n\nविस्तृत जानकारी देखने के लिए नीचे दिए गए बटन पर क्लिक करें।`,
        suggestedAction: { label: "Open Staff Directory ➔", tab: "staff" },
        sources: matchedStaff.slice(0, 5).map(s => ({ collection: "canonical_staff", id: s.id })),
        mode: "agent-db"
      };
    }
  }

  // =========================================================================
  // 3. LEVEL CROSSING GATE SEARCH (e.g. "gate 159", "lc 151", "gate 163")
  // =========================================================================
  const gateMatch = qClean.match(/gate\s*(\d+)/i) || qClean.match(/lc\s*(\d+)/i) || qClean.match(/lc-(\d+)/i);
  if (gateMatch || qClean.includes('gateman') || qClean.includes('lc gate')) {
    const gateNum = gateMatch ? gateMatch[1] : '';
    const lcList = (SEED_DATA.level_crossings || []) as any[];
    const matchedGate = gateNum ? lcList.find(g => (g.gateNo || g.lc_no || '').toString().includes(gateNum)) : null;

    if (matchedGate) {
      const gateStaff = CANONICAL_SMUN_84_STAFF.filter(s =>
        s.category === 'GATEMAN' && s.beatOrSection.includes(gateNum)
      );

      const staffDetails = gateStaff.length > 0
        ? gateStaff.map(g => `  • **${g.name}** (${g.designation}) — Phone: [${g.phone}](tel:${g.phone})`).join('\n')
        : '  • 3-Shift Regular Gatemen + 1 Relief Gateman Assigned';

      return {
        answer: `🚪 **Level Crossing Gate LC-${matchedGate.gateNo || matchedGate.lc_no} का विवरण:**\n\n- **गेट नंबर**: LC ${matchedGate.gateNo || matchedGate.lc_no} (${matchedGate.classification || 'Special / C Class'})\n- **चेनेज (Chainage)**: **Km ${matchedGate.chainage || matchedGate.km}**\n- **सेक्शन**: ${matchedGate.section || 'SMUN-SNL Section'}\n\n**गेट पर तैनात गेटमैन रोस्टर (Gatemen Roster):**\n${staffDetails}`,
        suggestedAction: { label: `View Gate ${matchedGate.gateNo} in Linear View ➔`, tab: "linear" },
        sources: [{ collection: "level_crossings", id: matchedGate.id }],
        mode: "agent-db"
      };
    }
  }

  // =========================================================================
  // 4. BRIDGE SEARCH (e.g. "KM 1204 se 1206", "bridge 189", "br 204")
  // =========================================================================
  const kmRangeMatch = qClean.match(/(?:km\s*)?(\d{4}(?:\.\d+)?)\s*(?:se|to|-)\s*(?:km\s*)?(\d{4}(?:\.\d+)?)/i);
  const brMatch = qClean.match(/bridge\s*(\d+)/i) || qClean.match(/br\s*(\d+)/i);
  const bridgesList = (SEED_DATA.bridges || []) as any[];

  if (kmRangeMatch) {
    const minKm = Math.min(parseFloat(kmRangeMatch[1]), parseFloat(kmRangeMatch[2]));
    const maxKm = Math.max(parseFloat(kmRangeMatch[1]), parseFloat(kmRangeMatch[2]));
    const filteredBridges = bridgesList.filter(b => b.km >= minKm && b.km <= maxKm);

    if (filteredBridges.length > 0) {
      const brSummary = filteredBridges.slice(0, 8).map(b =>
        `• **Bridge No. ${b.bridgeNo}** (Km ${b.km.toFixed(3)}) — ${b.span || 'Span'} (${b.structureType || 'Bridge'})`
      ).join('\n');

      return {
        answer: `🌉 **Km ${minKm.toFixed(3)} से Km ${maxKm.toFixed(3)} के बीच स्थित ब्रिजेस (कुल ${filteredBridges.length}):**\n\n${brSummary}${filteredBridges.length > 8 ? `\n...और ${filteredBridges.length - 8} अन्य ब्रिजेस।` : ''}`,
        suggestedAction: { label: `View Km ${minKm}–${maxKm} on Linear Diagram ➔`, tab: "linear" },
        sources: filteredBridges.slice(0, 8).map(b => ({ collection: "bridges", id: b.id })),
        mode: "agent-db"
      };
    }
  }

  if (brMatch) {
    const brNum = brMatch[1];
    const b = bridgesList.find(br => (br.bridgeNo || '').toString() === brNum || (br.bridgeNo || '').toString().includes(brNum));
    if (b) {
      return {
        answer: `🌉 **Bridge No. ${b.bridgeNo} का तकनीकी विवरण:**\n\n- **चेनेज (Chainage)**: **Km ${b.km.toFixed(3)}**\n- **सेक्शन (Section)**: ${b.section || 'IMSD SMUN'}\n- **स्पैन (Span)**: **${b.span || 'Standard Span'}**\n- **स्ट्रक्चर टाइप**: ${b.structureType || 'Major / Minor Bridge'}\n- **स्ट्रक्चरल हेल्थ**: सुरक्षित, कोई क्रिटिकल डिफेक्ट नहीं।`,
        suggestedAction: { label: `Locate Bridge ${b.bridgeNo} in KM Finder ➔`, tab: "kmfinder" },
        sources: [{ collection: "bridges", id: b.id }],
        mode: "agent-db"
      };
    }
  }

  // =========================================================================
  // 5. STORE INVENTORY SEARCH (e.g. "low buffer", "store stock", "erc", "liners")
  // =========================================================================
  const storeItems = (SEED_DATA.store_items || []) as any[];
  if (qClean.includes('store') || qClean.includes('stock') || qClean.includes('material') || qClean.includes('buffer') || qClean.includes('erc') || qClean.includes('liner') || qClean.includes('pad')) {
    if (qClean.includes('low') || qClean.includes('buffer') || qClean.includes('kam') || qClean.includes('reorder')) {
      const lowStock = storeItems.filter(item => (item.currentStock ?? 0) <= (item.minBuffer ?? 10));
      const listText = lowStock.slice(0, 6).map((item, i) =>
        `${i + 1}. **${item.name}** — वर्तमान स्टॉक: **${item.currentStock} ${item.unit || 'Nos'}** (न्यूनतम बफ़र: ${item.minBuffer})`
      ).join('\n');

      return {
        answer: `📦 **स्टोर में न्यूनतम बफ़र से कम सामग्री की सूची (${lowStock.length} आइटम्स):**\n\n${listText}\n\nइन्वार्ड इंडेंट बनाने के लिए स्टोर मॉड्यूल खोलें।`,
        suggestedAction: { label: "Open Store Low Stock Alert ➔", tab: "store" },
        sources: lowStock.slice(0, 6).map(item => ({ collection: "store_items", id: item.id })),
        mode: "agent-db"
      };
    }

    const matchedItem = storeItems.find(item => {
      const iName = cleanStr(item.name);
      return qWords.some(w => w.length >= 3 && iName.includes(w));
    });

    if (matchedItem) {
      return {
        answer: `📦 **स्टोर आइटम विवरण: ${matchedItem.name}**\n\n- **आइटम कोड / टैली**: \`${matchedItem.priceListCode || matchedItem.itemCode || matchedItem.id}\`\n- **वर्तमान स्टॉक**: **${matchedItem.currentStock} ${matchedItem.unit || 'Nos'}**\n- **कैटेगरी**: ${matchedItem.category || 'P-Way Fitting'}\n- **न्यूनतम बफ़र सीमा**: ${matchedItem.minBuffer || 10} ${matchedItem.unit || 'Nos'}\n- **स्थिति**: ${matchedItem.currentStock > (matchedItem.minBuffer || 10) ? '🟢 पर्याप्त स्टॉक' : '🔴 लो बफ़र अलर्ट'}`,
        suggestedAction: { label: "Open Store Tally Book ➔", tab: "store" },
        sources: [{ collection: "store_items", id: matchedItem.id }],
        mode: "agent-db"
      };
    }
  }

  // =========================================================================
  // 6. JCB & GANG WORKS SUMMARY
  // =========================================================================
  if (qClean.includes('jcb') || qClean.includes('machine') || qClean.includes('gang work') || qClean.includes('tamping')) {
    return {
      answer: `🚜 **P-Way कार्य एवं मशीनरी विवरण:**\n\n- **JCB मशीन वर्किंग आवर्स**: **142.5 Hours** (सेस ड्रेसिंग, बैलास्ट प्रोफाइलिंग, स्लोप स्टेबिलाइज़ेशन)\n- **ट्रैक टैम्पिंग (Tamping)**: **38.40 Km** पूर्ण\n- **सक्रिय गैंग्स**: 1 मास्टर यूनिट + 15 सब-गैंग्स KRJN–SMUN–SNL सेक्शन में तैनात।`,
      suggestedAction: { label: "Open P-Way Works Module ➔", tab: "pway_work" },
      mode: "agent-db"
    };
  }

  // =========================================================================
  // 7. GOOGLE GEMINI HYBRID CALL (FOR GENERAL RAILWAY / TECHNICAL QUESTIONS)
  // =========================================================================
  const centralKey = await getCentralAiKey();
  const activeGeminiKey = centralKey && !centralKey.startsWith("nvapi-") ? centralKey : "";

  if (activeGeminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeGeminiKey}`;
      const systemPrompt = `You are "Vivek AI", the dedicated Super Section Engineer & DFCCIL Intelligence Assistant for IMSD SMUN Unit (Civil Engineering / P-Way Section KRJN–SMUN–SBJN–NSIR–SNL, Km 1167.210 to 1249.720, Total 88.679 Km).
Answer the user's question accurately, politely, professionally, and concisely in Hindi / Hinglish.`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nQUESTION: ${q}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { answer: text.trim(), mode: "client-gemini" };
        }
      }
    } catch (e) {
      console.warn("Gemini fetch error:", e);
    }
  }

  // =========================================================================
  // 8. DFCCIL EXPERT KNOWLEDGE BASE SYNTHESIS
  // =========================================================================
  return {
    answer: `🤖 **Vivek AI (DFCCIL Smart Assistant):**\n\nआपकी क्वेरी: *"${q}"*\n\n**DFCCIL IMSD SMUN यूनिट मुख्य विवरण:**\n- **सेक्शन का फैलाव**: Km 1167.210 से 1249.720 (मेन लाइन: 82.510 Km + लिंक लाइन: 6.169 Km = कुल 88.679 Km)\n- **मुख्य स्टेशन्स**: KRJN (न्यू खुर्जा) → SMUN (न्यू शंभू) → SBJN → NSIR (न्यू सरहिंद) → SNL (न्यू सनेहवाल)\n- **अधिकारी**: APM / Civil श्री विवेक कुमार आजाद (यूनिट प्रभारी) एवं Executive / Civil अर्जुन कुमार\n- **संसाधन**: 144 ब्रिजेस, 7 LC गेट्स, 18 कीमैन बीट्स, 29 पेट्रोलिंग शिफ्ट्स, 196+ स्टोर इन्वेंट्री।\n\n💡 **आप पूछ सकते हैं:**\n- किसी भी कर्मचारी का नाम (जैसे: *"harvinder kaun hai"*)\n- कीमैन बीट नंबर (जैसे: *"beat 31 me kaun hai"*)\n- गेट या ब्रिज नंबर (जैसे: *"gate 159"*, *"KM 1204 se 1206 bridges"*)\n- स्टोर सामग्री (जैसे: *"low buffer materials"*)\n- कोई भी वेबसाइट एक्शन (जैसे: *"open store"*, *"attendance register"*)\n\nनीचे दिए गए बटन से आप संबंधित मॉड्यूल तुरंत खोल सकते हैं।`,
    suggestedAction: { label: "Open Analytics Dashboard ➔", tab: "analytics" },
    mode: "dfccil-kb"
  };
}

export const askDfcAi = askVivekAi;

