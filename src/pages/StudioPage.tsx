import React, { useState } from 'react';
import {
  Bot,
  Box,
  Film,
  Gamepad2,
  MapPin,
  Music,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GeminiChatPanel } from '../components/studio/GeminiChatPanel';
import { LiveVoiceTutor } from '../components/studio/LiveVoiceTutor';
import { LyriaMusicStudio } from '../components/studio/LyriaMusicStudio';
import { MediaStudioPanel } from '../components/studio/MediaStudioPanel';
import { Amazigh3DScene } from '../components/studio/Amazigh3DScene';
import { HeritageMapPanel } from '../components/studio/HeritageMapPanel';
import { TifinaghGame } from '../components/studio/TifinaghGame';

type StudioTabId = 'chat' | 'live' | 'music' | 'media' | 'heritage_map' | 'scene3d' | 'game';

export const StudioPage: React.FC = () => {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<StudioTabId>('chat');

  const tabs: { id: StudioTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'AI Chatbot & Grounding', icon: <Bot className="w-4 h-4" /> },
    { id: 'live', label: 'Live Voice Tutor', icon: <Radio className="w-4 h-4" /> },
    { id: 'music', label: 'Lyria Music Studio', icon: <Music className="w-4 h-4" /> },
    { id: 'media', label: 'Images & Video', icon: <Film className="w-4 h-4" /> },
    { id: 'heritage_map', label: 'Atlas Heritage Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'scene3d', label: '3D Fibula & Yaz', icon: <Box className="w-4 h-4" /> },
    { id: 'game', label: 'Tifinagh Game', icon: <Gamepad2 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="border-b border-[#E5E4DF] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C68B1C]">
          <Sparkles className="w-4 h-4" />
          <span className="font-tifinagh">ⴰⵙⴰⵢⵔⴰⵔ ⵏ ⵜⵉⵖⵉⵙⵜ ⴷ ⵜⴰⵢⵙⵉ</span>
        </div>
        <h1 className="text-3xl font-semibold text-[#16222E]">{t.nav.studio}</h1>
        <p className="text-sm text-[#475569] max-w-3xl">
          Interactive Gemini AI study assistant, live bilingual voice tutor, Lyria music studio, visual &amp; video creation, Moroccan Atlas heritage map, 3D Amazigh monument viewer, and Neo-Tifinagh game.
        </p>
      </header>

      {/* Studio Tool Switcher */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                  : 'bg-white text-[#16222E] border-[#E5E4DF] hover:border-[#C68B1C]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Studio Panel */}
      <section>
        {activeTab === 'chat' && <GeminiChatPanel />}
        {activeTab === 'live' && <LiveVoiceTutor />}
        {activeTab === 'music' && <LyriaMusicStudio />}
        {activeTab === 'media' && <MediaStudioPanel />}
        {activeTab === 'heritage_map' && <HeritageMapPanel />}
        {activeTab === 'scene3d' && <Amazigh3DScene />}
        {activeTab === 'game' && <TifinaghGame />}
      </section>
    </div>
  );
};
