import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Opportunity, Stage } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { useMetadata } from '../contexts/MetadataContext';
import OpportunityCard from './OpportunityCard';

interface KanbanColumnProps {
  stage: Stage;
  opportunities: Opportunity[];
  draggingOppId: string | null;
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (opp: Opportunity) => void;
  onUpdateActivities: (id: string, activities: any[]) => void;
  scores: any[];
  sortBy: 'default' | 'score';
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  opportunities,
  draggingOppId,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onUpdateActivities,
  scores,
  sortBy
}) => {
  const { t } = useTranslation();
  const { types } = useMetadata();
  
  let columnOpps = opportunities.filter(o => o.stage === stage.id);

  // Apply sorting
  if (sortBy === 'score') {
    columnOpps = [...columnOpps].sort((a, b) => {
      const scoreA = scores.find(s => s.opportunityId === a.id)?.score || 0;
      const scoreB = scores.find(s => s.opportunityId === b.id)?.score || 0;
      return scoreB - scoreA;
    });
  }

  return (
    <Droppable key={stage.id} droppableId={stage.id}>
      {(provided, snapshot) => {
        const draggingOpp = draggingOppId ? opportunities.find(o => o.id === draggingOppId) : null;
        const isDraggingAny = !!draggingOppId;
        
        let isValidTarget = true;
        if (draggingOpp) {
          const meta = types[draggingOpp.type];
          const allowedStages = meta?.allowedTransitions?.[draggingOpp.stage as string] || [];
          isValidTarget = draggingOpp.stage === stage.id || allowedStages.includes(stage.id);
        }

        return (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-shrink-0 w-80 p-4 border-2 transition-colors duration-200 ${
              snapshot.isDraggingOver 
                ? (isValidTarget ? 'bg-zinc-200/60 border-brand-primary/40 border-dashed ring-4 ring-brand-primary/5' : 'bg-red-50/50 border-red-500/40 ring-4 ring-red-500/5') 
                : 'bg-zinc-100/50 border-zinc-200/50'
            } ${
              isDraggingAny && !isValidTarget ? 'opacity-20' : ''
            } ${
              isDraggingAny && isValidTarget && draggingOpp?.stage !== stage.id ? 'bg-emerald-50/30' : ''
            }`}
          >
            <div className="flex justify-between items-center mb-5 pb-2.5 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-widest text-black">{t(`stage_${stage.id}` as any)}</span>
                <span className="bg-zinc-200 text-zinc-600 text-[10px] px-1.5 py-0.5 font-bold">{columnOpps.length}</span>
              </div>
              <span className="text-[12px] font-bold text-brand-primary tracking-tight">
                CHF {(columnOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0) / 1000).toFixed(1)}k
              </span>
            </div>

            <div className="space-y-4 min-h-[500px]">
              {columnOpps.map((opp, index) => (
                <OpportunityCard 
                  key={`opp-${opp.id}-${index}`} 
                  opportunity={opp} 
                  index={index}
                  onEdit={() => onEdit(opp)}
                  onDelete={() => onDelete(opp)}
                  isSelected={selectedIds.includes(opp.id)}
                  onSelect={onSelect}
                  onUpdateActivities={onUpdateActivities}
                  scoreData={scores.find(s => s.opportunityId === opp.id)}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        );
      }}
    </Droppable>
  );
};

export default KanbanColumn;
