import React, { useState } from 'react';
import { MoreHorizontal, Calendar, GripVertical, Pencil, Trash2, Clock, ChevronDown, User, DollarSign, Target, Tag, MessageSquare, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Draggable } from '@hello-pangea/dnd';
import { Opportunity, Activity } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMetadata } from '../contexts/MetadataContext';
import ActivitySection from './ActivitySection';
import HistorySection from './HistorySection';
import PriorityBadge from './PriorityBadge';
import ScoreBadge from './ScoreBadge';
import ScoreWidget from './ScoreWidget';

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onEdit?: (opp: Opportunity) => void;
  onDelete?: (opp: Opportunity) => void;
  isSelected?: boolean;
  onSelect?: (id: string, multi: boolean) => void;
  onUpdateActivities?: (oppId: string, activities: Activity[]) => void;
  scoreData?: { score: number; grade: string; trend: string } | null;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  opportunity, 
  index, 
  onEdit, 
  onDelete,
  isSelected, 
  onSelect, 
  onUpdateActivities,
  scoreData
}) => {
  const { t } = useTranslation();
  const { can, user } = useAuth();
  const { types } = useMetadata();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVITIES' | 'HISTORY' | 'SCORE'>('ACTIVITIES');

  const metadata = types[opportunity.type];
  const primaryField = metadata?.fields.find(f => f.isPrimary);
  const cardFields = metadata?.fields.filter(f => f.showOnCard && !f.isPrimary) || [];

  const canEdit = can('EDIT_OPPORTUNITY', opportunity);
  const canDelete = can('DELETE_OPPORTUNITY', opportunity);

  const handleCardClick = (e: React.MouseEvent) => {
    const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    if (isMultiSelect) {
      onSelect?.(opportunity.id, true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const getTypeIcon = (iconName: string) => {
    switch (iconName) {
      case 'DollarSign': return <DollarSign size={12} />;
      case 'Tag': return <Tag size={12} />;
      case 'MessageSquare': return <MessageSquare size={12} />;
      default: return <Target size={12} />;
    }
  };

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          layout={!snapshot.isDragging}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          onClick={handleCardClick}
          className={`bg-white border p-0 relative group cursor-pointer focus:outline-none ${
            !snapshot.isDragging ? 'transition-all duration-200' : ''
          } ${
            opportunity.priority === 'WINNING' ? 'opacity-100 border-green-200 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'border-border-subtle'
          } ${isSelected ? 'ring-2 ring-black border-black z-10' : ''} ${
            snapshot.isDragging ? 'shadow-2xl border-zinc-400 rotate-[1.5deg] scale-[1.03] z-[100]' : 'hover:shadow-md'
          }`}
        >
          <div className="flex">
            {/* ── Left drag rail ─────────────────────────────────── */}
            <div
              {...provided.dragHandleProps}
              className={`flex flex-col items-center justify-center gap-1 w-6 flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors duration-150 ${
                snapshot.isDragging
                  ? `${metadata?.color || 'bg-black'} text-white`
                  : 'bg-zinc-50 text-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-400'
              }`}
            >
              <GripVertical size={12} />
            </div>

            {/* ── Card content ───────────────────────────────────── */}
            <div className="flex-1 min-w-0 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(opportunity.id, true);
                    }}
                    className={`w-3.5 h-3.5 border transition-all flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-black border-black text-white' : 'border-zinc-300'}`}
                  >
                    {isSelected && <Check size={10} />}
                  </button>
                  <div className={`p-1 rounded text-white flex-shrink-0 ${metadata?.color}`}>
                    {getTypeIcon(metadata?.icon || '')}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 ml-1 leading-none">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-zinc-100 flex-shrink-0">
                        {opportunity.clientAvatar ? (
                          <img src={opportunity.clientAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={10} className="text-zinc-400 p-0.5" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">
                        {opportunity.clientName}
                      </span>
                    </div>
                    <PriorityBadge priority={opportunity.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(opportunity);
                      }}
                      className="text-zinc-400 hover:text-black transition-colors"
                      title="Edit Entry"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(opportunity);
                      }}
                      className="text-zinc-400 hover:text-brand-primary transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button className="text-zinc-400 hover:text-black">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-[12px] font-black text-black leading-tight mb-2 uppercase tracking-tight">{opportunity.title}</h3>
              {primaryField && (
                 <p className="text-[11px] text-zinc-500 mb-2 font-medium">{opportunity[primaryField.key]}</p>
              )}
              
              <div className="grid grid-cols-1 gap-1 mb-4">
                {cardFields.map((field, index) => (
                  <div key={`card-field-${field.key}-${index}`} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">{field.label}:</span>
                    <span className={`text-[10px] font-bold ${field.type === 'currency' ? 'text-brand-primary' : 'text-zinc-600'}`}>
                      {field.type === 'currency' ? `$${opportunity[field.key]?.toLocaleString()}` : (opportunity[field.key] || 'N/A')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Calendar size={12} />
                  <span className="text-[10px] font-bold tracking-wide">{opportunity.date}</span>
                </div>
                <motion.div 
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-zinc-300"
                >
                  <ChevronDown size={14} />
                </motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    key={`expanded-content-${opportunity.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-zinc-100 flex flex-col gap-4 pb-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            <User size={10} /> Owner
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${opportunity.ownerColor || 'bg-black'}`}>
                              {opportunity.ownerAlias}
                            </div>
                            <span className="text-[11px] font-bold text-black">{opportunity.ownerAlias}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            <Target size={10} /> Group
                          </div>
                          <span className="text-[11px] font-bold text-zinc-600">{metadata?.label}</span>
                        </div>
                      </div>

                      <div className="bg-zinc-50 p-2.5 border border-zinc-100">
                        <div className="flex items-center gap-4 mb-3 border-b border-zinc-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveTab('ACTIVITIES'); }}
                            className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'ACTIVITIES' ? 'border-brand-primary text-black' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                          >
                            {t('activities_tab')}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveTab('HISTORY'); }}
                            className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'HISTORY' ? 'border-brand-primary text-black' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                          >
                            {t('history_tab')}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveTab('SCORE'); }}
                            className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1 ${activeTab === 'SCORE' ? 'border-brand-primary text-black' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                          >
                            <Sparkles size={10} />
                            Score
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {activeTab === 'ACTIVITIES' ? (
                            <motion.div
                              key="activities-tab"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                            >
                              <ActivitySection 
                                activities={opportunity.activities || []} 
                                onUpdate={(acts) => onUpdateActivities?.(opportunity.id, acts)}
                                clientAddress={opportunity.clientAddress}
                                employeeAddress={(user as any).address}
                                clientRiskTolerance={opportunity.clientRiskTolerance}
                                clientHealth={opportunity.clientHealth}
                              />
                            </motion.div>
                          ) : activeTab === 'HISTORY' ? (
                            <motion.div
                              key="history-tab"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                            >
                              <HistorySection history={opportunity.history || []} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="score-tab"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                            >
                              <ScoreWidget opportunityId={opportunity.id} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

                <div className="flex justify-between items-center pt-3 border-t border-zinc-50">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 text-brand-primary">
                     <Clock size={12} />
                     <span className="text-[10px] font-extrabold">{opportunity.activities?.length || 0}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBadge score={scoreData?.score ?? null} grade={scoreData?.grade ?? null} trend={scoreData?.trend ?? null} />
                  {!isExpanded && (
                    <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white ${opportunity.ownerColor || 'bg-black'}`}>
                      {opportunity.ownerAlias}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Draggable>
  );
};

export default OpportunityCard;
