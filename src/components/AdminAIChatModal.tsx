/**
 * DFCCIL Admin AI Search & Firebase Log Query Assistant
 * IMSD SMUN Unit (Civil Engineering / Super Admin)
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bot,
  Send,
  Sparkles,
  Search,
  Database,
  ShieldCheck,
  X,
  UserCheck,
  HardHat,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import type {
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  LevelCrossingRecord,
  PWayDailyWorkRecord,
  PWayScheduleInspectionRecord,
  StoreItemRecord,
  TrackDefectRecord
} from '../types/index.ts';

import { getCentralAiKey, saveCentralAiKey, askVivekAi } from '../services/aiAssistant.ts';

interface AdminAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedAction?: { label: string; tab: string };
  dataList?: any[];
  sources?: { collection: string; id: string }[];
}

export const AdminAIChatModal: React.FC<AdminAIChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { currentUser } = useAuth();
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('raildiary_gemini_api_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `👋 Greetings ${currentUser?.name || 'Officer'}! I am **Vivek AI**, your Official DFCCIL IMSD SMUN Track & Intelligence Assistant.\n\nConnected to live Firestore records across **144 Bridges, 7 LC Gates, 18 Keymen Beats, 29 Patrol Shifts, Turnouts, Curves, USFD Rail Defects, Store Stock, and 1+15 Gang Work Progress**.\n\nAsk me anything in Hindi or English!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quick suggestion prompt chips tailored for Meta AI & DFCCIL operations
  const SUGGESTION_PROMPTS = [
    'LC 164 pr kaun h?',
    'Insp. due kab h?',
    'Store me curruntly kya stock h?',
    '1205 ka keyman kaun h?',
    'CHAN ke main line points kaun se hai?',
    'Km 332 par kaun sa curve hai?',
    'Who is assigned to Gate 159 SPL?'
  ];

  // Auto-sync Central API Key from Firestore on mount
  useEffect(() => {
    getCentralAiKey().then(k => {
      if (k && k !== geminiApiKey) {
        setGeminiApiKey(k);
        setApiKeyInput(k);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    setGeminiApiKey(trimmed);
    await saveCentralAiKey(trimmed);
    setIsApiKeyModalOpen(false);
  };

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev.slice(-4), userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const qLower = q.toLowerCase();
      let suggestedAction: { label: string; tab: string } | undefined;

      // Determine navigation suggestion
      if (qLower.includes('keyman') || qLower.includes('patrol') || qLower.includes('staff')) {
        suggestedAction = { label: 'Open Staff Directory', tab: 'staff' };
      } else if (qLower.includes('inspection') || qLower.includes('schedule') || qLower.includes('jcb') || qLower.includes('gang')) {
        suggestedAction = { label: 'Open P-Way Works', tab: 'pway_work' };
      } else if (qLower.includes('gate') || qLower.includes('lc')) {
        suggestedAction = { label: 'View LC Gates', tab: 'categories' };
      } else if (qLower.includes('store') || qLower.includes('stock') || qLower.includes('erc') || qLower.includes('material')) {
        suggestedAction = { label: 'Open Store Module', tab: 'store' };
      } else if (qLower.includes('defect') || qLower.includes('usfd')) {
        suggestedAction = { label: 'View Rail Defects', tab: 'defects' };
      } else if (qLower.includes('bridge') || qLower.includes('km')) {
        suggestedAction = { label: 'Open KM Quick Finder', tab: 'km_finder' };
      }

      // Query Vivek AI Engine (In-Memory Deterministic Agent + Gemini)
      const aiResponse = await askVivekAi(q);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: aiResponse.suggestedAction || suggestedAction,
        sources: aiResponse.sources
      };

      setMessages(prev => [...prev.slice(-6), aiMsg]);
    } catch (err: any) {
      console.error('Vivek AI query processing error:', err);
      const errMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ Vivek AI Error: ${err?.message || 'Query processing failed. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.slice(-4), errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[92vh] animate-scaleUp">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0c234a] via-[#123b72] to-[#0c234a] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md border border-cyan-300/40">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  🤖 Meta AI × Vivek AI • DFCCIL Smart Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-300 text-slate-950">
                  ⚡ META LLAMA 3.2
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-mono">
                Live DFCCIL Knowledge Base • WhatsApp Meta Agent Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition text-xs font-bold flex items-center gap-1"
              title="Configure Global NVIDIA / Gemini API Key (Synchronized Across All Devices)"
            >
              <span>🔑</span>
              <span>{geminiApiKey ? (geminiApiKey.startsWith('nvapi-') ? 'NVIDIA Key Active' : 'API Key Active') : 'Set API Key'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI API Key Modal (NVIDIA / Gemini) */}
        {isApiKeyModalOpen && (
          <div className="p-4 bg-gradient-to-r from-blue-900/90 to-indigo-950/90 border-b border-blue-400/30 text-white text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                <span>⚡</span>
                <span>Configure Universal NVIDIA NIM / Gemini API Key for Vivek AI:</span>
              </div>
              <button onClick={() => setIsApiKeyModalOpen(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>
            <p className="text-[11px] text-blue-200">
              यह API Key Firestore में सुरक्षित सेव होगी। NVIDIA NIM (<code>nvapi-...</code>) और Google Gemini (<code>AIzaSy...</code>) दोनों पूरी तरह सपोर्टेड हैं।
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="nvapi-... or AIzaSy..."
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-blue-400/40 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold transition shadow"
              >
                Save Globally
              </button>
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 flex items-center gap-1 pl-1">
            <Sparkles className="w-3 h-3 text-cyan-500" /> Suggestions:
          </span>
          {SUGGESTION_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(prompt)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-medium whitespace-nowrap transition shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-300" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none font-normal'
                  }`}
                >
                  {msg.text}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold">Verified Sources:</span>
                      {msg.sources.map((s, sIdx) => (
                        <span key={sIdx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded font-mono border border-blue-200 dark:border-blue-800">
                          {s.collection}/{s.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.suggestedAction && (
                  <button
                    onClick={() => {
                      if (onNavigateTab && msg.suggestedAction) {
                        onClose();
                        onNavigateTab(msg.suggestedAction.tab);
                      }
                    }}
                    className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <span>{msg.suggestedAction.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="text-[9px] font-mono text-slate-400 px-1">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 font-bold text-xs">
                  APM
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span className="font-mono">Analyzing databases and Firebase logs...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask AI about staff, inspections, JCB hours, store stock, gates..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isProcessing}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
