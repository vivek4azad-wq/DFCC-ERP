/**
 * DFCCIL IMSD SMUN - Official Track & Railroad Manuals Library
 * Direct 1-Click Native Full-Screen Browser Viewer for Mobile & Desktop
 */

import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Search
} from 'lucide-react';

import { KindleManualReader, ManualItem } from './KindleManualReader.tsx';
import { Download, FileText } from 'lucide-react';

export interface ManualDoc {
  id: string;
  title: string;
  shortTitle: string;
  category: 'CORE' | 'TRACK' | 'BRIDGE' | 'INSTALLATION' | 'GUIDE';
  badge: string;
  edition: string;
  size: string;
  description: string;
  url: string;
  accentColor: string;
}

export const OFFICIAL_MANUALS: ManualDoc[] = [
  // 1. DFC RAILROAD MANUAL
  {
    id: 'dfc_rrm_final',
    title: 'DFC Railroad Manual (Final Official Edition)',
    shortTitle: 'DFC Railroad Manual (RRM)',
    category: 'CORE',
    badge: 'Statutory Core Manual',
    edition: '2024 / 2025 Final Edition',
    size: '12.3 MB',
    description: 'IMD/IMSD संगठन, अधिकारियों के अधिकार, 100% निरीक्षण अनुसूची (Para 266), आपातकालीन प्रबंधन एवं सुरक्षा नियम।',
    url: '/manuals/DFC_RAILROAD_MANUAL_Final.pdf',
    accentColor: 'from-blue-600 to-indigo-700'
  },

  // 2. DFC BRIDGE MANUAL 2025
  {
    id: 'dfc_bridge_manual_2025',
    title: 'DFC Bridge Manual (2025 Official)',
    shortTitle: 'DFC Bridge Manual 2025',
    category: 'BRIDGE',
    badge: 'Official Bridge Manual',
    edition: '2025 Edition',
    size: '24.1 MB',
    description: 'मेजर व माइनर ब्रिजेस, गर्डर, आरसीसी स्लैब, बेयरिंग, वॉटरवे, फाउंडेशन एवं मानसून पूर्व/पश्चात निरीक्षण मानक।',
    url: '/manuals/DFC_Bridge_Manual_2025.pdf',
    accentColor: 'from-sky-600 to-cyan-700'
  },

  // 3. DFC TRACK MANUAL 2025
  {
    id: 'dfc_track_manual_2025',
    title: 'DFC Track Manual (July 2025 Final)',
    shortTitle: 'DFC Track Manual 2025',
    category: 'TRACK',
    badge: 'Latest Track Manual',
    edition: 'July 2025 Final',
    size: '22.0 MB',
    description: '32.5T हेवी एक्सल लोड ट्रैक ज्योमेट्री, रेल टॉलरेंस, कर्व्स, वेल्डिंग, USFD एवं मशीनीकृत अनुरक्षण के संपूर्ण मानक।',
    url: '/manuals/DFC_Track_manual_2025_Final.pdf',
    accentColor: 'from-emerald-600 to-teal-700'
  },

  // 4. L&T TRACK MANUAL FOR WDFC
  {
    id: 'lt_wdfc_manual',
    title: 'L&T Track Manual Applicable for WDFC',
    shortTitle: 'L&T WDFC Track Manual',
    category: 'TRACK',
    badge: 'Heavy Haul Track',
    edition: 'WDFC Applicable',
    size: '19.2 MB',
    description: 'वेस्टर्न एवं ईस्टर्न फ्रेट कॉरिडोर हेतु हेवी हॉल ट्रैक स्पेसिफिकेशन, ब्लास्ट एवं फॉर्मेशन गाइडलाइन्स।',
    url: '/manuals/LT_Track_Manual_Applicable_for_WDFC.pdf',
    accentColor: 'from-cyan-600 to-blue-700'
  },

  // 5. INSTALLATION MANUAL EDFCC APL-01
  {
    id: 'edfcc_installation_manual',
    title: 'Installation Manual EDFCC APL-01 (Rev 03)',
    shortTitle: 'Installation Manual EDFCC',
    category: 'INSTALLATION',
    badge: 'EDFCC Standards',
    edition: 'APL-01 Revision 3',
    size: '3.5 MB',
    description: 'ईस्टर्न डेडिकेटेड फ्रेट कॉरिडोर पैकेज APL-01 (Km 1167.210 – 1249.720) ट्रैक लेइंग, SEJ एवं ग्लूड जॉइंट्स स्थापना।',
    url: '/manuals/Installation_Manual_EDFCC_APL_01.pdf',
    accentColor: 'from-slate-700 to-slate-900'
  },

  // 6. IMSD MAINTENANCE MANUAL BY VIVEK KUMAR AZAD
  {
    id: 'imsd_field_guide_vivek',
    title: 'IMSD SMUN P-Way Inspection & Maintenance Guide',
    shortTitle: 'Vivek Azad IMSD Guide',
    category: 'GUIDE',
    badge: 'IMSD SMUN In-Charge Guide',
    edition: 'By Shri Vivek Kumar Azad (APM/Civil)',
    size: '1.6 MB',
    description: 'IMSD SMUN (Km 1167–1250) हेतु दैनिक, साप्ताहिक एवं मासिक 100% निरीक्षण, पॉइंट्स एवं क्रॉसिंग्स 35 No. व सुरक्षा प्रोटोकॉल।',
    url: '/manuals/IMSD_Maintenance_Manual_Vivek_Azad.pdf',
    accentColor: 'from-amber-600 to-rose-700'
  }
];

export const ACS_CORRECTION_SLIPS = [
  { id: 'acs_01', name: 'ACS-01 (dt. 25.06.2025)', size: '809 KB', url: '/manuals/ACS_01_DFC_RRM_25.06.2025.pdf' },
  { id: 'acs_02', name: 'ACS-02 (2025)', size: '2.2 MB', url: '/manuals/ACS_02_DFC_Railroad_Manual.pdf' },
  { id: 'acs_03', name: 'ACS-03 (2025)', size: '831 KB', url: '/manuals/ACS_03_to_DFC_RRM.pdf' },
  { id: 'acs_04', name: 'ACS-04 (dt. 16.10.2025)', size: '3.0 MB', url: '/manuals/ACS_04_dt_16.10.2025.pdf' },
  { id: 'acs_05', name: 'ACS-05 (dt. 02.12.2025)', size: '814 KB', url: '/manuals/ACS_05_dt_02.12.25_RRM.pdf' }
];

export const EBookManualsViewer: React.FC = () => {
  const [selectedManual, setSelectedManual] = useState<ManualDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAcsModalOpen, setIsAcsModalOpen] = useState<boolean>(false);

  const filteredManuals = OFFICIAL_MANUALS.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.shortTitle.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.badge.toLowerCase().includes(q)
    );
  });

  const kindleManualList: ManualItem[] = OFFICIAL_MANUALS.map(m => ({
    id: m.id,
    title: m.title,
    category: (m.category === 'CORE' ? 'Core' : m.category === 'BRIDGE' ? 'Bridge' : m.category === 'GUIDE' ? 'Inspection' : m.category === 'INSTALLATION' ? 'Installation' : 'Track') as any,
    badge: m.badge,
    date: m.edition,
    url: m.url
  }));

  if (selectedManual) {
    const activeKindleManual: ManualItem = {
      id: selectedManual.id,
      title: selectedManual.title,
      category: (selectedManual.category === 'CORE' ? 'Core' : selectedManual.category === 'BRIDGE' ? 'Bridge' : selectedManual.category === 'GUIDE' ? 'Inspection' : selectedManual.category === 'INSTALLATION' ? 'Installation' : 'Track') as any,
      badge: selectedManual.badge,
      date: selectedManual.edition,
      url: selectedManual.url
    };

    return (
      <div className="w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-90px)] flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <KindleManualReader
          manual={activeKindleManual}
          manualList={kindleManualList}
          onSelectManual={(item) => {
            const found = OFFICIAL_MANUALS.find(m => m.id === item.id);
            if (found) setSelectedManual(found);
          }}
          onOpenAcsModal={() => setIsAcsModalOpen(true)}
          onClose={() => setSelectedManual(null)}
        />

        {isAcsModalOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-white animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-black text-amber-400">Advance Correction Slips (ACS 1–5)</h3>
                  <p className="text-[11px] text-slate-400">DFC Railroad Manual Official Amendments</p>
                </div>
                <button
                  onClick={() => setIsAcsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {ACS_CORRECTION_SLIPS.map(slip => (
                  <a
                    key={slip.id}
                    href={slip.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-white group-hover:text-emerald-300">
                          {slip.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{slip.size}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d2a58] via-[#123b72] to-[#1e4d8c] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-400/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
              DFCCIL Official Library
            </span>
            <span className="text-xs font-mono text-blue-200">IMSD SMUN Authorized Collection</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            📖 डीएफसीसीआईएल आधिकारिक मैन्युअल्स (Kindle Reader)
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl">
            किसी भी पुस्तक पर क्लिक करें — वह तुरंत <strong>Kindle Reader (एकल पृष्ठ 1-Page / दो पृष्ठ 2-Page Spread)</strong> में बड़े, स्पष्ट एवं शार्प अक्षरों के साथ खुलेगी।
          </p>
        </div>

        {/* Quick Search & ACS Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Manuals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl text-xs text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
            <Search className="w-4 h-4 text-blue-200 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setIsAcsModalOpen(true)}
            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ACS Slips (1-5)</span>
          </button>
        </div>
      </div>

      {/* Manuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredManuals.map(manual => (
          <div
            key={manual.id}
            onClick={() => {
              window.open(`/flipbook/index.html?book=${manual.id}`, '_blank');
            }}
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Top Accent Stripe */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${manual.accentColor}`} />

            <div className="space-y-3">
              {/* Top Meta */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {manual.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  {manual.size}
                </span>
              </div>

              {/* Book Icon & Title */}
              <div className="flex items-start gap-3 pt-1">
                <div className={`w-12 h-14 rounded-xl bg-gradient-to-br ${manual.accentColor} text-white flex flex-col items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition`}>
                  <BookOpen className="w-6 h-6" />
                  <span className="text-[8px] font-black uppercase mt-0.5">KINDLE</span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {manual.title}
                  </h3>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5 font-mono">
                    {manual.edition}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {manual.description}
              </p>
            </div>

            {/* Bottom Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              {/* 3D Realistic HTML5 Flipbook in New Window */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/flipbook/index.html?book=${manual.id}`, '_blank');
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow hover:shadow-amber-500/30"
                title="3D पन्ने पलटने वाला Flipbook (नई विंडो में खोलें)"
              >
                <span>3D Flipbook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Kindle Reader in New Window */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/?view=reader&book=${manual.id}&mode=kindle`, '_blank');
                }}
                className="px-3 py-1.5 bg-[#123b72] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow group-hover:shadow-blue-500/30"
                title="Kindle Reader (नई विंडो में खोलें)"
              >
                <span>Kindle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ACS Modal for Main Grid view */}
      {isAcsModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-black text-amber-400">Advance Correction Slips (ACS 1–5)</h3>
                <p className="text-[11px] text-slate-400">DFC Railroad Manual Official Amendments</p>
              </div>
              <button
                onClick={() => setIsAcsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {ACS_CORRECTION_SLIPS.map(slip => (
                <a
                  key={slip.id}
                  href={slip.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block text-white group-hover:text-emerald-300">
                        {slip.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{slip.size}</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
