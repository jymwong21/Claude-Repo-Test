import type { GameState } from '../lib/gameState';
import { CONTRACTS } from '../lib/contracts';
import { RIVAL_NAME } from '../lib/rival';

interface Props {
  state: GameState;
  onNewGame: () => void;
}

export default function GameScreen({ state, onNewGame }: Props) {
  const won = state.gamePhase === 'won';

  const completedContracts = Math.min(state.contractIndex, CONTRACTS.length);
  const shareText = won
    ? `I cleared all 4 Merchant Empire contracts in ${state.day} days! Can you beat me?`
    : `I made it to contract ${completedContracts}/4 in Merchant Empire before going bankrupt.`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).catch(() => {});
    }
  }

  if (won) {
    return (
      <div className="min-h-svh bg-[#0f0e17] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Empire Built!</h1>
          <p className="text-slate-300 mb-1">
            You repaid all four contracts in{' '}
            <span className="text-amber-400 font-mono font-bold text-xl">{state.day} days</span>.
          </p>
          <p className="text-slate-500 text-sm mb-2">
            The Merchant's Guild acknowledges your mastery.
          </p>
          <p className="text-slate-600 text-sm text-center leading-relaxed mb-6">
            {state.rival.contractIndex < CONTRACTS.length
              ? `${RIVAL_NAME} was still working on his ${['first', 'second', 'third', 'fourth'][state.rival.contractIndex] ?? 'final'} contract when you finished. He didn't say a word.`
              : `${RIVAL_NAME} finished at the same time. The clerks had to check their ledgers twice.`}
          </p>

          <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Run summary</div>
            {CONTRACTS.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300 flex-1">{c.label}</span>
                <span className="text-slate-500 text-xs">{c.repay.toLocaleString()}g repaid</span>
              </div>
            ))}
            <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between text-sm">
              <span className="text-slate-400">Final gold</span>
              <span className="text-amber-400 font-mono">{state.gold.toLocaleString()}g</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 mb-6 text-xs text-slate-400 italic">
            "{shareText}"
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors text-sm"
            >
              📤 Share Score
            </button>
            <button
              onClick={onNewGame}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl font-medium transition-colors text-sm"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lost screen
  const failedContract = CONTRACTS[Math.min(state.contractIndex, CONTRACTS.length - 1)];
  const shortBy = Math.max(0, state.contractDebt - state.gold);

  return (
    <div className="min-h-svh bg-[#0f0e17] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">💸</div>
        <h1 className="text-3xl font-bold text-red-400 mb-2">Bankrupt</h1>
        <p className="text-slate-500 text-sm text-center mb-1">
          {RIVAL_NAME} cleared his accounts{' '}
          {state.rival.contractIndex > 0
            ? `${state.rival.contractIndex} contract${state.rival.contractIndex !== 1 ? 's' : ''} ago`
            : 'before you even started'}.
        </p>
        <p className="text-slate-300 mb-1">
          You failed to repay the{' '}
          <span className="text-red-300 font-semibold">{failedContract.label}</span>{' '}
          on Day {state.day}.
        </p>
        {shortBy > 0 && (
          <p className="text-slate-500 text-sm mb-1">
            Short by <span className="text-red-400 font-mono">{shortBy.toLocaleString()}g</span>.
          </p>
        )}
        <p className="text-slate-600 text-xs mb-6">{state.lostReason}</p>

        <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">
            Contracts completed: {completedContracts} / {CONTRACTS.length}
          </div>
          {CONTRACTS.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              <span className={i < completedContracts ? 'text-green-400' : i === completedContracts ? 'text-red-400' : 'text-slate-700'}>
                {i < completedContracts ? '✓' : i === completedContracts ? '✗' : '○'}
              </span>
              <span className={`flex-1 ${i < completedContracts ? 'text-slate-400' : i === completedContracts ? 'text-slate-200' : 'text-slate-700'}`}>
                {c.label}
              </span>
              <span className="text-slate-600 text-xs">{c.repay.toLocaleString()}g</span>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 mb-6 text-xs text-slate-400 italic">
          "{shareText}"
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors text-sm"
          >
            📤 Share
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 rounded-xl font-medium transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
