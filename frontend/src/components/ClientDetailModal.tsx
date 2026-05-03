import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, DollarSign, Activity, TrendingUp, Calendar, ArrowRight, Briefcase, Globe } from 'lucide-react';
import { Client, Opportunity } from '../types';

interface ClientDetailModalProps {
  client: Client | null;
  onClose: () => void;
  onNavigateToOpportunity: (oppId: string) => void;
}

export default function ClientDetailModal({ client, onClose, onNavigateToOpportunity }: ClientDetailModalProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setIsLoading(true);
      fetch('/api/opportunities')
        .then(res => res.json())
        .then(data => {
          const clientOpps = data.filter((o: Opportunity) => o.clientId === client.id);
          setOpportunities(clientOpps);
          setIsLoading(false);
        });
    }
  }, [client]);

  if (!client) return null;

  const totalPipelineValue = opportunities.reduce((sum, opp: any) => {
    return sum + (opp.value || 0);
  }, 0);

  const getStageColor = (stage: string) => {
    const stages: Record<string, string> = {
      'QUALIFY': 'text-blue-600 bg-blue-50',
      'DEVELOP': 'text-amber-600 bg-amber-50',
      'PROPOSE': 'text-purple-600 bg-purple-50',
      'CLOSE': 'text-emerald-600 bg-emerald-50'
    };
    return stages[stage] || 'text-zinc-600 bg-zinc-50';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden">
                <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{client.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase tracking-widest">
                    {client.segment}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{client.id}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-zinc-500">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{client.address}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-zinc-400 hover:text-zinc-900 transition-all shadow-sm">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total AUM</p>
                <p className="text-lg font-black text-zinc-900">${(client.totalWealth / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Pipeline Value</p>
                <p className="text-lg font-black text-brand-primary">${(totalPipelineValue / 1000).toFixed(0)}K</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Active Opps</p>
                <p className="text-lg font-black text-zinc-900">{opportunities.length}</p>
              </div>
            </div>

            {/* Opportunities List */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5" />
                  Active Pipeline
                </h3>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-zinc-50 rounded-lg animate-pulse" />)}
                </div>
              ) : opportunities.length > 0 ? (
                <div className="space-y-3">
                  {opportunities.map((opp, index) => (
                    <motion.div 
                      key={`client-opp-${opp.id}-${index}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onNavigateToOpportunity(opp.id)}
                      className="p-4 border border-zinc-100 rounded-xl hover:border-brand-primary transition-all group flex items-center justify-between cursor-pointer active:scale-95"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-zinc-100 group-hover:bg-brand-primary group-hover:text-white transition-colors`}>
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-zinc-900">{opp.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${getStageColor(opp.stage)}`}>
                              {opp.stage}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold">
                              ${((opp as any).value / 1000).toFixed(0)}k Projected
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-brand-primary transition-colors" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Active Opportunities</p>
                </div>
              )}
            </section>

            {/* Wealth Breakdown */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Wealth Profile
              </h3>
              <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">Risk Profile</span>
                    <span className="text-zinc-900">{client.riskTolerance}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${client.riskTolerance === 'AGGRESSIVE' ? 'bg-orange-500' : client.riskTolerance === 'CONSERVATIVE' ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                      style={{ width: client.riskTolerance === 'AGGRESSIVE' ? '85%' : client.riskTolerance === 'CONSERVATIVE' ? '30%' : '60%' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 py-4 border-t border-zinc-200">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Relationship Health</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${client.health === 'HEALTHY' ? 'bg-emerald-500' : 'bg-brand-primary'}`} />
                      <p className="text-xs font-black text-zinc-900">{client.health.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Last Interaction</p>
                    <p className="text-xs font-black text-zinc-900">{new Date(client.lastContact).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50/30 flex gap-3">
            <button className="flex-1 bg-brand-primary text-white py-3 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-100">
              Generate Proposal
            </button>
            <button className="px-6 py-3 border border-zinc-200 bg-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-zinc-50 transition-colors">
              Log Call
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
