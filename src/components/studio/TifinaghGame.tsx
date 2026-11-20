import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, HelpCircle, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';

interface GlyphItem {
  glyph: string;
  latin: string;
  arabic: string;
  name: string;
  word: string;
}

const GAME_GLYPHS: GlyphItem[] = [
  { glyph: 'ⴰ', latin: 'a', arabic: 'أ', name: 'Ya', word: 'ⴰⵎⴰⵏ (Water)' },
  { glyph: 'ⴱ', latin: 'b', arabic: 'ب', name: 'Yab', word: 'ⴰⴱⵔⵉⴷ (Path)' },
  { glyph: 'ⴳ', latin: 'g', arabic: 'ڭ', name: 'Yag', word: 'ⴰⴳⴰⴼⴰ (North)' },
  { glyph: 'ⴷ', latin: 'd', arabic: 'د', name: 'Yad', word: 'ⴰⴷⵔⴰⵔ (Mountain)' },
  { glyph: 'ⴼ', latin: 'f', arabic: 'ف', name: 'Yaf', word: 'ⵜⴰⴼⵓⴽⵜ (Sun)' },
  { glyph: 'ⴽ', latin: 'k', arabic: 'ك', name: 'Yak', word: 'ⴰⴽⴰⵍ (Earth)' },
  { glyph: 'ⵃ', latin: 'ḥ', arabic: 'ح', name: 'Yaḥ', word: 'ⴰⵃⵡⴰⵛ (Ahwach)' },
  { glyph: 'ⵉ', latin: 'i', arabic: 'ي', name: 'Yi', word: 'ⵉⵜⵔⵉ (Star)' },
  { glyph: 'ⵍ', latin: 'l', arabic: 'ل', name: 'Yal', word: 'ⵉⵍⴻⵍ (Sea)' },
  { glyph: 'ⵎ', latin: 'm', arabic: 'م', name: 'Yam', word: 'ⴰⵎⴰⵣⵉⵖ (Amazigh)' },
  { glyph: 'ⵏ', latin: 'n', arabic: 'ن', name: 'Yan', word: 'ⴰⵏⴰⵔⵓⵣ (Hope)' },
  { glyph: 'ⵓ', latin: 'u', arabic: 'و', name: 'Yu', word: 'ⵓⵍ (Heart)' },
  { glyph: 'ⵔ', latin: 'r', arabic: 'ر', name: 'Yar', word: 'ⴰⵔⴳⴰⵏ (Argan)' },
  { glyph: 'ⵖ', latin: 'ɣ', arabic: 'غ', name: 'Yaɣ', word: 'ⴰⵖⵔⵓⵎ (Bread)' },
  { glyph: 'ⵙ', latin: 's', arabic: 'س', name: 'Yas', word: 'ⴰⵙⵍⵎⴷ (Teaching)' },
  { glyph: 'ⵛ', latin: 'c', arabic: 'ش', name: 'Yac', word: 'ⴰⵛⴰⵍ (Land)' },
  { glyph: 'ⵜ', latin: 't', arabic: 'ت', name: 'Yat', word: 'ⵜⵉⴼⵉⵏⴰⵖ (Tifinagh)' },
  { glyph: 'ⵡ', latin: 'w', arabic: 'و', name: 'Yaw', word: 'ⴰⵡⴰⵍ (Word)' },
  { glyph: 'ⵢ', latin: 'y', arabic: 'ي', name: 'Yay', word: 'ⴰⵢⵢⵓⵔ (Moon)' },
  { glyph: 'ⵣ', latin: 'z', arabic: 'ز', name: 'Yaz', word: 'ⴰⵣⵓⵍ (Greeting)' },
];

const TOTAL_ROUNDS = 10;

function pickRound(excludeGlyph?: string): { target: GlyphItem; choices: GlyphItem[] } {
  const pool = GAME_GLYPHS.filter((g) => g.glyph !== excludeGlyph);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = GAME_GLYPHS.filter((g) => g.glyph !== target.glyph)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
  const choices = [target, ...distractors].sort(() => Math.random() - 0.5);
  return { target, choices };
}

export const TifinaghGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [hintTier, setHintTier] = useState(0);
  const [muted, setMuted] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [bestScore, setBestScore] = useState<number>(() => {
    const raw = localStorage.getItem('berghazi_tifinagh_best');
    return raw ? Number(raw) || 0 : 0;
  });
  const [current, setCurrent] = useState(() => pickRound());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const playTone = useCallback(
    (freq: number, duration = 0.14, type: OscillatorType = 'sine') => {
      if (muted) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Ignore browser autoplay restrictions
      }
    },
    [muted]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const startNewGame = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setRound(1);
    setScore(0);
    setStreak(0);
    setLives(3);
    setHintTier(0);
    setFeedback('none');
    setCurrent(pickRound());
    setGameState('PLAYING');
    playTone(523.25, 0.15, 'triangle');
  };

  const handleSelectChoice = (choice: GlyphItem) => {
    if (gameState !== 'PLAYING' || feedback !== 'none') return;

    if (choice.glyph === current.target.glyph) {
      const bonus = Math.max(10, 25 - hintTier * 5) + streak * 5;
      const nextScore = score + bonus;
      setScore(nextScore);
      setStreak((s) => s + 1);
      setFeedback('correct');
      playTone(659.25, 0.12, 'triangle');
      window.setTimeout(() => playTone(880, 0.16, 'triangle'), 90);

      if (nextScore > bestScore) {
        setBestScore(nextScore);
        localStorage.setItem('berghazi_tifinagh_best', String(nextScore));
      }

      timerRef.current = window.setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          setGameState('ROUND_SUMMARY');
        } else {
          setRound((r) => r + 1);
          setHintTier(0);
          setFeedback('none');
          setCurrent(pickRound(current.target.glyph));
        }
      }, 650);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      setStreak(0);
      setFeedback('wrong');
      playTone(220, 0.22, 'sawtooth');

      timerRef.current = window.setTimeout(() => {
        setFeedback('none');
        if (nextLives <= 0) {
          setGameState('GAME_OVER');
        }
      }, 650);
    }
  };

  return (
    <div className="bg-[#16222E] text-white rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Top HUD */}
      <div className="px-5 py-3.5 bg-[#0F1822] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-[#E5AD44] font-tifinagh">
            ⵓⵔⴰⵔ ⵏ ⵜⵉⴼⵉⵏⴰⵖ · Tifinagh Challenge
          </span>
          <span className="tabular-nums text-slate-300">
            Round: <strong className="text-white">{round}/{TOTAL_ROUNDS}</strong>
          </span>
          <span className="tabular-nums text-slate-300">
            Score: <strong className="text-[#E5AD44]">{score}</strong>
          </span>
          <span className="tabular-nums text-slate-300">
            Streak: <strong className="text-emerald-400">{streak}x</strong>
          </span>
          <span className="tabular-nums text-slate-300">
            Lives: <strong className="text-rose-400">{lives}/3</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
            title={muted ? 'Unmute FX' : 'Mute FX'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {gameState === 'PLAYING' && (
            <button
              type="button"
              onClick={() => setGameState('PAUSED')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {gameState !== 'TITLE_MENU' && (
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Arena */}
      <div className="p-6 sm:p-10 min-h-[400px] flex flex-col items-center justify-center">
        {gameState === 'TITLE_MENU' && (
          <div className="max-w-md text-center space-y-6">
            <div className="text-6xl font-tifinagh text-[#E5AD44]">ⵣ</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Tifinagh Script Mastery Challenge</h2>
              <p className="text-sm text-slate-300">
                Match each phonetic Tifinagh letter name and sound to the authentic Neo-Tifinagh glyph. Use 3-tier clues when needed and build your streak.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Personal Best Score: <strong className="text-[#E5AD44]">{bestScore}</strong>
            </div>
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C68B1C] text-[#16222E] font-semibold text-sm hover:bg-[#E5AD44] transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Game</span>
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="text-center space-y-5">
            <h3 className="text-2xl font-bold">Game Paused</h3>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setGameState('PLAYING')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C68B1C] text-[#16222E] font-semibold text-sm"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-3">
              <div className="text-xs uppercase tracking-wider text-[#E5AD44]">
                Identify the Tifinagh Glyph for
              </div>
              <div className="text-3xl sm:text-4xl font-bold">
                {current.target.name}{' '}
                <span className="text-[#E5AD44] font-mono">/{current.target.latin}/</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHintTier((h) => Math.min(2, h + 1))}
                  disabled={hintTier >= 2}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs disabled:opacity-40"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#E5AD44]" />
                  <span>
                    {hintTier === 0
                      ? 'Reveal Arabic Hint (-5 pts)'
                      : hintTier === 1
                      ? 'Reveal Word Clue (-5 pts)'
                      : 'All Hints Shown'}
                  </span>
                </button>
              </div>

              {hintTier >= 1 && (
                <div className="text-xs text-slate-300 space-x-3">
                  <span>
                    Arabic Sound: <strong className="text-white">{current.target.arabic}</strong>
                  </span>
                  {hintTier >= 2 && (
                    <span>
                      · Example:{' '}
                      <strong className="text-[#E5AD44] font-tifinagh">
                        {current.target.word}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {current.choices.map((choice) => {
                const isTarget = choice.glyph === current.target.glyph;
                let tileStyle =
                  'bg-[#1E2E3E] border-slate-700 hover:border-[#E5AD44] hover:bg-[#24374A]';
                if (feedback === 'correct' && isTarget) {
                  tileStyle = 'bg-emerald-700 border-emerald-400 scale-[1.03]';
                } else if (feedback === 'wrong' && !isTarget) {
                  tileStyle = 'bg-[#1E2E3E] border-slate-700 opacity-75';
                }

                return (
                  <button
                    key={choice.glyph}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className={`min-h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-150 ${tileStyle}`}
                  >
                    <span className="text-4xl sm:text-5xl font-tifinagh">{choice.glyph}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') && (
          <div className="max-w-md text-center space-y-5">
            <Award
              className={`w-12 h-12 mx-auto ${
                gameState === 'ROUND_SUMMARY' ? 'text-[#E5AD44]' : 'text-rose-400'
              }`}
            />
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">
                {gameState === 'ROUND_SUMMARY' ? 'Challenge Complete!' : 'Out of Lives'}
              </h3>
              <p className="text-sm text-slate-300">
                Final Score: <strong className="text-[#E5AD44]">{score}</strong> · Best:{' '}
                <strong className="text-white">{bestScore}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={startNewGame}
              className="px-6 py-3 rounded-xl bg-[#C68B1C] text-[#16222E] font-semibold text-sm hover:bg-[#E5AD44]"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
