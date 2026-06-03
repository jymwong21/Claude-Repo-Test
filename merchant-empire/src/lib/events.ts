import type { GameState } from './gameState';
import { ALL_GOODS } from './goods';

export interface TravelEvent {
  title: string;
  emoji: string;
  description: string;
  tone: 'good' | 'bad' | 'neutral';
  apply: (state: GameState) => GameState;
}

function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function rollTravelEvent(state: GameState, travelSeed: number): TravelEvent | null {
  if (seeded(travelSeed) > 0.30) return null;

  const pick = seeded(travelSeed * 7 + 13);
  const events = buildEvents(state, travelSeed);
  return events[Math.floor(pick * events.length)];
}

function buildEvents(state: GameState, seed: number): TravelEvent[] {
  // Bandits now hit harder — 25% of gold, more meaningful relative to debt
  const goldLost = Math.max(20, Math.floor(state.gold * 0.25));

  const cargoUsed = Object.values(state.inventory).reduce((a, b) => a + b, 0);
  const freeSlots = state.cargoCapacity - cargoUsed;
  const cheapGoods = ALL_GOODS.filter(g => g.basePrice <= 25);
  const foundGood = cheapGoods[Math.floor(seeded(seed * 31) * cheapGoods.length)];
  const foundQty = Math.min(freeSlots, 2 + Math.floor(seeded(seed * 19) * 3));

  const heldGoods = ALL_GOODS.filter(g => (state.inventory[g.id] ?? 0) > 0);
  const damagedGood = heldGoods.length > 0
    ? heldGoods[Math.floor(seeded(seed * 41) * heldGoods.length)]
    : null;
  const damagedQty = damagedGood
    ? Math.min(state.inventory[damagedGood.id], 1 + Math.floor(seeded(seed * 53) * 2))
    : 0;

  const pool: TravelEvent[] = [
    {
      title: 'Bandit Ambush!',
      emoji: '⚔️',
      tone: 'bad',
      description: `Bandits blocked the road and demanded payment. You lost ${goldLost}g — money you can't afford to spare.`,
      apply: s => ({
        ...s,
        gold: Math.max(0, s.gold - goldLost),
        log: [`Bandits took ${goldLost}g on the road.`, ...s.log.slice(0, 19)],
      }),
    },
    {
      title: 'Favorable Winds',
      emoji: '💨',
      tone: 'good',
      description: 'Good weather pushed you along. You made excellent time on the road.',
      apply: s => ({
        ...s,
        log: ['Favorable winds — you arrived ahead of schedule.', ...s.log.slice(0, 19)],
      }),
    },
    {
      title: 'Market Rumor',
      emoji: '🗣️',
      tone: 'neutral',
      description: 'A fellow traveler tips you off: "Prices are shifting wildly across the region. Check the market news — there may be opportunities."',
      apply: s => s,
    },
  ];

  if (foundQty > 0) {
    pool.push({
      title: 'Abandoned Wagon',
      emoji: '🎁',
      tone: 'good',
      description: `You came across an abandoned merchant wagon. Inside: ${foundQty}× ${foundGood.name}. Useful cargo in tight times.`,
      apply: s => ({
        ...s,
        inventory: { ...s.inventory, [foundGood.id]: (s.inventory[foundGood.id] ?? 0) + foundQty },
        log: [`Found ${foundQty}× ${foundGood.name} in an abandoned wagon!`, ...s.log.slice(0, 19)],
      }),
    });
  }

  if (damagedGood && damagedQty > 0) {
    pool.push({
      title: 'Storm Damage',
      emoji: '⛈️',
      tone: 'bad',
      description: `A violent storm soaked your cargo. ${damagedQty}× ${damagedGood.name} was ruined — a painful loss when you're racing a deadline.`,
      apply: s => ({
        ...s,
        inventory: {
          ...s.inventory,
          [damagedGood.id]: Math.max(0, (s.inventory[damagedGood.id] ?? 0) - damagedQty),
        },
        log: [`Storm ruined ${damagedQty}× ${damagedGood.name}.`, ...s.log.slice(0, 19)],
      }),
    });
  }

  // Debt collector appears when overdue
  if (state.day > state.contractDueDay && heldGoods.length > 0) {
    const seized = heldGoods[Math.floor(seeded(seed * 67) * heldGoods.length)];
    const seizedQty = Math.max(1, Math.floor((state.inventory[seized.id] || 0) * 0.2));
    pool.push({
      title: 'Debt Collector',
      emoji: '📜',
      tone: 'bad',
      description: `A debt collector hired by your moneylender intercepts you on the road. They seize ${seizedQty}× ${seized.name} as partial payment.`,
      apply: s => ({
        ...s,
        inventory: { ...s.inventory, [seized.id]: Math.max(0, (s.inventory[seized.id] ?? 0) - seizedQty) },
        log: [`Debt collector seized ${seizedQty}× ${seized.name}.`, ...s.log.slice(0, 19)],
      }),
    });
  }

  return pool;
}
