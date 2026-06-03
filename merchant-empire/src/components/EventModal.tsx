import type { TravelEvent } from '../lib/events';

interface Props {
  event: TravelEvent;
  onClose: () => void;
}

const toneBg: Record<string, string> = {
  good: 'border-green-600 bg-green-950/60',
  bad: 'border-red-600 bg-red-950/60',
  neutral: 'border-amber-600 bg-amber-950/30',
};

const toneLabel: Record<string, string> = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-amber-400',
};

export default function EventModal({ event, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className={`rounded-2xl border p-6 max-w-sm w-full shadow-2xl ${toneBg[event.tone]}`}>
        <div className="text-4xl mb-3 text-center">{event.emoji}</div>
        <h2 className={`text-xl font-bold text-center mb-3 ${toneLabel[event.tone]}`}>
          {event.title}
        </h2>
        <p className="text-slate-300 text-sm text-center leading-relaxed mb-6">
          {event.description}
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
