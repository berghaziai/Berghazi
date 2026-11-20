import React, { useState } from 'react';
import { Loader2, Music, Sparkles, Upload } from 'lucide-react';

const MUSIC_PRESETS = [
  {
    label: 'Atlas Ahwach Rhythm',
    prompt:
      'Traditional Moroccan Amazigh Atlas folk ensemble inspired by Ahwach, warm frame drums (bendir), plucked lotar lute, gentle highland flute, uplifting educational mood.',
  },
  {
    label: 'Classroom Tifinagh Focus',
    prompt:
      'Calm acoustic instrumental background with soft Mediterranean acoustic guitar, gentle oud melodies, and peaceful Atlas wind ambience suitable for reading and study.',
  },
  {
    label: 'Yennayer Celebration',
    prompt:
      'Festive Moroccan Amazigh New Year Yennayer celebration instrumental, bright polyrhythmic hand percussion, bendir, joyful acoustic strings.',
  },
];

export const LyriaMusicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(MUSIC_PRESETS[0].prompt);
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [refImageBase64, setRefImageBase64] = useState<string>('');
  const [refImageMime, setRefImageMime] = useState<string>('image/jpeg');
  const [refImagePreview, setRefImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState<string>('');
  const [lyrics, setLyrics] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      setRefImagePreview(dataUrl);
      setRefImageMime(file.type || 'image/jpeg');
      setRefImageBase64(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAudioDataUrl('');
    setLyrics('');

    try {
      const res = await fetch('/api/ai/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          imageBase64: refImageBase64 || undefined,
          imageMimeType: refImageBase64 ? refImageMime : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Music generation failed.');
      }
      setAudioDataUrl(json.audioDataUrl);
      setLyrics(json.lyrics || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate music.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E4DF] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E4DF] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C68B1C]">
            <Music className="w-4 h-4" />
            <span>Lyria AI Music Studio</span>
          </div>
          <h2 className="text-xl font-semibold text-[#16222E]">
            Cultural Soundtracks &amp; Classroom Audio
          </h2>
          <p className="text-xs text-[#64748B]">
            Compose original audio tracks (`lyria-3-clip-preview` or `lyria-3-pro-preview`) from text or reference artwork. Requires a billing-enabled Gemini API key in Settings &gt; Secrets.
          </p>
        </div>

        <select
          value={model}
          onChange={(e) =>
            setModel(e.target.value as 'lyria-3-clip-preview' | 'lyria-3-pro-preview')
          }
          className="px-3 py-2 text-xs font-medium bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg text-[#16222E]"
        >
          <option value="lyria-3-clip-preview">Lyria 3 Clip (Up to 30s)</option>
          <option value="lyria-3-pro-preview">Lyria 3 Pro (Full Track)</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {MUSIC_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setPrompt(preset.prompt)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAFAF8] border border-[#E5E4DF] hover:border-[#C68B1C] text-[#16222E]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe instruments, tempo, mood, or cultural theme..."
          className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl focus:outline-none focus:border-[#1D3A5F]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#FAFAF8] border border-[#D6D3CB] hover:border-[#C68B1C] cursor-pointer text-[#16222E]">
            <Upload className="w-3.5 h-3.5 text-[#C68B1C]" />
            <span>{refImagePreview ? 'Change Inspiration Image' : 'Optional Image Inspiration'}</span>
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>

          {refImagePreview && (
            <button
              type="button"
              onClick={() => {
                setRefImageBase64('');
                setRefImagePreview('');
              }}
              className="text-xs text-[#9A3412] underline"
            >
              Remove Image
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#E5AD44]" />
            )}
            <span>{loading ? 'Composing Audio...' : 'Generate Music'}</span>
          </button>
        </div>
      </form>

      {refImagePreview && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF]">
          <img
            src={refImagePreview}
            alt="Music reference"
            className="w-16 h-16 rounded-lg object-cover border border-[#E5E4DF]"
          />
          <span className="text-xs text-[#475569]">
            Lyria will use this image alongside your prompt for tonal inspiration.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#9A3412]/30 text-xs text-[#9A3412]">
          {error}
        </div>
      )}

      {audioDataUrl && (
        <div className="p-5 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] space-y-4">
          <audio controls src={audioDataUrl} className="w-full" />
          {lyrics && (
            <div className="text-xs text-[#475569] whitespace-pre-wrap border-t border-[#E5E4DF] pt-3">
              <div className="font-semibold text-[#16222E] mb-1">Generated Notes / Lyrics</div>
              {lyrics}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
