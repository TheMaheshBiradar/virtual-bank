import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScoreReason {
  factor: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ScoreData {
  current: {
    score: number;
    grade: string;
    trend: string;
    previousScore: number | null;
    improvers: ScoreReason[];
    harmers: ScoreReason[];
    recommendation: string;
    marketSentimentScore?: number;
    riskScore?: number;
  } | null;
  history: { score: number; createdAt: string }[];
}

interface ScoreWidgetProps {
  opportunityId: string;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  A: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: '#10b981' },
  B: { bg: 'bg-violet-50', text: 'text-violet-600', bar: '#8b5cf6' },
  C: { bg: 'bg-amber-50', text: 'text-amber-600', bar: '#f59e0b' },
  D: { bg: 'bg-red-50', text: 'text-red-600', bar: '#ef4444' },
};

const IMPACT_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-zinc-100 text-zinc-500',
};

/** Tiny inline SVG sparkline — zero dependencies */
function Sparkline({ data, color, width = 180, height = 40 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  // Gradient fill area
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkFill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkFill-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = (data.length - 1) * step;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 8) - 4;
        return <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="white" strokeWidth="1.5" />;
      })()}
    </svg>
  );
}

const TrendLabel: React.FC<{ trend: string; delta: number | null }> = ({ trend, delta }) => {
  const deltaStr = delta !== null ? (delta >= 0 ? `+${delta}` : `${delta}`) : '';
  switch (trend) {
    case 'IMPROVING':
      return <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold"><TrendingUp size={12} /> {deltaStr}</span>;
    case 'DECLINING':
      return <span className="flex items-center gap-1 text-red-600 text-[11px] font-bold"><TrendingDown size={12} /> {deltaStr}</span>;
    case 'STEADY':
      return <span className="flex items-center gap-1 text-zinc-400 text-[11px] font-bold"><Minus size={12} /> Steady</span>;
    default:
      return <span className="flex items-center gap-1 text-amber-500 text-[11px] font-bold"><Sparkles size={12} /> New</span>;
  }
};

export default function ScoreWidget({ opportunityId }: ScoreWidgetProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchScore = () => {
    setLoading(true);
    fetch(`/api/scoring/${opportunityId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScore();
  }, [opportunityId]);

  const handleSingleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`/api/scoring/${opportunityId}/refresh`, { method: 'POST' });
      // Re-fetch to update history and current state
      const res = await fetch(`/api/scoring/${opportunityId}`);
      const newData = await res.json();
      setData(newData);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw size={16} className="text-zinc-300 animate-spin" />
        <span className="text-[10px] font-bold text-zinc-400 ml-2">Loading score...</span>
      </div>
    );
  }

  if (!data?.current) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Sparkles size={20} className="text-zinc-300" />
        <span className="text-[10px] font-bold text-zinc-400">Score not yet calculated</span>
        <span className="text-[9px] text-zinc-300">Scores refresh on server startup</span>
      </div>
    );
  }

  const { current, history } = data;
  const colors = GRADE_COLORS[current.grade] || GRADE_COLORS.D;
  const delta = current.previousScore !== null ? current.score - current.previousScore : null;
  const sparkData = history.map(h => h.score);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className={`p-4 ${colors.bg} border border-${current.grade === 'A' ? 'emerald' : current.grade === 'B' ? 'violet' : current.grade === 'C' ? 'amber' : 'red'}-200`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <span className={`text-[32px] font-black tabular-nums leading-none ${colors.text}`}>{current.score}</span>
            <span className="text-[11px] font-bold text-zinc-400">/ 100</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full ${colors.text} font-black text-[12px] bg-white ring-1 ring-current/20`}>
              Grade {current.grade}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSingleRefresh(); }}
              disabled={isRefreshing}
              className={`p-1.5 rounded-md border ${colors.text} bg-white ring-1 ring-current/10 hover:shadow-sm transition-all disabled:opacity-50`}
              title="Re-score this opportunity"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <TrendLabel trend={current.trend} delta={delta} />
          </div>
        </div>

        {/* Sparkline */}
        {sparkData.length >= 1 && (
          <div className="mt-2">
            <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Score History</div>
            <Sparkline data={sparkData.length === 1 ? [sparkData[0], sparkData[0]] : sparkData} color={colors.bar} />
          </div>
        )}
      </div>

      {/* System Signals (Hard data from other Global systems) */}
      <div className="bg-zinc-50 border border-zinc-200 p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <RefreshCw size={12} className="text-zinc-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Underlying System Signals</span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-zinc-500">Market Sentiment Score</span>
              <span className="text-black font-black">{current.marketSentimentScore ?? 50}%</span>
            </div>
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${current.marketSentimentScore ?? 50}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-zinc-500">Risk Management Exposure</span>
              <span className="text-black font-black">{current.riskScore ?? 30}%</span>
            </div>
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${current.riskScore ?? 30}%` }}
                className="h-full bg-red-500"
              />
            </div>
          </div>
        </div>
        <p className="mt-3 text-[9px] text-zinc-400 leading-tight italic">
          These scores are pulled directly from the Global Trade Sentiment and Risk Management Engines and weighted by the AI Orchestrator.
        </p>
      </div>

      {/* Improvers */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Score Improvers</span>
        </div>
        <div className="space-y-1.5">
          {current.improvers.map((r, i) => (
            <motion.div
              key={`imp-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2 p-2 bg-emerald-50/50 border border-emerald-100"
            >
              <div className="w-1 h-full min-h-[24px] bg-emerald-400 flex-shrink-0 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-emerald-700">{r.factor}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${IMPACT_COLORS[r.impact]}`}>{r.impact}</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-snug">{r.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Harmers */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={12} className="text-amber-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Score Harmers</span>
        </div>
        <div className="space-y-1.5">
          {current.harmers.map((r, i) => (
            <motion.div
              key={`harm-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2 p-2 bg-red-50/50 border border-red-100"
            >
              <div className="w-1 h-full min-h-[24px] bg-red-400 flex-shrink-0 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-red-700">{r.factor}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${IMPACT_COLORS[r.impact]}`}>{r.impact}</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-snug">{r.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      {current.recommendation && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200">
          <Lightbulb size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">AI Recommendation</span>
            <p className="text-[11px] font-semibold text-blue-800 mt-1 leading-snug">{current.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
