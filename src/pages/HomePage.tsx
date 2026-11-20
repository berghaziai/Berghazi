import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  FlaskConical,
  Layers,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AmazighGeometricFrieze,
  AtlasHeroIllustration,
  HeritageTapestryIllustration,
  YazEmblem,
} from '../components/AmazighArtwork';
import { AdSlot } from '../components/AdSlot';
import { PageId } from '../types';

interface HomePageProps {
  onSelectPathway: (pathway: number) => void;
  onSelectDocTab: (tab: 'mind_map' | 'annual_distribution' | 'periodic_distribution') => void;
  onOpenArticle: (articleId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectPathway,
  onSelectDocTab,
  onOpenArticle,
}) => {
  const {
    language,
    t,
    navigate,
    lessons,
    pathways,
    templates,
    articles,
    siteSettings,
    firebaseUser,
    signInWithGoogle,
  } = useApp();

  const welcomeMessage =
    language === 'zgh'
      ? siteSettings.welcomeZgh
      : language === 'ar'
      ? siteSettings.welcomeAr
      : siteSettings.welcomeEn;

  const approvedResearch = articles.filter(
    (a) => a.status === 'approved' && a.kind === 'research'
  );
  const approvedCulture = articles.filter(
    (a) => a.status === 'approved' && a.kind === 'culture'
  );

  const popularLessons = [...lessons]
    .filter((l) => l.isPublished)
    .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
    .slice(0, 4);

  const go = (page: PageId) => navigate(page);

  return (
    <div className="space-y-16 pb-8">
      {/* 1. Hero Section */}
      <section className="bg-white border-b border-[#E5E4DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#1D3A5F]">
                <YazEmblem className="w-5 h-5 text-[#C68B1C]" />
                <span>{welcomeMessage}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-[#16222E] leading-[1.15]">
                {t.home.heroTitle}
              </h1>

              <p className="text-base text-[#475569] leading-relaxed max-w-xl">
                {t.home.heroSubtitle}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => go('lessons')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.home.exploreLessons}</span>
                </button>
                <button
                  type="button"
                  onClick={() => go('documents')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg hover:bg-[#F4F3EF] transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 text-[#C68B1C]" />
                  <span>{t.home.openDocuments}</span>
                </button>
              </div>

              {/* Quiet institutional summary strip */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E4DF] text-xs text-[#64748B]">
                <div>
                  <div className="text-lg font-semibold text-[#16222E] tabular-nums">6</div>
                  <div>{t.home.pathwaysHeading}</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#16222E] tabular-nums">
                    {lessons.length}
                  </div>
                  <div>{t.nav.lessons}</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#16222E] tabular-nums">
                    {approvedResearch.length + approvedCulture.length}
                  </div>
                  <div>{t.nav.research}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <AtlasHeroIllustration className="w-full min-h-[280px] lg:h-full" />
          </div>
        </div>
        <AmazighGeometricFrieze />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        <AdSlot slotKey="homepageBanner" />

        {/* 2. Quick Access to Six Educational Pathways */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#16222E]">
                {t.home.pathwaysHeading}
              </h2>
              <p className="text-sm text-[#475569] max-w-2xl">{t.home.pathwaysSubheading}</p>
            </div>
            <button
              type="button"
              onClick={() => go('lessons')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3A5F] hover:text-[#C68B1C] transition-colors whitespace-nowrap"
            >
              <span>{t.home.exploreLessons}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const count = lessons.filter((l) => l.pathway === num && l.isPublished).length;
              const pw = pathways.find((p) => p.number === num);
              const pwTitle = pw
                ? language === 'zgh'
                  ? pw.titleZgh
                  : language === 'ar'
                  ? pw.titleAr
                  : pw.titleEn
                : `${t.lessons.pathwayLabel} ${num}`;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    onSelectPathway(num);
                    go('lessons');
                  }}
                  className="group text-start bg-white border border-[#E5E4DF] rounded-xl p-6 hover:border-[#C68B1C] transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4F3EF] border border-[#E5E4DF] flex items-center justify-center font-mono-num text-sm font-semibold text-[#1D3A5F] group-hover:bg-[#1D3A5F] group-hover:text-white transition-colors">
                      0{num}
                    </div>
                    <span className="text-xs text-[#64748B] tabular-nums">
                      {count} {t.nav.lessons}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[#16222E] group-hover:text-[#1D3A5F]">
                      {pwTitle}
                    </h3>
                    <p className="text-xs text-[#64748B] font-tifinagh">
                      {t.lessons.stage} 1–6 · {t.lessons.week} 1–6 · {t.lessons.part} 1–2
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Educational Documents: Mind Maps & Annual/Periodic Distributions */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#16222E]">
              {t.home.docsHeading}
            </h2>
            <p className="text-sm text-[#475569] max-w-2xl">{t.home.docsSubheading}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-7 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#1D3A5F]">
                    <Compass className="w-4 h-4 text-[#C68B1C]" />
                    <span>{t.documents.tabs.mindMap}</span>
                  </span>
                  <span className="tabular-nums">
                    {templates.filter((tpl) => tpl.docType === 'mind_map').length} templates
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[#16222E]">{t.home.mindMapsTitle}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{t.home.mindMapsDesc}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDocTab('mind_map');
                    go('documents');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors"
                >
                  <span>{t.documents.tabs.mindMap}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E5E4DF] rounded-xl p-7 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#1B6B50]">
                    <Layers className="w-4 h-4 text-[#1B6B50]" />
                    <span>
                      {t.documents.tabs.annual} / {t.documents.tabs.periodic}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {templates.filter((tpl) => tpl.docType !== 'mind_map').length} templates
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[#16222E]">
                  {t.home.distributionsTitle}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {t.home.distributionsDesc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectDocTab('annual_distribution');
                    go('documents');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg hover:bg-[#F4F3EF] transition-colors"
                >
                  <span>{t.documents.tabs.annual}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDocTab('periodic_distribution');
                    go('documents');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg hover:bg-[#F4F3EF] transition-colors"
                >
                  <span>{t.documents.tabs.periodic}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Latest Scientific Research & Popular Resources */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#16222E]">
                {t.home.latestResearchHeading}
              </h2>
              <button
                type="button"
                onClick={() => go('research')}
                className="text-xs font-semibold text-[#1D3A5F] hover:text-[#C68B1C] whitespace-nowrap"
              >
                {t.nav.research} →
              </button>
            </div>

            {approvedResearch.length === 0 ? (
              <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center space-y-3">
                <FlaskConical className="w-7 h-7 text-[#64748B] mx-auto" />
                <p className="text-sm text-[#475569]">{t.home.noResearchYet}</p>
                <button
                  type="button"
                  onClick={() => go('research')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
                >
                  {t.nav.research}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedResearch.slice(0, 3).map((art) => (
                  <article
                    key={art.id}
                    onClick={() => {
                      onOpenArticle(art.id);
                      go('research');
                    }}
                    className="cursor-pointer bg-white border border-[#E5E4DF] rounded-xl p-5 hover:border-[#C68B1C] transition-colors space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span>{art.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{art.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{art.publicationDate}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#16222E]">{art.title}</h3>
                    <p className="text-sm text-[#475569] line-clamp-2">{art.abstract}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#16222E]">
                {t.home.popularResourcesHeading}
              </h2>
              <button
                type="button"
                onClick={() => go('lessons')}
                className="text-xs font-semibold text-[#1D3A5F] hover:text-[#C68B1C] whitespace-nowrap"
              >
                {t.nav.lessons} →
              </button>
            </div>

            {popularLessons.length === 0 ? (
              <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center space-y-3">
                <BookOpen className="w-7 h-7 text-[#64748B] mx-auto" />
                <p className="text-sm text-[#475569]">{t.home.noResourcesYet}</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E4DF] rounded-xl divide-y divide-[#E5E4DF]">
                {popularLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      onSelectPathway(lesson.pathway);
                      go('lessons');
                    }}
                    className="w-full text-start p-4 hover:bg-[#FAFAF8] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#16222E] truncate">
                        {lesson.title}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {t.lessons.pathwayLabel} {lesson.pathway} · {lesson.fileFormat.toUpperCase()}
                      </div>
                    </div>
                    <span className="text-xs font-mono-num text-[#1D3A5F] shrink-0">
                      {lesson.downloadCount || 0} ↓
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Amazigh Culture & Heritage Feature */}
        <section className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-medium text-[#C68B1C]">ⵜⴰⵢⵙⵉ · Heritage</div>
              <h2 className="text-2xl font-semibold text-[#16222E]">{t.home.culturalHeading}</h2>
              <p className="text-sm text-[#475569] leading-relaxed">{t.culture.subtitle}</p>
              {approvedCulture.length > 0 && (
                <div className="pt-2 space-y-2 border-t border-[#E5E4DF]">
                  {approvedCulture.slice(0, 2).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onOpenArticle(c.id);
                        go('research');
                      }}
                      className="block w-full text-start text-sm font-medium text-[#1D3A5F] hover:text-[#C68B1C] truncate"
                    >
                      · {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => go('culture')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.nav.culture}</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-7 p-4 sm:p-6 bg-[#FAFAF8]">
            <HeritageTapestryIllustration className="min-h-[220px] lg:h-full" />
          </div>
        </section>

        {/* 6. Registration & Membership */}
        <section className="bg-[#16222E] text-white rounded-xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl font-semibold">{t.home.membershipHeading}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{t.home.membershipDesc}</p>
          </div>
          <div className="shrink-0">
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => go('account')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#C68B1C] text-[#16222E] rounded-lg hover:bg-[#E5AD44] transition-colors whitespace-nowrap"
              >
                <span>{t.nav.account}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#C68B1C] text-[#16222E] rounded-lg hover:bg-[#E5AD44] transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.home.joinNow}</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
