import React from 'react';
import { BookOpen, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YazEmblem } from '../components/AmazighArtwork';

export const AboutPage: React.FC = () => {
  const { t, navigate } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header className="space-y-3 border-b border-[#E5E4DF] pb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C68B1C]">
          <YazEmblem className="w-5 h-5" />
          <span>{t.brandSubtitle}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#16222E]">{t.about.title}</h1>
        <p className="text-base text-[#475569] max-w-3xl leading-relaxed">{t.about.subtitle}</p>
      </header>

      <section className="bg-white border border-[#E5E4DF] rounded-xl p-8 space-y-4">
        <h2 className="text-2xl font-semibold text-[#16222E]">{t.about.missionTitle}</h2>
        <p className="text-base text-[#475569] leading-relaxed">{t.about.missionBody}</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#16222E]">{t.about.audienceTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <GraduationCap className="w-6 h-6 text-[#1D3A5F]" />
            <h3 className="text-lg font-semibold text-[#16222E]">Primary Educators</h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Access structured six-pathway materials and personalize official mind maps and distribution schedules for immediate classroom printing.
            </p>
          </div>
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <BookOpen className="w-6 h-6 text-[#C68B1C]" />
            <h3 className="text-lg font-semibold text-[#16222E]">Students &amp; Learners</h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Navigate Tifinagh literacy, level-based weekly parts, and interactive cultural heritage guides in Amazigh, Arabic, and English.
            </p>
          </div>
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <Users className="w-6 h-6 text-[#1B6B50]" />
            <h3 className="text-lg font-semibold text-[#16222E]">Academic Researchers</h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Publish peer-reviewed linguistics, historical studies, and cultural documentation with explicit authorship attribution and archival attachments.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#16222E] text-white rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-[#E5AD44] text-sm font-semibold">
            <ShieldCheck className="w-5 h-5" />
            <span>{t.about.architectureTitle}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every official lesson and template is curated and controlled strictly by the Main Administrator and authorized staff, preserving pedagogical accuracy across all six pathways.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('contact')}
          className="px-5 py-2.5 text-xs font-semibold bg-[#C68B1C] text-[#16222E] rounded-lg hover:bg-[#E5AD44] whitespace-nowrap"
        >
          {t.nav.contact}
        </button>
      </section>
    </div>
  );
};
