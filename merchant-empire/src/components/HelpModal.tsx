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
            <p>Accumulate gold by buying goods cheaply in one town and selling them for more in another. Hit each wealth milestone — 2,000g → 6,000g → 15,000g → 40,000g — to grow your empire.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-2">Price Badges</h3>
            <div className="bg-slate-800 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-900 text-green-300 w-14 text-center shrink-0">CHEAP</span>
                <span>Below average price — good time to buy and carry to a better market.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 w-14 text-center shrink-0">FAIR</span>
                <span>Average market price.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-900 text-red-300 w-14 text-center shrink-0">PRICEY</span>
                <span>Above average — good to sell here if you're carrying this good.</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Trade Table Columns</h3>
            <div className="flex flex-col gap-1.5">
              <div>
                <span className="text-green-400 font-medium">Green goods</span> = produced here, priced cheaply. Best time to buy.
              </div>
              <div>
                <span className="text-red-400 font-medium">Red goods</span> = in high demand here. Sell these for top price.
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                <div><span className="text-slate-200 font-medium">You pay</span> = the price you pay to buy from this town.</div>
                <div><span className="text-slate-200 font-medium">Town pays</span> = the gold you receive when selling here. The small number below it shows profit or loss vs. what you paid.</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Trade Routes Panel</h3>
            <p>When you're carrying goods, the <span className="text-amber-300">Trade Routes</span> panel shows the best town to sell each item and your expected profit. When empty, it shows the top buy opportunities at the current town.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">The Map</h3>
            <p>Tap any town on the map to preview what it produces and demands — useful for planning trips without travelling there first.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Upgrades</h3>
            <p>Spend gold on a larger cargo hold to carry more goods per trip, or buy swift horses to travel 30% faster. Both dramatically multiply your earnings per day.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Quick Start</h3>
            <p>You start at Farmstead. Buy <span className="text-green-400">Grain</span> or <span className="text-green-400">Herbs</span> (cheap here), then check <span className="text-amber-300">Trade Routes</span> to see where to sell them for profit.</p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-amber-700 hover:bg-amber-600 rounded-xl font-medium transition-colors"
        >
          Got it, let's trade!
        </button>
      </div>
    </div>
  );
}
