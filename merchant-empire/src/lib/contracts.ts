export interface ContractDef {
  index: number;
  label: string;
  loan: number;
  repay: number;
  days: number;  // days from contract start until deadline
}

export const CONTRACTS: ContractDef[] = [
  { index: 0, label: 'Starter Loan',   loan: 500,   repay: 650,   days: 14 },
  { index: 1, label: 'Trade Advance',  loan: 1500,  repay: 1950,  days: 20 },
  { index: 2, label: 'Guild Bond',     loan: 5000,  repay: 6500,  days: 28 },
  { index: 3, label: 'Empire Charter', loan: 15000, repay: 20000, days: 40 },
];

export const OVERDUE_RATE = 0.12;    // 12% per day compounding after deadline
export const BANKRUPTCY_DAYS = 7;   // hard cutoff: game over this many days after deadline

export const DEMAND_CAP_WINDOW = 7;              // days per demand window
export const DEMAND_SATURATED_PRICE_MULT = 0.15; // sell price multiplier when cap exceeded

export function getDemandCap(basePrice: number): number {
  if (basePrice > 60) return 4;   // Spices (60g), Luxuries (120g)
  if (basePrice > 25) return 8;   // Iron (30), Tools (45), Cloth (35)
  return 15;                      // Grain (10), Fish (12), Salt (18), Timber (22), Herbs (25)
}
