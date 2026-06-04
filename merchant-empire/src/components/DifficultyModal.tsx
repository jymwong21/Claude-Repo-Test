import { useState } from 'react';
import type { Difficulty } from '../lib/gameState';
import { DIFFICULTY_CONFIGS } from '../lib/gameState';

interface Props {
  onSelect: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['apprentice', 'merchant', 'factor'];

const DEMAND_LABELS: Record<Difficulty, string> = {
  apprentice: 'Market caps 2× larger',
  merchant: 'Standard market caps',
  factor: 'Market caps 25% smaller',
};

const RIVAL_LABELS: Record<Difficulty, string> = {
  apprentice: 'Rival pays Days 20, 55, 100, 155',
  merchant: 'Rival pays Days 13, 32, 60, 100',
  factor: 'Rival pays Days 11, 28, 55, 90',
};

const CARD_COLORS: Record<Difficulty, { border: string; glow: string; badge: string; btn: string }> = {
  apprentice: {
    border: 'border-green-700/60',
    glow: 'border-green-500 shadow-green-900/40',
    badge: 'bg-green-900/60 text-green-300',
    btn: 'bg-green-700 hover:bg-green-600',
  },
  merchant: {
    border: 'border-amber-700/60',
    glow: 'border-amber-500 shadow-amber-900/40',
    badge: 'bg-amber-900/60 text-amber-300',
    btn: 'bg-amber-700 hover:bg-amber-600',
  },
  factor: {
    border: 'border-red-700/60',
    glow: 'border-red-500 shadow-red-900/40',
    badge: 'bg-red-900/60 text-red-300',
    btn: 'bg-red-700 hover:bg-red-600',
  },
};

export default function DifficultyModal({ onSelect }: Props) {
  const [selected, setSelected] = useState<Difficulty>('merchant');
  const cfg = DIFFICULTY_CONFIGS[selected];
  const colors = CARD_COLORS[selected];

  return (
    <div className="min-h-svh bg-[#0a0d15] text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚖️</div>
          <h1 className="text-2xl font-bold text-amber-400">Merchant Empire</h1>
          <p className="text-slate-500 text-sm mt-1">Choose your difficulty</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {DIFFICULTIES.map(diff => {
            const c = DIFFICULTY_CONFIGS[diff];
            const col = CARD_COLORS[diff];
            const isSelected = diff === selected;
            return (
              <button
                key={diff}
                onClick={() => setSelected(diff)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${col.glow} shadow-lg bg-slate-800`
                    : `${col.border} bg-slate-900/60 hover:bg-slate-800/60`
                }`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-100">{c.label}</div>
                    <div className="text-xs text-slate-400">{c.tagline}</div>
                  </div>
                  {isSelected && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${col.badge}`}>
                      SELECTED
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-600">📦</span> {DEMAND_LABELS[diff]}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-600">🏴</span> {RIVAL_LABELS[diff]}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-600">💰</span> Start with {c.startGold + 500}g ({c.startGold}g + 500g loan)
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSelect(selected)}
          className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-colors ${colors.btn}`}
        >
          Start as {cfg.label} →
        </button>
      </div>
    </div>
  );
}
