import React, { useState } from 'react';
import { Film, Image as ImageIcon, Loader2, Sparkles, Upload } from 'lucide-react';

export const MediaStudioPanel: React.FC = () => {
  const [mode, setMode] = useState<'image' | 'video'>('image');

  // Image state
  const [imgPrompt, setImgPrompt] = useState(
    'Warm editorial illustration of Moroccan High Atlas terraced village and earthen kasbah at golden hour, subtle Amazigh geometric borders.'
  );
  const [imgModel, setImgModel] = useState<'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1'>(
    'gemini-nano-banana-2.1'
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '9:16'>('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [srcImgBase64, setSrcImgBase64] = useState('');
  const [srcImgMime, setSrcImgMime] = useState('image/png');
  const [srcImgPreview, setSrcImgPreview] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [imgResultUrl, setImgResultUrl] = useState('');
  const [imgCaption, setImgCaption] = useState('');

  // Video state
  const [vidPrompt, setVidPrompt] = useState(
    'Gentle cinematic pan across sunlit Atlas mountains and an earthen Amazigh kasbah, warm documentary style.'
  );
  const [vidRatio, setVidRatio] = useState<'16:9' | '9:16'>('16:9');
  const [vidDuration, setVidDuration] = useState<'5s' | '8s'>('5s');
  const [vidImgBase64, setVidImgBase64] = useState('');
  const [vidImgMime, setVidImgMime] = useState('image/png');
  const [vidImgPreview, setVidImgPreview] = useState('');
  const [vidLoading, setVidLoading] = useState(false);
  const [vidResultUrl, setVidResultUrl] = useState('');

  const [error, setError] = useState<string | null>(null);

  const readImageFile = (
    file: File,
    onDone: (base64: string, mime: string, dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      onDone(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl, file.type || 'image/png', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPrompt.trim() || imgLoading) return;
    setError(null);
    setImgLoading(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt.trim(),
          model: imgModel,
          aspectRatio,
          imageSize,
          sourceImageBase64: srcImgBase64 || undefined,
          sourceImageMimeType: srcImgBase64 ? srcImgMime : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Image generation failed.');
      setImgResultUrl(json.imageUrl);
      setImgCaption(json.caption || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate image.');
    } finally {
      setImgLoading(false);
    }
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidPrompt.trim() || vidLoading) return;
    setError(null);
    setVidLoading(true);
    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: vidPrompt.trim(),
          aspectRatio: vidRatio,
          duration: vidDuration,
          imageBase64: vidImgBase64 || undefined,
          imageMimeType: vidImgBase64 ? vidImgMime : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Video generation failed.');
      setVidResultUrl(json.videoDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate video.');
    } finally {
      setVidLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E4DF] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E4DF] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#16222E]">
            Visual Illustration &amp; Video Studio
          </h2>
          <p className="text-xs text-[#64748B]">
            Create or edit classroom visuals (`gemini-nano-banana-2.1`) and animate scenes (`gemini-omni-1.2-flash`). Requires a billing-enabled key in Settings &gt; Secrets.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-[#D6D3CB] bg-[#FAFAF8] p-1">
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md ${
              mode === 'image' ? 'bg-[#1D3A5F] text-white' : 'text-[#475569]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Create / Edit Images</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('video')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md ${
              mode === 'video' ? 'bg-[#1D3A5F] text-white' : 'text-[#475569]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video &amp; Animation</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#9A3412]/30 text-xs text-[#9A3412]">
          {error}
        </div>
      )}

      {mode === 'image' ? (
        <div className="space-y-5">
          <form onSubmit={handleGenerateImage} className="space-y-4">
            <textarea
              rows={3}
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              placeholder="Describe the educational illustration or image edit..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl"
            />
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={imgModel}
                  onChange={(e) =>
                    setImgModel(
                      e.target.value as 'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1'
                    )
                  }
                  className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="gemini-nano-banana-2.1">Nano Banana 2.1 (High Quality)</option>
                  <option value="gemini-3.1-flash-lite-image">Flash Lite Image</option>
                </select>

                <select
                  value={aspectRatio}
                  onChange={(e) =>
                    setAspectRatio(e.target.value as '1:1' | '4:3' | '16:9' | '9:16')
                  }
                  className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="4:3">4:3 Classroom</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="9:16">9:16 Portrait</option>
                </select>

                {imgModel === 'gemini-nano-banana-2.1' && (
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as '1K' | '2K')}
                    className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                  </select>
                )}

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAFAF8] border border-[#D6D3CB] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#C68B1C]" />
                  <span>{srcImgPreview ? 'Replace Source Image' : 'Upload to Edit'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        readImageFile(f, (b, m, d) => {
                          setSrcImgBase64(b);
                          setSrcImgMime(m);
                          setSrcImgPreview(d);
                        });
                    }}
                  />
                </label>
                {srcImgPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSrcImgBase64('');
                      setSrcImgPreview('');
                    }}
                    className="text-xs text-[#9A3412] underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={imgLoading || !imgPrompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50"
              >
                {imgLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#E5AD44]" />
                )}
                <span>{imgLoading ? 'Rendering...' : srcImgPreview ? 'Edit Image' : 'Generate Image'}</span>
              </button>
            </div>
          </form>

          {imgResultUrl && (
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] space-y-2">
              <img
                src={imgResultUrl}
                alt="Generated visual"
                className="max-h-[420px] mx-auto rounded-lg border border-[#E5E4DF]"
              />
              {imgCaption && <p className="text-xs text-[#475569]">{imgCaption}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <form onSubmit={handleGenerateVideo} className="space-y-4">
            <textarea
              rows={3}
              value={vidPrompt}
              onChange={(e) => setVidPrompt(e.target.value)}
              placeholder="Describe the educational or cultural video scene..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl"
            />
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={vidRatio}
                  onChange={(e) => setVidRatio(e.target.value as '16:9' | '9:16')}
                  className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Vertical</option>
                </select>
                <select
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value as '5s' | '8s')}
                  className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="5s">5 seconds</option>
                  <option value="8s">8 seconds</option>
                </select>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAFAF8] border border-[#D6D3CB] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#C68B1C]" />
                  <span>{vidImgPreview ? 'Starting Frame Attached' : 'Animate Image (Optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        readImageFile(f, (b, m, d) => {
                          setVidImgBase64(b);
                          setVidImgMime(m);
                          setVidImgPreview(d);
                        });
                    }}
                  />
                </label>
                {vidImgPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setVidImgBase64('');
                      setVidImgPreview('');
                    }}
                    className="text-xs text-[#9A3412] underline"
                  >
                    Clear Frame
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={vidLoading || !vidPrompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50"
              >
                {vidLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Film className="w-4 h-4 text-[#E5AD44]" />
                )}
                <span>{vidLoading ? 'Generating Video (may take ~1 min)...' : 'Generate Video'}</span>
              </button>
            </div>
          </form>

          {vidResultUrl && (
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF]">
              <video controls src={vidResultUrl} className="w-full max-h-[420px] rounded-lg" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
