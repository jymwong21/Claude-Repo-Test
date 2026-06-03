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
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function rollTravelEvent(state: GameState, travelSeed: number): TravelEvent | null {
  if (seeded(travelSeed) > 0.30) return null;

  const pick = seeded(travelSeed * 7 + 13);
  const events = buildEvents(state, travelSeed);
  return events[Math.floor(pick * events.length)];
}

function buildEvents(state: GameState, seed: number): TravelEvent[] {
  const goldLost = Math.max(15, Math.floor(state.gold * 0.13));

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
      description: `Armed bandits blocked the road and demanded payment. You paid ${goldLost}g to pass.`,
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
      title: 'Merchant\'s Tip',
      emoji: '🗣️',
      tone: 'neutral',
      description: 'A fellow traveler shared news: "The Capital is desperate for Spices right now. Their prices are sky-high." Useful intel.',
      apply: s => s,
    },
  ];

  if (foundQty > 0) {
    pool.push({
      title: 'Abandoned Wagon',
      emoji: '🎁',
      tone: 'good',
      description: `You came across an abandoned merchant wagon. Inside: ${foundQty}× ${foundGood.name}. Finders keepers.`,
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
      description: `A violent storm soaked your cargo. ${damagedQty}× ${damagedGood.name} was ruined and had to be discarded.`,
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

  return pool;
}
