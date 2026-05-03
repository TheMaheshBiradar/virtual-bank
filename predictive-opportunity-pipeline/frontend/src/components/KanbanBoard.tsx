import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import LeadModal from './LeadModal';
import ConfirmModal from './ConfirmModal';
import KanbanColumn from './KanbanColumn';
import KanbanHeader from './KanbanHeader';
import BulkActionToolbar from './BulkActionToolbar';
import KanbanInsights from './KanbanInsights';
import TransitionBlockedModal from './TransitionBlockedModal';
import PipelineScoreBar from './PipelineScoreBar';
import { Opportunity, Activity, HistoryEntry } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMetadata } from '../contexts/MetadataContext';

interface KanbanBoardProps {
  targetOpportunityId?: string | null;
  onClearTarget?: () => void;
}

export default function KanbanBoard({ targetOpportunityId, onClearTarget }: KanbanBoardProps) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { stages, isLoading: isMetadataLoading } = useMetadata();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'score'>('default');

  useEffect(() => {
    if (!isLoading && targetOpportunityId && opportunities.length > 0) {
      const target = opportunities.find(o => o.id === targetOpportunityId);
      if (target) {
        setEditingOpportunity(target);
        setIsBulkEdit(false);
        setIsModalOpen(true);
        onClearTarget?.();
      }
    }
  }, [isLoading, targetOpportunityId, opportunities]);

  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [viewMode, setViewMode] = useState<'stage' | 'status'>('stage');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingOppId, setDraggingOppId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Transition-blocked modal state
  const [transitionBlocked, setTransitionBlocked] = useState<{
    opportunityTitle: string;
    opportunityType: string;
    fromStage: string;
    toStage: string;
    allowedStages: string[];
    /** The opportunity to actually move if the user picks an alternative */ 
    pendingOpp: Opportunity;
    prevOpps: Opportunity[];
  } | null>(null);
  
  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      // Flatten dynamicFields into the root object for frontend compatibility
      const flattened = data.map((opp: any) => ({
        ...opp,
        ...opp.dynamicFields
      }));
      setOpportunities(flattened);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scoring/leaderboard');
      const data = await res.json();
      setScores(data);
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    }
  };

  const addHistoryEntry = (opp: Opportunity, type: HistoryEntry['type'], description: string): Opportunity => {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString(),
      user: 'Current User',
      description,
      type
    };
    return {
      ...opp,
      history: [entry, ...(opp.history || [])]
    };
  };

  const preparePayload = (data: any) => {
    // Destructure all known top-level fields (including read-only backend fields)
    const { 
      id, type, title, stage, ownerAlias, priority, date, activities, history, clientId,
      dynamicFields,
      // Read-only fields that should NOT go into dynamicFields:
      createdAt, updatedAt, score, grade, marketSentimentScore, riskScore, recommendation,
      clientName, clientAvatar, clientAddress, clientRiskTolerance, clientHealth,
      ...rest 
    } = data;
    
    // Convert all values in rest to strings to satisfy Map<String, String> in Java backend
    const stringifiedRest: Record<string, string> = {};
    Object.keys(rest).forEach(key => {
      stringifiedRest[key] = rest[key] != null ? String(rest[key]) : '';
    });

    return {
      id, type, title, stage, ownerAlias, priority, date, activities, history, clientId,
      dynamicFields: { ...(dynamicFields || {}), ...stringifiedRest }
    };
  };

  const handleFormSubmit = async (data: Omit<Opportunity, 'id'>) => {
    if (isBulkEdit) {
      const results = await Promise.all(selectedIds.map(async (id) => {
        const opp = opportunities.find(o => o.id === id);
        if (!opp) return { success: false };

        const updated = addHistoryEntry({ ...opp, ...data }, 'EDIT', 'Bulk update applied');
        const payload = preparePayload(updated);
        
        const res = await fetch(`/api/opportunities/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const err = await res.json();
          return { success: false, message: err.error, opp };
        }
        return { success: true };
      }));

      const failures = results.filter(r => !r.success && r.message);
      if (failures.length > 0) {
        alert(`Some updates failed:\n${failures.map(f => `- ${f.opp?.title}: ${f.message}`).join('\n')}`);
      }
      
      await fetchOpportunities();
      setSelectedIds([]);
    } else if (editingOpportunity) {
      const opp = opportunities.find(o => o.id === (editingOpportunity as any).id);
      if (!opp) return;

      const updated = addHistoryEntry({ ...data, id: opp.id, history: opp.history } as Opportunity, 'EDIT', 'Updated via editor');
      const payload = preparePayload(updated);

      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
        return;
      }

      await fetchOpportunities();
    } else {
      const newOpp = addHistoryEntry(data as Opportunity, 'CREATE', 'Created entry');
      const payload = preparePayload(newOpp);

      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) await fetchOpportunities();
    }
    setIsModalOpen(false);
    setEditingOpportunity(null);
    setIsBulkEdit(false);
  };

  const handleEditRequest = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setIsBulkEdit(false);
    setIsModalOpen(true);
  };

  const handleCreateRequest = () => {
    setEditingOpportunity(null);
    setIsBulkEdit(false);
    setIsModalOpen(true);
  };

  const handleBulkEditRequest = () => {
    const selectedOpps = opportunities.filter(o => selectedIds.includes(o.id));
    if (selectedOpps.length === 0) return;

    const first = selectedOpps[0];
    const initialData: Record<string, any> = {};
    const allSameType = selectedOpps.every(o => o.type === first.type);
    if (allSameType) initialData.type = first.type;

    const allKeys = Array.from(new Set(selectedOpps.flatMap(o => Object.keys(o))));
    allKeys.forEach((key: any) => {
      if (key === 'id') return;
      const firstVal = (first as any)[key];
      if (selectedOpps.every(o => JSON.stringify((o as any)[key]) === JSON.stringify(firstVal))) {
        (initialData as any)[key] = firstVal;
      }
    });

    setEditingOpportunity(initialData as any);
    setIsBulkEdit(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchOpportunities();
    fetchScores();
    const handleGlobalCreate = () => handleCreateRequest();
    window.addEventListener('open-lead-modal', handleGlobalCreate);
    return () => window.removeEventListener('open-lead-modal', handleGlobalCreate);
  }, []);

  const onDragStart = (start: any) => setDraggingOppId(start.draggableId);

  const onDragEnd = async (result: DropResult) => {
    setDraggingOppId(null);
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const destStage = destination.droppableId as Opportunity['stage'];
    const sourceStage = source.droppableId as Opportunity['stage'];
    
    // Optimistic UI Update
    const prevOpps = [...opportunities];
    const targetOpp = opportunities.find(o => o.id === draggableId);
    if (!targetOpp) return;

    // Filter out the moving item and insert it at the new position
    const newItems = opportunities.filter(o => o.id !== draggableId);
    
    // Find all items in the destination column
    const destColumnItems = newItems.filter(o => o.stage === destStage);
    const otherItems = newItems.filter(o => o.stage !== destStage);
    
    // Insert at destination index within the destination column
    const updatedOpp = { ...targetOpp, stage: destStage };
    destColumnItems.splice(destination.index, 0, updatedOpp);
    
    // Combine back
    const optimisticOpps = [...otherItems, ...destColumnItems];
    setOpportunities(optimisticOpps);

    // Handle Backend Sync
    if (sourceStage !== destStage) {
      try {
        const historyUpdated = addHistoryEntry(updatedOpp, 'STATUS_CHANGE', `Moved to ${destStage}`);
        const payload = preparePayload(historyUpdated);
        const res = await fetch(`/api/opportunities/${targetOpp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const err = await res.json();
          setOpportunities(prevOpps); // Revert card position

          if (err.type === 'VALIDATION_ERROR' || (err.error && err.error.includes('Invalid transition'))) {
            // Parse allowed stages from the error message if available,
            // then show the rich TransitionBlockedModal
            const allowedMatch = err.error?.match(/Allowed: \[([^\]]*)\]/);
            const allowedStages = allowedMatch && allowedMatch[1]
              ? allowedMatch[1].split(', ').filter(Boolean)
              : [];

            setTransitionBlocked({
              opportunityTitle: targetOpp.title,
              opportunityType: targetOpp.type,
              fromStage: sourceStage,
              toStage: destStage,
              allowedStages,
              pendingOpp: targetOpp,
              prevOpps,
            });
          } else {
            console.error('Server error during transition update:', err);
            alert(`Update failed: ${err.error || 'Unknown server error'}`);
          }
          return;
        }
      } catch (error) {
        console.error('Sync failed:', error);
        setOpportunities(prevOpps); // Revert
        return;
      }
    }
    
    // Final sync to get server-side ids/order if needed, but UI is already updated
    fetchOpportunities();
  };

  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds(prev => prev.includes(id) && prev.length === 1 ? [] : [id]);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmState({
      isOpen: true,
      title: t('bulk_delete_confirm_title'),
      message: t('bulk_delete_confirm_message').replace('{count}', selectedIds.length.toString()),
      onConfirm: async () => {
        await Promise.all(selectedIds.map(id => fetch(`/api/opportunities/${id}`, { method: 'DELETE' })));
        await fetchOpportunities();
        setSelectedIds([]);
      }
    });
  };

  const handleDeleteOpportunity = async (opp: Opportunity) => {
    setConfirmState({
      isOpen: true,
      title: t('delete_confirm_title'),
      message: t('delete_confirm_message'),
      onConfirm: async () => {
        const res = await fetch(`/api/opportunities/${opp.id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchOpportunities();
          setSelectedIds(prev => prev.filter(id => id !== opp.id));
        }
      }
    });
  };

  const handleBulkChangeStage = async (stageId: Opportunity['stage']) => {
    const results = await Promise.all(selectedIds.map(async (id) => {
      const opp = opportunities.find(o => o.id === id);
      if (!opp || opp.stage === stageId) return { success: true };

      const updated = addHistoryEntry({ ...opp, stage: stageId }, 'STATUS_CHANGE', `Bulk moved to ${stageId}`);
      const payload = preparePayload(updated);
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.error, opp };
      }
      return { success: true };
    }));

    const failures = results.filter(r => !r.success && r.message);
    if (failures.length > 0) alert(`${failures.length} transitions failed.`);
    await fetchOpportunities();
    setSelectedIds([]);
  };

  const handleUpdateActivities = async (oppId: string, activities: Activity[]) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;
    const updated = addHistoryEntry({ ...opp, activities }, 'ACTIVITY', 'Activities updated');
    const payload = preparePayload(updated);
    const res = await fetch(`/api/opportunities/${oppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchOpportunities();
  };

  /** Called when user clicks a valid alternative stage inside TransitionBlockedModal. */
  const handleMoveToAlternativeStage = async (newStage: string) => {
    if (!transitionBlocked) return;
    const { pendingOpp } = transitionBlocked;

    // Optimistically move to the chosen valid stage
    setOpportunities(prev =>
      prev.map(o => o.id === pendingOpp.id ? { ...o, stage: newStage as any } : o)
    );

    const historyUpdated = addHistoryEntry(
      { ...pendingOpp, stage: newStage as any },
      'STATUS_CHANGE',
      `Moved to ${newStage} (redirect from blocked ${transitionBlocked.toStage})`
    );
    const payload = preparePayload(historyUpdated);

    const res = await fetch(`/api/opportunities/${pendingOpp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Revert if even the alternative fails (shouldn't happen)
      setOpportunities(transitionBlocked.prevOpps);
    } else {
      fetchOpportunities();
    }
  };

  if (isLoading || isMetadataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 border-t border-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Loading Pipeline...</p>
        </div>
      </div>
    );
  }

  const filteredOpps = opportunities.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 px-8 pt-24 min-h-screen">
      <BulkActionToolbar 
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkEdit={handleBulkEditRequest}
        onBulkDelete={handleBulkDelete}
        onBulkChangeStage={handleBulkChangeStage}
      />

      <LeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleFormSubmit} 
        initialData={editingOpportunity}
        isBulk={isBulkEdit}
      />

      <KanbanHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <PipelineScoreBar onRefreshScores={fetchScores} />

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-12 kanban-scroll items-start">
          {stages.map((stage, index) => (
            <KanbanColumn 
              key={`kanban-column-${stage.id}-${index}`}
              stage={stage}
              opportunities={filteredOpps}
              draggingOppId={draggingOppId}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onEdit={handleEditRequest}
              onDelete={handleDeleteOpportunity}
              onUpdateActivities={handleUpdateActivities}
              scores={scores}
              sortBy={sortBy}
            />
          ))}
          {can('VIEW_INSIGHTS') && <KanbanInsights opportunities={filteredOpps} />}
        </div>
      </DragDropContext>

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
      />

      <TransitionBlockedModal
        blocked={transitionBlocked}
        onClose={() => setTransitionBlocked(null)}
        onMoveToStage={handleMoveToAlternativeStage}
      />

      <button 
        onClick={handleCreateRequest}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-white flex items-center justify-center shadow-xl hover:bg-brand-primary-hover transition-all active:scale-90 group z-50 focus:outline-none"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
