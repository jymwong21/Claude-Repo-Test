export const RIVAL_NAME = 'Silas Greymark';

export interface RivalState {
  contractIndex: number;       // how many contracts rival has paid (0 = none yet)
  paidOnDay: number[];
  lastContractPaidDay: number;
}

// Absolute game days when the rival pays each contract.
// Player's deadlines: Day 15, ~35, ~63, ~103 — rival is always a couple days ahead.
export const RIVAL_PAY_DAYS = [13, 32, 60, 100] as const;

// Town ID sequence for rival's visible map position. Moves every 3 days.
// IDs match towns.ts (underscores).
const RIVAL_SEQUENCE = [
  'capital', 'desert_oasis', 'capital', 'mining_town',
  'coastal_port', 'capital', 'forest_village', 'capital',
] as const;

export function getRivalTownId(day: number): string {
  return RIVAL_SEQUENCE[Math.floor(day / 3) % RIVAL_SEQUENCE.length];
}

export interface AdvanceRivalResult {
  rival: RivalState;
  justPaidIndex: number | null;
}

export function advanceRival(rival: RivalState, day: number): AdvanceRivalResult {
  const nextPayIdx = rival.contractIndex;
  if (nextPayIdx < RIVAL_PAY_DAYS.length && day >= RIVAL_PAY_DAYS[nextPayIdx]) {
    return {
      rival: {
        contractIndex: rival.contractIndex + 1,
        paidOnDay: [...rival.paidOnDay, RIVAL_PAY_DAYS[nextPayIdx]],
        lastContractPaidDay: RIVAL_PAY_DAYS[nextPayIdx],
      },
      justPaidIndex: nextPayIdx,
    };
  }
  return { rival, justPaidIndex: null };
}

export function initRival(): RivalState {
  return { contractIndex: 0, paidOnDay: [], lastContractPaidDay: 0 };
}
