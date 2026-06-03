import { useState } from 'react';
import type { GameState } from '../lib/gameState';
import { buyGood, sellGood, getCargoUsed } from '../lib/gameState';
import type { GoodId } from '../lib/goods';
import { GOODS, ALL_GOODS } from '../lib/goods';
import { TOWNS } from '../lib/towns';

interface Props {
  state: GameState;
  onChange: (newState: GameState) => void;
}

export default function TradePanel({ state, onChange }: Props) {
  const [quantities, setQuantities] = useState<Partial<Record<GoodId, number>>>({});
  const market = state.markets[state.currentTownId];
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const cargoUsed = getCargoUsed(state.inventory);
  const cargoFree = state.cargoCapacity - cargoUsed;

  function setQty(goodId: GoodId, val: string) {
    const n = parseInt(val) || 0;
    setQuantities(q => ({ ...q, [goodId]: Math.max(0, n) }));
  }

  function handleBuy(goodId: GoodId) {
    const qty = quantities[goodId] || 1;
    const next = buyGood(state, goodId, qty);
    if (next !== state) { onChange(next); setQuantities(q => ({ ...q, [goodId]: 1 })); }
  }

  function handleSell(goodId: GoodId) {
    const qty = quantities[goodId] || 1;
    const next = sellGood(state, goodId, qty);
    if (next !== state) { onChange(next); setQuantities(q => ({ ...q, [goodId]: 1 })); }
  }

  function maxBuy(goodId: GoodId): number {
    const price = market.buyPrice[goodId];
    return Math.min(Math.floor(state.gold / price), cargoFree);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* town header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{town.emoji}</span>
        <div>
          <div className="font-bold text-amber-300">{town.name}</div>
          <div className="text-xs text-slate-400">{town.description}</div>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex gap-1 items-center">
          <span className="text-green-400">Produces:</span>
          <span className="text-slate-300">{town.produces.map(g => GOODS[g].name).join(', ')}</span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-red-400">Needs:</span>
          <span className="text-slate-300">{town.demands.map(g => GOODS[g].name).join(', ')}</span>
        </div>
      </div>

      {/* goods table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-700">
              <th className="text-left py-1 pr-2">Good</th>
              <th className="text-right py-1 px-2">Buy</th>
              <th className="text-right py-1 px-2">Sell</th>
              <th className="text-right py-1 px-2">You have</th>
              <th className="text-right py-1 px-2">Qty</th>
              <th className="py-1 px-1" />
              <th className="py-1 px-1" />
            </tr>
          </thead>
          <tbody>
            {ALL_GOODS.map(good => {
              const buyPrice = market.buyPrice[good.id];
              const sellPrice = market.sellPrice[good.id];
              const held = state.inventory[good.id] || 0;
              const qty = quantities[good.id] ?? 1;
              const canBuy = state.gold >= buyPrice && cargoFree >= 1;
              const canSell = held > 0;
              const isProduced = town.produces.includes(good.id);
              const isDemanded = town.demands.includes(good.id);

              return (
                <tr key={good.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="py-1.5 pr-2">
                    <span className="mr-1">{good.emoji}</span>
                    <span className={isProduced ? 'text-green-400' : isDemanded ? 'text-red-400' : 'text-slate-300'}>
                      {good.name}
                    </span>
                  </td>
                  <td className="text-right px-2 text-amber-300 font-mono">{buyPrice}g</td>
                  <td className="text-right px-2 text-slate-400 font-mono">{sellPrice}g</td>
                  <td className="text-right px-2 text-slate-300 font-mono">{held}</td>
                  <td className="text-right px-2 w-14">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(held, maxBuy(good.id))}
                      value={qty}
                      onChange={e => setQty(good.id, e.target.value)}
                      className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-right text-white text-xs"
                    />
                  </td>
                  <td className="px-1">
                    <button
                      onClick={() => handleBuy(good.id)}
                      disabled={!canBuy || qty < 1 || state.gold < buyPrice * qty || cargoFree < qty}
                      className="text-xs px-2 py-0.5 rounded bg-green-800 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                    >
                      Buy
                    </button>
                  </td>
                  <td className="px-1">
                    <button
                      onClick={() => handleSell(good.id)}
                      disabled={!canSell || qty < 1 || held < qty}
                      className="text-xs px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        <span className="text-green-400">Green</span> = produced here (buy cheap) &nbsp;
        <span className="text-red-400">Red</span> = needed here (sell for more)
      </div>
    </div>
  );
}
