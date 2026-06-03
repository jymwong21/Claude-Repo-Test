import { useState, useEffect } from 'react';
import type { GameState, TravelResult, RivalNotification } from './lib/gameState';
import { initGame, saveGame, loadGame, payContract } from './lib/gameState';
import type { TravelEvent } from './lib/events';
import { CONTRACTS } from './lib/contracts';
import WorldMap from './components/WorldMap';
import TradePanel from './components/TradePanel';
import TravelPanel from './components/TravelPanel';
import UpgradePanel from './components/UpgradePanel';
import HUD from './components/HUD';
import EventLog from './components/EventLog';
import EventModal from './components/EventModal';
import HelpModal from './components/HelpModal';
import GameScreen from './components/GameScreen';

type Tab = 'trade' | 'travel' | 'upgrade';

const HELP_KEY = 'merchant_empire_seen_help';

const CONTRACT_NAMES = CONTRACTS.map(c => c.label);

function buildRivalEvent(notif: RivalNotification): TravelEvent {
  if (notif.playerPenalty) {
    return {
      title: 'Rival Merchant Advances!',
      emoji: '🏴',
      tone: 'bad',
      description: `The Guild's Factor repaid their "${CONTRACT_NAMES[notif.contractIndex]}" before you. Your current deadline has been shortened by ${Math.abs(notif.daysDelta)} days. Move faster!`,
      apply: s => s,
    };
  }
  return {
    title: "You're Ahead!",
    emoji: '🏆',
    tone: 'good',
    description: `The rival merchant just paid their "${CONTRACT_NAMES[notif.contractIndex]}" — but you were already ahead! Your next deadline has been extended by 2 days.`,
    apply: s => s,
  };
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? initGame());
  const [tab, setTab] = useState<Tab>('trade');
  const [pendingEvent, setPendingEvent] = useState<TravelEvent | null>(null);
  const [rivalNotif, setRivalNotif] = useState<RivalNotification | null>(null);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(HELP_KEY));

  useEffect(() => {
    saveGame(state);
  }, [state]);

  function handleTravel(result: TravelResult) {
    setState(result.state);
    if (result.event) setPendingEvent(result.event);
    if (result.rivalNotification) setRivalNotif(result.rivalNotification);
    setTab('trade');
  }

  function handlePayContract() {
    setState(s => payContract(s));
  }

  function handleNewGame() {
    const fresh = initGame();
    setState(fresh);
    saveGame(fresh);
    setTab('trade');
    setPendingEvent(null);
    setRivalNotif(null);
  }

  function closeHelp() {
    localStorage.setItem(HELP_KEY, '1');
    setShowHelp(false);
  }

  if (state.gamePhase !== 'playing') {
    return <GameScreen state={state} onNewGame={handleNewGame} />;
  }

  return (
    <div className="min-h-svh bg-[#0f0e17] text-white flex flex-col">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between max-w-2xl w-full mx-auto">
        <div>
          <h1 className="text-xl font-bold text-amber-400 leading-none">⚖️ Merchant Empire</h1>
          <p className="text-xs text-slate-500">Buy low. Sell high. Outrun the rival.</p>
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
        <HUD state={state} onPayContract={handlePayContract} />

        <WorldMap currentTownId={state.currentTownId} day={state.day} />

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
                tab === key ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {tab === 'trade' && <TradePanel state={state} onChange={setState} />}
          {tab === 'travel' && (
            <TravelPanel state={state} onChange={handleTravel} />
          )}
          {tab === 'upgrade' && <UpgradePanel state={state} onChange={setState} />}
        </div>

        <EventLog log={state.log} />
      </main>

      {/* Travel events first, then rival notification */}
      {pendingEvent && (
        <EventModal event={pendingEvent} onClose={() => setPendingEvent(null)} />
      )}
      {!pendingEvent && rivalNotif && (
        <EventModal event={buildRivalEvent(rivalNotif)} onClose={() => setRivalNotif(null)} />
      )}

      {showHelp && <HelpModal onClose={closeHelp} />}
    </div>
  );
}
