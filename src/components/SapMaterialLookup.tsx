import React, { useMemo, useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { SAP_MATERIALS, type SapMaterial } from '../data/sapMaterialMaster.ts';

type SapMaterialLookupProps = {
  initialQuery?: string;
  onSelect?: (material: SapMaterial) => void;
  className?: string;
};

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Reusable SAP Material Master search. Use before creating a new store item:
 * it confirms whether a SAP material code exists and returns the exact record.
 */
export const SapMaterialLookup: React.FC<SapMaterialLookupProps> = ({ initialQuery = '', onSelect, className = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => {
    const q = normalise(query);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    return SAP_MATERIALS
      .map(material => {
        const haystack = normalise(`${material.code} ${material.description} ${material.uom} ${material.plantDescription}`);
        const exact = material.code === query.trim() || normalise(material.description) === q;
        const matchedTokens = tokens.filter(token => haystack.includes(token)).length;
        return { material, score: exact ? 1000 : matchedTokens * 100 + (haystack.includes(q) ? 50 : 0) };
      })
      .filter(row => row.score > 0)
      .sort((a, b) => b.score - a.score || a.material.description.localeCompare(b.material.description))
      .slice(0, showAll ? 100 : 15)
      .map(row => row.material);
  }, [query, showAll]);

  const exactMatch = useMemo(() => {
    const q = query.trim();
    if (!q) return undefined;
    return SAP_MATERIALS.find(material => material.code === q || normalise(material.description) === normalise(q));
  }, [query]);

  return (
    <section className={`rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
            SAP Material Code Check
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
            Search by SAP code or material name before adding a new item.
          </p>
        </div>
        <span className="text-[10px] font-bold text-blue-800 dark:text-cyan-300 bg-white/80 dark:bg-slate-900 px-2 py-1 rounded-lg">
          {SAP_MATERIALS.length.toLocaleString('en-IN')} SAP items
        </span>
      </div>

      <input
        value={query}
        onChange={event => { setQuery(event.target.value); setShowAll(false); }}
        placeholder="Example: 60010010, ERC MKV, rubber pad..."
        className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {query.trim() && (
        <div className="mt-3">
          {exactMatch ? (
            <div className="mb-3 flex gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              SAP material found — use code {exactMatch.code}.
            </div>
          ) : (
            <div className="mb-3 flex gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <XCircle className="w-4 h-4 shrink-0" />
              Exact SAP code/name not found. Review the suggestions before creating a new material.
            </div>
          )}

          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {results.length ? results.map(material => (
              <button type="button" key={`${material.code}-${material.plant}`} onClick={() => onSelect?.(material)} className="w-full p-3 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{material.description}</div>
                    <div className="mt-1 text-[10px] text-slate-500">Plant: {material.plantDescription || material.plant} • Group: {material.mainGroup}/{material.subGroup}</div>
                  </div>
                  <div className="shrink-0 text-right"><div className="font-mono font-black text-blue-700 dark:text-cyan-400 text-xs">{material.code}</div><div className="text-[10px] text-slate-500">{material.uom || '—'}</div></div>
                </div>
              </button>
            )) : <div className="p-4 text-center text-xs text-slate-500">No SAP suggestion found. Create only after SAP master verification.</div>}
          </div>
          {results.length === 15 && !showAll && <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-xs font-bold text-blue-700 dark:text-cyan-400">Show more matches</button>}
        </div>
      )}
    </section>
  );
};
