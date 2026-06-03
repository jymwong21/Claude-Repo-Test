export type GoodId =
  | 'grain' | 'fish' | 'salt' | 'iron' | 'timber'
  | 'herbs' | 'spices' | 'cloth' | 'tools' | 'luxuries';

export interface Good {
  id: GoodId;
  name: string;
  emoji: string;
  basePrice: number;
}

export const GOODS: Record<GoodId, Good> = {
  grain:    { id: 'grain',    name: 'Grain',    emoji: '🌾', basePrice: 10 },
  fish:     { id: 'fish',     name: 'Fish',     emoji: '🐟', basePrice: 12 },
  salt:     { id: 'salt',     name: 'Salt',     emoji: '🧂', basePrice: 18 },
  iron:     { id: 'iron',     name: 'Iron',     emoji: '⚙️', basePrice: 30 },
  timber:   { id: 'timber',   name: 'Timber',   emoji: '🪵', basePrice: 22 },
  herbs:    { id: 'herbs',    name: 'Herbs',    emoji: '🌿', basePrice: 25 },
  spices:   { id: 'spices',   name: 'Spices',   emoji: '🫙', basePrice: 60 },
  cloth:    { id: 'cloth',    name: 'Cloth',    emoji: '🧵', basePrice: 35 },
  tools:    { id: 'tools',    name: 'Tools',    emoji: '🔨', basePrice: 45 },
  luxuries: { id: 'luxuries', name: 'Luxuries', emoji: '💎', basePrice: 120 },
};

export const ALL_GOODS = Object.values(GOODS);
