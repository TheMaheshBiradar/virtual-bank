import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardEntry {
  opportunityId: string;
  title: string;
  type: string;
  stage: string;
  score: number;
  grade: string;
  trend: string;
}

interface ScoreSummary {
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
  avgScore: number;
  total: number;
}

interface PipelineScoreBarProps {
  onRefreshScores?: () => void;
}

const GRADE_PILL = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-indigo-100 text-indigo-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-red-100 text-red-700',
};

const GRADE_BAR = {
  A: 'bg-emerald-500',
  B: 'bg-indigo-500',
  C: 'bg-amber-500',
  D: 'bg-red-500',
};

export default function PipelineScoreBar({ onRefreshScores }: PipelineScoreBarProps) {
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/scoring/leaderboard');
      const data: LeaderboardEntry[] = await res.json();
      if (data.length === 0) {
        setSummary({ gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, avgScore: 0, total: 0 });
        return;
      }
      const gradeA = data.filter(d => d.grade === 'A').length;
      const gradeB = data.filter(d => d.grade === 'B').length;
      const gradeC = data.filter(d => d.grade === 'C').length;
      const gradeD = data.filter(d => d.grade === 'D').length;
      const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
      setSummary({ gradeA, gradeB, gradeC, gradeD, avgScore, total: data.length });
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Poll every 10 seconds until we get scores (they may still be computing on startup)
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/scoring/batch', { method: 'POST' });
      await fetchLeaderboard();
      onRefreshScores?.();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!summary || summary.total === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 border border-zinc-200 mb-4">
        <RefreshCw size={12} className="text-zinc-300 animate-spin" />
        <span className="text-[10px] font-bold text-zinc-400">Initializing pipeline health...</span>
      </div>
    );
  }

  const total = summary.total;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-4 py-2.5 bg-white border border-zinc-200 mb-4 shadow-sm"
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <TrendingUp size={14} className="text-zinc-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Pipeline Health</span>
      </div>

      {/* Avg score */}
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <span className="text-[18px] font-black tabular-nums text-black">{summary.avgScore}</span>
        <span className="text-[9px] font-bold text-zinc-400">AVG</span>
      </div>

      {/* Segmented bar */}
      <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-zinc-100">
        {summary.gradeA > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(summary.gradeA / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`${GRADE_BAR.A} h-full`}
            title={`Grade A: ${summary.gradeA}`}
          />
        )}
        {summary.gradeB > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(summary.gradeB / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className={`${GRADE_BAR.B} h-full`}
            title={`Grade B: ${summary.gradeB}`}
          />
        )}
        {summary.gradeC > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(summary.gradeC / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className={`${GRADE_BAR.C} h-full`}
            title={`Grade C: ${summary.gradeC}`}
          />
        )}
        {summary.gradeD > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(summary.gradeD / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className={`${GRADE_BAR.D} h-full`}
            title={`Grade D: ${summary.gradeD}`}
          />
        )}
      </div>

      {/* Grade counts */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {[
          { key: 'A', count: summary.gradeA },
          { key: 'B', count: summary.gradeB },
          { key: 'C', count: summary.gradeC },
          { key: 'D', count: summary.gradeD },
        ].map(({ key, count }) => (
          <div
            key={key}
            className={`px-2 py-0.5 rounded-full text-[9px] font-black ${GRADE_PILL[key as keyof typeof GRADE_PILL]}`}
          >
            {key}:{count}
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border border-zinc-300 hover:border-black hover:bg-zinc-50 transition-all disabled:opacity-50"
      >
        <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? 'Scoring...' : 'Refresh'}
      </button>
    </motion.div>
  );
}
