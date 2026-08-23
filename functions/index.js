const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const COLLECTIONS = {
  bridges: "bridges",
  levelCrossings: "level_crossings",
  staff: "officers_staff",
  keymen: "keymen",
  patrol: "patrol_shifts",
  watchmen: "bridge_watchmen",
  stations: "stations",
  points: "points_crossings",
  curves: "curves",
  defects: "track_defects",
  lwr: "lwr",
  sej: "sej",
  storeItems: "store_items",
  storeInventory: "store_inventory",
  storeTransactions: "store_transactions"
};

function s(v) { return String(v ?? "").trim(); }
function lc(v) { return s(v).toLowerCase(); }
function num(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function uniq(arr) {
  const seen = new Set();
  return arr.filter(x => {
    const k = `${x.collection}/${x.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function textOf(data) {
  try { return JSON.stringify(data).toLowerCase(); }
  catch { return ""; }
}
function parseKmRange(q) {
  const nums = [...q.replace(/,/g, ".").matchAll(/\b(1\d{3}(?:\.\d{1,3})?)\b/g)]
    .map(m => Number(m[1]));
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
  return null;
}
function parseExactNumber(q, patterns) {
  for (const re of patterns) {
    const m = q.match(re);
    if (m) return m[1];
  }
  return null;
}
function inKmRange(data, from, to) {
  const a = num(data.fromKm ?? data.from_km ?? data.km ?? data.chainageKm ?? data.chainage);
  const b = num(data.toKm ?? data.to_km ?? data.km ?? data.chainageKm ?? data.chainage);
  if (a === null && b === null) return False;
  const lo = a ?? b, hi = b ?? a;
  return lo <= to && hi >= from;
}

// JS spelling:
const False = false;

async function readCollection(db, collectionName, max = 500) {
  const snap = await db.collection(collectionName).limit(max).get();
  return snap.docs.map(d => ({ collection: collectionName, id: d.id, data: d.data() }));
}

function pickFields(r) {
  const d = r.data || {};
  const preferred = [
    "bridgeNo","bridge_no","bridgeType","category","gateNo","lc_no",
    "name","designation","post","dutyType","beatNo","beatNoText","beatCode",
    "patrolmanName","patrolmanPhone","staffId","awpoId","phone","mobileNo",
    "station","code","pointNo","curveNo","defectCode","title","status",
    "itemCode","itemName","name","description","quantity","qty","stock",
    "balance","currentStock","issuedQty","availableQty",
    "km","fromKm","toKm","chainage","chainageKm","sectionCode","section",
    "remarks","updatedAt"
  ];
  const out = {};
  for (const k of preferred) {
    if (d[k] !== undefined && d[k] !== null && d[k] !== "") out[k] = d[k];
  }
  if (!Object.keys(out).length) {
    for (const [k,v] of Object.entries(d).slice(0,15)) out[k]=v;
  }
  return { collection: r.collection, id: r.id, data: out };
}

async function deterministicSearch(db, question) {
  const q = lc(question);
  const range = parseKmRange(q);
  const lcNo = parseExactNumber(q, [/\blc\s*[-:#]?\s*(\d+[a-z]?)\b/i, /\bgate\s*[-:#]?\s*(\d+[a-z]?)\b/i]);
  const brNo = parseExactNumber(q, [/\bbr(?:idge)?\.?\s*[-:#]?\s*(\d+[a-z\/-]*)\b/i, /\bbridge\s*[-:#]?\s*(\d+[a-z\/-]*)\b/i]);

  let sourceCollections = [];
  if (/\blc\b|level crossing|gate no/.test(q)) sourceCollections.push(COLLECTIONS.levelCrossings);
  if (/bridge|\bbr\b/.test(q)) sourceCollections.push(COLLECTIONS.bridges);
  if (/keyman/.test(q)) sourceCollections.push(COLLECTIONS.keymen);
  if (/patrol|beat/.test(q)) sourceCollections.push(COLLECTIONS.patrol, COLLECTIONS.keymen, COLLECTIONS.staff);
  if (/gateman|staff|employee|officer|mts|executive/.test(q)) sourceCollections.push(COLLECTIONS.staff, COLLECTIONS.levelCrossings);
  if (/watchman/.test(q)) sourceCollections.push(COLLECTIONS.watchmen);
  if (/point|crossing|p&c|turnout/.test(q)) sourceCollections.push(COLLECTIONS.points);
  if (/curve/.test(q)) sourceCollections.push(COLLECTIONS.curves);
  if (/defect|dfwo|weld|usfd/.test(q)) sourceCollections.push(COLLECTIONS.defects);
  if (/\blwr\b/.test(q)) sourceCollections.push(COLLECTIONS.lwr);
  if (/\bsej\b/.test(q)) sourceCollections.push(COLLECTIONS.sej);
  if (/station/.test(q)) sourceCollections.push(COLLECTIONS.stations);
  if (/stock|inventory|torch|item|issue|issued|store|balance|quantity|qty/.test(q)) {
    sourceCollections.push(COLLECTIONS.storeItems, COLLECTIONS.storeInventory, COLLECTIONS.storeTransactions);
  }

  if (!sourceCollections.length) {
    sourceCollections = [
      COLLECTIONS.bridges, COLLECTIONS.levelCrossings, COLLECTIONS.staff,
      COLLECTIONS.keymen, COLLECTIONS.patrol, COLLECTIONS.stations,
      COLLECTIONS.storeItems, COLLECTIONS.storeInventory
    ];
  }

  sourceCollections = [...new Set(sourceCollections)];
  const batches = await Promise.all(sourceCollections.map(c => readCollection(db, c)));
  let rows = batches.flat();

  if (lcNo) {
    rows = rows.filter(r => {
      const d = r.data;
      return [d.gateNo,d.lc_no,d.lcNo,d.id,r.id].some(v => lc(v).replace(/\s+/g,"") === lc(lcNo));
    });
  } else if (brNo) {
    rows = rows.filter(r => {
      const d = r.data;
      return [d.bridgeNo,d.bridge_no,d.oldBridgeNo,d.old_no,r.id].some(v => lc(v).replace(/\s+/g,"") === lc(brNo));
    });
  } else if (range) {
    rows = rows.filter(r => inKmRange(r.data, range[0], range[1]));
  } else {
    const tokens = q.split(/[^\p{L}\p{N}]+/u)
      .filter(x => x.length >= 2)
      .filter(x => !["hai","ka","ki","ke","me","mein","kaha","kahan","kitna","kitni","kitne","show","tell","batao","please"].includes(x));

    rows = rows.map(r => {
      const hay = textOf(r.data) + " " + lc(r.id) + " " + lc(r.collection);
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += Math.min(t.length, 8);
      return { ...r, score };
    }).filter(r => r.score > 0).sort((a,b)=>b.score-a.score);
  }

  rows = uniq(rows).slice(0, 25).map(pickFields);

  let direct = "";
  if (!rows.length) {
    direct = "Firebase me matching record nahi mila.";
  } else if (/how many|kitne|kitni|count|total/.test(q)) {
    direct = `Matching Firebase records: ${rows.length}`;
  } else {
    direct = rows.slice(0,8).map((r,i) =>
      `${i+1}. [${r.collection}/${r.id}] ${Object.entries(r.data).map(([k,v])=>`${k}: ${s(v)}`).join(" | ")}`
    ).join("\n");
  }

  return { rows, direct };
}

async function askGemini(question, rows, direct, apiKey) {
  const prompt = `
You are "Vivek AI", the dedicated Super Section Engineer & DFCCIL Intelligence Assistant for IMSD SMUN Unit (Civil Engineering / P-Way Section KRJN–SMUN–SBJN–NSIR–SNL, Km 1167.210 to 1249.720, Total 88.679 Km).

STRICT OPERATIONAL RULES:
- Use ONLY the real-time Firebase evidence provided below.
- Never invent any staff, bridge, gate, chainage, beat, or inventory quantity.
- If evidence is insufficient, clearly state that the record is not found in the database.
- For exact counts, count only records clearly matching the question.
- For KM ranges, include records whose km/fromKm/toKm overlap the requested range.
- Reply in clear, professional, concise Hindi / Hinglish (or English if the user asked in English).
- Mention verified document IDs like [bridges/BR-170] or [level_crossings/lc_159] where helpful.
- Keep answers formatted with markdown bullet points and emojis.

QUESTION:
${question}

FIREBASE EVIDENCE:
${JSON.stringify(rows, null, 2)}

DIRECT MATCH OUTPUT:
${direct}
`.trim();

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
    })
  });
  if (!res.ok) return direct;
  const body = await res.json();
  return body?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || direct;
}

async function handleAiRequest(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vivek AI use karne ke liye login zaroori hai.");
  }

  const question = s(request.data?.question);
  if (!question) throw new HttpsError("invalid-argument", "Question required.");
  if (question.length > 1000) throw new HttpsError("invalid-argument", "Question too long.");

  const db = getFirestore();
  const result = await deterministicSearch(db, question);

  if (!result.rows.length) {
    return {
      answer: "Vivek AI: Firebase database me is query se matching koi record nahi mila.",
      sources: [],
      mode: "firebase-direct"
    };
  }

  let apiKey = "";
  try {
    apiKey = GEMINI_API_KEY.value();
  } catch (_) {
    apiKey = process.env.GEMINI_API_KEY || "";
  }

  const answer = apiKey
    ? await askGemini(question, result.rows, result.direct, apiKey)
    : result.direct;

  return {
    answer,
    sources: result.rows.slice(0, 10).map(r => ({ collection: r.collection, id: r.id })),
    mode: apiKey ? "firebase+gemini" : "firebase-direct"
  };
}

exports.askVivekAi = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY]
  },
  handleAiRequest
);

exports.askDfcAi = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY]
  },
  handleAiRequest
);
