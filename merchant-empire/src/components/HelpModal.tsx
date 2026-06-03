interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90svh] overflow-y-auto">
        <h2 className="text-xl font-bold text-amber-400 mb-4">⚖️ How to Play</h2>

        <div className="flex flex-col gap-4 text-sm text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-100 mb-1">The Goal</h3>
            <p>Accumulate gold by trading goods between towns. Hit each wealth milestone to keep growing your empire.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-2">Reading Prices</h3>
            <div className="bg-slate-800 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-900 text-green-300 w-14 text-center">CHEAP</span>
                <span>This price is below average — a good time to buy.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 w-14 text-center">FAIR</span>
                <span>Average market price. Not a great deal either way.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-900 text-red-300 w-14 text-center">PRICEY</span>
                <span>Above average — good to sell here, expensive to buy.</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Town Colors</h3>
            <div className="flex flex-col gap-1.5">
              <div><span className="text-green-400 font-medium">Green goods</span> = produced here, priced cheaply. Buy these.</div>
              <div><span className="text-red-400 font-medium">Red goods</span> = in high demand here. Sell here for top price.</div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Profit Intel</h3>
            <p>The Trade tab shows a <span className="text-amber-300">Profit Intel</span> panel when you're carrying goods. It tells you exactly where to go next and how much profit you'll make.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Upgrades</h3>
            <p>Spend gold on a larger cargo hold to carry more per trip, or buy faster horses to spend fewer days travelling. Both multiply your profits.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Quick Start</h3>
            <p>You're at Farmstead. Buy <span className="text-green-400">Grain</span> or <span className="text-green-400">Herbs</span> cheaply, then travel to Mining Town or the Capital where they're in demand.</p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-amber-700 hover:bg-amber-600 rounded-xl font-medium transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
