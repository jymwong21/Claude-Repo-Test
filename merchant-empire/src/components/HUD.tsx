import type { GameState } from '../lib/gameState';
import { getCargoUsed, WIN_MILESTONES } from '../lib/gameState';
import { ALL_GOODS } from '../lib/goods';
import { TOWNS } from '../lib/towns';

interface Props {
  state: GameState;
}

export default function HUD({ state }: Props) {
  const cargoUsed = getCargoUsed(state.inventory);
  const currentTown = TOWNS.find(t => t.id === state.currentTownId)!;

  const currentMilestoneIdx = state.milestoneReached + 1;
  const targetGold = WIN_MILESTONES[currentMilestoneIdx] ?? WIN_MILESTONES[WIN_MILESTONES.length - 1];
  const prevTarget = currentMilestoneIdx > 0 ? WIN_MILESTONES[currentMilestoneIdx - 1] : 0;
  const progress = Math.min(100, ((state.gold - prevTarget) / (targetGold - prevTarget)) * 100);
  const isMaxMilestone = currentMilestoneIdx >= WIN_MILESTONES.length;

  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);
  const cargoFull = cargoUsed >= state.cargoCapacity;
  const cargoNearFull = cargoUsed >= state.cargoCapacity * 0.85;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-xs text-slate-500">Gold</div>
          <div className="text-amber-400 font-mono font-bold text-base">{state.gold.toLocaleString()}g</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-xs text-slate-500">Day</div>
          <div className="text-slate-200 font-mono font-bold text-base">{state.day}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-xs text-slate-500">Cargo</div>
          <div className={`font-mono font-bold text-base ${cargoFull ? 'text-red-400' : cargoNearFull ? 'text-amber-400' : 'text-slate-200'}`}>
            {cargoUsed}/{state.cargoCapacity}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-lg">{currentTown.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">Location</div>
          <div className="text-slate-200 text-sm font-medium">{currentTown.name}</div>
        </div>
        {state.upgrades.speedLevel > 0 && (
          <span className="text-xs text-amber-500">🐎 Fast</span>
        )}
        {state.upgrades.cargoLevel > 0 && (
          <span className="text-xs text-slate-500">📦 ×{state.upgrades.cargoLevel}</span>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg px-3 py-2">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">
            {isMaxMilestone ? 'Empire Goal' : `Milestone ${currentMilestoneIdx + 1} of ${WIN_MILESTONES.length}`}
          </span>
          <span className="text-amber-400 font-mono">{state.gold.toLocaleString()} / {targetGold.toLocaleString()}g</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {heldGoods.length > 0 && (
        <div className="bg-slate-800 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-500 mb-1.5">Cargo Hold</div>
          <div className="flex flex-wrap gap-1.5">
            {heldGoods.map(good => (
              <div key={good.id} className="flex items-center gap-1 bg-slate-700 rounded px-2 py-0.5 text-sm">
                <span>{good.emoji}</span>
                <span className="text-slate-300 text-xs">{good.name}</span>
                <span className="text-amber-400 font-mono text-xs">×{state.inventory[good.id]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
