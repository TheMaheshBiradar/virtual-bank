import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ScoreBadgeProps {
  score: number | null;
  grade: string | null;
  trend: string | null;
  size?: 'sm' | 'md';
}

const GRADE_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  A: { bg: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700' },
  B: { bg: 'bg-indigo-600', ring: 'ring-indigo-200', text: 'text-indigo-700' },
  C: { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700' },
  D: { bg: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-700' },
};

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
  switch (trend) {
    case 'IMPROVING':
      return <TrendingUp size={10} className="text-emerald-500" />;
    case 'DECLINING':
      return <TrendingDown size={10} className="text-red-500" />;
    case 'STEADY':
      return <Minus size={10} className="text-zinc-400" />;
    default:
      return (
        <motion.div
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles size={10} className="text-amber-400" />
        </motion.div>
      );
  }
};

export default function ScoreBadge({ score, grade, trend, size = 'sm' }: ScoreBadgeProps) {
  if (score === null || grade === null) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 rounded-full opacity-50">
        <Sparkles size={10} className="text-zinc-300" />
        <span className="text-[8px] font-bold text-zinc-400">—</span>
      </div>
    );
  }

  const colors = GRADE_COLORS[grade] || GRADE_COLORS.D;
  const isMd = size === 'md';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-1 ${isMd ? 'px-2 py-1' : 'px-1.5 py-0.5'} rounded-full ring-1 ${colors.ring} bg-white`}
      title={`Score: ${score}/100 — Grade ${grade} (${trend?.toLowerCase()})`}
    >
      <div className={`${isMd ? 'w-5 h-5 text-[9px]' : 'w-4 h-4 text-[8px]'} rounded-full ${colors.bg} text-white font-black flex items-center justify-center`}>
        {grade}
      </div>
      <span className={`${isMd ? 'text-[11px]' : 'text-[10px]'} font-black tabular-nums ${colors.text}`}>
        {score}
      </span>
      {trend && <TrendIcon trend={trend} />}
    </motion.div>
  );
}
