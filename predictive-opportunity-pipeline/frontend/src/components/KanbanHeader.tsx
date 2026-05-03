import React from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface KanbanHeaderProps {
  viewMode: 'stage' | 'status';
  setViewMode: (mode: 'stage' | 'status') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'default' | 'score';
  setSortBy: (sort: 'default' | 'score') => void;
}

export default function KanbanHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy
}: KanbanHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {/* Left: breadcrumb + AI badge + view toggle */}
      <div className="flex items-center gap-4">
        <nav>
          <ol className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Global Markets</li>
            <li>/</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Opportunities</li>
            <li>/</li>
            <li className="flex items-center gap-1.5 text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full border border-brand-primary/10 animate-pulse">
               <Sparkles size={10} />
               <span>AI AGENT ACTIVE</span>
            </li>
          </ol>
        </nav>

        <div className="h-4 w-px bg-zinc-200" />

        <div className="flex bg-zinc-100 p-0.5 border border-zinc-200">
          <button 
            onClick={() => setViewMode('stage')}
            className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'stage' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {t('view_stage')}
          </button>
          <button 
            onClick={() => setViewMode('status')}
            className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'status' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {t('view_status')}
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-200" />

        <div className="flex bg-zinc-100 p-0.5 border border-zinc-200">
          <button 
            onClick={() => setSortBy('default')}
            className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === 'default' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {t('sort_default')}
          </button>
          <button 
            onClick={() => setSortBy('score')}
            className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === 'score' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {t('sort_score')}
          </button>
        </div>
      </div>

      {/* Right: search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="bg-white border border-border-subtle px-10 py-2 text-sm w-64 focus:outline-none focus:border-black transition-colors placeholder:text-zinc-300"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-black text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors">
          <Filter size={14} />
          {t('filter')}
        </button>
      </div>
    </header>
  );
}
