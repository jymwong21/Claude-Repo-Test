import { GOODS, ALL_GOODS } from './goods';
import type { GoodId } from './goods';
import { TOWNS } from './towns';
import type { Town } from './towns';
import { rollTravelEvent } from './events';
import type { TravelEvent } from './events';
import {
  CONTRACTS, OVERDUE_RATE, BANKRUPTCY_DAYS,
  getDemandCap, DEMAND_CAP_WINDOW, DEMAND_SATURATED_PRICE_MULT,
} from './contracts';
import { initRival, advanceRival } from './rival';
import type { RivalState } from './rival';

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
  cargoLevel: number;
  speedLevel: number;
}

export interface PriceEvent {
  id: string;
  townId: string;
  goodId: string;
  multiplier: number;
  label: 'SHORTAGE' | 'SURPLUS';
  expiresDay: number;
}

export const CARGO_LEVELS = [20, 35, 60, 100];
export const CARGO_UPGRADE_COSTS = [300, 800, 2000];
export const CARGO_UPGRADE_LABELS = ['Larger Cart', 'Merchant Wagon', 'Trade Caravan'];

export const SPEED_UPGRADE_COST = 600;
export const SPEED_UPGRADE_LABEL = 'Swift Horses';

export interface RivalNotification {
  contractIndex: number;
  playerPenalty: boolean;  // true = rival ahead, player loses days
  daysDelta: number;       // -3 (penalty) or +2 (bonus from payContract)
}

export interface GameState {
  day: number;
  gold: number;
  currentTownId: string;
  inventory: PlayerInventory;
  costBasis: Partial<Record<string, number>>;
  cargoCapacity: number;
  markets: Record<string, TownMarket>;
  log: string[];
  upgrades: Upgrades;
  // contract system
  contractIndex: number;
  contractDebt: number;
  contractBaseRepay: number;
  contractDueDay: number;
  priceEvents: PriceEvent[];
  gamePhase: 'playing' | 'won' | 'lost';
  lostReason?: string;
  // rival + demand tracking
  rival: RivalState;
  demandUsed: Record<string, Record<string, number>>;  // townId → goodId → units sold this window
  demandWindowStart: number;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function computeBasePrice(town: Town, goodId: GoodId, supplyModifier: number): number {
  const good = GOODS[goodId];
  const townMod = town.priceModifiers[goodId] ?? 1.0;
  return Math.round(good.basePrice * townMod * supplyModifier);
}

export function getEventMultiplier(
  priceEvents: PriceEvent[],
  townId: string,
  goodId: string,
  day: number,
): number {
  const ev = priceEvents.find(e => e.townId === townId && e.goodId === goodId && e.expiresDay > day);
  return ev ? ev.multiplier : 1;
}

export function getDemandRemaining(
  demandUsed: Record<string, Record<string, number>>,
  townId: string,
  goodId: string,
  basePrice: number,
): { used: number; cap: number; remaining: number } {
  const used = demandUsed[townId]?.[goodId] ?? 0;
  const cap = getDemandCap(basePrice);
  return { used, cap, remaining: Math.max(0, cap - used) };
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

function updatePriceEvents(priceEvents: PriceEvent[], oldDay: number, newDay: number): PriceEvent[] {
  const active = priceEvents.filter(e => e.expiresDay > newDay);

  const oldPeriod = Math.floor((oldDay - 1) / 7);
  const newPeriod = Math.floor((newDay - 1) / 7);
  if (newPeriod <= oldPeriod) return active;

  const seed = newPeriod * 9973;
  if (seededRandom(seed) > 0.38) return active;

  const townIdx = Math.floor(seededRandom(seed * 7) * TOWNS.length);
  const goodIdx = Math.floor(seededRandom(seed * 13) * ALL_GOODS.length);
  const isShortage = seededRandom(seed * 19) > 0.45;
  const duration = 3 + Math.floor(seededRandom(seed * 23) * 3);
  const multiplier = isShortage
    ? 1.5 + seededRandom(seed * 29) * 0.6
    : 0.35 + seededRandom(seed * 31) * 0.3;

  return [...active, {
    id: `pe-${newPeriod}`,
    townId: TOWNS[townIdx].id,
    goodId: ALL_GOODS[goodIdx].id,
    multiplier,
    label: isShortage ? 'SHORTAGE' : 'SURPLUS',
    expiresDay: newDay + duration,
  }];
}

export function initGame(): GameState {
  const markets: Record<string, TownMarket> = {};
  TOWNS.forEach((town, i) => { markets[town.id] = buildMarket(town, i * 100); });

  const inventory: PlayerInventory = {};
  ALL_GOODS.forEach(g => { inventory[g.id] = 0; });

  const first = CONTRACTS[0];
  const dueDay = 1 + first.days;

  return {
    day: 1,
    gold: 200 + first.loan,
    currentTownId: 'farmstead',
    inventory,
    costBasis: {},
    cargoCapacity: 20,
    markets,
    log: [
      `You borrowed ${first.loan}g from the Merchant's Guild. Repay ${first.repay}g by Day ${dueDay}.`,
      'Your journey begins at Farmstead with 700 gold.',
    ],
    upgrades: { cargoLevel: 0, speedLevel: 0 },
    contractIndex: 0,
    contractDebt: first.repay,
    contractBaseRepay: first.repay,
    contractDueDay: dueDay,
    priceEvents: [],
    gamePhase: 'playing',
    rival: initRival(),
    demandUsed: {},
    demandWindowStart: 1,
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

function applyOverdue(state: GameState, newDay: number): GameState {
  if (state.gamePhase !== 'playing' || newDay <= state.contractDueDay) return state;

  const overdueDays = newDay - state.contractDueDay;
  const newDebt = Math.round(state.contractBaseRepay * Math.pow(1 + OVERDUE_RATE, overdueDays));

  if (overdueDays > BANKRUPTCY_DAYS) {
    const contractName = CONTRACTS[state.contractIndex]?.label ?? 'contract';
    return {
      ...state,
      contractDebt: newDebt,
      gamePhase: 'lost',
      lostReason: `Debt spiraled to ${newDebt.toLocaleString()}g on Day ${newDay}. Bankrupt.`,
      log: [
        `💸 BANKRUPT — the "${contractName}" debt grew to ${newDebt.toLocaleString()}g. Game over.`,
        ...state.log.slice(0, 19),
      ],
    };
  }

  const newState = { ...state, contractDebt: newDebt };
  if (overdueDays === 1) {
    return {
      ...newState,
      log: [
        `⚠️ Contract overdue! Interest now compounding — debt is ${newDebt.toLocaleString()}g and rising 12%/day.`,
        ...state.log.slice(0, 19),
      ],
    };
  }
  return newState;
}

export interface TravelResult {
  state: GameState;
  event: TravelEvent | null;
  rivalNotification: RivalNotification | null;
}

export function travel(state: GameState, destinationId: string): TravelResult {
  if (state.currentTownId === destinationId || state.gamePhase !== 'playing') {
    return { state, event: null, rivalNotification: null };
  }

  const fromTown = TOWNS.find(t => t.id === state.currentTownId)!;
  const toTown = TOWNS.find(t => t.id === destinationId)!;
  const days = travelDays(fromTown, toTown, state.upgrades.speedLevel);

  let newState = driftMarkets(state, days);
  const newDay = newState.day + days;

  const newPriceEvents = updatePriceEvents(newState.priceEvents, newState.day, newDay);

  // Reset demand window if 7+ days have passed
  let newDemandUsed = newState.demandUsed;
  let newDemandWindowStart = newState.demandWindowStart;
  if (newDay - newState.demandWindowStart >= DEMAND_CAP_WINDOW) {
    newDemandUsed = {};
    newDemandWindowStart = newDay;
  }

  // Advance rival — loop handles multi-threshold skips defensively
  let currentRival = newState.rival;
  let rivalNotification: RivalNotification | null = null;
  let newContractDueDay = newState.contractDueDay;

  let advResult = advanceRival(currentRival, newDay);
  while (advResult.justPaidIndex !== null) {
    currentRival = advResult.rival;
    const justPaidIdx = advResult.justPaidIndex;

    if (justPaidIdx >= newState.contractIndex) {
      // Rival at or ahead of player — penalize
      newContractDueDay = Math.max(newDay + 1, newContractDueDay - 3);
      rivalNotification = { contractIndex: justPaidIdx, playerPenalty: true, daysDelta: -3 };
    } else {
      rivalNotification = { contractIndex: justPaidIdx, playerPenalty: false, daysDelta: 0 };
    }

    advResult = advanceRival(currentRival, newDay);
  }
  currentRival = advResult.rival;

  newState = {
    ...newState,
    day: newDay,
    currentTownId: destinationId,
    priceEvents: newPriceEvents,
    rival: currentRival,
    demandUsed: newDemandUsed,
    demandWindowStart: newDemandWindowStart,
    contractDueDay: newContractDueDay,
    log: [
      `Day ${newDay}: Arrived at ${toTown.name} after ${days} day${days > 1 ? 's' : ''} of travel.`,
      ...newState.log.slice(0, 19),
    ],
  };

  newState = applyOverdue(newState, newDay);

  const travelSeed = state.day * 997 + state.currentTownId.length * 53 + destinationId.length * 31;
  const event = newState.gamePhase === 'playing' ? rollTravelEvent(newState, travelSeed) : null;
  const stateWithEvent = event ? event.apply(newState) : newState;

  return { state: stateWithEvent, event, rivalNotification };
}

export function buyGood(state: GameState, goodId: GoodId, qty: number): GameState {
  const market = state.markets[state.currentTownId];
  const eventMult = getEventMultiplier(state.priceEvents, state.currentTownId, goodId, state.day);
  const priceEach = Math.round(market.buyPrice[goodId] * eventMult);
  const totalCost = priceEach * qty;
  const cargoUsed = getCargoUsed(state.inventory);

  if (qty <= 0 || totalCost > state.gold || cargoUsed + qty > state.cargoCapacity) return state;

  const prevQty = state.inventory[goodId] || 0;
  const prevBasis = state.costBasis[goodId] ?? 0;
  const newAvgCost = prevQty === 0
    ? priceEach
    : Math.round((prevQty * prevBasis + qty * priceEach) / (prevQty + qty));

  const newMarket = { ...market };
  const newSupply = { ...market.supplyModifier };
  newSupply[goodId] = clamp(newSupply[goodId] + qty * 0.02, 0.7, 1.5);
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
    gold: state.gold - totalCost,
    inventory: { ...state.inventory, [goodId]: prevQty + qty },
    costBasis: { ...state.costBasis, [goodId]: newAvgCost },
    markets: { ...state.markets, [state.currentTownId]: newMarket },
    log: [
      `Bought ${qty}× ${good.name} for ${totalCost}g (${priceEach}g each).`,
      ...state.log.slice(0, 19),
    ],
  };
}

export function sellGood(state: GameState, goodId: GoodId, qty: number): GameState {
  const market = state.markets[state.currentTownId];
  const available = state.inventory[goodId] || 0;

  if (qty <= 0 || qty > available) return state;

  const eventMult = getEventMultiplier(state.priceEvents, state.currentTownId, goodId, state.day);
  const baseUnitPrice = Math.round(market.sellPrice[goodId] * eventMult);

  // Split sale at demand cap boundary
  const good = GOODS[goodId];
  const { used, cap, remaining } = getDemandRemaining(
    state.demandUsed, state.currentTownId, goodId, good.basePrice
  );
  const normalQty = Math.min(qty, remaining);
  const saturatedQty = qty - normalQty;
  const saturatedUnitPrice = Math.max(1, Math.round(baseUnitPrice * DEMAND_SATURATED_PRICE_MULT));
  const earned = normalQty * baseUnitPrice + saturatedQty * saturatedUnitPrice;
  const effectivePriceEach = qty > 0 ? Math.round(earned / qty) : 0;

  const newQty = available - qty;

  // Update supply modifier
  const newMarket = { ...market };
  const newSupply = { ...market.supplyModifier };
  newSupply[goodId] = clamp(newSupply[goodId] - qty * 0.02, 0.7, 1.5);
  const town = TOWNS.find(t => t.id === state.currentTownId)!;
  const newBuy = { ...market.buyPrice };
  const newSell = { ...market.sellPrice };
  const newBase = computeBasePrice(town, goodId, newSupply[goodId]);
  newBuy[goodId] = Math.max(1, newBase);
  newSell[goodId] = Math.max(1, Math.round(newBase * 0.88));
  newMarket.supplyModifier = newSupply;
  newMarket.buyPrice = newBuy;
  newMarket.sellPrice = newSell;

  // Update demand tracking
  const newTownDemand = { ...(state.demandUsed[state.currentTownId] ?? {}) };
  newTownDemand[goodId] = (newTownDemand[goodId] ?? 0) + qty;
  const newDemandUsed = { ...state.demandUsed, [state.currentTownId]: newTownDemand };

  const newCostBasis = { ...state.costBasis };
  if (newQty === 0) delete newCostBasis[goodId];

  const basisCost = state.costBasis[goodId] ?? 0;
  const profitNote = basisCost > 0
    ? ` (${effectivePriceEach >= basisCost ? '+' : ''}${(effectivePriceEach - basisCost) * qty}g profit)`
    : '';
  const satNote = saturatedQty > 0
    ? ` ⚠️ ${saturatedQty} sold at crash price — market saturated! (${used + normalQty}/${cap}/wk)`
    : '';

  return {
    ...state,
    gold: state.gold + earned,
    inventory: { ...state.inventory, [goodId]: newQty },
    costBasis: newCostBasis,
    markets: { ...state.markets, [state.currentTownId]: newMarket },
    demandUsed: newDemandUsed,
    log: [
      `Sold ${qty}× ${good.name} for ${earned}g (${effectivePriceEach}g avg)${profitNote}${satNote}.`,
      ...state.log.slice(0, 19),
    ],
  };
}

export function sellAllGood(state: GameState, goodId: GoodId): GameState {
  const qty = state.inventory[goodId] || 0;
  return qty > 0 ? sellGood(state, goodId, qty) : state;
}

export function payContract(state: GameState): GameState {
  if (state.gold < state.contractDebt || state.gamePhase !== 'playing') return state;

  const newGold = state.gold - state.contractDebt;
  const newIdx = state.contractIndex + 1;

  // Bonus days if player pays before rival has paid this contract
  const playerAhead = state.contractIndex >= state.rival.contractIndex;

  if (newIdx >= CONTRACTS.length) {
    return {
      ...state,
      gold: newGold,
      contractIndex: newIdx,
      contractDebt: 0,
      contractBaseRepay: 0,
      gamePhase: 'won',
      log: [
        `🏆 All contracts repaid on Day ${state.day}! The empire is yours!`,
        ...state.log.slice(0, 19),
      ],
    };
  }

  const next = CONTRACTS[newIdx];
  const bonusDays = playerAhead ? 2 : 0;
  const dueDay = state.day + next.days + bonusDays;

  return {
    ...state,
    gold: newGold + next.loan,
    contractIndex: newIdx,
    contractDebt: next.repay,
    contractBaseRepay: next.repay,
    contractDueDay: dueDay,
    log: [
      `Contract paid!${bonusDays > 0 ? ' Beat the rival — +2 days bonus!' : ''} Borrowed ${next.loan.toLocaleString()}g — repay ${next.repay.toLocaleString()}g by Day ${dueDay}.`,
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
  if (state.upgrades.speedLevel >= 1 || state.gold < SPEED_UPGRADE_COST) return state;
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
    const mult = getEventMultiplier(state.priceEvents, town.id, goodId, state.day);
    const price = Math.round(state.markets[town.id].sellPrice[goodId] * mult);
    if (price > best.sellPrice) best = { townId: town.id, sellPrice: price };
  });
  return best;
}

export function migrateState(raw: GameState): GameState {
  const state = { ...raw };
  if (!state.upgrades) state.upgrades = { cargoLevel: 0, speedLevel: 0 };
  if (!state.costBasis) state.costBasis = {};
  if (!state.priceEvents) state.priceEvents = [];
  if (!state.gamePhase) state.gamePhase = 'playing';
  if (!state.rival) state.rival = initRival();
  if (!state.demandUsed) state.demandUsed = {};
  if (state.demandWindowStart === undefined) state.demandWindowStart = state.day;
  // migrate from old milestone/contract system
  if (state.contractIndex === undefined) {
    const first = CONTRACTS[0];
    state.contractIndex = 0;
    state.contractDebt = first.repay;
    state.contractBaseRepay = first.repay;
    state.contractDueDay = state.day + first.days;
  }
  // remove legacy fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as any;
  delete s.won; delete s.winTarget; delete s.milestoneReached;
  return state;
}

export function saveGame(state: GameState) {
  localStorage.setItem('merchant_empire_save', JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem('merchant_empire_save');
  if (!raw) return null;
  try { return migrateState(JSON.parse(raw) as GameState); } catch { return null; }
}
