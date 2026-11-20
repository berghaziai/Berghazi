import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
} from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import type { WebSocket, WebSocketServer } from 'ws';

export function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function mapGeminiError(err: unknown): { status: number; error: string } {
  const raw = err instanceof Error ? err.message : String(err || 'AI service error');
  const statusProp = (err as { status?: number })?.status;

  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return { status: 503, error: raw };
  }
  if (statusProp === 403 || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      error:
        'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (statusProp === 429 || raw.includes('RESOURCE_EXHAUSTED') || raw.toLowerCase().includes('quota')) {
    return {
      status: 429,
      error:
        'Quota limit reached or this model requires a billing-enabled Gemini API key in Settings > Secrets.',
    };
  }
  if (statusProp === 404 || raw.includes('NOT_FOUND')) {
    return {
      status: 404,
      error: `Requested AI model is unavailable or not found: ${raw}`,
    };
  }
  return {
    status: typeof statusProp === 'number' && statusProp >= 400 && statusProp < 600 ? statusProp : 500,
    error: raw,
  };
}

export interface ChatHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequestInput {
  message: string;
  history?: ChatHistoryTurn[];
  model?: string;
  systemInstruction?: string;
  grounding?: 'none' | 'search' | 'maps';
  latLng?: { latitude: number; longitude: number };
  thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const ALLOWED_CHAT_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-4-neon',
  'gemini-4-carbon',
]);

export async function runChatTurn(input: ChatRequestInput) {
  const ai = getAiClient();
  const grounding = input.grounding || 'none';
  const requestedModel = ALLOWED_CHAT_MODELS.has(input.model || '')
    ? (input.model as string)
    : 'gemini-4-hydrogen';

  // Grounding tools route through gemini-4-hydrogen when enabled
  const model = grounding === 'none' ? requestedModel : 'gemini-4-hydrogen';

  const config: Record<string, unknown> = {};
  if (input.systemInstruction) {
    config.systemInstruction = input.systemInstruction;
  }

  if (grounding === 'search') {
    config.tools = [{ googleSearch: {} }];
  } else if (grounding === 'maps') {
    config.tools = [{ googleMaps: {} }];
    if (
      input.latLng &&
      typeof input.latLng.latitude === 'number' &&
      typeof input.latLng.longitude === 'number'
    ) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: input.latLng.latitude,
            longitude: input.latLng.longitude,
          },
        },
      };
    }
  } else if (input.thinkingLevel && model !== 'gemini-3.1-flash-lite') {
    const levelMap: Record<string, ThinkingLevel> = {
      LOW: ThinkingLevel.LOW,
      MEDIUM: ThinkingLevel.MEDIUM,
      HIGH: ThinkingLevel.HIGH,
    };
    if (levelMap[input.thinkingLevel]) {
      config.thinkingConfig = { thinkingLevel: levelMap[input.thinkingLevel] };
    }
  }

  const formattedHistory = (input.history || [])
    .filter((h) => h.text && h.text.trim())
    .slice(-16)
    .map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

  const chat = ai.chats.create({
    model,
    history: formattedHistory,
    config,
  });

  const response = await chat.sendMessage({ message: input.message });
  const chunks =
    (response.candidates?.[0]?.groundingMetadata?.groundingChunks as Array<{
      web?: { uri?: string; title?: string };
      maps?: {
        uri?: string;
        title?: string;
        placeId?: string;
        placeAnswerSources?: {
          reviewSnippets?: Array<{ uri?: string; title?: string; author?: string }>;
        };
      };
    }>) || [];

  const webSources = chunks
    .filter((c) => c.web?.uri)
    .map((c) => ({ uri: c.web!.uri!, title: c.web?.title || c.web!.uri! }));

  const mapsSources = chunks
    .filter((c) => c.maps?.uri)
    .map((c) => ({
      uri: c.maps!.uri!,
      title: c.maps?.title || 'Google Maps Place',
      placeId: c.maps?.placeId,
      reviewSnippets: (c.maps?.placeAnswerSources?.reviewSnippets || []).map((r) => ({
        uri: r.uri || '',
        title: r.title || '',
        author: r.author || '',
      })),
    }));

  return {
    text: response.text || '',
    model,
    webSources,
    mapsSources,
  };
}

export async function generateLyriaMusic(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const ai = getAiClient();
  const model =
    params.model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

  const contents = params.imageBase64
    ? {
        parts: [
          { text: params.prompt },
          {
            inlineData: {
              data: params.imageBase64,
              mimeType: params.imageMimeType || 'image/jpeg',
            },
          },
        ],
      }
    : params.prompt;

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
  });

  const audioChunks: Buffer[] = [];
  let lyrics = '';
  let mimeType = 'audio/mpeg';

  for await (const chunk of responseStream) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.inlineData?.data) {
        if (audioChunks.length === 0 && part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
      }
      if (part.text) {
        lyrics += part.text;
      }
    }
  }

  if (audioChunks.length === 0) {
    throw new Error('No audio track was returned by the music model.');
  }

  const audioBase64 = Buffer.concat(audioChunks).toString('base64');
  return {
    audioDataUrl: `data:${mimeType};base64,${audioBase64}`,
    lyrics: lyrics.trim(),
    mimeType,
    model,
  };
}

export async function generateOrEditImage(params: {
  prompt: string;
  model?: 'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '1K' | '2K' | '4K';
  useSearch?: boolean;
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
}) {
  const ai = getAiClient();
  const model =
    params.model === 'gemini-nano-banana-2.1'
      ? 'gemini-nano-banana-2.1'
      : 'gemini-3.1-flash-lite-image';

  const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
  if (params.sourceImageBase64) {
    parts.push({
      inlineData: {
        data: params.sourceImageBase64,
        mimeType: params.sourceImageMimeType || 'image/png',
      },
    });
  }
  parts.push({ text: params.prompt });

  const imageConfig: Record<string, string> = {
    aspectRatio: params.aspectRatio || '1:1',
  };
  if (model === 'gemini-nano-banana-2.1') {
    imageConfig.imageSize = params.imageSize || '1K';
  }

  const config: Record<string, unknown> = { imageConfig };
  if (model === 'gemini-nano-banana-2.1' && params.useSearch) {
    config.tools = [
      {
        googleSearch: {
          searchTypes: {
            webSearch: {},
            imageSearch: {},
          },
        },
      },
    ];
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config,
  });

  let imageUrl = '';
  let caption = '';
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType ?? 'image/png';
      imageUrl = `data:${mime};base64,${part.inlineData.data}`;
    } else if (part.text) {
      caption += part.text;
    }
  }

  if (!imageUrl) {
    throw new Error('No image was produced for this prompt.');
  }

  return { imageUrl, caption: caption.trim(), model };
}

export async function generateOmniVideo(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '8s' | '10s';
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const ai = getAiClient();
  const input = params.imageBase64
    ? [
        {
          type: 'image' as const,
          mime_type: params.imageMimeType || 'image/png',
          data: params.imageBase64,
        },
        {
          type: 'text' as const,
          text: params.prompt,
        },
      ]
    : params.prompt;

  const interaction = await ai.interactions.create(
    {
      model: 'gemini-omni-1.2-flash',
      input,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: params.aspectRatio === '9:16' ? '9:16' : '16:9',
        duration: params.duration || '8s',
        resolution: '720p',
      },
    },
    { timeout: 300000 }
  );

  const videoPart = interaction.output_video;
  if (!videoPart?.data) {
    throw new Error('Video generation did not return playable video data.');
  }

  const mime = videoPart.mime_type || 'video/mp4';
  return {
    videoDataUrl: `data:${mime};base64,${videoPart.data}`,
    mimeType: mime,
    model: 'gemini-omni-1.2-flash',
  };
}

export async function transcribeAudioClip(params: {
  audioBase64: string;
  mimeType: string;
  languageHint?: string;
}) {
  const ai = getAiClient();
  const hint = params.languageHint
    ? `Transcribe this audio accurately (the speaker may use Amazigh/Tamazight, Arabic, French, or English; hint: ${params.languageHint}). Return only the clean transcription text.`
    : 'Transcribe this audio accurately. Return only the clean transcription text.';

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType || 'audio/webm',
            data: params.audioBase64,
          },
        },
        { text: hint },
      ],
    },
  });

  return {
    text: (response.text || '').trim(),
    model: 'gemini-3.5-transcribe',
  };
}

export async function generateSpeechClip(params: { text: string; voiceName?: string }) {
  const ai = getAiClient();
  const voiceName = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(
    params.voiceName || ''
  )
    ? (params.voiceName as string)
    : 'Kore';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: params.text,
            speechMetadata: {
              style: 'Clear, warm educational narrator',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Text-to-speech did not return audio data.');
  }

  return {
    audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
    model: 'gemini-3.8-flash-lite-tts',
  };
}

export function attachLiveWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', async (clientWs: WebSocket, req) => {
    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    try {
      const url = new URL(req.url || '/api/ai/live', 'http://localhost');
      const lang = url.searchParams.get('lang') || 'en';
      const voice = url.searchParams.get('voice') || 'Zephyr';
      const safeVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voice)
        ? voice
        : 'Zephyr';

      const langNote =
        lang === 'zgh'
          ? 'The learner selected Amazigh (Tamazight / Tifinagh). Speak clearly, encourage Amazigh vocabulary and Tifinagh literacy.'
          : lang === 'ar'
          ? 'The learner selected Arabic. Converse warmly in Arabic while helping with Amazigh language and Moroccan cultural education.'
          : 'Converse warmly in English while teaching Amazigh (Tamazight), Tifinagh script, and Moroccan Amazigh heritage.';

      const ai = getAiClient();
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: safeVoice } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are Berghazi Voice Tutor, a knowledgeable, warm educator on Moroccan Amazigh language (Tamazight), Tifinagh script, and heritage. ${langNote} Keep spoken answers concise and encouraging.`,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ ready: true }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== clientWs.OPEN) return;
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === clientWs.OPEN) {
              const mapped = mapGeminiError(err);
              clientWs.send(JSON.stringify({ error: mapped.error }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.close();
            }
          },
        },
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: mapped.error }));
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (rawData) => {
      if (!session) return;
      try {
        const payload = JSON.parse(rawData.toString()) as {
          audio?: string;
          text?: string;
        };
        if (payload.audio) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text) {
          session.sendRealtimeInput({ text: payload.text });
        }
      } catch (err) {
        console.error('Live WebSocket message parse error:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {
        // Ignore close errors
      }
      session = null;
    });
  });
}
