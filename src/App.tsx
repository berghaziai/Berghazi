import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ResearchPage } from './pages/ResearchPage';
import { CulturePage } from './pages/CulturePage';
import { StudioPage } from './pages/StudioPage';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DocumentTemplateType } from './types';

const BerghaziShell: React.FC = () => {
  const { activePage, authError, clearAuthError } = useApp();
  const [selectedPathway, setSelectedPathway] = useState<number>(1);
  const [selectedDocTab, setSelectedDocTab] = useState<DocumentTemplateType>('mind_map');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#16222E]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm no-print">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header />

      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 no-print">
          <div className="bg-[#FEF2F2] border border-[#9A3412]/30 text-[#9A3412] rounded-lg px-4 py-2.5 text-xs flex items-center justify-between gap-4">
            <span>{authError}</span>
            <button type="button" onClick={clearAuthError} className="font-semibold underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onSelectPathway={(p) => setSelectedPathway(p)}
            onSelectDocTab={(tab) => setSelectedDocTab(tab)}
            onOpenArticle={(id) => setSelectedArticleId(id)}
          />
        )}
        {activePage === 'lessons' && (
          <LessonsPage
            selectedPathway={selectedPathway}
            onSelectPathway={(p) => setSelectedPathway(p)}
          />
        )}
        {activePage === 'documents' && (
          <DocumentsPage
            activeTab={selectedDocTab}
            onTabChange={(tab) => setSelectedDocTab(tab)}
          />
        )}
        {activePage === 'research' && (
          <ResearchPage
            initialArticleId={selectedArticleId}
            onClearInitialArticle={() => setSelectedArticleId(null)}
          />
        )}
        {activePage === 'culture' && (
          <CulturePage onOpenArticle={(id) => setSelectedArticleId(id)} />
        )}
        {activePage === 'studio' && <StudioPage />}
        {activePage === 'about' && <AboutPage />}
        {activePage === 'account' && <AccountPage />}
        {activePage === 'contact' && <ContactPage />}
        {activePage === 'admin' && <AdminDashboard />}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BerghaziShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
