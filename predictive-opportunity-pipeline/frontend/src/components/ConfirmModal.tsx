import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger'
}: ConfirmModalProps) {
  const { t } = useTranslation();

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'text-brand-primary bg-red-50';
      case 'warning': return 'text-amber-500 bg-amber-50';
      default: return 'text-blue-500 bg-blue-50';
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-brand-primary hover:bg-brand-primary-hover text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      default: return 'bg-black hover:bg-zinc-800 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              key="confirm-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md shadow-2xl pointer-events-auto border border-zinc-200"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${getVariantStyles()}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight italic">{title}</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="text-zinc-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <p className="text-[15px] text-zinc-600 leading-relaxed italic">
                  {message}
                </p>
              </div>

              <div className="flex justify-end gap-0 p-0 border-t border-zinc-100">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black hover:bg-zinc-50 border-r border-zinc-100 transition-all focus:outline-none"
                >
                  {cancelText || t('cancel')}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all focus:outline-none ${getButtonStyles()}`}
                >
                  {confirmText || t('confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
