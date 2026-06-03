import { TOWNS } from '../lib/towns';
import type { GameState, TravelResult } from '../lib/gameState';
import { travelDays, travel, getCargoUsed, bestSellTown } from '../lib/gameState';
import { ALL_GOODS, GOODS } from '../lib/goods';

interface Props {
  state: GameState;
  onChange: (result: TravelResult) => void;
}

export default function TravelPanel({ state, onChange }: Props) {
  const currentTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const cargoUsed = getCargoUsed(state.inventory);
  const cargoFree = state.cargoCapacity - cargoUsed;
  const daysLeft = state.contractDueDay - state.day;
  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-slate-400 flex items-center justify-between">
        <span>Where do you want to go?</span>
        {state.upgrades.speedLevel > 0 && (
          <span className="text-xs text-amber-500">🐎 +30% speed</span>
        )}
      </div>

      {/* contextual hints */}
      {cargoUsed === 0 && (
        <div className="bg-amber-950/60 border border-amber-800/50 rounded-lg px-3 py-2 text-xs text-amber-300">
          ⚠️ Cargo hold empty — consider buying goods to sell at your destination.
        </div>
      )}
      {cargoFree === 0 && (
        <div className="bg-blue-950/60 border border-blue-800/50 rounded-lg px-3 py-2 text-xs text-blue-300">
          📦 Cargo hold is full — you won't be able to buy anything when you arrive.
        </div>
      )}
      {daysLeft >= 0 && daysLeft <= 4 && (
        <div className="bg-red-950/60 border border-red-800/50 rounded-lg px-3 py-2 text-xs text-red-300">
          ⏰ Contract due in {daysLeft}d — travel time counts!
        </div>
      )}

      {/* cargo route suggestions */}
      {heldGoods.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Best place to sell your cargo</div>
          <div className="flex flex-col gap-1">
            {heldGoods.map(good => {
              const held = state.inventory[good.id];
              const best = bestSellTown(state, good.id);
              if (!best.townId) return null;
              const bestTown = TOWNS.find(t => t.id === best.townId);
              if (!bestTown) return null;
              return (
                <div key={good.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    {GOODS[good.id].emoji} {GOODS[good.id].name} ×{held}
                  </span>
                  <span className="text-slate-400">
                    → {bestTown.emoji} {bestTown.name}
                    <span className="text-amber-400 font-mono ml-1">{best.sellPrice}g</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* town buttons */}
      {TOWNS.filter(t => t.id !== state.currentTownId).map(town => {
        const days = travelDays(currentTown, town, state.upgrades.speedLevel);
        const deadlineRisk = daysLeft >= 0 && days > daysLeft;
        return (
          <button
            key={town.id}
            onClick={() => onChange(travel(state, town.id))}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border transition-colors text-left ${
              deadlineRisk ? 'border-red-800/60 hover:border-red-600' : 'border-slate-700 hover:border-amber-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{town.emoji}</span>
              <div>
                <div className="font-medium text-slate-200">{town.name}</div>
                <div className="text-xs text-slate-500">{town.description}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className={`font-mono text-sm font-bold ${deadlineRisk ? 'text-red-400' : 'text-amber-400'}`}>{days}d</div>
              <div className="text-xs text-slate-500">travel</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
