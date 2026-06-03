import type { GameState } from '../lib/gameState';
import { getCargoUsed } from '../lib/gameState';
import { ALL_GOODS } from '../lib/goods';
import { TOWNS } from '../lib/towns';

interface Props {
  state: GameState;
}

export default function HUD({ state }: Props) {
  const cargoUsed = getCargoUsed(state.inventory);
  const currentTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const progress = Math.min(100, (state.gold / state.winTarget) * 100);

  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);

  return (
    <div className="flex flex-col gap-2">
      {/* main stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <div className="text-xs text-slate-500">Gold</div>
          <div className="text-amber-400 font-mono font-bold">{state.gold.toLocaleString()}g</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <div className="text-xs text-slate-500">Day</div>
          <div className="text-slate-200 font-mono font-bold">{state.day}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <div className="text-xs text-slate-500">Cargo</div>
          <div className={`font-mono font-bold ${cargoUsed >= state.cargoCapacity ? 'text-red-400' : 'text-slate-200'}`}>
            {cargoUsed}/{state.cargoCapacity}
          </div>
        </div>
      </div>

      {/* location */}
      <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-lg">{currentTown.emoji}</span>
        <div>
          <div className="text-xs text-slate-500">Location</div>
          <div className="text-slate-200 text-sm font-medium">{currentTown.name}</div>
        </div>
      </div>

      {/* wealth goal progress */}
      <div className="bg-slate-800 rounded-lg px-3 py-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Wealth Goal</span>
          <span>{state.gold.toLocaleString()} / {state.winTarget.toLocaleString()}g</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* inventory */}
      {heldGoods.length > 0 && (
        <div className="bg-slate-800 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-500 mb-1.5">Cargo Hold</div>
          <div className="flex flex-wrap gap-1.5">
            {heldGoods.map(good => (
              <div key={good.id} className="flex items-center gap-1 bg-slate-700 rounded px-2 py-0.5 text-sm">
                <span>{good.emoji}</span>
                <span className="text-slate-300">{good.name}</span>
                <span className="text-amber-400 font-mono">×{state.inventory[good.id]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
