import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Opportunity } from '../constants';

interface PriorityBadgeProps {
  priority: Opportunity['priority'];
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useTranslation();
  
  const getStyles = () => {
    switch (priority) {
      case 'HIGH': return 'bg-zinc-100 text-zinc-700';
      case 'MED': return 'bg-zinc-50 text-zinc-600 border border-zinc-100';
      case 'LOW': return 'bg-zinc-50 text-zinc-500';
      case 'WINNING': return 'bg-green-50 text-green-700 border border-green-100';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  return (
    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 tracking-wider ${getStyles()}`}>
      {t(`priority_${priority}` as any)}
    </span>
  );
}
