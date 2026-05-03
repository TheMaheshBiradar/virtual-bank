import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { generatePipelineInsights } from '../services/aiService';

interface KanbanInsightsProps {
  opportunities: any[];
}

export default function KanbanInsights({ opportunities }: KanbanInsightsProps) {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generatePipelineInsights(opportunities);
      setInsights(result);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex-shrink-0 w-64 bg-white border border-zinc-200 p-4 flex flex-col justify-between h-[450px] shadow-sm">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-300">{t('insights_view')}</h4>
          <Sparkles size={12} className="text-brand-primary" />
        </div>
        
        <div className="flex-1 bg-zinc-50 border border-zinc-100 p-3 overflow-y-auto custom-scroll">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 opacity-50">
              <Loader2 size={16} className="animate-spin text-brand-primary" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{t('analyzing' as any)}</span>
            </div>
          ) : insights ? (
            <div className="text-[11px] leading-relaxed text-zinc-600 markdown-body">
              {insights.split('\n').map((line, i) => (
                <p key={`insight-line-${i}`} className={line.startsWith('-') ? 'ml-2 -indent-2' : 'mb-2'}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/5 flex items-center justify-center mb-3">
                <Sparkles size={16} className="text-brand-primary/40" />
              </div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">
                AI can analyze your {opportunities.length} active opportunities for strategic gaps.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full py-3 bg-black hover:bg-zinc-800 disabled:bg-zinc-100 text-white disabled:text-zinc-400 text-[10px] font-extrabold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 mt-4"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {insights ? t('refresh_ai' as any) : t('generate_ai' as any)}
      </button>
    </div>
  );
}
