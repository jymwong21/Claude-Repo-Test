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
            <p>The Merchant's Guild has given you a series of loans. Repay all four contracts before they're overdue — starting small (500g) and escalating to 15,000g. Beat your rival merchant to each payment and you'll earn bonus time; fall behind and your deadline shrinks.</p>
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
            <h3 className="font-semibold text-slate-100 mb-1">Trade Cards</h3>
            <div className="flex flex-col gap-1.5">
              <div>
                <span className="text-green-400 font-medium">Green goods</span> = produced here, priced cheaply. Best time to buy.
              </div>
              <div>
                <span className="text-red-400 font-medium">Red goods</span> = in high demand here. Sell these for top price.
              </div>
              <div className="mt-1">
                The colored <span className="text-slate-200 font-medium">● dot</span> on each card shows weekly demand saturation — green is fine, amber is filling up, red means the market is saturated and you'll earn very little.
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Trade Routes Panel</h3>
            <p>When you're carrying goods, the <span className="text-amber-300">Trade Routes</span> panel shows the best town to sell each item and your expected profit. When empty, it shows the top buy opportunities at the current town.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Demand Caps</h3>
            <p>Each town absorbs a limited quantity of goods per week. Once the cap is hit, the sell price drops to ~15% of normal. Repeating the same route too many times makes it worthless — diversify.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Price Events</h3>
            <p>Random <span className="text-red-300 font-medium">SHORTAGE</span> and <span className="text-blue-300 font-medium">SURPLUS</span> events temporarily change prices. Look for the <span className="text-slate-200">⚡</span> badge — shortages mean sell here now, surpluses mean buy cheap.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">The Map</h3>
            <p>Tap any town to see what it produces and demands — then tap <span className="text-amber-300 font-medium">Travel Here</span> to go there directly. The red dot is your rival merchant.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Rival Merchant</h3>
            <p>A rival is racing to repay the same contracts on a fixed schedule. If they pay before you, your next deadline shrinks by 3 days. Pay first and your next deadline extends by 2 days. The status panel shows whether you're ahead, behind, or tied.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Upgrades</h3>
            <p>Spend gold on a larger cargo hold to carry more goods per trip, or buy swift horses to travel 30% faster. Both dramatically multiply your earnings per day.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-100 mb-1">Quick Start</h3>
            <p>You start at Farmstead. Buy <span className="text-green-400">Grain</span> or <span className="text-green-400">Herbs</span> (cheap here), then check <span className="text-amber-300">Trade Routes</span> to see where to sell them for profit. Keep an eye on the contract deadline in the status panel.</p>
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
