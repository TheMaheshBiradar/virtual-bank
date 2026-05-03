import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Ban, CheckCircle2, Workflow } from 'lucide-react';

const STAGE_ORDER = ['QUALIFY', 'DEVELOP', 'PROPOSE', 'CLOSE'];
const STAGE_LABELS: Record<string, string> = {
  QUALIFY: 'Qualify',
  DEVELOP: 'Develop',
  PROPOSE: 'Propose',
  CLOSE: 'Close',
};

interface TransitionBlockedModalProps {
  /** Null when closed. */
  blocked: {
    opportunityTitle: string;
    opportunityType: string;
    fromStage: string;
    toStage: string;
    allowedStages: string[];
  } | null;
  onClose: () => void;
  /** Called when the user picks an allowed alternative stage. */
  onMoveToStage: (stage: string) => void;
}

export default function TransitionBlockedModal({
  blocked,
  onClose,
  onMoveToStage,
}: TransitionBlockedModalProps) {
  const handlePickStage = (stage: string) => {
    onMoveToStage(stage);
    onClose();
  };

  return (
    <AnimatePresence>
      {blocked && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tbm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />

          {/* Modal — slides up from bottom */}
          <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="tbm-panel"
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-lg bg-white shadow-2xl pointer-events-auto border border-zinc-200 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-primary/10 flex items-center justify-center">
                    <Ban size={18} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      Stage Transition Blocked
                    </p>
                    <h2 className="text-[15px] font-black text-black uppercase tracking-tight leading-none mt-0.5">
                      {blocked.opportunityTitle}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-black transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Visual Stage Map */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-3 flex items-center gap-2">
                    <Workflow size={10} />
                    {blocked.opportunityType} Pipeline Map
                  </p>
                  <div className="flex items-center gap-0">
                    {STAGE_ORDER.map((stage, i) => {
                      const isFrom = stage === blocked.fromStage;
                      const isTo = stage === blocked.toStage;
                      const isAllowed = blocked.allowedStages.includes(stage);
                      const isLast = i === STAGE_ORDER.length - 1;

                      return (
                        <React.Fragment key={stage}>
                          {/* Stage node */}
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.07 }}
                            className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 border-2 min-w-[72px] transition-all ${
                              isFrom
                                ? 'border-brand-primary bg-brand-primary/5'
                                : isTo
                                ? 'border-red-400 bg-red-50/60'
                                : 'border-zinc-200 bg-white'
                            }`}
                          >
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              isFrom ? 'text-brand-primary' : isTo ? 'text-red-500' : 'text-zinc-400'
                            }`}>
                              {STAGE_LABELS[stage]}
                            </span>
                            {isFrom && (
                              <span className="text-[8px] font-black text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 uppercase tracking-wider">
                                Current
                              </span>
                            )}
                            {isTo && (
                              <span className="text-[8px] font-black text-red-500 bg-red-100 px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1">
                                <Ban size={8} /> Blocked
                              </span>
                            )}
                          </motion.div>

                          {/* Arrow connector */}
                          {!isLast && (
                            <div className="relative flex items-center">
                              {/* Blocked path flash */}
                              {stage === blocked.fromStage && !blocked.allowedStages.includes(STAGE_ORDER[i + 1]) && STAGE_ORDER[i + 1] === blocked.toStage ? (
                                <motion.div
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.2 }}
                                  className="flex items-center"
                                >
                                  <div className="w-6 h-0.5 bg-red-400" />
                                  <X size={14} className="text-red-500 -mx-0.5" />
                                  <div className="w-6 h-0.5 bg-red-400" />
                                </motion.div>
                              ) : (
                                <div className="w-8 h-0.5 bg-zinc-200 flex items-center justify-center">
                                  <ArrowRight size={12} className="text-zinc-300 -mr-1" />
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Rule explanation */}
                <div className="bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-3">
                  <Ban size={14} className="text-brand-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    <span className="font-black text-black">{blocked.opportunityType}</span> opportunities
                    cannot skip directly from{' '}
                    <span className="font-black text-brand-primary">{STAGE_LABELS[blocked.fromStage]}</span> to{' '}
                    <span className="font-black text-red-500">{STAGE_LABELS[blocked.toStage]}</span>.
                    This protects the integrity of your sales workflow.
                  </p>
                </div>

                {/* Allowed alternatives */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    Valid next stages from {STAGE_LABELS[blocked.fromStage]}
                  </p>
                  {blocked.allowedStages.length > 0 ? (
                    <div className="flex gap-3 flex-wrap">
                      {blocked.allowedStages.map((stage) => (
                        <motion.button
                          key={stage}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handlePickStage(stage)}
                          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 transition-all group"
                        >
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                            Move to {STAGE_LABELS[stage]}
                          </span>
                          <ArrowRight size={12} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-200">
                      <Ban size={14} className="text-zinc-400" />
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Terminal stage — no further transitions allowed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/40 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-black border border-zinc-200 hover:border-zinc-400 transition-all"
                >
                  Keep in {STAGE_LABELS[blocked.fromStage]}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
