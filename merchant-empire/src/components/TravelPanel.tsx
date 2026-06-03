import { TOWNS } from '../lib/towns';
import type { GameState } from '../lib/gameState';
import { travelDays, travel } from '../lib/gameState';

interface Props {
  state: GameState;
  onChange: (newState: GameState) => void;
  onSelectTown: (townId: string) => void;
}

export default function TravelPanel({ state, onChange, onSelectTown }: Props) {
  const currentTown = TOWNS.find(t => t.id === state.currentTownId)!;

  function handleTravel(townId: string) {
    const next = travel(state, townId);
    onChange(next);
    onSelectTown(townId);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-slate-400 mb-1">Where do you want to go?</div>
      {TOWNS.filter(t => t.id !== state.currentTownId).map(town => {
        const days = travelDays(currentTown, town);
        return (
          <button
            key={town.id}
            onClick={() => handleTravel(town.id)}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-600 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{town.emoji}</span>
              <div>
                <div className="font-medium text-slate-200">{town.name}</div>
                <div className="text-xs text-slate-500">{town.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-amber-400 font-mono text-sm">{days}d</div>
              <div className="text-xs text-slate-500">travel</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
