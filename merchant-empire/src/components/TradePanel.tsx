import { useState } from 'react';
import type { GameState } from '../lib/gameState';
import { buyGood, sellGood, sellAllGood, getCargoUsed, bestSellTown, getEventMultiplier, getDemandRemaining } from '../lib/gameState';
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
  const [showAll, setShowAll] = useState(false);
  const market = state.markets[state.currentTownId];
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const cargoUsed = getCargoUsed(state.inventory);
  const cargoFree = state.cargoCapacity - cargoUsed;

  const visibleGoods = showAll
    ? ALL_GOODS
    : ALL_GOODS.filter(g =>
        town.produces.includes(g.id) ||
        town.demands.includes(g.id) ||
        (state.inventory[g.id] || 0) > 0
      );
  const hiddenCount = ALL_GOODS.length - visibleGoods.length;

  function getQty(goodId: GoodId) { return quantities[goodId] ?? 1; }

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
    const sellDemand = best.townId
      ? getDemandRemaining(state.demandUsed, best.townId, good.id, GOODS[good.id].basePrice, state.demandCapMult)
      : null;
    return { good, held, costPaid, best, bestTown, profitPerUnit, sellDemand };
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
              {cargoRoutes.map(({ good, held, costPaid, bestTown, best, profitPerUnit, sellDemand }) => {
                const demandColor = sellDemand
                  ? sellDemand.remaining === 0 ? 'text-red-500'
                    : sellDemand.remaining < held ? 'text-amber-400'
                    : 'text-green-600'
                  : 'text-slate-600';
                return (
                  <div key={good.id} className="flex items-center justify-between text-xs py-0.5 gap-2">
                    <span className="text-slate-300">
                      {good.emoji} {good.name} ×{held}
                      {costPaid > 0 && <span className="text-slate-600 ml-1">(paid {costPaid}g)</span>}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-slate-400">{bestTown.emoji} {bestTown.name} · {best.sellPrice}g</span>
                      {sellDemand && (
                        <span className={`text-[10px] font-mono ${demandColor}`}>
                          {sellDemand.remaining}/{sellDemand.cap}
                        </span>
                      )}
                      {profitPerUnit !== null && (
                        <span className={`font-mono font-bold text-xs ${profitPerUnit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profitPerUnit >= 0 ? '+' : ''}{profitPerUnit * held}g
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* goods cards */}
      <div className="flex flex-col gap-2">
        {visibleGoods.map(good => {
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
          const demand = getDemandRemaining(state.demandUsed, state.currentTownId, good.id, GOODS[good.id].basePrice, state.demandCapMult);
          const demandPct = demand.cap > 0 ? demand.used / demand.cap : 0;
          const demandDotColor = demandPct >= 1 ? 'text-red-500' : demandPct >= 0.5 ? 'text-amber-400' : 'text-green-600';
          const maxBuy = maxBuyQty(good.id);
          const effectiveBuy = Math.round(buyPrice * getEventMultiplier(state.priceEvents, state.currentTownId, good.id, state.day));
          const effectiveSell = Math.round(sellPrice * getEventMultiplier(state.priceEvents, state.currentTownId, good.id, state.day));
          const costBasis = state.costBasis[good.id];
          const canBuy = state.gold >= effectiveBuy * qty && cargoFree >= qty && qty > 0;
          const canSell = held >= qty && qty > 0;
          const maxStep = Math.max(held, maxBuy, 1);

          return (
            <div key={good.id} className="bg-slate-800 rounded-xl p-3">
              {/* header row: name + badge + demand dot */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{good.emoji}</span>
                  <span className={`text-sm font-medium truncate ${
                    isProduced ? 'text-green-400' :
                    isDemanded ? 'text-red-400' :
                    'text-slate-200'
                  }`}>
                    {good.name}
                  </span>
                  {activeEvent ? (
                    <span className={`text-[9px] font-bold px-1 rounded leading-tight shrink-0 ${
                      activeEvent.label === 'SHORTAGE'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      ⚡{activeEvent.label}
                    </span>
                  ) : (
                    <span className={`text-[9px] font-bold px-1 rounded leading-tight shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <span className={`text-lg leading-none shrink-0 ml-2 ${demandDotColor}`} title={`${demand.used}/${demand.cap} sold this week`}>●</span>
              </div>

              {/* price row */}
              <div className="flex items-baseline justify-between text-xs mb-3">
                <span className="text-slate-400">
                  Buy: <span className="text-amber-300 font-mono font-bold text-sm">{effectiveBuy}g</span>
                </span>
                <span className="text-right">
                  <span className={`font-mono font-bold text-sm ${demand.used >= demand.cap ? 'text-red-400' : 'text-slate-300'}`}>
                    Sell: {effectiveSell}g
                  </span>
                  {held > 0 && costBasis !== undefined && (
                    <span className={`ml-1.5 font-mono font-bold text-xs ${effectiveSell >= costBasis ? 'text-green-400' : 'text-red-400'}`}>
                      {effectiveSell >= costBasis ? '+' : ''}{effectiveSell - costBasis}g
                    </span>
                  )}
                </span>
              </div>

              {/* controls row */}
              <div className="flex items-center gap-2">
                {/* stepper */}
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantities(q => ({ ...q, [good.id]: Math.max(1, (q[good.id] ?? 1) - 1) }))}
                    disabled={qty <= 1}
                    className="w-8 h-8 rounded-l-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold text-base flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-10 h-8 bg-slate-700 border-x border-slate-600 flex items-center justify-center font-mono text-sm text-white">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQuantities(q => ({ ...q, [good.id]: Math.min(maxStep, (q[good.id] ?? 1) + 1) }))}
                    disabled={qty >= maxStep}
                    className="w-8 h-8 rounded-r-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                {maxBuy > 1 && (
                  <button
                    onClick={() => setQuantities(q => ({ ...q, [good.id]: maxBuy }))}
                    className="text-[10px] text-slate-600 hover:text-slate-300 leading-none"
                  >
                    max
                  </button>
                )}

                {/* buy/sell buttons */}
                <div className="flex gap-1.5 ml-auto">
                  <button
                    onClick={() => handleBuy(good.id)}
                    disabled={!canBuy}
                    className="h-10 px-4 rounded-xl bg-green-800 hover:bg-green-700 active:bg-green-600 disabled:opacity-20 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                  >
                    Buy
                  </button>
                  {held > 0 ? (
                    <button
                      onClick={() => handleSellAll(good.id)}
                      title={`Sell all ${held} units`}
                      className="h-10 px-3 rounded-xl bg-red-900 hover:bg-red-800 active:bg-red-700 text-white text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      Sell All
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSell(good.id)}
                      disabled={!canSell}
                      className="h-10 px-4 rounded-xl bg-red-900 hover:bg-red-800 active:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                    >
                      Sell
                    </button>
                  )}
                </div>
              </div>

              {held > 0 && (
                <div className="mt-2 text-[10px] text-slate-500">Holding {held} unit{held !== 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* show all / show less toggle */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-slate-600 hover:text-slate-400 text-center w-full py-1.5 border border-slate-800 rounded-lg transition-colors"
        >
          Show {hiddenCount} more good{hiddenCount !== 1 ? 's' : ''} ↓
        </button>
      )}
      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-slate-600 hover:text-slate-400 text-center w-full py-1.5 border border-slate-800 rounded-lg transition-colors"
        >
          Show less ↑
        </button>
      )}

      <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
        <span><span className="text-green-400">Green</span> = produced here (buy cheap)</span>
        <span><span className="text-red-400">Red</span> = demanded here (sell for more)</span>
        <span>● = weekly demand (green/amber/red)</span>
      </div>
    </div>
  );
}
