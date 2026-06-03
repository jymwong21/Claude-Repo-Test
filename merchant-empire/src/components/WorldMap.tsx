import { useState } from 'react';
import { TOWNS } from '../lib/towns';
import { GOODS } from '../lib/goods';
import { getRivalTownId } from '../lib/rival';
import { travelDays } from '../lib/gameState';

interface Props {
  currentTownId: string;
  day: number;
  speedLevel: number;
  onTravel: (townId: string) => void;
}

const ROAD_DISTANCE_THRESHOLD = 45;

export default function WorldMap({ currentTownId, day, speedLevel, onTravel }: Props) {
  const [infoTownId, setInfoTownId] = useState<string | null>(null);
  const infoTown = TOWNS.find(t => t.id === infoTownId);
  const currentTown = TOWNS.find(t => t.id === currentTownId)!;

  const rivalTownId = getRivalTownId(day);
  const rivalTown = TOWNS.find(t => t.id === rivalTownId);

  function handleTownClick(id: string) {
    setInfoTownId(prev => prev === id ? null : id);
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#2e4a8a] select-none">
      {/* map */}
      <svg
        className="w-full block"
        viewBox="0 0 100 75"
        style={{ display: 'block' }}
      >
        {/* background sea */}
        <rect width="100" height="75" fill="#1a2744" />
        {/* landmass shapes */}
        <ellipse cx="48" cy="44" rx="43" ry="27" fill="#243c24" opacity="0.7" />
        <ellipse cx="28" cy="34" rx="22" ry="16" fill="#2d4a2d" opacity="0.5" />
        <ellipse cx="68" cy="52" rx="18" ry="13" fill="#243c24" opacity="0.4" />
        {/* mountain hint near mining town */}
        <polygon points="35,48 38,40 41,48" fill="#3a3028" opacity="0.5" />
        <polygon points="32,50 36,42 40,50" fill="#2e2820" opacity="0.4" />
        {/* forest hint near forest village */}
        <circle cx="58" cy="55" r="3" fill="#1e3d1e" opacity="0.5" />
        <circle cx="63" cy="53" r="2.5" fill="#1e3d1e" opacity="0.4" />
        <circle cx="61" cy="58" r="2" fill="#1e3d1e" opacity="0.4" />

        {/* roads — only between nearby towns */}
        {TOWNS.map((from, fi) =>
          TOWNS.slice(fi + 1).map(to => {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > ROAD_DISTANCE_THRESHOLD) return null;
            return (
              <line
                key={`${from.id}-${to.id}`}
                x1={from.x} y1={from.y * 0.75}
                x2={to.x} y2={to.y * 0.75}
                stroke="#8b7355"
                strokeWidth="0.5"
                strokeDasharray="1.5,1.5"
                opacity="0.35"
              />
            );
          })
        )}

        {/* rival dot — drawn before towns so towns render on top */}
        {rivalTown && (() => {
          const ty = rivalTown.y * 0.75;
          const atPlayerTown = rivalTown.id === currentTownId;
          const ox = atPlayerTown ? 4 : 0;
          const oy = atPlayerTown ? -4 : 0;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <circle
                cx={rivalTown.x + ox}
                cy={ty + oy}
                r="2.8"
                fill="#ef4444"
                stroke="#991b1b"
                strokeWidth="0.5"
                opacity="0.9"
              />
              <text
                x={rivalTown.x + ox}
                y={ty + oy - 4}
                textAnchor="middle"
                fontSize="2.5"
                fill="#ef4444"
                style={{ pointerEvents: 'none' }}
              >
                rival
              </text>
            </g>
          );
        })()}

        {/* towns */}
        {TOWNS.map(town => {
          const isCurrent = town.id === currentTownId;
          const isInfo = town.id === infoTownId;
          const ty = town.y * 0.75;

          return (
            <g
              key={town.id}
              onClick={() => handleTownClick(town.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* invisible touch target for better mobile tapping */}
              <circle cx={town.x} cy={ty} r="7" fill="transparent" />

              {isCurrent && (
                <circle cx={town.x} cy={ty} r="5.8" fill="none" stroke="#fbbf24" strokeWidth="0.9" opacity="0.9" />
              )}
              {isInfo && !isCurrent && (
                <circle cx={town.x} cy={ty} r="5.8" fill="none" stroke="#60a5fa" strokeWidth="0.9" opacity="0.9" />
              )}
              <circle
                cx={town.x}
                cy={ty}
                r="3.5"
                fill={isCurrent ? '#fbbf24' : isInfo ? '#93c5fd' : '#c4a35a'}
                stroke={isCurrent ? '#f59e0b' : '#6b5a38'}
                strokeWidth="0.5"
              />
              <text
                x={town.x}
                y={ty + 7}
                textAnchor="middle"
                fontSize="3.2"
                fill={isCurrent ? '#fbbf24' : '#d4c5a0'}
                fontWeight={isCurrent ? 'bold' : 'normal'}
                style={{ pointerEvents: 'none' }}
              >
                {town.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* town info panel — shown when a town is tapped */}
      <div className={`transition-all duration-200 overflow-hidden ${infoTown ? 'max-h-44' : 'max-h-0'}`}>
        {infoTown && (
          <div className="bg-slate-900/95 border-t border-slate-700 px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base">{infoTown.emoji}</span>
                <span className="font-semibold text-amber-300 text-sm">{infoTown.name}</span>
                {infoTown.id === currentTownId && (
                  <span className="text-[10px] text-amber-500 border border-amber-800 rounded px-1">you are here</span>
                )}
                {infoTown.id === rivalTownId && (
                  <span className="text-[10px] text-red-500 border border-red-800 rounded px-1">rival here</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 text-xs">
                <div>
                  <span className="text-green-400 font-medium">Produces: </span>
                  <span className="text-slate-300">{infoTown.produces.map(g => `${GOODS[g].emoji} ${GOODS[g].name}`).join(', ')}</span>
                </div>
                <div>
                  <span className="text-red-400 font-medium">Demands: </span>
                  <span className="text-slate-300">{infoTown.demands.map(g => `${GOODS[g].emoji} ${GOODS[g].name}`).join(', ')}</span>
                </div>
              </div>
              {infoTown.id !== currentTownId && (
                <button
                  onClick={() => { onTravel(infoTown.id); setInfoTownId(null); }}
                  className="mt-2 w-full py-1.5 bg-amber-700 hover:bg-amber-600 active:bg-amber-500 rounded-lg text-xs font-bold text-white transition-colors"
                >
                  Travel Here — {travelDays(currentTown, infoTown, speedLevel)}d
                </button>
              )}
            </div>
            <button
              onClick={() => setInfoTownId(null)}
              className="text-slate-600 hover:text-slate-400 text-lg leading-none shrink-0 mt-0.5"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* static bottom bar when nothing selected */}
      {!infoTown && (
        <div className="bg-slate-900/80 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-600">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              You
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              Rival
            </span>
          </span>
          <span>Tap a town to travel there</span>
        </div>
      )}
    </div>
  );
}
