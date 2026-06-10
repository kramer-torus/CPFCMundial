'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { GameUser } from '@/lib/types';
import { QUIZ_QUESTIONS, QUESTION_TIME_SECS, BASE_POINTS, calcSpeedBonus, TOTAL_QUESTIONS } from '@/lib/quiz-data';

interface QuizResult {
  id: string;
  user_id: string;
  score: number;
  correct_count: number;
  completed_at: string;
}

type QuizState = 'lobby' | 'playing' | 'done';

const RANK_BADGES = ['🥇', '🥈', '🥉', '4th', '5th', '6th', '7th', '8th'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const [session, setSession] = useState(() => getSession());
  const [quizState, setQuizState] = useState<QuizState>('lobby');
  const [users, setUsers] = useState<GameUser[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(false);

  // Playing state
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECS);
  const [feedback, setFeedback] = useState<string>('');
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, resultsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at'),
        supabase.from('quiz_results').select('*'),
      ]);
      setUsers(usersRes.data || []);
      setResults(resultsRes.data || []);
    } catch {
      // Network failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSession(getSession());
    fetchData();
    const ch = supabase.channel('quiz-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  // Timer logic
  useEffect(() => {
    if (quizState !== 'playing' || answered) return;
    setTimeLeft(QUESTION_TIME_SECS);
    questionStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, quizState]);

  function handleTimeout() {
    setAnswered(true);
    setFeedback("Time's up!");
    setTimeout(() => advance(false, 0), 1400);
  }

  function handleAnswer(idx: number) {
    if (answered) return;
    clearInterval(timerRef.current!);
    setSelectedIndex(idx);
    setAnswered(true);
    const q = QUIZ_QUESTIONS[currentQ];
    const correct = idx === q.correctIndex;
    const elapsed = Date.now() - questionStartRef.current;
    const bonus = correct ? calcSpeedBonus(elapsed) : 0;
    const pts = correct ? BASE_POINTS + bonus : 0;
    if (correct) {
      setFeedback(`+${pts} pts`);
    } else {
      setFeedback('Wrong!');
    }
    setTimeout(() => advance(correct, pts), 1400);
  }

  function advance(correct: boolean, pts: number) {
    const newScore = score + pts;
    const newCorrect = correctCount + (correct ? 1 : 0);
    setScore(newScore);
    setCorrectCount(newCorrect);
    setFeedback('');
    setSelectedIndex(null);
    setAnswered(false);

    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      // Quiz complete — save results
      finishQuiz(newScore, newCorrect);
    } else {
      setCurrentQ(prev => prev + 1);
    }
  }

  async function finishQuiz(finalScore: number, finalCorrect: number) {
    if (!session) return;
    await supabase.from('quiz_results').upsert(
      { user_id: session.id, score: finalScore, correct_count: finalCorrect, completed_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    await fetchData();
    setQuizState('done');
  }

  function startQuiz() {
    setCurrentQ(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedIndex(null);
    setAnswered(false);
    setFeedback('');
    setQuizState('playing');
  }

  async function lockDraftOrder() {
    setLocking(true);
    const sorted = [...results].sort((a, b) => b.score - a.score);
    for (let i = 0; i < sorted.length; i++) {
      await supabase.from('users').update({ draft_position: i + 1 }).eq('id', sorted[i].user_id);
    }
    await supabase.from('audit_log').insert({
      user_id: session?.id,
      action: 'LOCK_DRAFT_ORDER',
      detail: `Draft order locked via quiz: ${sorted.map((r, i) => `#${i+1} ${users.find(u=>u.id===r.user_id)?.display_name}`).join(', ')}`,
    });
    setLocking(false);
    setLockSuccess(true);
    fetchData();
  }

  const myResult = session ? results.find(r => r.user_id === session.id) : null;
  const allDone = users.length > 0 && results.length >= users.length;
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const myRank = myResult ? sortedResults.findIndex(r => r.user_id === myResult.user_id) + 1 : null;

  // ---- PLAYING ----
  if (quizState === 'playing') {
    const q = QUIZ_QUESTIONS[currentQ];
    const timerPct = (timeLeft / QUESTION_TIME_SECS) * 100;
    const timerColor = timeLeft > 10 ? '#C9A84C' : '#C4122E';

    return (
      <div className="fixed inset-0 bg-bg-base z-50 flex flex-col p-4 overflow-hidden">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white/40 text-xs font-mono">Q{currentQ + 1}/{TOTAL_QUESTIONS}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-palace-red transition-all rounded-full" style={{ width: `${((currentQ) / TOTAL_QUESTIONS) * 100}%` }} />
          </div>
          <span className="text-white/40 text-xs font-mono">{score} pts</span>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          />
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${q.category === 'cpfc' ? 'bg-palace-red/20 text-palace-red' : 'bg-gold/20 text-gold'}`}>
            {q.category === 'cpfc' ? '🦅 CPFC Trivia' : '⚽ World Cup'}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-white leading-snug mb-6 flex-shrink-0">{q.question}</h2>

        {/* Timer countdown */}
        <div className="text-center mb-4">
          <span className={`text-3xl font-extrabold tabular-nums ${timeLeft <= 5 ? 'text-palace-red' : 'text-white/30'}`}>{timeLeft}</span>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrect = idx === q.correctIndex;
            let bg = 'bg-bg-card border border-white/10';
            if (answered) {
              if (isCorrect) bg = 'bg-emerald-600/30 border border-emerald-500';
              else if (isSelected) bg = 'bg-rose-700/30 border border-rose-600';
              else bg = 'bg-bg-card border border-white/5 opacity-50';
            } else {
              bg = 'bg-bg-card border border-white/10 hover:border-white/30 hover:bg-white/5 active:scale-[0.98]';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${bg}`}
              >
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
                  {OPTION_LABELS[idx]}
                </span>
                <span className="text-white font-medium text-sm">{opt}</span>
                {answered && isCorrect && <span className="ml-auto text-emerald-400 text-lg">✓</span>}
                {answered && isSelected && !isCorrect && <span className="ml-auto text-rose-400 text-lg">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Feedback overlay */}
        {feedback && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className={`text-2xl font-extrabold px-4 py-2 rounded-xl animate-fade-in ${feedback.startsWith('+') ? 'text-neon' : 'text-palace-red'}`}>
              {feedback}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ---- DONE ----
  if (quizState === 'done') {
    return (
      <div className="page-fade space-y-5 pb-4 pt-2">
        <div className="card text-center py-8 space-y-3">
          <div className="text-6xl">🦅</div>
          <h2 className="font-display font-bold text-3xl text-white tracking-wide uppercase">Gauntlet Complete!</h2>
          <div>
            <span className="font-display font-bold text-6xl text-gold leading-none tabular-nums">{score}</span>
            <span className="text-white/40 text-lg ml-2">/ 3000 pts</span>
          </div>
          <p className="text-white/50 text-sm">{correctCount}/{TOTAL_QUESTIONS} correct answers</p>
          {myRank && (
            <div className="pt-2">
              <span className="text-4xl">{RANK_BADGES[myRank - 1]}</span>
              <p className="text-white font-bold mt-1">
                {myRank === 1 ? 'You pick first! 🎉' : `Draft Position #${myRank}`}
              </p>
            </div>
          )}
          {!allDone && (
            <p className="text-white/40 text-xs">Waiting for others to finish…</p>
          )}
        </div>
        <button onClick={() => setQuizState('lobby')} className="w-full btn-ghost">
          ← Back to Lobby
        </button>
      </div>
    );
  }

  // ---- LOBBY ----
  return (
    <div className="page-fade space-y-5 pb-4">
      {/* Hero */}
      <div className="-mx-4 px-6 py-8" style={{ background: 'linear-gradient(160deg, #1a0000 0%, #3d0a10 40%, #C4122E 80%, #8B0D20 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-[0.3em] text-white/40 uppercase mb-1">2026 World Cup</div>
            <h1 className="font-display font-bold text-5xl text-white leading-none tracking-wide">THE<br /><span className="text-gold">GAUNTLET</span></h1>
            <p className="text-white/60 text-sm mt-2">Highest score drafts first</p>
            <div className="flex gap-3 mt-3 text-xs text-white/40">
              <span>20 questions</span>
              <span>·</span>
              <span>30s each</span>
              <span>·</span>
              <span>Speed bonus</span>
            </div>
          </div>
          <div className="text-5xl opacity-80 mt-1">🔥</div>
        </div>
      </div>

      {/* Player status cards */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-xl text-white tracking-wider uppercase">Scores</h2>
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-16 bg-bg-card rounded-xl animate-pulse" />)
        ) : (
          sortedResults.length > 0
            ? sortedResults.map((r, idx) => {
                const user = users.find(u => u.id === r.user_id);
                if (!user) return null;
                return (
                  <div key={r.user_id} className="card flex items-center gap-3" style={{ borderLeftColor: user.accent_colour, borderLeftWidth: 3 }}>
                    <span className="text-2xl w-8 text-center">{RANK_BADGES[idx]}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white">{user.display_name}</div>
                      <div className="text-white/40 text-xs">{r.correct_count}/{TOTAL_QUESTIONS} correct</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-2xl text-gold leading-none tabular-nums">{r.score}</div>
                      <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">pts</div>
                    </div>
                  </div>
                );
              })
            : users.map(user => {
                const result = results.find(r => r.user_id === user.id);
                return (
                  <div key={user.id} className="card flex items-center gap-3" style={{ borderLeftColor: user.accent_colour, borderLeftWidth: 3 }}>
                    <div className="flex-1">
                      <div className="font-bold text-white">{user.display_name}</div>
                    </div>
                    {result ? (
                      <div className="text-right">
                        <div className="text-gold font-bold">{result.score} pts</div>
                        <div className="text-emerald-400 text-xs">✓ Complete</div>
                      </div>
                    ) : (
                      <span className="text-white/30 text-xs italic">Waiting…</span>
                    )}
                  </div>
                );
              })
        )}
      </div>

      {/* CTA */}
      {session && !myResult && (
        <button onClick={startQuiz} className="w-full btn-primary py-4 text-base font-extrabold">
          Enter the Gauntlet 🔥
        </button>
      )}

      {session && myResult && !allDone && (
        <div className="card text-center py-4 text-white/50 text-sm space-y-3">
          <p>You&apos;re done — waiting for the others…</p>
          {session.is_admin && (
            <button
              onClick={async () => {
                const res = await fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'quiz_reminder' }),
                });
                const data = await res.json();
                alert(data.ok ? `Reminder sent to ${data.sent} players 📲` : 'WhatsApp not configured');
              }}
              className="text-xs bg-white/10 hover:bg-white/20 text-white/70 font-semibold px-4 py-2 rounded-lg transition-all"
            >
              📲 Send WhatsApp Reminder to Pending Players
            </button>
          )}
        </div>
      )}

      {/* All done — lock order */}
      {allDone && (
        <div className="card space-y-3">
          <h3 className="font-bold text-white text-center">All players have completed The Gauntlet!</h3>
          <div className="space-y-1">
            {sortedResults.map((r, idx) => {
              const user = users.find(u => u.id === r.user_id);
              return (
                <div key={r.user_id} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{RANK_BADGES[idx]}</span>
                  <span className="font-semibold text-white">{user?.display_name}</span>
                  <span className="text-gold ml-auto font-bold">{r.score} pts</span>
                </div>
              );
            })}
          </div>
          {session?.is_admin && (
            <button
              onClick={lockDraftOrder}
              disabled={locking || lockSuccess}
              className={`w-full font-bold py-3 rounded-xl transition-all ${lockSuccess ? 'bg-emerald-600 text-white' : 'btn-primary'}`}
            >
              {lockSuccess ? '✓ Draft Order Locked!' : locking ? 'Locking…' : '🔒 Lock Draft Order'}
            </button>
          )}
          {!session?.is_admin && (
            <p className="text-white/40 text-xs text-center">Waiting for admin (Jakob) to lock the draft order…</p>
          )}
        </div>
      )}

      {/* How scoring works */}
      <div className="card space-y-2">
        <h3 className="text-sm font-bold text-white/60">How scoring works</h3>
        <div className="text-xs text-white/40 space-y-1">
          <div className="flex justify-between"><span>Correct answer</span><span className="text-gold font-bold">+100 pts</span></div>
          <div className="flex justify-between"><span>Speed bonus (0–10s)</span><span className="text-gold font-bold">+50 pts</span></div>
          <div className="flex justify-between"><span>Speed bonus (10–20s)</span><span className="text-gold font-bold">+25 pts</span></div>
          <div className="flex justify-between"><span>Speed bonus (20–30s)</span><span className="text-gold font-bold">+10 pts</span></div>
          <div className="flex justify-between border-t border-white/10 pt-1"><span>Maximum score</span><span className="font-bold text-white">3,000 pts</span></div>
        </div>
      </div>
    </div>
  );
}
