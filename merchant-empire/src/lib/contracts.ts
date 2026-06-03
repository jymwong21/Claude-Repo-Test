export interface ContractDef {
  index: number;
  label: string;
  loan: number;
  repay: number;
  days: number;  // days from contract start until deadline
}

export const CONTRACTS: ContractDef[] = [
  { index: 0, label: 'Starter Loan',   loan: 500,   repay: 650,   days: 22 },
  { index: 1, label: 'Trade Advance',  loan: 1500,  repay: 1950,  days: 32 },
  { index: 2, label: 'Guild Bond',     loan: 5000,  repay: 6500,  days: 45 },
  { index: 3, label: 'Empire Charter', loan: 15000, repay: 20000, days: 60 },
];

export const OVERDUE_RATE = 0.08;    // 8% per day compounding after deadline
export const BANKRUPTCY_DAYS = 15;  // hard cutoff: game over this many days after deadline
