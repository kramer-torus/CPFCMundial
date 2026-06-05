export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return (
    <div className="page-fade space-y-6 pb-4">
      <h1 className="text-2xl font-extrabold text-white">How It Works ❓</h1>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">The Draft</h2>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex gap-2"><span>👥</span>4 players: Kev, Franks, Kangars, Jakob</li>
          <li className="flex gap-2"><span>🌍</span>48 teams in 4 tiers — Elite, Contenders, Dark Horses, Underdogs</li>
          <li className="flex gap-2"><span>⚽</span>Each player drafts 12 teams — 3 per tier</li>
          <li className="flex gap-2"><span>🐍</span>Snake draft: Kev → Franks → Kangars → Jakob, then reverse, repeat</li>
          <li className="flex gap-2"><span>🔒</span>You can only pick on your turn — picks lock once made</li>
          <li className="flex gap-2"><span>↩️</span>Only the most recent pick can be undone (by its owner or admin)</li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">Scoring</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase border-b border-white/10">
              <th className="text-left py-1.5">Stage</th>
              <th className="text-right py-1.5">Result</th>
              <th className="text-right py-1.5">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ['Group stage', 'Win', '3'],
              ['Group stage', 'Draw', '1'],
              ['Group stage', 'Loss', '0'],
              ['R32 / R16 / QF / SF', 'Win', '3'],
              ['R32 / R16 / QF / SF', 'Eliminated', '0'],
              ['3rd place play-off', 'Win', '2'],
              ['Final', 'Winner', '5'],
              ['Final', 'Runner-up', '3'],
            ].map(([stage, result, pts]) => (
              <tr key={`${stage}-${result}`} className="text-white/70">
                <td className="py-2 pr-2">{stage}</td>
                <td className="text-right">{result}</td>
                <td className="text-right font-bold text-gold">{pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-white/50 text-xs">Your score = combined points of all 12 of your teams</p>
      </section>

      <section className="card space-y-2">
        <h2 className="text-palace-red font-bold text-lg">Tiebreakers</h2>
        <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
          <li>Most teams reaching the Round of 16+</li>
          <li>Highest single-team finish</li>
          <li>Coin flip 🪙</li>
        </ol>
      </section>

      <div className="card text-center py-4">
        <p className="text-gold font-bold text-lg">Glad All Over the World 🦅</p>
        <p className="text-white/40 text-xs mt-1">CPFC 2026 World Cup Draft Game</p>
      </div>
    </div>
  );
}
