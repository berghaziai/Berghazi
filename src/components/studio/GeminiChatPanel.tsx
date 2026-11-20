import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Globe,
  Loader2,
  MapPin,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WebSource {
  uri: string;
  title: string;
}

interface MapsSource {
  uri: string;
  title: string;
  placeId?: string;
  reviewSnippets?: { uri: string; title: string; author: string }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  webSources?: WebSource[];
  mapsSources?: MapsSource[];
}

type RolePresetId = 'tutor' | 'planner' | 'linguist' | 'historian';
type GroundingMode = 'none' | 'search' | 'maps';

const ROLE_INSTRUCTIONS: Record<RolePresetId, { label: string; instruction: string }> = {
  tutor: {
    label: 'Amazigh & Tifinagh Tutor',
    instruction:
      'You are Berghazi Tutor, an expert Amazigh (Tamazight) language and Tifinagh educator. Teach clearly using Neo-Tifinagh examples (like ⴰⵣⵓⵍ, ⵜⴰⵎⴰⵣⵉⵖⵜ, ⴰⴱⵔⵉⴷ) alongside transliteration and clear explanations tailored to learners and primary teachers.',
  },
  planner: {
    label: 'Primary Curriculum Planner',
    instruction:
      'You are Berghazi Curriculum Advisor. Help primary school teachers design structured Amazigh classroom activities, stage plans, phonics exercises, and comprehension rubrics aligned with Moroccan Tamazight curricula.',
  },
  linguist: {
    label: 'Linguistics & Research Assistant',
    instruction:
      'You are Berghazi Research Assistant specializing in Amazigh linguistics, morphology, syntax, dialectology (Tashelhit, Tamazight, Tarifit), and Neo-Tifinagh orthography. Cite scholarly concepts carefully.',
  },
  historian: {
    label: 'Amazigh Heritage Historian',
    instruction:
      'You are Berghazi Cultural Historian. Share accurate, respectful scholarship on Moroccan Amazigh history, Igoudar architecture, oral poetry (Ahwach, Ahidus, Izlan), and Amazigh heritage across North Africa.',
  },
};

export const GeminiChatPanel: React.FC = () => {
  const { language, userProfile } = useApp();
  const [rolePreset, setRolePreset] = useState<RolePresetId>('tutor');
  const [model, setModel] = useState<string>('gemini-4-hydrogen');
  const [grounding, setGrounding] = useState<GroundingMode>('none');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      activeAudioRef.current?.pause();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const getUserLatLng = (): Promise<{ latitude: number; longitude: number } | undefined> =>
    new Promise((resolve) => {
      if (grounding !== 'maps' || !navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(undefined),
        { timeout: 3000 }
      );
    });

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
    };
    const nextHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const latLng = await getUserLatLng();
      const langRule =
        language === 'ar'
          ? 'Respond primarily in Arabic unless the user writes in another language, and include Tifinagh terms where helpful.'
          : language === 'zgh'
          ? 'Include Amazigh (Tifinagh) alongside helpful translations so learners can follow seamlessly.'
          : 'Respond clearly in English unless the user writes in Arabic or Amazigh.';

      const userNote = userProfile?.displayName
        ? ` The user's name is ${userProfile.displayName} (role: ${userProfile.role}).`
        : '';

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory,
          model,
          grounding,
          latLng,
          systemInstruction: `${ROLE_INSTRUCTIONS[rolePreset].instruction} ${langRule}${userNote}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate AI response.');
      }

      const aiMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: json.text || '',
        modelUsed: json.model,
        webSources: json.webSources,
        mapsSources: json.mapsSources,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI assistant.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    setError(null);
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size < 200) return;
        setTranscribing(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = String(reader.result || '');
              const comma = result.indexOf(',');
              resolve(comma >= 0 ? result.slice(comma + 1) : result);
            };
            reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
            reader.readAsDataURL(blob);
          });
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
              languageHint: language,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Audio transcription failed.');
          if (json.text) {
            setInput((prev) => (prev ? `${prev} ${json.text}` : json.text));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Audio transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access was denied or is unavailable in this browser.');
    }
  };

  const speakMessage = async (msg: ChatMessage) => {
    setError(null);
    if (playingMsgId === msg.id) {
      activeAudioRef.current?.pause();
      setPlayingMsgId(null);
      return;
    }
    activeAudioRef.current?.pause();
    setPlayingMsgId(msg.id);
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Speech generation failed.');
      const audio = new Audio(json.audioDataUrl);
      activeAudioRef.current = audio;
      audio.onended = () => setPlayingMsgId(null);
      audio.onerror = () => setPlayingMsgId(null);
      await audio.play();
    } catch (err) {
      setPlayingMsgId(null);
      setError(err instanceof Error ? err.message : 'Unable to play audio.');
    }
  };

  return (
    <div className="bg-white border border-[#E5E4DF] rounded-2xl overflow-hidden shadow-sm">
      {/* Configuration Header */}
      <div className="bg-[#FAFAF8] border-b border-[#E5E4DF] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D3A5F] text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#E5AD44]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#16222E]">
              Berghazi Gemini AI Assistant
            </h2>
            <p className="text-xs text-[#64748B]">
              Multi-turn Amazigh study tutor, microphone dictation (`gemini-3.5-transcribe`), Search &amp; Maps grounding
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rolePreset}
            onChange={(e) => setRolePreset(e.target.value as RolePresetId)}
            aria-label="Assistant Role"
            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D6D3CB] rounded-lg text-[#16222E]"
          >
            {(Object.keys(ROLE_INSTRUCTIONS) as RolePresetId[]).map((k) => (
              <option key={k} value={k}>
                {ROLE_INSTRUCTIONS[k].label}
              </option>
            ))}
          </select>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Gemini Model"
            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D6D3CB] rounded-lg text-[#16222E]"
          >
            <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Default)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
            <option value="gemini-4-neon">Gemini 4 Neon (Paid Key)</option>
            <option value="gemini-4-carbon">Gemini 4 Carbon (Deep · Paid Key)</option>
          </select>

          <div className="inline-flex rounded-lg border border-[#D6D3CB] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setGrounding('none')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                grounding === 'none'
                  ? 'bg-[#1D3A5F] text-white'
                  : 'text-[#475569] hover:text-[#16222E]'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setGrounding('search')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                grounding === 'search'
                  ? 'bg-[#1D3A5F] text-white'
                  : 'text-[#475569] hover:text-[#16222E]'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => setGrounding('maps')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                grounding === 'maps'
                  ? 'bg-[#1D3A5F] text-white'
                  : 'text-[#475569] hover:text-[#16222E]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Maps</span>
            </button>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="p-2 text-xs text-[#64748B] hover:text-[#9A3412] rounded-lg border border-[#E5E4DF] bg-white"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation History */}
      <div className="h-[420px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAFAF8]/60">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
            <Sparkles className="w-8 h-8 text-[#C68B1C]" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#16222E]">
                Ask about Tamazight, Tifinagh, Lesson Planning, or Moroccan Heritage
              </h3>
              <p className="text-xs text-[#64748B]">
                Choose a prompt below or speak into your microphone to transcribe and ask in Amazigh, Arabic, or English.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Explain the Tifinagh Yaz symbol (ⵣ) and how to teach it to primary students.',
                'Write 5 beginner Tamazight greetings in Tifinagh with Latin & English translations.',
                'Find historical Amazigh Igoudar granaries in the Anti-Atlas region of Morocco.',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSend(sample)}
                  className="text-start text-xs px-3 py-2 rounded-lg bg-white border border-[#E5E4DF] hover:border-[#C68B1C] text-[#16222E] transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#1D3A5F] text-white'
                    : 'bg-white border border-[#E5E4DF] text-[#16222E]'
                }`}
              >
                <div className="whitespace-pre-wrap font-tifinagh">{msg.text}</div>

                {msg.role === 'model' && (
                  <div className="pt-2 border-t border-[#F4F3EF] flex items-center justify-between gap-3 text-[11px] text-[#64748B]">
                    <span>{msg.modelUsed || model}</span>
                    <button
                      type="button"
                      onClick={() => speakMessage(msg)}
                      className="inline-flex items-center gap-1 text-[#1D3A5F] hover:text-[#C68B1C] font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{playingMsgId === msg.id ? 'Stop Audio' : 'Listen'}</span>
                    </button>
                  </div>
                )}

                {msg.webSources && msg.webSources.length > 0 && (
                  <div className="pt-2 border-t border-[#F4F3EF] space-y-1">
                    <div className="text-[11px] font-semibold text-[#475569]">
                      Google Search Sources
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.webSources.map((src, i) => (
                        <a
                          key={`${src.uri}_${i}`}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2 py-1 rounded bg-[#FAFAF8] border border-[#E5E4DF] text-[#1D3A5F] hover:border-[#C68B1C] underline truncate max-w-[240px]"
                        >
                          {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {msg.mapsSources && msg.mapsSources.length > 0 && (
                  <div className="pt-2 border-t border-[#F4F3EF] space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#475569]">
                      Google Maps Grounded Places
                    </div>
                    <div className="space-y-1.5">
                      {msg.mapsSources.map((place, i) => (
                        <div
                          key={`${place.uri}_${i}`}
                          className="text-[11px] p-2 rounded bg-[#FAFAF8] border border-[#E5E4DF] space-y-1"
                        >
                          <a
                            href={place.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#1D3A5F] hover:text-[#C68B1C] underline inline-flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{place.title}</span>
                          </a>
                          {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-[10px] text-[#64748B]">
                              {place.reviewSnippets.map((rev, ri) => (
                                <a
                                  key={ri}
                                  href={rev.uri || place.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-[#16222E]"
                                >
                                  {rev.title || rev.author || 'Review'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E5E4DF] rounded-2xl px-4 py-3 text-xs text-[#64748B] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C68B1C]" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-[#FEF2F2] border-t border-[#9A3412]/20 text-xs text-[#9A3412]">
          {error}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 bg-white border-t border-[#E5E4DF] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleRecording}
          disabled={transcribing}
          className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
            recording
              ? 'bg-[#9A3412] text-white border-[#9A3412]'
              : 'bg-[#FAFAF8] text-[#16222E] border-[#D6D3CB] hover:border-[#C68B1C]'
          }`}
          title={recording ? 'Stop recording' : 'Record voice to transcribe'}
        >
          {transcribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : recording ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in Amazigh (ⵜⴰⵎⴰⵣⵉⵖⵜ), Arabic, or English..."
          className="flex-1 px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl focus:outline-none focus:border-[#1D3A5F]"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
