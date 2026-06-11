export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return (
    <div className="page-fade space-y-5 pb-6">
      <h1 className="text-2xl font-extrabold text-white">How It Works ❓</h1>
      <section className="card space-y-2">
        <h2 className="text-palace-red font-bold text-lg">The Game</h2>
        <p className="text-white/70 text-sm leading-relaxed">CPFCMundial is a draft game for the 2026 World Cup. 6 players draft national teams and earn points as those teams win and progress through the tournament.</p>
      </section>
      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">The Draft</h2>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex gap-2"><span className="flex-shrink-0">👥</span>6 players: Kev, Franks, Kangars, Jakob, Matty Eagles and Bananaman</li>
          <li className="flex gap-2"><span className="flex-shrink-0">🌍</span>48 teams split into 4 tiers of 12 by FIFA ranking: Elite (#1–12), Contenders (#13–24), Dark Horses (#25–36), Wildcards (#37+)</li>
          <li className="flex gap-2"><span className="flex-shrink-0">⚽</span>Each player drafts 8 teams — exactly 2 from each tier.</li>
          <li className="flex gap-2"><span className="flex-shrink-0">🐍</span>
            <div>Snake order reverses each round:<div className="mt-1.5 bg-white/5 rounded-lg p-2.5 font-mono text-xs space-y-0.5">
              <div>Odd rounds: <span className="text-gold">Kangars</span> → <span className="text-purple-400">Bananaman</span> → <span className="text-palace-red">Kev</span> → <span className="text-blue-400">Franks</span> → <span className="text-emerald-400">Jakob</span> → <span className="text-orange-400">Matty</span></div>
              <div>Even rounds: <span className="text-orange-400">Matty</span> → <span className="text-emerald-400">Jakob</span> → <span className="text-blue-400">Franks</span> → <span className="text-palace-red">Kev</span> → <span className="text-purple-400">Bananaman</span> → <span className="text-gold">Kangars</span></div>
            </div></div>
          </li>
        </ul>
      </section>
      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">Tiers</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><span className="pill bg-emerald-600/20 text-emerald-400 border-emerald-600/40">T1 · Elite</span><span className="text-white/60">FIFA #1–12 · 12 teams</span></div>
          <div className="flex items-center gap-2"><span className="pill bg-amber-500/20 text-amber-400 border-amber-500/40">T2 · Contenders</span><span className="text-white/60">FIFA #13–24 · 12 teams</span></div>
          <div className="flex items-center gap-2"><span className="pill bg-purple-600/20 text-purple-400 border-purple-600/40">T3 · Dark Horses</span><span className="text-white/60">FIFA #25–36 · 12 teams</span></div>
          <div className="flex items-center gap-2"><span className="pill bg-slate-600/20 text-slate-400 border-slate-600/40">T4 · Wildcards</span><span className="text-white/60">FIFA #37+ · 12 teams</span></div>
        </div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-palace-red font-bold text-lg">Scoring</h2>
        <div><p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Group Stage</p>
          <table className="w-full text-sm"><tbody className="divide-y divide-white/5">{[['Win','3 pts'],['Draw','1 pt'],['Loss','0 pts']].map(([r,p])=><tr key={r} className="text-white/70"><td className="py-1.5">{r}</td><td className="text-right font-bold text-gold">{p}</td></tr>)}</tbody></table>
        </div>
        <div><p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Knockout (R32/R16/QF/SF)</p>
          <table className="w-full text-sm"><tbody className="divide-y divide-white/5">{[['Win','3 pts'],['Eliminated','0 pts']].map(([r,p])=><tr key={r} className="text-white/70"><td className="py-1.5">{r}</td><td className="text-right font-bold text-gold">{p}</td></tr>)}</tbody></table>
        </div>
        <div><p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">End Stages</p>
          <table className="w-full text-sm"><tbody className="divide-y divide-white/5">{[['3rd place win','2 pts'],['Final — Winner','5 pts'],['Final — Runner-up','3 pts']].map(([r,p])=><tr key={r} className="text-white/70"><td className="py-1.5">{r}</td><td className="text-right font-bold text-gold">{p}</td></tr>)}</tbody></table>
        </div>
      </section>
      <div className="card text-center py-4 bg-gradient-to-r from-palace-red/20 to-navy/40 border-palace-red/20">
        <p className="text-gold font-bold text-lg">Glad All Over the World 🦅</p>
        <p className="text-white/40 text-xs mt-1">CPFC 2026 World Cup Draft Game</p>
      </div>
    </div>
  );
}
