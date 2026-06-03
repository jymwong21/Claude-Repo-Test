import { useState, useEffect } from 'react';
import type { GameState } from './lib/gameState';
import { initGame, saveGame, loadGame } from './lib/gameState';
import WorldMap from './components/WorldMap';
import TradePanel from './components/TradePanel';
import TravelPanel from './components/TravelPanel';
import HUD from './components/HUD';
import EventLog from './components/EventLog';

type Tab = 'trade' | 'travel';

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? initGame());
  const [tab, setTab] = useState<Tab>('trade');
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    saveGame(state);
    if (state.won && !showWin) setShowWin(true);
  }, [state]);

  function handleStateChange(next: GameState) {
    setState(next);
  }

  function handleNewGame() {
    const fresh = initGame();
    setState(fresh);
    saveGame(fresh);
    setShowWin(false);
    setTab('trade');
  }

  return (
    <div className="min-h-svh bg-[#0f0e17] text-white flex flex-col">
      {/* header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-400 leading-none">⚖️ Merchant Empire</h1>
          <p className="text-xs text-slate-500">Buy low. Sell high. Grow rich.</p>
        </div>
        <button
          onClick={handleNewGame}
          className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-2 py-1 transition-colors"
        >
          New Game
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-3 px-4 pb-6 max-w-2xl w-full mx-auto">
        {/* HUD */}
        <HUD state={state} />

        {/* map */}
        <WorldMap
          currentTownId={state.currentTownId}
          onTownClick={id => setSelectedTownId(id === selectedTownId ? null : id)}
          selectedTownId={selectedTownId}
        />

        {/* tab switcher */}
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {(['trade', 'travel'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'trade' ? '🛒 Trade' : '🗺️ Travel'}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {tab === 'trade' ? (
            <TradePanel state={state} onChange={handleStateChange} />
          ) : (
            <TravelPanel
              state={state}
              onChange={handleStateChange}
              onSelectTown={id => { setSelectedTownId(id); setTab('trade'); }}
            />
          )}
        </div>

        {/* event log */}
        <EventLog log={state.log} />
      </main>

      {/* win modal */}
      {showWin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-amber-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">Wealth Goal Reached!</h2>
            <p className="text-slate-300 mb-1">
              You amassed <span className="text-amber-400 font-mono font-bold">{state.gold.toLocaleString()}g</span> in {state.day} days.
            </p>
            <p className="text-slate-500 text-sm mb-6">Keep trading to grow your empire further, or start fresh.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowWin(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition-colors"
              >
                Keep Playing
              </button>
              <button
                onClick={handleNewGame}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
