interface Props {
  log: string[];
}

export default function EventLog({ log }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 max-h-36 overflow-y-auto">
      <div className="text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Journey Log</div>
      {log.map((entry, i) => (
        <div key={i} className={`text-xs py-0.5 ${i === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
          {entry}
        </div>
      ))}
    </div>
  );
}
