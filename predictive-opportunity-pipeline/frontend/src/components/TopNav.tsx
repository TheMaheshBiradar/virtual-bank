import { User as UserIcon, ChevronDown, Menu as MenuIcon, Globe, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMetadata } from '../contexts/MetadataContext';
import { Language } from '../translations';
import { ViewType } from '../types';

interface TopNavProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function TopNav({ onToggleSidebar, isSidebarOpen, currentView, onViewChange }: TopNavProps) {
  const { language, setLanguage, t } = useTranslation();
  const { user, setUser } = useAuth();
  const { users } = useMetadata();

  return (
    <header className="fixed top-0 w-full bg-white border-b border-border-subtle z-50 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-zinc-50 transition-colors text-zinc-400 hover:text-black focus:outline-none"
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <MenuIcon size={20} strokeWidth={2.5} />
        </button>
        
        
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary p-1.5 rounded-sm">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-black tracking-[-0.02em] uppercase text-black">Global</span>
            <span className="text-[11px] font-semibold tracking-tight text-zinc-500">{t('app_title')}</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 h-16 ml-4">
          <button
            onClick={() => onViewChange('PIPELINE')}
            className={`text-[13px] font-semibold tracking-tight h-full flex items-center border-b-2 transition-all ${
              currentView === 'PIPELINE' ? 'text-black border-brand-primary' : 'text-zinc-400 border-transparent hover:text-brand-primary'
            }`}
          >
            {t('nav_pipeline')}
          </button>
          <button
            onClick={() => onViewChange('CLIENTS')}
            className={`text-[13px] font-semibold tracking-tight h-full flex items-center border-b-2 transition-all ${
              currentView === 'CLIENTS' ? 'text-black border-brand-primary' : 'text-zinc-400 border-transparent hover:text-brand-primary'
            }`}
          >
            {t('nav_clients')}
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 border-r border-zinc-200 pr-6">
          <Shield size={14} className="text-zinc-400" />
          <select 
            value={user.id}
            onChange={(e) => {
              const selected = users.find(u => u.id === e.target.value);
              if (selected) setUser(selected);
            }}
            className="text-[11px] font-bold uppercase tracking-wider bg-transparent focus:outline-none cursor-pointer hover:text-brand-primary transition-colors"
          >
            {users.map((u, index) => (
              <option key={`${u.id}-${index}`} value={u.id}>{u.role}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 border-r border-zinc-200 pr-6">
          <Globe size={14} className="text-zinc-400" />
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-[11px] font-bold uppercase tracking-wider bg-transparent focus:outline-none cursor-pointer hover:text-brand-primary transition-colors"
          >
            <option value="EN">EN</option>
            <option value="DE">DE</option>
            <option value="FR">FR</option>
            <option value="IT">IT</option>
          </select>
        </div>

        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-lead-modal'))}
          className="bg-brand-primary text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-brand-primary-hover transition-colors shadow-sm active:scale-[0.98]"
        >
          {t('create_new')}
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 text-white font-bold text-[10px] ${user.color}`}>
            {user.alias}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-black leading-none uppercase">{user.name}</span>
            <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter">{user.role}</span>
          </div>
          <ChevronDown size={14} className="text-zinc-400 group-hover:text-black transition-colors" />
        </div>
      </div>
    </header>
  );
}
