import React from 'react';
import { Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AmazighGeometricFrieze, YazEmblem } from './AmazighArtwork';
import { PageId } from '../types';

export const Footer: React.FC = () => {
  const { t, navigate, siteSettings, setLanguage, language, isMainAdmin, isAssistantAdmin } =
    useApp();

  const links: { id: PageId; label: string }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'lessons', label: t.nav.lessons },
    { id: 'documents', label: t.nav.documents },
    { id: 'research', label: t.nav.research },
    { id: 'culture', label: t.nav.culture },
    { id: 'studio', label: t.nav.studio },
    { id: 'about', label: t.nav.about },
    { id: 'account', label: t.nav.account },
    { id: 'contact', label: t.nav.contact },
  ];

  return (
    <footer className="bg-[#16222E] text-white mt-20 no-print">
      <AmazighGeometricFrieze />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-xl font-bold">
            <YazEmblem className="w-7 h-7 text-[#C68B1C]" />
            <span>{t.brand}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            {t.home.heroSubtitle}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Mail className="w-4 h-4 text-[#C68B1C]" />
            <span>{siteSettings.contactEmail || 'berghazi9@gmail.com'}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#E5AD44] mb-4">Navigation</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            {links.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className="text-start hover:text-white transition-colors py-1"
              >
                {item.label}
              </button>
            ))}
            {(isMainAdmin || isAssistantAdmin) && (
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="text-start text-[#E5AD44] hover:text-white transition-colors py-1 font-medium"
              >
                {t.nav.admin}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E5AD44]">
            ⵜⴰⵎⴰⵣⵉⵖⵜ · العربية · English
          </h3>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { code: 'zgh', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ (Tifinagh)' },
                { code: 'ar', label: 'العربية' },
                { code: 'en', label: 'English' },
              ] as const
            ).map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  language === l.code
                    ? 'bg-[#C68B1C] text-[#16222E] border-[#C68B1C] font-semibold'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2">
            {siteSettings.socialLinks?.facebook && (
              <a
                href={siteSettings.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Facebook
              </a>
            )}
            {siteSettings.socialLinks?.youtube && (
              <a
                href={siteSettings.socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                YouTube
              </a>
            )}
            {siteSettings.socialLinks?.instagram && (
              <a
                href={siteSettings.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Instagram
              </a>
            )}
            {siteSettings.socialLinks?.x && (
              <a
                href={siteSettings.socialLinks.x}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                X
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} {t.brand}. {t.brandSubtitle}.
          </span>
          <span className="font-tifinagh">ⴰⵣⵓⵍ · ⴱⵔⵖⴰⵣⵉ</span>
        </div>
      </div>
    </footer>
  );
};
