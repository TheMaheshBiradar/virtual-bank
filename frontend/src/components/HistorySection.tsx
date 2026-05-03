import React from 'react';
import { Target, Pencil, Plus, Clock } from 'lucide-react';
import { HistoryEntry } from '../constants';

interface HistorySectionProps {
  history: HistoryEntry[];
}

export default function HistorySection({ history }: HistorySectionProps) {
  const getHistoryIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'STATUS_CHANGE': return <Target size={12} className="text-brand-primary" />;
      case 'EDIT': return <Pencil size={12} className="text-blue-500" />;
      case 'CREATE': return <Plus size={12} className="text-green-500" />;
      case 'ACTIVITY': return <Clock size={12} className="text-zinc-400" />;
      default: return <Clock size={12} />;
    }
  };

  return (
    <div className="space-y-4">
      {history && history.length > 0 ? (
        <div className="relative pl-3 border-l border-zinc-200 ml-1 space-y-4 py-2">
           {history.map((entry, index) => (
             <div key={`history-${entry.id}-${index}`} className="relative">
               <div className="absolute -left-[17px] top-1 bg-zinc-50 p-0.5">
                  {getHistoryIcon(entry.type)}
               </div>
               <div className="space-y-0.5">
                 <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black text-black uppercase tracking-wider">{entry.user}</span>
                   <span className="text-[8px] text-zinc-400 font-bold">{entry.date}</span>
                 </div>
                 <p className="text-[10px] text-zinc-600 font-medium leading-tight">
                   {entry.description}
                 </p>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-[10px] text-zinc-400 text-center py-6 font-medium italic">
          No history entries available.
        </div>
      )}
    </div>
  );
}
