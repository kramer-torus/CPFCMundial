export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return (
    <div className="page-fade space-y-5 pb-6">
      <h1 className="text-2xl font-extrabold text-white">How It Works ❓</h1>

      <section className="card space-y-2">
        <h2 className="text-palace-red font-bold text-lg">The Game</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          CPFCMundial is a draft game for the 2026 World Cup. 6 players draft national teams and earn points as those teams win and progress through the tournament. The player whose teams score the most points wins.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">The Draft</h2>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex gap-2"><span className="flex-shrink-0">👥</span>6 players: Kev, Franks, Kangars, Jakob, Matty Eagles and Bananaman</li>
          <li className="flex gap-2"><span className="flex-shrink-0">🌍</span>48 qualified teams split into 4 tiers of 12 by FIFA ranking: Elite (#1–12), Contenders (#13–24), Dark Horses (#25–36), Wildcards (#37+)</li>
          <li className="flex gap-2"><span className="flex-shrink-0">⚽</span>Each player drafts 8 teams total — exactly 2 from each tier. Everyone gets a mix of stars and underdogs.</li>
          <li className="flex gap-2"><span className="flex-shrink-0">🐍</span>
            <div>
              Picks follow a <strong className="text-white">snake order</strong> that reverses each round to keep it fair:
              <div className="mt-1.5 bg-white/5 rounded-lg p-2.5 font-mono text-xs space-y-0.5">
                <div>Round 1: <span className="text-palace-red">Kev</span> → <span className="text-blue-400">Franks</span> → <span className="text-gold">Kangars</span> → <span className="text-emerald-400">Jakob</span> → <span className="text-orange-400">Matty</span> → <span className="text-purple-400">Bananaman</span></div>
                <div>Round 2: <span className="text-purple-400">Bananaman</span> → <span className="text-orange-400">Matty</span> → <span className="text-emerald-400">Jakob</span> → <span className="text-gold">Kangars</span> → <span className="text-blue-400">Franks</span> → <span className="text-palace-red">Kev</span></div>
                <div>Round 3: <span className="text-palace-red">Kev</span> → <span className="text-blue-400">Franks</span> … (repeats for each tier)</div>
              </div>
              Repeat through all 4 tiers until all 48 teams are drafted (48 picks total).
            </div>
          </li>
          <li className="flex gap-2"><span className="flex-shrink-0">🔒</span>You can only pick on your turn. Once made, a pick is locked.</li>
          <li className="flex gap-2"><span className="flex-shrink-0">↩️</span>The most recent pick can be undone by the player who made it, or by the admin.</li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">Tiers</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="pill bg-emerald-600/20 text-emerald-400 border-emerald-600/40">T1 · Elite</span>
            <span className="text-white/60">FIFA #1–12 · 12 teams · 2 picks per player</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill bg-amber-500/20 text-amber-400 border-amber-500/40">T2 · Contenders</span>
            <span className="text-white/60">FIFA #13–24 · 12 teams · 2 picks per player</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill bg-purple-600/20 text-purple-400 border-purple-600/40">T3 · Dark Horses</span>
            <span className="text-white/60">FIFA #25–36 · 12 teams · 2 picks per player</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill bg-slate-600/20 text-slate-400 border-slate-600/40">T4 · Wildcards</span>
            <span className="text-white/60">FIFA #37+ · 12 teams · 2 picks per player</span>
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">Scoring</h2>
        <p className="text-white/50 text-xs">Points awarded per team per match. Your score = combined total across all 8 of your teams.</p>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Group Stage (GW1, GW2, GW3)</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {[['Win','3 pts'],['Draw','1 pt'],['Loss','0 pts']].map(([r,p]) => (
                <tr key={r} className="text-white/70">
                  <td className="py-1.5">{r}</td>
                  <td className="text-right font-bold text-gold">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Knockout Stage (R32 / R16 / QF / SF)</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {[['Win','3 pts'],['Eliminated','0 pts']].map(([r,p]) => (
                <tr key={r} className="text-white/70">
                  <td className="py-1.5">{r}</td>
                  <td className="text-right font-bold text-gold">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">End Stages</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {[['3rd place play-off win','2 pts'],['Final — Winner','5 pts'],['Final — Runner-up','3 pts']].map(([r,p]) => (
                <tr key={r} className="text-white/70">
                  <td className="py-1.5">{r}</td>
                  <td className="text-right font-bold text-gold">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="text-palace-red font-bold text-lg">Tiebreakers</h2>
        <ol className="text-sm text-white/70 space-y-1.5 list-decimal list-inside">
          <li>Most teams that reached the Round of 16 or beyond</li>
          <li>Highest single-team finish (a finalist beats a semi-finalist, etc.)</li>
          <li>Coin flip 🪙</li>
        </ol>
      </section>

      <section className="card bg-palace-red/10 border-palace-red/20">
        <p className="text-sm text-white/80 leading-relaxed">
          <span className="text-gold font-bold">💡 Tip:</span> Tier 1 teams score reliably, but a Wildcard that goes on a deep run earns the same points per win. Landing two strong T1 picks in the snake can swing the whole competition.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">2026 Schedule</h2>
        <div className="space-y-1.5 text-sm">
          {[
            ['Group Stage', 'Jun 11 – Jun 27'],
            ['Round of 32', 'Jun 28 – Jul 3'],
            ['Round of 16', 'Jul 4 – Jul 7'],
            ['Quarter-finals', 'Jul 9 – Jul 11'],
            ['Semi-finals', 'Jul 14 – Jul 15'],
            ['3rd Place Play-off', 'Jul 18'],
            ['Final 🏆', 'Jul 19 · MetLife Stadium, NJ'],
          ].map(([stage, dates]) => (
            <div key={stage} className="flex justify-between items-baseline">
              <span className="text-white/70">{stage}</span>
              <span className="text-white/40 text-xs">{dates}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="card text-center py-4 bg-gradient-to-r from-palace-red/20 to-navy/40 border-palace-red/20">
        <p className="text-gold font-bold text-lg">Glad All Over the World 🦅</p>
        <p className="text-white/40 text-xs mt-1">CPFC 2026 World Cup Draft Game</p>
      </div>
    </div>
  );
}
