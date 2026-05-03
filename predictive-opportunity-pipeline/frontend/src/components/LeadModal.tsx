import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Opportunity, OpportunityType, Client } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useMetadata } from '../contexts/MetadataContext';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (opportunity: Omit<Opportunity, 'id'>) => void;
  initialData?: Opportunity | null;
  isBulk?: boolean;
}

export default function LeadModal({ isOpen, onClose, onSubmit, initialData, isBulk }: LeadModalProps) {
  const { t } = useTranslation();
  const { types, stages } = useMetadata();
  const [selectedType, setSelectedType] = useState<OpportunityType>('SALES');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);
  
  useEffect(() => {
    if (initialData) {
      setSelectedType(initialData.type || 'SALES');
      setFormData({ ...initialData });
    } else {
      setFormData({
        title: '',
        priority: 'MED',
        ownerAlias: '',
        stage: 'QUALIFY',
        activities: [],
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, type: selectedType } as any);
  };

  const metadata = types[selectedType];

  const renderField = (field: any, index: number) => {
    const value = formData[field.key] || '';
    const onChange = (val: any) => setFormData(prev => ({ ...prev, [field.key]: val }));

    return (
      <div key={`modal-field-${field.key}-${index}`} className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{field.label}</label>
        {field.type === 'select' ? (
          <select
            required={field.required && !isBulk}
            className="w-full border border-border-subtle px-4 py-2.5 text-sm focus:outline-none focus:border-black appearance-none bg-white font-medium"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select {field.label}...</option>
            {field.options?.map((opt: string, index: number) => (
              <option key={`${opt}-${index}`} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === 'currency' ? (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
            <input
              required={field.required && !isBulk}
              type="number"
              className="w-full border border-border-subtle pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-black"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
            />
          </div>
        ) : (
          <input
            required={field.required && !isBulk}
            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            className="w-full border border-border-subtle px-4 py-2.5 text-sm focus:outline-none focus:border-black"
            value={value}
            onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            key="modal-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full max-w-[480px] bg-white z-[110] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="text-[18px] font-bold tracking-tight uppercase">
                {isBulk ? t('bulk_edit') : (initialData ? t('save') : t('create_new'))}
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {!initialData && !isBulk && (
                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Entry Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(types) as OpportunityType[]).map((type, index) => {
                      const meta = types[type];
                      return (
                        <button
                          key={`type-opt-${type}-${index}`}
                          type="button"
                          onClick={() => setSelectedType(type)}
                          className={`p-3 border flex flex-col items-center gap-2 transition-all ${
                            selectedType === type ? 'border-black bg-zinc-50' : 'border-zinc-100 hover:border-zinc-300'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${selectedType === type ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                            {type === 'SALES' ? <DollarSign size={16} /> : type === 'TAGGING' ? <Tag size={16} /> : <MessageSquare size={16} />}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center">{t(`opp_${type}` as any)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Read-only type badge shown in Edit mode */}
              {initialData && !isBulk && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Entry Type</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200">
                    <div className={`p-2 rounded-full text-white ${metadata?.color || 'bg-black'}`}>
                      {selectedType === 'SALES' ? <DollarSign size={16} /> : selectedType === 'TAGGING' ? <Tag size={16} /> : <MessageSquare size={16} />}
                    </div>
                    <div>
                      <span className="text-[13px] font-black uppercase tracking-wide text-black">{metadata?.label}</span>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Type is locked after creation</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Associated Client</label>
                <div className="relative">
                  <select
                    required={!isBulk}
                    className="w-full border border-border-subtle px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-black appearance-none bg-white"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  >
                    <option value="">Select Relationship...</option>
                    {clients.map((client, index) => (
                      <option key={`client-opt-${client.id}-${index}`} value={client.id}>
                        {client.name} ({client.id}) - {client.segment}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-tight">
                    Every opportunity must be anchored to a verified client relationship.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Title</label>
                <input
                  required={!isBulk}
                  type="text"
                  className="w-full border border-border-subtle px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-black"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Current Stage</label>
                <div className="relative">
                  <select
                    required={!isBulk}
                    className="w-full border border-border-subtle px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-black appearance-none bg-white"
                    value={formData.stage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                  >
                    <option value="">Select Stage...</option>
                    {stages.map((stage, index) => {
                      const isCurrent = initialData?.stage === stage.id;
                      const allowed = metadata?.allowedTransitions?.[initialData?.stage as string] || [];
                      const isAllowed = isCurrent || !initialData || allowed.includes(stage.id);
                      
                      return (
                        <option 
                          key={`stage-opt-${stage.id}-${index}`} 
                          value={stage.id} 
                          disabled={!isAllowed}
                          className={!isAllowed ? 'text-zinc-300' : 'text-black font-bold'}
                        >
                          {t(`stage_${stage.id}` as any)} {!isAllowed ? ` (${t('locked_stage')})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {!isBulk && initialData && (
                    <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-tight italic">
                      Note: Stages are locked based on {metadata?.label} workflow rules.
                    </p>
                  )}
                </div>
              </div>

              {metadata?.fields.map((field, i) => renderField(field, i))}

              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Priority</label>
                <div className="flex gap-2">
                  {['LOW', 'MED', 'HIGH', 'WINNING'].map((p: any, index: number) => (
                    <button
                      key={`priority-opt-${p}-${index}`}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={`flex-1 py-2 text-[9px] font-extrabold tracking-widest border transition-all ${
                        formData.priority === p ? 'bg-black text-white border-black shadow-lg scale-[1.02]' : 'bg-white text-zinc-400 border-border-subtle hover:border-zinc-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Owner Initial</label>
                <input
                  required={!isBulk}
                  maxLength={2}
                  type="text"
                  className="w-24 border border-border-subtle px-4 py-2.5 text-sm font-bold uppercase focus:outline-none focus:border-black"
                  value={formData.ownerAlias || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerAlias: e.target.value.toUpperCase() }))}
                />
              </div>
            </form>

              <div className="p-6 border-t border-border-subtle bg-zinc-50">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full bg-brand-primary text-white py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-brand-primary-hover transition-all active:scale-[0.98] shadow-lg"
                >
                  {isBulk ? t('bulk_edit') : (initialData ? t('save') : t('save'))}
                </button>
              </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
