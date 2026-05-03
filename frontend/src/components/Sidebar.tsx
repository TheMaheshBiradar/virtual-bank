import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  Archive, 
  Filter, 
  Handshake, 
  Trophy,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext';
import { ViewType } from '../types';

interface SidebarProps {
  onClose: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Sidebar({ onClose, currentView, onViewChange }: SidebarProps) {
  const { t } = useTranslation();
  const navItems: { label: string; icon: any; id: ViewType }[] = [
    { label: t('nav_pipeline'), icon: Trophy, id: 'PIPELINE' },
    { label: t('nav_clients'), icon: Users, id: 'CLIENTS' },
  ];

  return (
    <motion.aside 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-stone-50 border-r border-border-subtle h-screen sticky top-0 hidden md:flex flex-col pt-24 overflow-hidden shrink-0 z-40"
    >
      <div className="px-6 mb-10 flex justify-between items-center group/sidebar-header">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-400 mb-1">{t('nav_bu')}</h2>
          <p className="text-[12px] text-zinc-900 font-bold tracking-tight">{t('nav_subbu')}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-stone-300 hover:text-brand-primary transition-all opacity-0 group-hover/sidebar-header:opacity-100 p-1 hover:bg-stone-100 rounded"
          title="Hide Navigation"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="px-6 mb-10">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-lead-modal'))}
          className="w-full bg-black text-white py-3.5 px-6 text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-between group/add transition-all hover:bg-zinc-800 shadow-lg shadow-black/5 active:scale-95"
        >
          {t('create_new')}
          <div className="bg-white/20 p-0.5 rounded-sm transition-transform group-hover/add:rotate-90">
             <LayoutDashboard size={14} className="text-white" />
          </div>
        </button>
      </div>

      <nav className="flex flex-col flex-1">
        <div className="px-6 mb-4">
           <h3 className="text-[9px] uppercase tracking-[0.2em] font-black text-stone-400">{t('nav_header')}</h3>
        </div>
        {navItems.map((item, index) => (
          <button
            key={`${item.id}-${index}`}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group w-full text-left ${
              currentView === item.id 
                ? 'bg-white text-brand-primary border-l-4 border-brand-primary' 
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-black border-l-4 border-transparent'
            }`}
          >
            <item.icon size={18} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[11px] uppercase tracking-[0.1em] font-bold">
              {item.label}
            </span>
          </button>
        ))}

        <div className="mt-auto pb-8 px-6">
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center">
            Alpha Wealth Systems v1.0
          </p>
        </div>
      </nav>
    </motion.aside>
  );
}
