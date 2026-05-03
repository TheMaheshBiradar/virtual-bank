import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, User, DollarSign, Activity, TrendingUp, AlertCircle, CheckCircle2, MinusCircle, UserPlus, Shield, Target, Globe } from 'lucide-react';
import { Client } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

import ClientDetailModal from './ClientDetailModal';

export default function ClientView({ onNavigateToOpportunity }: { onNavigateToOpportunity: (oppId: string) => void }) {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setIsLoading(false);
      });
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.segment.toLowerCase().includes(search.toLowerCase())
  );

  const getHealthIcon = (health: Client['health']) => {
    switch(health) {
      case 'HEALTHY': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'AT_RISK': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <MinusCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSegmentBadge = (segment: Client['segment']) => {
    const colors = {
      UHNW: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      HNW: 'bg-purple-100 text-purple-700 border-purple-200',
      AFFLUENT: 'bg-blue-100 text-blue-700 border-blue-200',
      RETAIL: 'bg-zinc-100 text-zinc-700 border-zinc-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest ${colors[segment]}`}>
        {segment}
      </span>
    );
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-zinc-200 border-t-brand-primary"></div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Loading Alpha-Tier Relationships...</p>
    </div>
  );

  if (clients.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 p-12">
      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 border border-zinc-200">
        <UserPlus className="w-10 h-10 text-zinc-300" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Clients Onboarded</h2>
      <p className="text-zinc-500 text-sm max-w-sm text-center mb-6">Start by connecting your CRM or manually onboarding a new wealth relationship.</p>
      <button className="bg-brand-primary text-white px-6 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-brand-primary-hover transition-colors shadow-sm">
        Connect CRM
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-zinc-900">Client Directory</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search relationships..."
              className="pl-9 pr-4 py-1.5 bg-zinc-100 border-transparent focus:bg-white focus:ring-1 focus:ring-brand-primary rounded-md text-sm w-64 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="bg-brand-primary text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-colors">
            Onboard New Client
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map((client, index) => (
            <motion.div 
              layout
              key={`client-card-${client.id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedClient(client)}
              className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200 p-0.5">
                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 group-hover:text-brand-primary transition-colors text-sm uppercase tracking-tight">{client.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-mono font-bold">{client.id}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getSegmentBadge(client.segment)}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded text-[10px] font-medium text-zinc-600">
                    {getHealthIcon(client.health)}
                    {client.health.replace('_', ' ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">AUM / Net Worth</span>
                      </div>
                      <span className="text-xs font-black text-zinc-900">
                        ${(client.totalWealth / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    {/* Wealth visual indicator bar */}
                    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${client.totalWealth > 25000000 ? 'bg-indigo-500' : 'bg-brand-primary'}`} 
                        style={{ width: `${Math.min(100, (client.totalWealth / 50000000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Target className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Risk Profile</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      client.riskTolerance === 'AGGRESSIVE' ? 'bg-orange-50 text-orange-600' : 
                      client.riskTolerance === 'CONSERVATIVE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {client.riskTolerance}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 py-1 border-t border-zinc-50">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Globe className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Swiss Location</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-medium truncate" title={client.address}>
                      {client.address}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Last Interaction</span>
                    </div>
                    <span className="text-xs text-zinc-600 font-medium">
                      {new Date(client.lastContact).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-4 py-2 border border-zinc-200 text-zinc-600 rounded text-xs font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2">
                <User className="w-3 h-3" />
                Full 360 View
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <ClientDetailModal 
        client={selectedClient} 
        onClose={() => setSelectedClient(null)} 
        onNavigateToOpportunity={onNavigateToOpportunity}
      />
    </div>
  );
}
