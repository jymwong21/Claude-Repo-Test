import { TOWNS } from '../lib/towns';

interface Props {
  currentTownId: string;
  onTownClick: (townId: string) => void;
  selectedTownId: string | null;
}

export default function WorldMap({ currentTownId, onTownClick, selectedTownId }: Props) {
  return (
    <div className="relative w-full aspect-[4/3] bg-[#1a2744] rounded-xl overflow-hidden border border-[#2e4a8a] select-none">
      {/* terrain texture dots */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 75" preserveAspectRatio="none">
        {/* sea */}
        <rect width="100" height="75" fill="#1a2744" />
        {/* landmass */}
        <ellipse cx="50" cy="45" rx="42" ry="28" fill="#2d4a2d" opacity="0.6" />
        <ellipse cx="30" cy="35" rx="25" ry="18" fill="#3a5a3a" opacity="0.5" />
        <ellipse cx="65" cy="50" rx="20" ry="15" fill="#2d4a2d" opacity="0.4" />

        {/* roads between towns */}
        {TOWNS.map((from, fi) =>
          TOWNS.slice(fi + 1).map(to => (
            <line
              key={`${from.id}-${to.id}`}
              x1={from.x} y1={from.y * 0.75}
              x2={to.x} y2={to.y * 0.75}
              stroke="#8b7355"
              strokeWidth="0.4"
              strokeDasharray="1.5,1.5"
              opacity="0.3"
            />
          ))
        )}

        {/* towns */}
        {TOWNS.map(town => {
          const isCurrent = town.id === currentTownId;
          const isSelected = town.id === selectedTownId;
          const ty = town.y * 0.75;

          return (
            <g
              key={town.id}
              onClick={() => onTownClick(town.id)}
              className="cursor-pointer"
              style={{ pointerEvents: 'all' }}
            >
              {/* glow ring for current */}
              {isCurrent && (
                <circle cx={town.x} cy={ty} r="5.5" fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.8" />
              )}
              {/* selection ring */}
              {isSelected && !isCurrent && (
                <circle cx={town.x} cy={ty} r="5.5" fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.8" />
              )}
              {/* town dot */}
              <circle
                cx={town.x}
                cy={ty}
                r="3.5"
                fill={isCurrent ? '#fbbf24' : isSelected ? '#93c5fd' : '#c4a35a'}
                stroke={isCurrent ? '#f59e0b' : '#8b7355'}
                strokeWidth="0.5"
              />
              {/* label */}
              <text
                x={town.x}
                y={ty + 6.5}
                textAnchor="middle"
                fontSize="3.2"
                fill={isCurrent ? '#fbbf24' : '#e2d5b8'}
                fontWeight={isCurrent ? 'bold' : 'normal'}
              >
                {town.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* compass rose */}
      <div className="absolute top-2 right-3 text-[#8b7355] text-xs opacity-60 font-mono leading-tight text-right">
        <div>N</div>
      </div>

      {/* legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-[#8b7355]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#fbbf24]" />
          You are here
        </span>
      </div>
    </div>
  );
}
