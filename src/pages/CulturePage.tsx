import React, { useState } from 'react';
import { BookOpen, Landmark, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';
import { HeritageTapestryIllustration } from '../components/AmazighArtwork';

interface TifinaghGlyph {
  glyph: string;
  latin: string;
  arabic: string;
  name: string;
  example: string;
}

const TIFINAGH_ALPHABET: TifinaghGlyph[] = [
  { glyph: 'ⴰ', latin: 'a', arabic: 'أ', name: 'Ya', example: 'ⴰⵎⴰⵣⵉⵖ (Amazigh)' },
  { glyph: 'ⴱ', latin: 'b', arabic: 'ب', name: 'Yab', example: 'ⴰⴱⵔⵉⴷ (Abrid · Path)' },
  { glyph: 'ⴳ', latin: 'g', arabic: 'ڭ', name: 'Yag', example: 'ⴰⴳⴰⴼⴰ (Agafa · North)' },
  { glyph: 'ⴷ', latin: 'd', arabic: 'د', name: 'Yad', example: 'ⴰⴷⵔⴰⵔ (Adrar · Mountain)' },
  { glyph: 'ⴹ', latin: 'ḍ', arabic: 'ض', name: 'Yaḍ', example: 'ⴰⴹⵓ (Aḍu · Wind)' },
  { glyph: 'ⴻ', latin: 'e', arabic: 'ـ', name: 'Yey', example: 'ⴰⵙⵍⵎⴷ (Aselmed · Teaching)' },
  { glyph: 'ⴼ', latin: 'f', arabic: 'ف', name: 'Yaf', example: 'ⵜⴰⴼⵓⴽⵜ (Tafukt · Sun)' },
  { glyph: 'ⴽ', latin: 'k', arabic: 'ك', name: 'Yak', example: 'ⴰⴽⴰⵍ (Akal · Earth)' },
  { glyph: 'ⵀ', latin: 'h', arabic: 'هـ', name: 'Yah', example: 'ⴰⵀⵉⵍ (Ahil · Program)' },
  { glyph: 'ⵃ', latin: 'ḥ', arabic: 'ح', name: 'Yaḥ', example: 'ⴰⵃⵡⴰⵛ (Aḥwac · Dance)' },
  { glyph: 'ⵄ', latin: 'ɛ', arabic: 'ع', name: 'Yaɛ', example: 'ⵜⴰⵄⵔⴰⴱⵜ (Taɛrabt)' },
  { glyph: 'ⵅ', latin: 'x', arabic: 'خ', name: 'Yax', example: 'ⴰⵅⴰⵎ (Axam · House)' },
  { glyph: 'ⵇ', latin: 'q', arabic: 'ق', name: 'Yaq', example: 'ⴰⵇⴰⵔⵉⴹ (Aqariḍ)' },
  { glyph: 'ⵉ', latin: 'i', arabic: 'ي', name: 'Yi', example: 'ⵉⵜⵔⵉ (Itri · Star)' },
  { glyph: 'ⵊ', latin: 'j', arabic: 'ج', name: 'Yaj', example: 'ⴰⵊⴷⴷⵉⴳ (Ajddig · Flower)' },
  { glyph: 'ⵍ', latin: 'l', arabic: 'ل', name: 'Yal', example: 'ⵉⵍⴻⵍ (Ilel · Sea)' },
  { glyph: 'ⵎ', latin: 'm', arabic: 'م', name: 'Yam', example: 'ⴰⵎⴰⵏ (Aman · Water)' },
  { glyph: 'ⵏ', latin: 'n', arabic: 'ن', name: 'Yan', example: 'ⴰⵏⴰⵔⵓⵣ (Anaruz · Hope)' },
  { glyph: 'ⵓ', latin: 'u', arabic: 'و', name: 'Yu', example: 'ⵓⵍ (Ul · Heart)' },
  { glyph: 'ⵔ', latin: 'r', arabic: 'ر', name: 'Yar', example: 'ⴰⵔⴳⴰⵏ (Argan · Argan)' },
  { glyph: 'ⵕ', latin: 'ṛ', arabic: 'ر مفخمة', name: 'Yaṛ', example: 'ⴰⵕⵥⵥⴰ (Aṛẓẓa)' },
  { glyph: 'ⵖ', latin: 'ɣ', arabic: 'غ', name: 'Yaɣ', example: 'ⴰⵖⵔⵓⵎ (Aɣrum · Bread)' },
  { glyph: 'ⵙ', latin: 's', arabic: 'س', name: 'Yas', example: 'ⴰⵙⴰⴼⴰⵔ (Asafar)' },
  { glyph: 'ⵚ', latin: 'ṣ', arabic: 'ص', name: 'Yaṣ', example: 'ⵉⵚⵎⵎⵉⴹ (Iṣmmiḍ · Cold)' },
  { glyph: 'ⵛ', latin: 'c', arabic: 'ش', name: 'Yac', example: 'ⴰⵛⴰⵍ (Acal · Land)' },
  { glyph: 'ⵜ', latin: 't', arabic: 'ت', name: 'Yat', example: 'ⵜⵉⴼⵉⵏⴰⵖ (Tifinagh)' },
  { glyph: 'ⵟ', latin: 'ṭ', arabic: 'ط', name: 'Yaṭ', example: 'ⵉⵟⵉⵊ (Iṭij · Sun)' },
  { glyph: 'ⵡ', latin: 'w', arabic: 'و', name: 'Yaw', example: 'ⴰⵡⴰⵍ (Awal · Word)' },
  { glyph: 'ⵢ', latin: 'y', arabic: 'ي', name: 'Yay', example: 'ⴰⵢⵢⵓⵔ (Ayyur · Moon)' },
  { glyph: 'ⵣ', latin: 'z', arabic: 'ز', name: 'Yaz', example: 'ⴰⵎⴰⵣⵉⵖ (Free Person)' },
  { glyph: 'ⵥ', latin: 'ẓ', arabic: 'ز مفخمة', name: 'Yaẓ', example: 'ⵉⵥⵉⵍ (Iẓil · Beauty)' },
];

export const CulturePage: React.FC<{ onOpenArticle: (id: string) => void }> = ({
  onOpenArticle,
}) => {
  const { t, articles, navigate } = useApp();
  const [selectedGlyph, setSelectedGlyph] = useState<TifinaghGlyph>(TIFINAGH_ALPHABET[29]); // Yaz ⵣ

  const culturalArticles = articles.filter(
    (a) => a.status === 'approved' && a.kind === 'culture'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-[#E5E4DF] pb-10">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#C68B1C]">ⵜⴰⴷⵍⵙⴰ ⵜⴰⵎⴰⵣⵉⵖⵜ</div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#16222E]">
              {t.culture.title}
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">{t.culture.subtitle}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E4DF] text-xs text-[#64748B]">
            <div>
              <div className="text-lg font-semibold text-[#16222E] tabular-nums">31</div>
              <div>Neo-Tifinagh Glyphs</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#16222E] tabular-nums">2976</div>
              <div>Amazigh Year (Yennayer)</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#16222E] tabular-nums">
                {culturalArticles.length}
              </div>
              <div>{t.culture.articlesTitle}</div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6">
          <HeritageTapestryIllustration className="min-h-[240px] lg:h-full" />
        </div>
      </header>

      {/* Interactive Tifinagh Alphabet Explorer */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[#16222E]">{t.culture.tifinaghGuideTitle}</h2>
          <p className="text-sm text-[#475569]">{t.culture.tifinaghGuideDesc}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-[#E5E4DF] rounded-xl p-5">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {TIFINAGH_ALPHABET.map((item) => {
                const active = selectedGlyph.glyph === item.glyph;
                return (
                  <button
                    key={item.glyph}
                    type="button"
                    onClick={() => setSelectedGlyph(item)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      active
                        ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                        : 'bg-[#FAFAF8] text-[#16222E] border-[#E5E4DF] hover:border-[#C68B1C]'
                    }`}
                  >
                    <div className="text-2xl font-tifinagh leading-none">{item.glyph}</div>
                    <div className="text-[11px] mt-1.5 opacity-80 font-mono">{item.latin}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#16222E] text-white rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E5AD44] font-medium">Selected Character</span>
              <span className="text-xs font-mono text-slate-400">Unicode Tifinagh</span>
            </div>
            <div className="text-7xl font-tifinagh text-center py-4 text-[#E5AD44]">
              {selectedGlyph.glyph}
            </div>
            <dl className="space-y-2.5 text-sm border-t border-slate-800 pt-4">
              <div className="flex justify-between">
                <dt className="text-slate-400">Name</dt>
                <dd className="font-semibold">{selectedGlyph.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Latin</dt>
                <dd className="font-mono">{selectedGlyph.latin}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Arabic</dt>
                <dd>{selectedGlyph.arabic}</dd>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <dt className="text-xs text-slate-400 mb-1">Example</dt>
                <dd className="font-tifinagh text-base text-[#E5AD44]">{selectedGlyph.example}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <AdSlot slotKey="cultureArticle" />

      {/* Pillars of Amazigh Heritage */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#16222E]">{t.culture.heritagePillarsTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <Landmark className="w-6 h-6 text-[#C68B1C]" />
            <h3 className="text-lg font-semibold text-[#16222E]">
              Igoudar &amp; Atlas Architecture
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Collective fortified granaries (<em>Igoudar</em>) and earthen kasbahs across the Anti-Atlas and High Atlas embody centuries of Amazigh communal governance and sustainable engineering.
            </p>
          </div>
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <Sparkles className="w-6 h-6 text-[#1D3A5F]" />
            <h3 className="text-lg font-semibold text-[#16222E]">
              Textile Geometry &amp; Tizerzai
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Handwoven Atlas carpets and silver fibulae encode tribal memory, cosmology, and protective geometric motifs passed across generations of Amazigh artisans.
            </p>
          </div>
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <BookOpen className="w-6 h-6 text-[#1B6B50]" />
            <h3 className="text-lg font-semibold text-[#16222E]">
              Oral Poetry &amp; Ahwach / Ahidus
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Collective polyphonic song, rhythm, and improvised verse (<em>Tamdyazt</em>, <em>Izlan</em>) preserve historical chronicles and philosophical wisdom across Tamazgha.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive AI & Heritage Studio Callout */}
      <section className="bg-[#16222E] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#E5AD44] font-tifinagh">
            ⴰⵙⴰⵢⵔⴰⵔ ⵏ ⵜⵉⵖⵉⵙⵜ · Interactive Experiences
          </div>
          <h3 className="text-lg font-semibold">{t.nav.studio}</h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Explore the 3D Amazigh Fibula &amp; Yaz sculpture, browse Moroccan Atlas cultural markers, compose Lyria music, practice with the Gemini Tutor, or play the Tifinagh script challenge.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('studio')}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#C68B1C] text-[#16222E] hover:bg-[#E5AD44] transition-colors whitespace-nowrap shrink-0"
        >
          {t.nav.studio} →
        </button>
      </section>

      {/* Cultural Heritage Articles Feed */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#16222E]">{t.culture.articlesTitle}</h2>
          <button
            type="button"
            onClick={() => navigate('research')}
            className="text-xs font-semibold text-[#1D3A5F] hover:text-[#C68B1C]"
          >
            {t.research.submitResearch} →
          </button>
        </div>

        {culturalArticles.length === 0 ? (
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center text-sm text-[#475569]">
            {t.research.noArticles}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {culturalArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => {
                  onOpenArticle(art.id);
                  navigate('research');
                }}
                className="cursor-pointer bg-white border border-[#E5E4DF] rounded-xl p-6 hover:border-[#C68B1C] transition-colors space-y-3"
              >
                <div className="text-xs text-[#64748B]">
                  {art.authorName} · {art.publicationDate}
                </div>
                <h3 className="text-lg font-semibold text-[#16222E]">{art.title}</h3>
                <p className="text-sm text-[#475569] line-clamp-3">{art.abstract}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
