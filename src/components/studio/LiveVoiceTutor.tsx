import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function pcmFloat32ToBase64Int16(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Int16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export const LiveVoiceTutor: React.FC = () => {
  const { language } = useApp();
  const [voice, setVoice] = useState<'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir'>('Zephyr');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const mutedRef = useRef<boolean>(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const stopSession = () => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      inputCtxRef.current?.close();
    } catch {
      // ignore
    }
    inputCtxRef.current = null;
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    try {
      outputCtxRef.current?.close();
    } catch {
      // ignore
    }
    outputCtxRef.current = null;
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;
    nextStartTimeRef.current = 0;
    setConnected(false);
    setConnecting(false);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  const schedulePlaybackChunk = (base64Pcm: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    const float32 = base64Int16ToFloat32(base64Pcm);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
    };
  };

  const clearPlaybackQueue = () => {
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    }
  };

  const startSession = async () => {
    setError(null);
    setConnecting(true);
    setTranscripts([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/ai/live?lang=${encodeURIComponent(
          language
        )}&voice=${encodeURIComponent(voice)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (ev) => {
          if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const pcmBase64 = pcmFloat32ToBase64Int16(ev.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: pcmBase64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
        setConnecting(false);
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as {
            audio?: string;
            interrupted?: boolean;
            inputTranscript?: string;
            outputTranscript?: string;
            error?: string;
          };
          if (msg.error) {
            setError(msg.error);
            stopSession();
            return;
          }
          if (msg.audio) {
            schedulePlaybackChunk(msg.audio);
          }
          if (msg.interrupted) {
            clearPlaybackQueue();
          }
          if (msg.inputTranscript) {
            setTranscripts((prev) => [
              ...prev.slice(-24),
              { role: 'user', text: msg.inputTranscript! },
            ]);
          }
          if (msg.outputTranscript) {
            setTranscripts((prev) => [
              ...prev.slice(-24),
              { role: 'ai', text: msg.outputTranscript! },
            ]);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        setError('Live voice connection encountered an error.');
        stopSession();
      };

      ws.onclose = () => {
        stopSession();
      };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access microphone or start Live API session.'
      );
      stopSession();
    }
  };

  return (
    <div className="bg-white border border-[#E5E4DF] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E4DF] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C68B1C]">
            <Radio className="w-4 h-4" />
            <span>Gemini 3.8 Live · Real-Time Voice Conversation</span>
          </div>
          <h2 className="text-xl font-semibold text-[#16222E]">
            Spoken Amazigh &amp; Bilingual Voice Tutor
          </h2>
          <p className="text-xs text-[#64748B]">
            Low-latency 16kHz microphone streaming and 24kHz gapless audio responses with live transcription.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={voice}
            onChange={(e) =>
              setVoice(e.target.value as 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir')
            }
            disabled={connected || connecting}
            className="px-3 py-2 text-xs font-medium bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg text-[#16222E]"
          >
            <option value="Zephyr">Voice: Zephyr</option>
            <option value="Kore">Voice: Kore</option>
            <option value="Puck">Voice: Puck</option>
            <option value="Charon">Voice: Charon</option>
            <option value="Fenrir">Voice: Fenrir</option>
          </select>

          {!connected ? (
            <button
              type="button"
              onClick={startSession}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>{connecting ? 'Connecting...' : 'Start Live Voice'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
                  muted
                    ? 'bg-[#FEF2F2] text-[#9A3412] border-[#9A3412]/30'
                    : 'bg-[#FAFAF8] text-[#16222E] border-[#D6D3CB]'
                }`}
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{muted ? 'Muted' : 'Mic Live'}</span>
              </button>
              <button
                type="button"
                onClick={stopSession}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#9A3412] text-white hover:opacity-90"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#9A3412]/30 text-xs text-[#9A3412]">
          {error}
        </div>
      )}

      <div className="min-h-[240px] bg-[#FAFAF8] border border-[#E5E4DF] rounded-xl p-4 space-y-3">
        {transcripts.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center text-xs text-[#64748B] space-y-2">
            <Volume2 className="w-7 h-7 text-[#1D3A5F]/60" />
            <p>
              {connected
                ? 'Listening — speak naturally to practice Tamazight pronunciation or ask a question.'
                : 'Click "Start Live Voice" to open a real-time spoken session with Berghazi Voice Tutor.'}
            </p>
          </div>
        ) : (
          transcripts.map((item, idx) => (
            <div
              key={idx}
              className={`text-xs px-3 py-2 rounded-lg ${
                item.role === 'user'
                  ? 'bg-[#1D3A5F] text-white ms-auto max-w-[80%]'
                  : 'bg-white border border-[#E5E4DF] text-[#16222E] me-auto max-w-[80%]'
              }`}
            >
              <span className="font-semibold block text-[10px] opacity-75 mb-0.5">
                {item.role === 'user' ? 'You' : 'Berghazi Tutor'}
              </span>
              {item.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
