import { useState } from 'react';
import type { GameState } from '../lib/gameState';
import { buyGood, sellGood, getCargoUsed, bestSellTown } from '../lib/gameState';
import type { GoodId } from '../lib/goods';
import { GOODS, ALL_GOODS } from '../lib/goods';
import { TOWNS } from '../lib/towns';

interface Props {
  state: GameState;
  onChange: (newState: GameState) => void;
}

function priceBadge(buyPrice: number, basePrice: number): { label: string; cls: string } {
  const ratio = buyPrice / basePrice;
  if (ratio < 0.75) return { label: 'CHEAP', cls: 'bg-green-900 text-green-300' };
  if (ratio > 1.25) return { label: 'PRICEY', cls: 'bg-red-900 text-red-300' };
  return { label: 'FAIR', cls: 'bg-slate-700 text-slate-400' };
}

export default function TradePanel({ state, onChange }: Props) {
  const [quantities, setQuantities] = useState<Partial<Record<GoodId, number>>>({});
  const market = state.markets[state.currentTownId];
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const cargoUsed = getCargoUsed(state.inventory);
  const cargoFree = state.cargoCapacity - cargoUsed;

  function getQty(goodId: GoodId) { return quantities[goodId] ?? 1; }

  function setQty(goodId: GoodId, val: string) {
    const n = parseInt(val);
    setQuantities(q => ({ ...q, [goodId]: isNaN(n) ? 1 : Math.max(1, n) }));
  }

  function maxBuyQty(goodId: GoodId) {
    return Math.min(Math.floor(state.gold / market.buyPrice[goodId]), cargoFree);
  }

  function handleBuy(goodId: GoodId) {
    const qty = getQty(goodId);
    const next = buyGood(state, goodId, qty);
    if (next !== state) { onChange(next); setQuantities(q => ({ ...q, [goodId]: 1 })); }
  }

  function handleSell(goodId: GoodId) {
    const qty = getQty(goodId);
    const next = sellGood(state, goodId, qty);
    if (next !== state) { onChange(next); setQuantities(q => ({ ...q, [goodId]: 1 })); }
  }

  // profit intel: goods you're holding with a profitable sell destination
  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);
  const profitRoutes = heldGoods.map(good => {
    const held = state.inventory[good.id];
    const best = bestSellTown(state, good.id);
    const bestTown = TOWNS.find(t => t.id === best.townId)!;
    const profitPerUnit = best.sellPrice - market.buyPrice[good.id];
    return { good, held, best, bestTown, profitPerUnit };
  }).filter(r => r.best.townId !== '');

  // cheap buys here with good sell potential elsewhere
  const buyOpportunities = ALL_GOODS.map(good => {
    const buyPrice = market.buyPrice[good.id];
    const badge = priceBadge(buyPrice, GOODS[good.id].basePrice);
    if (badge.label !== 'CHEAP') return null;
    const bestSell = bestSellTown(state, good.id);
    if (!bestSell.townId) return null;
    const bestTown = TOWNS.find(t => t.id === bestSell.townId)!;
    const profitPerUnit = bestSell.sellPrice - buyPrice;
    if (profitPerUnit <= 0) return null;
    return { good, buyPrice, bestTown, profitPerUnit };
  }).filter(Boolean).sort((a, b) => b!.profitPerUnit - a!.profitPerUnit).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* town header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{town.emoji}</span>
        <div>
          <div className="font-bold text-amber-300">{town.name}</div>
          <div className="text-xs text-slate-400">{town.description}</div>
        </div>
      </div>

      <div className="flex gap-3 text-xs flex-wrap">
        <span>
          <span className="text-green-400 font-medium">Produces: </span>
          <span className="text-slate-300">{town.produces.map(g => GOODS[g].name).join(', ')}</span>
        </span>
        <span>
          <span className="text-red-400 font-medium">Needs: </span>
          <span className="text-slate-300">{town.demands.map(g => GOODS[g].name).join(', ')}</span>
        </span>
      </div>

      {/* profit intel */}
      {(profitRoutes.length > 0 || buyOpportunities.length > 0) && (
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3">
          <div className="text-xs font-semibold text-amber-400 mb-2">💡 Profit Intel</div>

          {profitRoutes.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-slate-500 mb-1">Sell your cargo at:</div>
              {profitRoutes.map(({ good, held, bestTown, profitPerUnit }) => (
                <div key={good.id} className="flex items-center justify-between text-xs py-0.5">
                  <span>
                    {good.emoji} {good.name} ×{held} → {bestTown.emoji} {bestTown.name}
                  </span>
                  <span className={`font-mono font-bold ${profitPerUnit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitPerUnit > 0 ? '+' : ''}{profitPerUnit * held}g
                  </span>
                </div>
              ))}
            </div>
          )}

          {buyOpportunities.length > 0 && profitRoutes.length === 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Best buys here:</div>
              {buyOpportunities.map(opp => opp && (
                <div key={opp.good.id} className="flex items-center justify-between text-xs py-0.5">
                  <span>
                    {opp.good.emoji} {opp.good.name} ({opp.buyPrice}g) → {opp.bestTown.emoji} {opp.bestTown.name}
                  </span>
                  <span className="font-mono font-bold text-green-400">+{opp.profitPerUnit}g/unit</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* goods table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm border-collapse min-w-[340px]">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-700">
              <th className="text-left py-1.5 px-1">Good</th>
              <th className="text-right py-1.5 px-1">Buy</th>
              <th className="text-right py-1.5 px-1">Sell</th>
              <th className="text-right py-1.5 px-1">You</th>
              <th className="py-1.5 px-1 w-16" />
              <th className="py-1.5 px-1 w-8" />
              <th className="py-1.5 px-1 w-8" />
            </tr>
          </thead>
          <tbody>
            {ALL_GOODS.map(good => {
              const buyPrice = market.buyPrice[good.id];
              const sellPrice = market.sellPrice[good.id];
              const held = state.inventory[good.id] || 0;
              const qty = getQty(good.id);
              const isProduced = town.produces.includes(good.id);
              const isDemanded = town.demands.includes(good.id);
              const badge = priceBadge(buyPrice, GOODS[good.id].basePrice);
              const canBuy = state.gold >= buyPrice * qty && cargoFree >= qty && qty > 0;
              const canSell = held >= qty && qty > 0;
              const maxBuy = maxBuyQty(good.id);

              return (
                <tr key={good.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-1.5 px-1">
                    <span className="mr-1">{good.emoji}</span>
                    <span className={isProduced ? 'text-green-400' : isDemanded ? 'text-red-400' : 'text-slate-300'}>
                      {good.name}
                    </span>
                  </td>
                  <td className="text-right px-1">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-amber-300 font-mono text-xs">{buyPrice}g</span>
                      <span className={`text-[9px] font-bold px-1 rounded ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </td>
                  <td className="text-right px-1 text-slate-400 font-mono text-xs">{sellPrice}g</td>
                  <td className="text-right px-1 font-mono text-xs">{held > 0 ? <span className="text-white">{held}</span> : <span className="text-slate-600">—</span>}</td>
                  <td className="px-1">
                    <div className="flex items-center gap-0.5 justify-end">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(held, maxBuy)}
                        value={qty}
                        onChange={e => setQty(good.id, e.target.value)}
                        className="w-10 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-right text-white text-xs"
                      />
                      {maxBuy > 0 && (
                        <button
                          onClick={() => setQuantities(q => ({ ...q, [good.id]: maxBuy }))}
                          className="text-[9px] text-slate-500 hover:text-slate-300 px-0.5"
                          title="Set to max"
                        >
                          max
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-0.5">
                    <button
                      onClick={() => handleBuy(good.id)}
                      disabled={!canBuy}
                      className="text-xs px-1.5 py-1 rounded bg-green-800 hover:bg-green-700 disabled:opacity-25 disabled:cursor-not-allowed text-white font-medium"
                    >
                      Buy
                    </button>
                  </td>
                  <td className="px-0.5">
                    <button
                      onClick={() => handleSell(good.id)}
                      disabled={!canSell}
                      className="text-xs px-1.5 py-1 rounded bg-red-900 hover:bg-red-800 disabled:opacity-25 disabled:cursor-not-allowed text-white font-medium"
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

      <div className="text-[10px] text-slate-600 flex gap-3">
        <span><span className="text-green-400">Green</span> = cheap here (buy)</span>
        <span><span className="text-red-400">Red</span> = needed here (sell)</span>
        <span>Buy price × your qty vs. your gold</span>
      </div>
    </div>
  );
}
