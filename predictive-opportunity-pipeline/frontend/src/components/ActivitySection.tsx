import React, { useState } from 'react';
import { Phone, Mail, Users, Clock, Plus, Trash2, Pencil, Check, Sparkles, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { summarizeActivities } from '../services/aiService';

interface ActivitySectionProps {
  activities: Activity[];
  onUpdate: (activities: Activity[]) => void;
  clientAddress?: string;
  employeeAddress?: string;
  clientRiskTolerance?: string;
  clientHealth?: string;
}

export default function ActivitySection({ 
  activities, 
  onUpdate, 
  clientAddress, 
  employeeAddress,
  clientRiskTolerance,
  clientHealth
}: ActivitySectionProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    type: 'CALL',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSummarize = async () => {
    if (activities.length === 0) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeActivities(activities, clientAddress, employeeAddress, clientRiskTolerance, clientHealth);
      setSummary(result);
    } finally {
      setIsSummarizing(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'CALL': return <Phone size={12} className="text-blue-500" />;
      case 'EMAIL': return <Mail size={12} className="text-orange-500" />;
      case 'MEETING': return <Users size={12} className="text-purple-500" />;
      default: return <Clock size={12} className="text-zinc-400" />;
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formData.notes.trim()) return;

    let updated: Activity[];
    if (editingId) {
      updated = activities.map(a => a.id === editingId ? { ...a, ...formData } : a);
    } else {
      updated = [...activities, { ...formData, id: Math.random().toString(36).substr(2, 9) }];
    }

    onUpdate(updated);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      type: 'CALL',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdate(activities.filter(a => a.id !== id));
  };

  const startEdit = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setFormData({ type: activity.type, date: activity.date, notes: activity.notes });
    setEditingId(activity.id);
    setIsAdding(true);
  };

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2 pb-1">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-brand-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t('activities_tab')}</span>
        </div>
        <div className="flex items-center gap-1">
          {activities.length > 0 && !isAdding && (
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-1 px-1.5 py-1 hover:bg-brand-primary/5 transition-colors text-brand-primary rounded group"
              title="AI Summary"
            >
              {isSummarizing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} className="group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[9px] font-black uppercase tracking-tighter">AI SUMMARY</span>
            </button>
          )}
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="p-1 hover:bg-zinc-200 transition-colors text-brand-primary rounded ml-1"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div
            key="ai-summary-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-brand-primary/5 border border-brand-primary/20 p-3 relative"
          >
            <button 
              onClick={() => setSummary(null)}
              className="absolute top-2 right-2 text-brand-primary/40 hover:text-brand-primary"
            >
              <X size={10} />
            </button>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={10} className="text-brand-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">{t('ai_summary' as any)}</span>
            </div>
            <div className="text-[10px] text-zinc-600 leading-relaxed space-y-1 markdown-body">
              {summary.split('\n').map((line, i) => (
                <p key={`summary-line-${i}`} className={line.startsWith('-') ? 'ml-2 -indent-2' : ''}>{line}</p>
              ))}
            </div>
          </motion.div>
        )}

        {isAdding ? (
          <motion.div 
            key="activity-add-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 p-2 bg-white border border-zinc-200 rounded mb-2"
          >
            <div className="flex gap-2">
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="bg-zinc-50 border border-zinc-200 text-[10px] font-bold p-1 flex-1 focus:outline-none focus:border-black"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK">Task</option>
              </select>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-zinc-50 border border-zinc-200 text-[10px] font-bold p-1 flex-1 focus:outline-none focus:border-black"
              />
            </div>
            <textarea 
              placeholder="Activity notes..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] p-2 h-20 focus:outline-none focus:border-black resize-none"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={resetForm}
                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-black transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSave}
                className="bg-black text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <Check size={10} />
                {t('save')}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={`activity-${activity.id}-${index}`} className="group/activity bg-white border border-zinc-200 p-2 relative shadow-sm">
                   <div className="flex items-center justify-between mb-1">
                     <div className="flex items-center gap-1.5">
                       {getActivityIcon(activity.type)}
                       <span className="text-[9px] font-extrabold uppercase tracking-wider text-black">{activity.type}</span>
                       <span className="text-[9px] font-bold text-zinc-400">{activity.date}</span>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover/activity:opacity-100 transition-opacity">
                       <button 
                          onClick={(e) => startEdit(e, activity)}
                          className="text-zinc-400 hover:text-black"
                        >
                         <Pencil size={10} />
                       </button>
                       <button 
                          onClick={(e) => handleDelete(e, activity.id)}
                          className="text-zinc-400 hover:text-brand-primary"
                        >
                          <Trash2 size={10} />
                       </button>
                     </div>
                   </div>
                   <p className="text-[10px] text-zinc-600 leading-relaxed italic line-clamp-2">
                     {activity.notes}
                   </p>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-zinc-400 text-center py-4 font-medium italic">
                No activities recorded yet.
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
