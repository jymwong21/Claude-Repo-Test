import { useState, useEffect } from 'react';
import type { GameState, TravelResult } from './lib/gameState';
import { initGame, saveGame, loadGame, WIN_MILESTONES } from './lib/gameState';
import type { TravelEvent } from './lib/events';
import WorldMap from './components/WorldMap';
import TradePanel from './components/TradePanel';
import TravelPanel from './components/TravelPanel';
import UpgradePanel from './components/UpgradePanel';
import HUD from './components/HUD';
import EventLog from './components/EventLog';
import EventModal from './components/EventModal';
import HelpModal from './components/HelpModal';

type Tab = 'trade' | 'travel' | 'upgrade';

const HELP_KEY = 'merchant_empire_seen_help';

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadGame();
    // migrate old saves missing upgrades field
    if (saved && !saved.upgrades) {
      return { ...saved, upgrades: { cargoLevel: 0, speedLevel: 0 }, milestoneReached: -1 };
    }
    return saved ?? initGame();
  });
  const [tab, setTab] = useState<Tab>('trade');
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [pendingEvent, setPendingEvent] = useState<TravelEvent | null>(null);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(HELP_KEY));
  const [milestonePopup, setMilestonePopup] = useState<number | null>(null);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  // watch for newly crossed milestones
  const prevMilestoneRef = useState(state.milestoneReached)[0];
  useEffect(() => {
    if (state.milestoneReached > prevMilestoneRef && state.milestoneReached >= 0) {
      setMilestonePopup(WIN_MILESTONES[state.milestoneReached]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.milestoneReached]);

  function handleTravel(result: TravelResult) {
    setState(result.state);
    if (result.event) setPendingEvent(result.event);
  }

  function handleNewGame() {
    const fresh = initGame();
    setState(fresh);
    saveGame(fresh);
    setTab('trade');
    setSelectedTownId(null);
    setPendingEvent(null);
    setMilestonePopup(null);
  }

  function closeHelp() {
    localStorage.setItem(HELP_KEY, '1');
    setShowHelp(false);
  }

  const nextMilestoneIdx = state.milestoneReached + 1;
  const nextMilestone = WIN_MILESTONES[nextMilestoneIdx];

  return (
    <div className="min-h-svh bg-[#0f0e17] text-white flex flex-col">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between max-w-2xl w-full mx-auto">
        <div>
          <h1 className="text-xl font-bold text-amber-400 leading-none">⚖️ Merchant Empire</h1>
          <p className="text-xs text-slate-500">Buy low. Sell high. Grow rich.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-2 py-1 transition-colors"
          >
            ? Help
          </button>
          <button
            onClick={handleNewGame}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-2 py-1 transition-colors"
          >
            New Game
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-3 px-4 pb-8 max-w-2xl w-full mx-auto">
        <HUD state={state} />

        <WorldMap
          currentTownId={state.currentTownId}
          onTownClick={id => setSelectedTownId(id === selectedTownId ? null : id)}
          selectedTownId={selectedTownId}
        />

        {/* tab bar */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1">
          {([
            { key: 'trade', label: '🛒 Trade' },
            { key: 'travel', label: '🗺️ Travel' },
            { key: 'upgrade', label: '⬆️ Upgrades' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {tab === 'trade' && (
            <TradePanel state={state} onChange={setState} />
          )}
          {tab === 'travel' && (
            <TravelPanel
              state={state}
              onChange={handleTravel}
              onSelectTown={id => { setSelectedTownId(id); setTab('trade'); }}
            />
          )}
          {tab === 'upgrade' && (
            <UpgradePanel state={state} onChange={setState} />
          )}
        </div>

        <EventLog log={state.log} />

        {/* goal reminder if no cargo and gold low */}
        {nextMilestone && state.gold < nextMilestone && (
          <div className="text-center text-xs text-slate-600">
            Next milestone: <span className="text-amber-700">{nextMilestone.toLocaleString()}g</span>
            {' '}— {(nextMilestone - state.gold).toLocaleString()}g to go
          </div>
        )}
      </main>

      {/* event modal */}
      {pendingEvent && (
        <EventModal event={pendingEvent} onClose={() => setPendingEvent(null)} />
      )}

      {/* milestone celebration */}
      {milestonePopup !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-amber-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">Milestone Reached!</h2>
            <p className="text-slate-300 mb-1">
              You amassed <span className="text-amber-400 font-mono font-bold">{milestonePopup.toLocaleString()}g</span>!
            </p>
            {state.milestoneReached < WIN_MILESTONES.length - 1 ? (
              <p className="text-slate-500 text-sm mb-6">
                Next goal: <span className="text-amber-400">{WIN_MILESTONES[state.milestoneReached + 1].toLocaleString()}g</span>
              </p>
            ) : (
              <p className="text-slate-500 text-sm mb-6">You've built a legendary trading empire.</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setMilestonePopup(null)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl font-medium transition-colors"
              >
                Keep Trading
              </button>
              <button
                onClick={handleNewGame}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* help modal */}
      {showHelp && <HelpModal onClose={closeHelp} />}
    </div>
  );
}
