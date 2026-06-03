import { useState, useEffect } from 'react';
import type { GameState, TravelResult, RivalNotification } from './lib/gameState';
import { initGame, saveGame, loadGame, payContract, travel } from './lib/gameState';
import type { TravelEvent } from './lib/events';
import { CONTRACTS } from './lib/contracts';
import { RIVAL_NAME } from './lib/rival';
import WorldMap from './components/WorldMap';
import TradePanel from './components/TradePanel';
import TravelPanel from './components/TravelPanel';
import UpgradePanel from './components/UpgradePanel';
import HUD from './components/HUD';
import EventLog from './components/EventLog';
import EventModal from './components/EventModal';
import HelpModal from './components/HelpModal';
import GameScreen from './components/GameScreen';
import TutorialModal from './components/TutorialModal';

type Tab = 'trade' | 'travel' | 'upgrade';

const HELP_KEY = 'merchant_empire_seen_help';
const TUTORIAL_KEY = 'merchant_empire_tutorial_done';

function buildRivalEvent(notif: RivalNotification): TravelEvent {
  const contractName = CONTRACTS[notif.contractIndex].label;
  if (notif.playerPenalty) {
    return {
      title: `${RIVAL_NAME} Pulls Ahead`,
      emoji: '🏴',
      tone: 'bad',
      description: `${RIVAL_NAME} settled his "${contractName}" with the Guild this morning — before you. The clerk adjusts your ledger. Your current deadline has been cut by 3 days. Move faster.`,
      apply: s => s,
    };
  }
  return {
    title: 'You Beat the Rival',
    emoji: '🏆',
    tone: 'good',
    description: `${RIVAL_NAME} just paid his "${contractName}" — but you were already ahead. He'll find your name already checked when he arrives at the counter. Your next deadline extends by 2 days.`,
    apply: s => s,
  };
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? initGame());
  const [tab, setTab] = useState<Tab>('trade');
  const [pendingEvent, setPendingEvent] = useState<TravelEvent | null>(null);
  const [rivalNotif, setRivalNotif] = useState<RivalNotification | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(TUTORIAL_KEY));

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
    const result = payContract(state);
    setState(result.state);
    if (result.narrative) setPendingEvent(result.narrative);
  }

  function handleNewGame() {
    const fresh = initGame();
    setState(fresh);
    saveGame(fresh);
    setTab('trade');
    setPendingEvent(null);
    setRivalNotif(null);
    setShowTutorial(true);
    localStorage.removeItem(TUTORIAL_KEY);
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

        <WorldMap
          currentTownId={state.currentTownId}
          day={state.day}
          speedLevel={state.upgrades.speedLevel}
          onTravel={(townId) => handleTravel(travel(state, townId))}
        />

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
      {showTutorial && state.gamePhase === 'playing' && (
        <TutorialModal onDone={() => { localStorage.setItem(TUTORIAL_KEY, '1'); setShowTutorial(false); }} />
      )}
    </div>
  );
}
