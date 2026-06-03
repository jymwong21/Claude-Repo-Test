import { GOODS, ALL_GOODS } from './goods';
import type { GoodId } from './goods';
import { TOWNS } from './towns';
import type { Town } from './towns';

export interface TownMarket {
  townId: string;
  // current buy price (what the town charges you)
  buyPrice: Record<GoodId, number>;
  // current sell price (what the town pays you, slightly less than buy)
  sellPrice: Record<GoodId, number>;
  // local supply modifier, drifts over time
  supplyModifier: Record<GoodId, number>;
}

export interface PlayerInventory {
  [goodId: string]: number;
}

export interface GameState {
  day: number;
  gold: number;
  currentTownId: string;
  inventory: PlayerInventory;
  cargoCapacity: number;
  markets: Record<string, TownMarket>;
  // log of last N events
  log: string[];
  winTarget: number;
  won: boolean;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function computeBasePrice(town: Town, goodId: GoodId, supplyModifier: number): number {
  const good = GOODS[goodId];
  const townMod = town.priceModifiers[goodId] ?? 1.0;
  return Math.round(good.basePrice * townMod * supplyModifier);
}

function buildMarket(town: Town, seed: number): TownMarket {
  const buyPrice: Partial<Record<GoodId, number>> = {};
  const sellPrice: Partial<Record<GoodId, number>> = {};
  const supplyModifier: Partial<Record<GoodId, number>> = {};

  ALL_GOODS.forEach((good, i) => {
    const noise = 0.9 + seededRandom(seed + i * 37) * 0.2; // 0.9-1.1
    supplyModifier[good.id] = noise;
    const base = computeBasePrice(town, good.id, noise);
    buyPrice[good.id] = base;
    sellPrice[good.id] = Math.max(1, Math.round(base * 0.88)); // town buys at 88% of its ask
  });

  return {
    townId: town.id,
    buyPrice: buyPrice as Record<GoodId, number>,
    sellPrice: sellPrice as Record<GoodId, number>,
    supplyModifier: supplyModifier as Record<GoodId, number>,
  };
}

export function initGame(): GameState {
  const markets: Record<string, TownMarket> = {};
  TOWNS.forEach((town, i) => {
    markets[town.id] = buildMarket(town, i * 100);
  });

  const inventory: PlayerInventory = {};
  ALL_GOODS.forEach(g => { inventory[g.id] = 0; });

  return {
    day: 1,
    gold: 200,
    currentTownId: 'farmstead',
    inventory,
    cargoCapacity: 20,
    markets,
    log: ['You begin your merchant journey at Farmstead with 200 gold.'],
    winTarget: 2000,
    won: false,
  };
}

export function getCargoUsed(inventory: PlayerInventory): number {
  return Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
}

export function travelDays(from: Town, to: Town): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(1, Math.round(dist / 15));
}

function driftMarkets(state: GameState, days: number): GameState {
  const markets = { ...state.markets };

  TOWNS.forEach((town, ti) => {
    const market = { ...markets[town.id] };
    const newSupply = { ...market.supplyModifier };
    const newBuy = { ...market.buyPrice };
    const newSell = { ...market.sellPrice };

    ALL_GOODS.forEach((good, gi) => {
      const seed = state.day * 1000 + ti * 100 + gi + days;
      const drift = (seededRandom(seed) - 0.5) * 0.06 * days;
      newSupply[good.id] = clamp(newSupply[good.id] + drift, 0.7, 1.5);
      const base = computeBasePrice(town, good.id, newSupply[good.id]);
      newBuy[good.id] = Math.max(1, base);
      newSell[good.id] = Math.max(1, Math.round(base * 0.88));
    });

    markets[town.id] = { ...market, supplyModifier: newSupply, buyPrice: newBuy, sellPrice: newSell };
  });

  return { ...state, markets };
}

export function travel(state: GameState, destinationId: string): GameState {
  if (state.currentTownId === destinationId) return state;

  const fromTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const toTown = TOWNS.find(t => t.id === destinationId)!;
  const days = travelDays(fromTown, toTown);

  let newState = driftMarkets(state, days);
  newState = {
    ...newState,
    day: newState.day + days,
    currentTownId: destinationId,
    log: [
      `Day ${newState.day + days}: Arrived at ${toTown.name} after ${days} day${days > 1 ? 's' : ''} of travel.`,
      ...newState.log.slice(0, 19),
    ],
  };

  return newState;
}

export function buyGood(state: GameState, goodId: GoodId, qty: number): GameState {
  const market = state.markets[state.currentTownId];
  const price = market.buyPrice[goodId] * qty;
  const cargoUsed = getCargoUsed(state.inventory);

  if (qty <= 0) return state;
  if (price > state.gold) return state;
  if (cargoUsed + qty > state.cargoCapacity) return state;

  const newInventory = { ...state.inventory, [goodId]: (state.inventory[goodId] || 0) + qty };

  // buying drives price up slightly
  const newMarket = { ...market };
  const newSupply = { ...market.supplyModifier };
  newSupply[goodId] = clamp(newSupply[goodId] + qty * 0.015, 0.7, 1.5);
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const newBuy = { ...market.buyPrice };
  const newSell = { ...market.sellPrice };
  const newBase = computeBasePrice(town, goodId, newSupply[goodId]);
  newBuy[goodId] = Math.max(1, newBase);
  newSell[goodId] = Math.max(1, Math.round(newBase * 0.88));
  newMarket.supplyModifier = newSupply;
  newMarket.buyPrice = newBuy;
  newMarket.sellPrice = newSell;

  const good = GOODS[goodId];
  return {
    ...state,
    gold: state.gold - price,
    inventory: newInventory,
    markets: { ...state.markets, [state.currentTownId]: newMarket },
    log: [
      `Bought ${qty}x ${good.name} for ${price}g (${market.buyPrice[goodId]}g each).`,
      ...state.log.slice(0, 19),
    ],
  };
}

export function sellGood(state: GameState, goodId: GoodId, qty: number): GameState {
  const market = state.markets[state.currentTownId];
  const available = state.inventory[goodId] || 0;

  if (qty <= 0 || qty > available) return state;

  const earned = market.sellPrice[goodId] * qty;
  const newInventory = { ...state.inventory, [goodId]: available - qty };

  // selling drives price down slightly
  const newMarket = { ...market };
  const newSupply = { ...market.supplyModifier };
  newSupply[goodId] = clamp(newSupply[goodId] - qty * 0.015, 0.7, 1.5);
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const newBuy = { ...market.buyPrice };
  const newSell = { ...market.sellPrice };
  const newBase = computeBasePrice(town, goodId, newSupply[goodId]);
  newBuy[goodId] = Math.max(1, newBase);
  newSell[goodId] = Math.max(1, Math.round(newBase * 0.88));
  newMarket.supplyModifier = newSupply;
  newMarket.buyPrice = newBuy;
  newMarket.sellPrice = newSell;

  const good = GOODS[goodId];
  const newGold = state.gold + earned;
  const won = newGold >= state.winTarget;

  return {
    ...state,
    gold: newGold,
    inventory: newInventory,
    markets: { ...state.markets, [state.currentTownId]: newMarket },
    won,
    log: [
      `Sold ${qty}x ${good.name} for ${earned}g (${market.sellPrice[goodId]}g each).${won ? ' 🏆 You reached your wealth goal!' : ''}`,
      ...state.log.slice(0, 19),
    ],
  };
}

export function saveGame(state: GameState) {
  localStorage.setItem('merchant_empire_save', JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem('merchant_empire_save');
  if (!raw) return null;
  try { return JSON.parse(raw) as GameState; } catch { return null; }
}
