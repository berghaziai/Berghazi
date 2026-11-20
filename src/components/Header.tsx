import React, { useState } from 'react';
import { Menu, X, Shield, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LanguageCode, PageId } from '../types';
import { YazEmblem } from './AmazighArtwork';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    activePage,
    navigate,
    firebaseUser,
    userProfile,
    isMainAdmin,
    isAssistantAdmin,
    signInWithGoogle,
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryLinks: { id: PageId; label: string }[] = [
    { id: 'lessons', label: t.nav.lessons },
    { id: 'documents', label: t.nav.documents },
    { id: 'research', label: t.nav.research },
    { id: 'culture', label: t.nav.culture },
    { id: 'about', label: t.nav.about },
  ];

  const allDrawerLinks: { id: PageId; label: string }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'lessons', label: t.nav.lessons },
    { id: 'documents', label: t.nav.documents },
    { id: 'research', label: t.nav.research },
    { id: 'culture', label: t.nav.culture },
    { id: 'studio', label: t.nav.studio },
    { id: 'about', label: t.nav.about },
    { id: 'contact', label: t.nav.contact },
    { id: 'account', label: t.nav.account },
  ];

  const handleNav = (id: PageId) => {
    navigate(id);
    setMobileOpen(false);
  };

  const canAccessAdmin = isMainAdmin || isAssistantAdmin;

  return (
    <div className="no-print">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5E4DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#16222E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1D3A5F] rounded-md"
          >
            <YazEmblem className="w-6 h-6 text-[#C68B1C]" />
            <span>{t.brand}</span>
          </button>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#475569]">
            {primaryLinks.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'text-[#16222E] border-[#C68B1C] font-semibold'
                      : 'border-transparent hover:text-[#16222E] hover:border-[#E5E4DF]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action + mobile menu toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => handleNav('account')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">
                  {userProfile?.displayName || t.nav.account}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors whitespace-nowrap shrink-0"
              >
                {t.auth.signIn}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-[#16222E] hover:bg-[#F4F3EF] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Non-sticky Institutional Utility Ribbon (Languages + Contact + Admin Link) */}
      <div className="bg-[#F4F3EF] border-b border-[#E5E4DF] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[#475569]">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`hover:text-[#16222E] whitespace-nowrap ${
                activePage === 'home' ? 'font-semibold text-[#16222E]' : ''
              }`}
            >
              {t.nav.home}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleNav('contact')}
              className={`hover:text-[#16222E] whitespace-nowrap ${
                activePage === 'contact' ? 'font-semibold text-[#16222E]' : ''
              }`}
            >
              {t.nav.contact}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleNav('studio')}
              className={`font-semibold whitespace-nowrap ${
                activePage === 'studio'
                  ? 'text-[#C68B1C]'
                  : 'text-[#1D3A5F] hover:text-[#C68B1C]'
              }`}
            >
              {t.nav.studio}
            </button>
            {canAccessAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
                    activePage === 'admin'
                      ? 'text-[#C68B1C]'
                      : 'text-[#1D3A5F] hover:text-[#C68B1C]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.nav.admin}</span>
                </button>
              </>
            )}
          </div>

          {/* 3-Language Switcher: Amazigh Tifinagh / Arabic / English */}
          <div className="flex items-center gap-1 p-0.5 bg-white border border-[#E5E4DF] rounded-lg">
            {(
              [
                { code: 'zgh', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' },
                { code: 'ar', label: 'العربية' },
                { code: 'en', label: 'English' },
              ] as { code: LanguageCode; label: string }[]
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  language === lang.code
                    ? 'bg-[#1D3A5F] text-white'
                    : 'text-[#475569] hover:text-[#16222E]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E4DF] px-4 py-4 space-y-2">
          {allDrawerLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id
                  ? 'bg-[#1D3A5F] text-white'
                  : 'text-[#16222E] hover:bg-[#F4F3EF]'
              }`}
            >
              {item.label}
            </button>
          ))}
          {canAccessAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className="w-full text-start px-3 py-2.5 rounded-lg text-sm font-semibold text-[#C68B1C] bg-[#FAFAF8] border border-[#E5E4DF]"
            >
              {t.nav.admin}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
