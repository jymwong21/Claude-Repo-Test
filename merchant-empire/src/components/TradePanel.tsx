import { useState } from 'react';
import type { GameState } from '../lib/gameState';
import { buyGood, sellGood, sellAllGood, getCargoUsed, bestSellTown, getEventMultiplier } from '../lib/gameState';
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

  function handleSellAll(goodId: GoodId) {
    const next = sellAllGood(state, goodId);
    if (next !== state) onChange(next);
  }

  // goods being carried, with best sell destination
  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] || 0) > 0);
  const cargoRoutes = heldGoods.map(good => {
    const held = state.inventory[good.id];
    const costPaid = state.costBasis[good.id] ?? 0;
    const best = bestSellTown(state, good.id);
    const bestTown = TOWNS.find(t => t.id === best.townId)!;
    const profitPerUnit = costPaid > 0 ? best.sellPrice - costPaid : null;
    return { good, held, costPaid, best, bestTown, profitPerUnit };
  }).filter(r => r.best.townId !== '');

  // top buy opportunities at this town (regardless of what you're holding)
  const buyOpportunities = ALL_GOODS
    .filter(() => cargoFree > 0)
    .map(good => {
      const buyPrice = market.buyPrice[good.id];
      const best = bestSellTown(state, good.id);
      if (!best.townId) return null;
      const bestTown = TOWNS.find(t => t.id === best.townId)!;
      const profitPerUnit = best.sellPrice - buyPrice;
      if (profitPerUnit <= 0) return null;
      return { good, buyPrice, bestTown, profitPerUnit };
    })
    .filter(Boolean)
    .sort((a, b) => b!.profitPerUnit - a!.profitPerUnit)
    .slice(0, 3);

  const showIntel = cargoRoutes.length > 0 || buyOpportunities.length > 0;

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
      {showIntel && (
        <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 flex flex-col gap-2">
          <div className="text-xs font-semibold text-amber-400">💡 Trade Routes</div>

          {cargoRoutes.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Sell your cargo at</div>
              {cargoRoutes.map(({ good, held, costPaid, bestTown, best, profitPerUnit }) => (
                <div key={good.id} className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-slate-300">
                    {good.emoji} {good.name} ×{held}
                    {costPaid > 0 && <span className="text-slate-600 ml-1">(paid {costPaid}g)</span>}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400">{bestTown.emoji} {bestTown.name} · {best.sellPrice}g/unit</span>
                    {profitPerUnit !== null && (
                      <span className={`font-mono font-bold text-xs ${profitPerUnit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profitPerUnit >= 0 ? '+' : ''}{profitPerUnit * held}g
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {buyOpportunities.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Best buys here</div>
              {buyOpportunities.map(opp => opp && (
                <div key={opp.good.id} className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-slate-300">
                    {opp.good.emoji} {opp.good.name} at {opp.buyPrice}g
                  </span>
                  <span className="text-slate-400 shrink-0">
                    → {opp.bestTown.emoji} {opp.bestTown.name}
                    <span className="text-green-400 font-mono font-bold ml-1.5">+{opp.profitPerUnit}g/unit</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* goods table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm border-collapse" style={{ minWidth: 320 }}>
          <thead>
            <tr className="text-[10px] text-slate-500 border-b border-slate-700 uppercase tracking-wide">
              <th className="text-left py-1.5 px-1">Good</th>
              <th className="text-right py-1.5 px-1">You pay</th>
              <th className="text-right py-1.5 px-1">Town pays</th>
              <th className="text-right py-1.5 px-1">Held</th>
              <th className="py-1.5 px-1" colSpan={2} />
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
              const activeEvent = state.priceEvents.find(
                e => e.townId === state.currentTownId && e.goodId === good.id && e.expiresDay > state.day
              );
              const maxBuy = maxBuyQty(good.id);
              const canBuy = state.gold >= buyPrice * qty && cargoFree >= qty && qty > 0;
              const canSell = held >= qty && qty > 0;

              return (
                <tr key={good.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 px-1">
                    <span className="mr-1">{good.emoji}</span>
                    <span className={
                      isProduced ? 'text-green-400' :
                      isDemanded ? 'text-red-400' :
                      'text-slate-300'
                    }>
                      {good.name}
                    </span>
                  </td>

                  {/* You pay (buy price) */}
                  <td className="text-right px-1">
                    <div className="inline-flex flex-col items-end gap-0.5">
                      <span className="text-amber-300 font-mono text-xs">
                        {Math.round(buyPrice * getEventMultiplier(state.priceEvents, state.currentTownId, good.id, state.day))}g
                      </span>
                      {activeEvent ? (
                        <span className={`text-[9px] font-bold px-1 rounded leading-tight ${
                          activeEvent.label === 'SHORTAGE'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          ⚡{activeEvent.label}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1 rounded leading-tight ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Town pays (sell price) */}
                  <td className="text-right px-1">
                    {(() => {
                      const effectiveSell = Math.round(sellPrice * getEventMultiplier(state.priceEvents, state.currentTownId, good.id, state.day));
                      return (
                        <>
                          <span className="text-slate-400 font-mono text-xs">{effectiveSell}g</span>
                          {held > 0 && state.costBasis[good.id] !== undefined && (
                            <div className={`text-[9px] font-bold text-right ${
                              effectiveSell >= (state.costBasis[good.id] ?? 0) ? 'text-green-600' : 'text-red-700'
                            }`}>
                              {effectiveSell >= (state.costBasis[good.id] ?? 0) ? '+' : ''}
                              {effectiveSell - (state.costBasis[good.id] ?? 0)}g
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </td>

                  {/* Held */}
                  <td className="text-right px-1 font-mono text-xs">
                    {held > 0 ? (
                      <span className="text-white">{held}</span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>

                  {/* controls */}
                  <td className="px-1">
                    <div className="flex items-center gap-0.5 justify-end">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(held, maxBuy, 1)}
                        value={qty}
                        onChange={e => setQty(good.id, e.target.value)}
                        className="w-10 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right text-white text-xs"
                      />
                      {maxBuy > 1 && (
                        <button
                          onClick={() => setQuantities(q => ({ ...q, [good.id]: maxBuy }))}
                          className="text-[9px] text-slate-600 hover:text-slate-300 leading-none px-0.5"
                          title="Set to max you can afford"
                        >
                          max
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-0.5">
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => handleBuy(good.id)}
                        disabled={!canBuy}
                        className="text-xs px-1.5 py-1 rounded bg-green-800 hover:bg-green-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-medium"
                      >
                        Buy
                      </button>
                      {held > 0 ? (
                        <button
                          onClick={() => handleSellAll(good.id)}
                          title={`Sell all ${held} units`}
                          className="text-xs px-1.5 py-1 rounded bg-red-900 hover:bg-red-800 text-white font-medium"
                        >
                          Sell All
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSell(good.id)}
                          disabled={!canSell}
                          className="text-xs px-1.5 py-1 rounded bg-red-900 hover:bg-red-800 disabled:opacity-20 disabled:cursor-not-allowed text-white font-medium"
                        >
                          Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
        <span><span className="text-green-400">Green</span> = produced here (buy cheap)</span>
        <span><span className="text-red-400">Red</span> = demanded here (sell for more)</span>
        <span>Town pays = what you receive when selling</span>
      </div>
    </div>
  );
}
