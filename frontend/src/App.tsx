/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import ClientView from './components/ClientView';
import { AnimatePresence } from 'motion/react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { MetadataProvider } from './contexts/MetadataContext';
import { ViewType } from './types';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('PIPELINE');
  const [targetOpportunityId, setTargetOpportunityId] = useState<string | null>(null);

  const handleNavigateToOpportunity = (oppId: string) => {
    setTargetOpportunityId(oppId);
    setCurrentView('PIPELINE');
  };

  return (
    <LanguageProvider>
      <MetadataProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col overflow-x-hidden font-sans">
            <TopNav 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
              isSidebarOpen={sidebarOpen} 
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            
            <div className="flex flex-1">
              <AnimatePresence initial={false}>
                {sidebarOpen && (
                  <Sidebar 
                    onClose={() => setSidebarOpen(false)} 
                    currentView={currentView}
                    onViewChange={setCurrentView}
                  />
                )}
              </AnimatePresence>
              
              <main className="flex-1 bg-surface relative min-w-0 flex flex-col">
                {currentView === 'PIPELINE' ? (
                  <KanbanBoard 
                    targetOpportunityId={targetOpportunityId} 
                    onClearTarget={() => setTargetOpportunityId(null)} 
                  />
                ) : (
                  <ClientView onNavigateToOpportunity={handleNavigateToOpportunity} />
                )}
              </main>
            </div>
          </div>
        </AuthProvider>
      </MetadataProvider>
    </LanguageProvider>
  );
}
