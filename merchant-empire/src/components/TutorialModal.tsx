import { useState } from 'react';

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    emoji: '⚖️',
    title: 'A Risky Bet',
    text: "You've borrowed 500g from the Merchant's Guild to enter the trading circuit. So has Silas Greymark — the Guild's most ruthless factor. He's made this run before. You haven't. Beat him to every repayment and earn bonus time. Let him get ahead and your deadline shrinks.",
  },
  {
    emoji: '🛒',
    title: 'Buy Low, Sell High',
    text: 'Towns produce certain goods cheaply — shown in green on the Trade tab. Buy them, travel to a town that needs them, and sell for profit. The Trade Routes panel always shows your best move. Your cargo limit is 20 units, so choose wisely.',
  },
  {
    emoji: '📜',
    title: 'Your Deadline',
    text: "Your first debt of 650g is due in 14 days. Every time you travel, days pass. Miss the deadline and interest compounds at 12% per day — and the Guild gives you only 7 extra days before they seize everything. Watch the countdown in the status panel.",
  },
] as const;

export default function TutorialModal({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-end justify-center z-50 p-4 pb-6">
      <div className="bg-slate-900 border border-amber-800/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-5xl text-center mb-3">{current.emoji}</div>
        <h2 className="text-lg font-bold text-amber-400 text-center mb-3">{current.title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">{current.text}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-amber-400' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <button
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
            className="py-2 px-6 bg-amber-700 hover:bg-amber-600 active:bg-amber-500 rounded-xl text-white font-bold text-sm transition-colors"
          >
            {isLast ? "Let's Trade! →" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
