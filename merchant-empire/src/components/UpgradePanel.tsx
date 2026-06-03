import type { GameState } from '../lib/gameState';
import {
  buyCargoUpgrade, buySpeedUpgrade,
  CARGO_LEVELS, CARGO_UPGRADE_COSTS, CARGO_UPGRADE_LABELS,
  SPEED_UPGRADE_COST, SPEED_UPGRADE_LABEL,
} from '../lib/gameState';

interface Props {
  state: GameState;
  onChange: (s: GameState) => void;
}

export default function UpgradePanel({ state, onChange }: Props) {
  const { cargoLevel, speedLevel } = state.upgrades;

  const nextCargoIdx = cargoLevel;
  const canUpgradeCargo = nextCargoIdx < CARGO_UPGRADE_COSTS.length;
  const cargoCost = canUpgradeCargo ? CARGO_UPGRADE_COSTS[nextCargoIdx] : null;
  const nextCargoCapacity = canUpgradeCargo ? CARGO_LEVELS[nextCargoIdx + 1] : null;

  const canUpgradeSpeed = speedLevel < 1;
  const canAffordCargo = cargoCost !== null && state.gold >= cargoCost;
  const canAffordSpeed = canUpgradeSpeed && state.gold >= SPEED_UPGRADE_COST;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Invest your gold in upgrades to trade more efficiently and reach milestones faster.
      </p>

      {/* cargo upgrade */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📦</span>
              <span className="font-semibold text-slate-200">Cargo Hold</span>
            </div>
            <div className="text-sm text-slate-400">
              Current: <span className="text-amber-400 font-mono">{state.cargoCapacity} units</span>
              {canUpgradeCargo && (
                <> → <span className="text-green-400 font-mono">{nextCargoCapacity} units</span></>
              )}
            </div>
          </div>
          {canUpgradeCargo ? (
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">{CARGO_UPGRADE_LABELS[nextCargoIdx]}</div>
              <div className="font-mono text-amber-400">{cargoCost}g</div>
            </div>
          ) : (
            <div className="text-sm text-green-400 font-medium">Max level</div>
          )}
        </div>

        {/* level pips */}
        <div className="flex gap-1.5 mb-3">
          {CARGO_UPGRADE_COSTS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < cargoLevel ? 'bg-amber-500' : 'bg-slate-600'}`}
            />
          ))}
        </div>

        {canUpgradeCargo && (
          <button
            onClick={() => onChange(buyCargoUpgrade(state))}
            disabled={!canAffordCargo}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAffordCargo ? `Upgrade for ${cargoCost}g` : `Need ${cargoCost}g (have ${state.gold}g)`}
          </button>
        )}
      </div>

      {/* speed upgrade */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🐎</span>
              <span className="font-semibold text-slate-200">{SPEED_UPGRADE_LABEL}</span>
            </div>
            <div className="text-sm text-slate-400">
              {speedLevel > 0
                ? 'Travel 30% faster between towns.'
                : 'Reduce all travel times by 30%.'}
            </div>
          </div>
          {canUpgradeSpeed ? (
            <div className="font-mono text-amber-400">{SPEED_UPGRADE_COST}g</div>
          ) : (
            <div className="text-sm text-green-400 font-medium">Purchased</div>
          )}
        </div>

        <div className="flex gap-1.5 mb-3">
          <div className={`h-1.5 flex-1 rounded-full ${speedLevel > 0 ? 'bg-amber-500' : 'bg-slate-600'}`} />
        </div>

        {canUpgradeSpeed && (
          <button
            onClick={() => onChange(buySpeedUpgrade(state))}
            disabled={!canAffordSpeed}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAffordSpeed ? `Purchase for ${SPEED_UPGRADE_COST}g` : `Need ${SPEED_UPGRADE_COST}g (have ${state.gold}g)`}
          </button>
        )}
      </div>
    </div>
  );
}
