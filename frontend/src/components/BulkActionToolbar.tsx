import React from 'react';
import { Pencil, Trash2, Move, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Opportunity } from '../constants';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMetadata } from '../contexts/MetadataContext';

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkChangeStage: (stageId: Opportunity['stage']) => void;
}

export default function BulkActionToolbar({
  selectedIds,
  onClearSelection,
  onBulkEdit,
  onBulkDelete,
  onBulkChangeStage
}: BulkActionToolbarProps) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { stages } = useMetadata();

  const canBulkAction = can('BULK_ACTION');

  if (!canBulkAction && selectedIds.length > 0) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 flex items-center gap-6 shadow-2xl z-[60] border border-white/10 backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">{selectedIds.length} {t('selected')}</span>
            <button 
              onClick={onClearSelection}
              className="text-zinc-500 hover:text-white transition-colors underline text-[9px] uppercase tracking-widest font-bold"
            >
              {t('clear')}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-l border-white/20 pl-6">
            Permissions restricted for bulk modifications
          </p>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 flex items-center gap-10 shadow-2xl z-[60] border border-white/10 backdrop-blur-md"
        >
          <div className="flex items-center gap-4 border-r border-white/20 pr-8">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">{selectedIds.length} {t('selected')}</span>
            <button 
              onClick={onClearSelection}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={onBulkEdit}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              <Pencil size={16} />
              {t('bulk_edit')}
            </button>

            <button 
              onClick={onBulkDelete}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              <Trash2 size={16} />
              {t('bulk_delete')}
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                <Move size={16} />
                {t('move_to')}
              </button>
              <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 hidden group-hover:block min-w-[120px] shadow-xl">
                {stages.map((stage, index) => (
                  <button
                    key={`bulk-stage-opt-${stage.id}-${index}`}
                    onClick={() => onBulkChangeStage(stage.id as Opportunity['stage'])}
                    className="w-full text-left px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {t(`stage_${stage.id}` as any)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
