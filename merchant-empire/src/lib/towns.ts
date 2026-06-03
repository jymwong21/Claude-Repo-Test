import type { GoodId } from './goods';

export interface Town {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // position on 0-100 grid
  x: number;
  y: number;
  // goods this town produces cheaply (0.5-0.7x base price)
  produces: GoodId[];
  // goods this town needs badly (1.4-1.8x base price)
  demands: GoodId[];
  // baseline price modifiers per good (1.0 = base price)
  priceModifiers: Partial<Record<GoodId, number>>;
}

export const TOWNS: Town[] = [
  {
    id: 'farmstead',
    name: 'Farmstead',
    emoji: '🌾',
    description: 'A fertile agricultural settlement',
    x: 20, y: 30,
    produces: ['grain', 'herbs'],
    demands: ['iron', 'tools', 'salt'],
    priceModifiers: {
      grain: 0.55, herbs: 0.65,
      iron: 1.6, tools: 1.5, salt: 1.4,
      cloth: 1.2, spices: 1.5,
    },
  },
  {
    id: 'coastal_port',
    name: 'Coastal Port',
    emoji: '⚓',
    description: 'A busy harbor town',
    x: 72, y: 20,
    produces: ['fish', 'salt'],
    demands: ['grain', 'timber', 'cloth'],
    priceModifiers: {
      fish: 0.5, salt: 0.6,
      grain: 1.5, timber: 1.6, cloth: 1.4,
      spices: 0.8, luxuries: 0.9,
    },
  },
  {
    id: 'mining_town',
    name: 'Mining Town',
    emoji: '⛏️',
    description: 'Deep in the mountains',
    x: 35, y: 65,
    produces: ['iron', 'tools'],
    demands: ['grain', 'fish', 'herbs', 'cloth'],
    priceModifiers: {
      iron: 0.55, tools: 0.6,
      grain: 1.6, fish: 1.5, herbs: 1.6, cloth: 1.4,
      timber: 1.3,
    },
  },
  {
    id: 'forest_village',
    name: 'Forest Village',
    emoji: '🌲',
    description: 'Hidden among ancient trees',
    x: 60, y: 60,
    produces: ['timber', 'herbs'],
    demands: ['salt', 'iron', 'spices'],
    priceModifiers: {
      timber: 0.5, herbs: 0.6,
      salt: 1.5, iron: 1.4, spices: 1.6,
      grain: 1.1, fish: 1.2,
    },
  },
  {
    id: 'capital',
    name: 'The Capital',
    emoji: '🏰',
    description: 'The great trading hub',
    x: 48, y: 40,
    produces: ['cloth', 'luxuries'],
    demands: ['spices', 'fish', 'timber', 'grain'],
    priceModifiers: {
      cloth: 0.65, luxuries: 0.75,
      spices: 1.7, fish: 1.4, timber: 1.5, grain: 1.4,
      iron: 1.2, tools: 1.3,
    },
  },
  {
    id: 'desert_oasis',
    name: 'Desert Oasis',
    emoji: '🌵',
    description: 'A remote desert crossroads',
    x: 82, y: 70,
    produces: ['spices', 'luxuries'],
    demands: ['timber', 'grain', 'cloth', 'iron'],
    priceModifiers: {
      spices: 0.45, luxuries: 0.6,
      timber: 1.7, grain: 1.6, cloth: 1.5, iron: 1.5,
      fish: 1.4, salt: 1.3,
    },
  },
];
