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

export interface ManualDoc {
  id: string;
  title: string;
  shortTitle: string;
  category: 'CORE' | 'TRACK' | 'TURNOUT' | 'WELDING' | 'ACS' | 'KEYPLAN';
  badge: string;
  edition: string;
  size: string;
  description: string;
  url: string;
  accentColor: string;
}

const ALL_MANUALS: ManualDoc[] = [
  // 1. CORE RAILROAD MANUAL
  {
    id: 'dfc_rrm_final',
    title: 'DFC Railroad Manual (Final Official Edition)',
    shortTitle: 'DFC Railroad Manual (RRM)',
    category: 'CORE',
    badge: 'Statutory Core Manual',
    edition: '2024 / 2025 Final Edition',
    size: '14.8 MB',
    description: 'IMD/IMSD सेटअप, अधिकारियों के अधिकार, 100% निरीक्षण अनुसूची (Para 266), आपातकालीन रिस्पांस एवं सुरक्षा नियम।',
    url: '/manuals/DFC_RAILROAD_MANUAL_Final.pdf',
    accentColor: 'from-blue-600 to-indigo-700'
  },

  // 2. TRACK MANUAL 2025
  {
    id: 'dfc_track_manual_2025',
    title: 'DFC Track Manual (July 2025 Final)',
    shortTitle: 'DFC Track Manual 2025',
    category: 'TRACK',
    badge: 'Latest Track Manual',
    edition: 'July 2025 Final',
    size: '22.4 MB',
    description: 'ट्रैक ज्योमेट्री, हेवी एक्सल लोड (32.5t), रेल टॉलरेंस, कर्व्स, वेल्डिंग, USFD एवं मशीनीकृत अनुरक्षण के संपूर्ण मानक।',
    url: '/manuals/DFC_Track_manual_2025_Final.pdf',
    accentColor: 'from-emerald-600 to-teal-700'
  },

  // 3. WDFC L&T TRACK MANUAL
  {
    id: 'lt_wdfc_manual',
    title: 'L&T Track Manual Applicable for WDFC',
    shortTitle: 'L&T WDFC Track Manual',
    category: 'TRACK',
    badge: 'Heavy Haul Track',
    edition: 'WDFC Applicable',
    size: '18.2 MB',
    description: 'वेस्टर्न एवं ईस्टर्न फ्रेट कॉरिडोर हेतु हेवी हॉल ट्रैक स्पेसिफिकेशन, ब्लास्ट एवं फॉर्मेशन गाइडलाइन्स।',
    url: '/manuals/LT_Track_Manual_Applicable_for_WDFC.pdf',
    accentColor: 'from-cyan-600 to-blue-700'
  },

  // 4. INSTALLATION MANUAL APL-01
  {
    id: 'edfcc_installation_manual',
    title: 'Installation Manual EDFCC APL-01 (Rev 03)',
    shortTitle: 'Installation Manual EDFCC',
    category: 'TRACK',
    badge: 'EDFCC Standards',
    edition: 'APL-01 Revision 3',
    size: '11.5 MB',
    description: 'ईस्टर्न डेडिकेटेड फ्रेट कॉरिडोर पैकेज APL-01 हेतु ट्रैक लेइंग, SEJ, टर्नआउट्स एवं ग्लूड इंसुलेटेड जॉइंट्स स्थापना।',
    url: '/manuals/Installation_Manual_EDFCC_APL_01.pdf',
    accentColor: 'from-slate-700 to-slate-900'
  },

  // 5. VOSSLOH TURNOUT MANUAL
  {
    id: 'vossloh_turnout',
    title: 'Vossloh Turnout Maintenance & Installation Manual',
    shortTitle: 'Vossloh Turnout Manual',
    category: 'TURNOUT',
    badge: 'P&C Maintenance',
    edition: 'Vossloh Cogifer Special',
    size: '8.4 MB',
    description: '1 in 12 Thick Web Switch (TWS) एवं CMS क्रॉसिंग का इंस्टॉलेशन, टॉलरेंस, टॉर्क एवं रखरखाव।',
    url: '/manuals/Vossloh_TO_Maintenance_Manual.pdf',
    accentColor: 'from-amber-600 to-orange-700'
  },

  // 6. RECONDITIONING OF POINTS & CROSSING
  {
    id: 'reconditioning_pnc',
    title: 'Booklet on Reconditioning of Points & Crossings',
    shortTitle: 'P&C Reconditioning Booklet',
    category: 'TURNOUT',
    badge: 'RDSO / DFCCIL Guide',
    edition: 'Technical Guidelines',
    size: '4.2 MB',
    description: 'CMS क्रॉसिंग एवं टंग रेल की वेल्डिंग द्वारा रिकंडीशनिंग, इलेक्ट्रोड चयन एवं सुरक्षा सावधानियां।',
    url: '/manuals/Booklet_on_Reconditioning_of_Points_and_Crossing.pdf',
    accentColor: 'from-amber-700 to-red-800'
  },

  // 7. MM STEEL POINTS & CROSSINGS
  {
    id: 'mm_steel_pnc',
    title: 'Manual for Reconditioning of MM Steel Points & Crossings',
    shortTitle: 'MM Steel P&C Manual',
    category: 'TURNOUT',
    badge: 'Reconditioning Manual',
    edition: 'Special Steel Edition',
    size: '5.1 MB',
    description: 'मीडियम मैंगनीज (MM) स्टील पॉइंट्स एवं क्रॉसिंग्स की रीकंडीशनिंग प्रक्रिया एवं टेस्टिंग मानक।',
    url: '/manuals/Manual_for_Reconditioning_of_MM_Steel_Points_and_Crossings.pdf',
    accentColor: 'from-red-600 to-rose-800'
  },

  // 8. PROFORMA CROSSING INSPECTION
  {
    id: 'proforma_crossing',
    title: 'Proforma of Crossing Inspection of Railway',
    shortTitle: 'Crossing Inspection Proforma',
    category: 'TURNOUT',
    badge: 'Inspection Checklist',
    edition: 'Standard Proforma',
    size: '1.2 MB',
    description: 'क्रॉसिंग इंस्पेक्शन हेतु आधिकारिक प्रोफार्मा: मैक्सिमम वियर, चेक रेल क्लीयरेंस, विंग रेल गैप आदि।',
    url: '/manuals/Performa_of_crossing_inspection_of_railway.pdf',
    accentColor: 'from-purple-600 to-indigo-800'
  },

  // 9. ACS 01
  {
    id: 'acs_01',
    title: 'ACS-01: DFC Railroad Manual Correction Slip',
    shortTitle: 'Correction Slip ACS-01',
    category: 'ACS',
    badge: 'ACS-01 (dt. 25.06.2025)',
    edition: '25-Jun-2025',
    size: '790 KB',
    description: 'Advance Correction Slip No. 01 to DFC Railroad Manual.',
    url: '/manuals/ACS_01_DFC_RRM_25.06.2025.pdf',
    accentColor: 'from-emerald-700 to-green-900'
  },

  // 10. ACS 02
  {
    id: 'acs_02',
    title: 'ACS-02: DFC Railroad Manual Correction Slip',
    shortTitle: 'Correction Slip ACS-02',
    category: 'ACS',
    badge: 'ACS-02 (2025)',
    edition: '2025',
    size: '2.1 MB',
    description: 'Advance Correction Slip No. 02 to DFC Railroad Manual.',
    url: '/manuals/ACS_02_DFC_Railroad_Manual.pdf',
    accentColor: 'from-emerald-700 to-green-900'
  },

  // 11. ACS 03
  {
    id: 'acs_03',
    title: 'ACS-03: DFC Railroad Manual Correction Slip',
    shortTitle: 'Correction Slip ACS-03',
    category: 'ACS',
    badge: 'ACS-03 (2025)',
    edition: '2025',
    size: '1.4 MB',
    description: 'Advance Correction Slip No. 03 to DFC Railroad Manual.',
    url: '/manuals/ACS_03_to_DFC_RRM.pdf',
    accentColor: 'from-emerald-700 to-green-900'
  },

  // 12. ACS 04
  {
    id: 'acs_04',
    title: 'ACS-04: DFC Railroad Manual Correction Slip (16.10.2025)',
    shortTitle: 'Correction Slip ACS-04',
    category: 'ACS',
    badge: 'ACS-04 (dt. 16.10.2025)',
    edition: '16-Oct-2025',
    size: '850 KB',
    description: 'Advance Correction Slip No. 04 to DFC Railroad Manual.',
    url: '/manuals/ACS_04_dt_16.10.2025.pdf',
    accentColor: 'from-emerald-700 to-green-900'
  },

  // 13. ACS 05
  {
    id: 'acs_05',
    title: 'ACS-05: DFC Railroad Manual Correction Slip (02.12.2025)',
    shortTitle: 'Correction Slip ACS-05',
    category: 'ACS',
    badge: 'ACS-05 (dt. 02.12.2025)',
    edition: '02-Dec-2025',
    size: '1.2 MB',
    description: 'Advance Correction Slip No. 05 to DFC Railroad Manual.',
    url: '/manuals/ACS_05_dt_02.12.25_RRM.pdf',
    accentColor: 'from-emerald-700 to-green-900'
  },

  // 14-19. STATION KEY PLANS
  {
    id: 'keyplan_smun',
    title: 'New Shambhu (SMUN) Official Station Key-Plan',
    shortTitle: 'SMUN Key-Plan (Km 1177)',
    category: 'KEYPLAN',
    badge: 'IMSD Headquarter Yard',
    edition: 'CAD Final Approved',
    size: '3.1 MB',
    description: 'SMUN यार्ड का विस्तृत इंजीनियरिंग की-प्लान: सभी 35 पॉइंट्स, लाइन नंबर, क्रॉसओवर एवं चेनिएज।',
    url: '/keyplans/SMUN Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  },
  {
    id: 'keyplan_chan',
    title: 'Chawa Pail (CHAN) Official Station Key-Plan',
    shortTitle: 'CHAN Key-Plan (Km 1237)',
    category: 'KEYPLAN',
    badge: 'Station Yard Plan',
    edition: 'CAD Final Approved',
    size: '2.8 MB',
    description: 'CHAN यार्ड का विस्तृत की-प्लान: मेन लाइन एवं लूप लाइन टर्नआउट्स।',
    url: '/keyplans/CHAN Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  },
  {
    id: 'keyplan_knnn',
    title: 'Khanna (KNNN) Official Station Key-Plan',
    shortTitle: 'KNNN Key-Plan (Km 1216)',
    category: 'KEYPLAN',
    badge: 'Station Yard Plan',
    edition: 'CAD Final Approved',
    size: '2.6 MB',
    description: 'KNNN यार्ड का इंजीनियरिंग की-प्लान एवं क्रॉसओवर लेआउट।',
    url: '/keyplans/KNNN Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  },
  {
    id: 'keyplan_sbjn',
    title: 'Sarai Banjara (SBJN) Official Station Key-Plan',
    shortTitle: 'SBJN Key-Plan (Km 1192)',
    category: 'KEYPLAN',
    badge: 'Station Yard Plan',
    edition: 'CAD Final Approved',
    size: '2.9 MB',
    description: 'SBJN यार्ड का विस्तृत की-प्लान: 26 पॉइंट्स एवं क्रॉसओवर्स।',
    url: '/keyplans/SBJN Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  },
  {
    id: 'keyplan_nsir',
    title: 'Sirhind Detour (NSIR) Official Station Key-Plan',
    shortTitle: 'NSIR Key-Plan (Km 1205)',
    category: 'KEYPLAN',
    badge: 'Station Yard Plan',
    edition: 'CAD Final Approved',
    size: '2.7 MB',
    description: 'NSIR सरहिंद डिटूर यार्ड का आधिकारिक इंजीनियरिंग लेआउट प्लान।',
    url: '/keyplans/NSIR Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  },
  {
    id: 'keyplan_gvgn',
    title: 'Govindgarh (GVGN) Official Station Key-Plan',
    shortTitle: 'GVGN Key-Plan (Km 1226)',
    category: 'KEYPLAN',
    badge: 'Station Yard Plan',
    edition: 'CAD Final Approved',
    size: '3.0 MB',
    description: 'GVGN मंडी गोबिंदगढ़ यार्ड का आधिकारिक इंजीनियरिंग की-प्लान।',
    url: '/keyplans/GVGN Keyplan.pdf',
    accentColor: 'from-indigo-600 to-blue-800'
  }
];

export const EBookManualsViewer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredManuals = ALL_MANUALS.filter(m => {
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.shortTitle.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.badge.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenPdfDirectly = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d2a58] via-[#123b72] to-[#1e4d8c] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-400/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
              DFCCIL Official Library
            </span>
            <span className="text-xs font-mono text-blue-200">IMSD SMUN Digital Bookshelf</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            📖 डीएफसीसीआईएल आधिकारिक मैन्युअल्स एवं की-प्लान्स
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl">
            क्लिक करते ही पुस्तक सीधे नए ब्राउज़र टैब के <strong>फुल-स्क्रीन (Full Screen PDF Viewer)</strong> में खुलेगी, जहाँ आप टेक्स्ट सर्च, ज़ूम व डाउनलोड कर सकते हैं।
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <input
            type="text"
            placeholder="Search Manuals, ACS, Key-Plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl text-xs text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
          <Search className="w-4 h-4 text-blue-200 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All Publications', count: ALL_MANUALS.length },
          { id: 'CORE', label: '📘 Railroad Manual (RRM)', count: ALL_MANUALS.filter(m => m.category === 'CORE').length },
          { id: 'TRACK', label: '📗 Track Manuals', count: ALL_MANUALS.filter(m => m.category === 'TRACK').length },
          { id: 'TURNOUT', label: '⚙️ Points & Crossings', count: ALL_MANUALS.filter(m => m.category === 'TURNOUT').length },
          { id: 'ACS', label: '📑 Advance Correction Slips (1-5)', count: ALL_MANUALS.filter(m => m.category === 'ACS').length },
          { id: 'KEYPLAN', label: '🗺️ Station Key-Plans', count: ALL_MANUALS.filter(m => m.category === 'KEYPLAN').length }
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-[#123b72] text-white shadow-md font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredManuals.map(manual => (
          <div
            key={manual.id}
            onClick={() => handleOpenPdfDirectly(manual.url)}
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
                  <span className="text-[8px] font-black uppercase mt-0.5">PDF</span>
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

            {/* Bottom Action Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Official Publication</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPdfDirectly(manual.url);
                }}
                className="px-3.5 py-1.5 bg-[#123b72] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow group-hover:shadow-blue-500/30"
              >
                <span>ब्राउज़र में खोलें (Full Screen)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
