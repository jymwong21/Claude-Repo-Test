import { GOODS, ALL_GOODS } from './goods';
import type { GoodId } from './goods';
import { TOWNS } from './towns';
import type { Town } from './towns';
import { rollTravelEvent } from './events';
import type { TravelEvent } from './events';

export interface TownMarket {
  townId: string;
  buyPrice: Record<GoodId, number>;
  sellPrice: Record<GoodId, number>;
  supplyModifier: Record<GoodId, number>;
}

export interface PlayerInventory {
  [goodId: string]: number;
}

export interface Upgrades {
  cargoLevel: number;  // 0-3 → 20, 35, 60, 100 units
  speedLevel: number;  // 0-1 → normal, fast (30% faster)
}

export const CARGO_LEVELS = [20, 35, 60, 100];
export const CARGO_UPGRADE_COSTS = [300, 800, 2000];
export const CARGO_UPGRADE_LABELS = ['Larger Cart', 'Merchant Wagon', 'Trade Caravan'];

export const SPEED_UPGRADE_COST = 600;
export const SPEED_UPGRADE_LABEL = 'Swift Horses';

export const WIN_MILESTONES = [2000, 6000, 15000, 40000];

export interface GameState {
  day: number;
  gold: number;
  currentTownId: string;
  inventory: PlayerInventory;
  cargoCapacity: number;
  markets: Record<string, TownMarket>;
  log: string[];
  winTarget: number;
  milestoneReached: number;  // index of last hit milestone
  upgrades: Upgrades;
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
    const noise = 0.9 + seededRandom(seed + i * 37) * 0.2;
    supplyModifier[good.id] = noise;
    const base = computeBasePrice(town, good.id, noise);
    buyPrice[good.id] = base;
    sellPrice[good.id] = Math.max(1, Math.round(base * 0.88));
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
    winTarget: WIN_MILESTONES[0],
    milestoneReached: -1,
    upgrades: { cargoLevel: 0, speedLevel: 0 },
  };
}

export function getCargoUsed(inventory: PlayerInventory): number {
  return Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
}

export function travelDays(from: Town, to: Town, speedLevel = 0): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const raw = Math.max(1, Math.round(dist / 15));
  return speedLevel > 0 ? Math.max(1, Math.round(raw * 0.7)) : raw;
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

export interface TravelResult {
  state: GameState;
  event: TravelEvent | null;
}

export function travel(state: GameState, destinationId: string): TravelResult {
  if (state.currentTownId === destinationId) return { state, event: null };

  const fromTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const toTown = TOWNS.find(t => t.id === destinationId)!;
  const days = travelDays(fromTown, toTown, state.upgrades.speedLevel);

  let newState = driftMarkets(state, days);
  const newDay = newState.day + days;
  newState = {
    ...newState,
    day: newDay,
    currentTownId: destinationId,
    log: [
      `Day ${newDay}: Arrived at ${toTown.name} after ${days} day${days > 1 ? 's' : ''} of travel.`,
      ...newState.log.slice(0, 19),
    ],
  };

  const travelSeed = state.day * 997 + destinationId.length * 31 + state.gold * 0.01;
  const event = rollTravelEvent(newState, travelSeed);
  const stateWithEvent = event ? event.apply(newState) : newState;

  return { state: stateWithEvent, event };
}

export function buyGood(state: GameState, goodId: GoodId, qty: number): GameState {
  const market = state.markets[state.currentTownId];
  const price = market.buyPrice[goodId] * qty;
  const cargoUsed = getCargoUsed(state.inventory);

  if (qty <= 0 || price > state.gold || cargoUsed + qty > state.cargoCapacity) return state;

  const newInventory = { ...state.inventory, [goodId]: (state.inventory[goodId] || 0) + qty };

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
      `Bought ${qty}× ${good.name} for ${price}g (${market.buyPrice[goodId]}g each).`,
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

  // check if a new milestone was just crossed
  let { milestoneReached, winTarget } = state;
  const nextMilestoneIdx = milestoneReached + 1;
  if (nextMilestoneIdx < WIN_MILESTONES.length && newGold >= WIN_MILESTONES[nextMilestoneIdx]) {
    milestoneReached = nextMilestoneIdx;
    winTarget = WIN_MILESTONES[nextMilestoneIdx];
  }

  return {
    ...state,
    gold: newGold,
    inventory: newInventory,
    markets: { ...state.markets, [state.currentTownId]: newMarket },
    milestoneReached,
    winTarget,
    log: [
      `Sold ${qty}× ${good.name} for ${earned}g (${market.sellPrice[goodId]}g each).`,
      ...state.log.slice(0, 19),
    ],
  };
}

export function buyCargoUpgrade(state: GameState): GameState {
  const { cargoLevel } = state.upgrades;
  if (cargoLevel >= CARGO_UPGRADE_COSTS.length) return state;
  const cost = CARGO_UPGRADE_COSTS[cargoLevel];
  if (state.gold < cost) return state;
  const newLevel = cargoLevel + 1;
  const newCapacity = CARGO_LEVELS[newLevel];
  return {
    ...state,
    gold: state.gold - cost,
    cargoCapacity: newCapacity,
    upgrades: { ...state.upgrades, cargoLevel: newLevel },
    log: [`Upgraded cargo hold to ${newCapacity} units for ${cost}g.`, ...state.log.slice(0, 19)],
  };
}

export function buySpeedUpgrade(state: GameState): GameState {
  if (state.upgrades.speedLevel >= 1) return state;
  if (state.gold < SPEED_UPGRADE_COST) return state;
  return {
    ...state,
    gold: state.gold - SPEED_UPGRADE_COST,
    upgrades: { ...state.upgrades, speedLevel: 1 },
    log: [`Purchased swift horses for ${SPEED_UPGRADE_COST}g. Travel 30% faster!`, ...state.log.slice(0, 19)],
  };
}

export function bestSellTown(state: GameState, goodId: GoodId): { townId: string; sellPrice: number } {
  let best = { townId: '', sellPrice: 0 };
  TOWNS.forEach(town => {
    if (town.id === state.currentTownId) return;
    const price = state.markets[town.id].sellPrice[goodId];
    if (price > best.sellPrice) best = { townId: town.id, sellPrice: price };
  });
  return best;
}

export function saveGame(state: GameState) {
  localStorage.setItem('merchant_empire_save', JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem('merchant_empire_save');
  if (!raw) return null;
  try { return JSON.parse(raw) as GameState; } catch { return null; }
}
