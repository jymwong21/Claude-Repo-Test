import type { GameState } from '../lib/gameState';
import { getCargoUsed } from '../lib/gameState';
import { ALL_GOODS, GOODS } from '../lib/goods';
import type { GoodId } from '../lib/goods';
import { TOWNS } from '../lib/towns';
import { CONTRACTS } from '../lib/contracts';

interface Props {
  state: GameState;
  onPayContract: () => void;
}

export default function HUD({ state, onPayContract }: Props) {
  const cargoUsed = getCargoUsed(state.inventory);
  const currentTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const cargoFull = cargoUsed >= state.cargoCapacity;
  const cargoNearFull = cargoUsed >= state.cargoCapacity * 0.85;

  const contract = CONTRACTS[Math.min(state.contractIndex, CONTRACTS.length - 1)];
  const daysLeft = state.contractDueDay - state.day;
  const isOverdue = daysLeft < 0;
  const overdueDays = isOverdue ? Math.abs(daysLeft) : 0;
  const canPay = state.gold >= state.contractDebt;
  const debtProgress = Math.min(100, (state.gold / state.contractDebt) * 100);

  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);

  const activePriceEvents = state.priceEvents.filter(e => e.expiresDay > state.day);

  return (
    <div className="flex flex-col gap-2">
      {/* top stats */}
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

      {/* location */}
      <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-lg">{currentTown.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">Location</div>
          <div className="text-slate-200 text-sm font-medium">{currentTown.name}</div>
        </div>
        {state.upgrades.speedLevel > 0 && <span className="text-xs text-amber-500">🐎 Fast</span>}
        {state.upgrades.cargoLevel > 0 && <span className="text-xs text-slate-500">📦 Lv{state.upgrades.cargoLevel}</span>}
      </div>

      {/* contract panel */}
      <div className={`rounded-lg px-3 py-2.5 border ${
        isOverdue ? 'bg-red-950/40 border-red-800/60' :
        canPay ? 'bg-green-950/40 border-green-800/60' :
        daysLeft <= 4 ? 'bg-amber-950/40 border-amber-800/60' :
        'bg-slate-800 border-slate-700'
      }`}>
        {/* header row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs text-slate-400">
            Contract {state.contractIndex + 1}/{CONTRACTS.length}
            <span className="text-slate-600 ml-1">· {contract.label}</span>
          </div>
          <div className={`text-xs font-bold ${
            isOverdue ? 'text-red-400 animate-pulse' :
            daysLeft <= 3 ? 'text-amber-400' :
            'text-slate-400'
          }`}>
            {isOverdue
              ? `${overdueDays}d OVERDUE`
              : daysLeft === 0 ? 'Due today!'
              : `${daysLeft}d left`}
          </div>
        </div>

        {/* debt info */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500">
            Owe: <span className={`font-mono font-bold ${isOverdue ? 'text-red-300' : 'text-slate-200'}`}>
              {state.contractDebt.toLocaleString()}g
            </span>
            {isOverdue && <span className="text-red-600 ml-1 text-[10px]">+8%/day</span>}
          </span>
          <span className="text-slate-600">Due Day {state.contractDueDay}</span>
        </div>

        {/* progress bar */}
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              canPay ? 'bg-green-500' : isOverdue ? 'bg-red-600' : 'bg-amber-500'
            }`}
            style={{ width: `${debtProgress}%` }}
          />
        </div>

        {/* pay button */}
        {canPay ? (
          <button
            onClick={onPayContract}
            className="w-full py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-bold text-white transition-colors"
          >
            ✓ Pay Contract — {state.contractDebt.toLocaleString()}g
          </button>
        ) : isOverdue ? (
          <div className="text-xs text-red-500 text-center">
            Need {(state.contractDebt - state.gold).toLocaleString()}g more — debt compounding daily
          </div>
        ) : (
          <div className="text-xs text-slate-600 text-center">
            Need {(state.contractDebt - state.gold).toLocaleString()}g more to pay off
          </div>
        )}
      </div>

      {/* active price events */}
      {activePriceEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activePriceEvents.map(ev => {
            const town = TOWNS.find(t => t.id === ev.townId);
            const good = GOODS[ev.goodId as GoodId];
            if (!town || !good) return null;
            const pct = ev.multiplier >= 1
              ? `+${Math.round((ev.multiplier - 1) * 100)}%`
              : `-${Math.round((1 - ev.multiplier) * 100)}%`;
            return (
              <div
                key={ev.id}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  ev.label === 'SHORTAGE'
                    ? 'bg-red-900/70 text-red-200'
                    : 'bg-blue-900/70 text-blue-200'
                }`}
              >
                ⚡ {good.emoji} {good.name} {ev.label} at {town.name} ({pct}) · {ev.expiresDay - state.day}d
              </div>
            );
          })}
        </div>
      )}

      {/* cargo hold */}
      {heldGoods.length > 0 && (
        <div className="bg-slate-800 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-500 mb-1.5">Cargo Hold</div>
          <div className="flex flex-wrap gap-1.5">
            {heldGoods.map(good => (
              <div key={good.id} className="flex items-center gap-1 bg-slate-700 rounded px-2 py-0.5">
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
