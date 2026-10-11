import { useCallback, useEffect, useRef, useState } from 'react';
import CookingStation from './components/CookingStation';
import { art, Food, Icon, Logo, Star, Confetti } from './components/Art';
import { activeOrder, completeStep, createRun, dayConfig, RECIPES, roundStars, selectOrder, serveOrder, tickRun, comboMultiplier, type RecipeId, type Run } from './arcade/rules';
import { nextDay, recordRound, stallLevel, type Progress } from './arcade/progress';
import { firstCupDone, loadProgress, rememberFirstCup, saveProgress, submitScore } from './arcade/storage';
import { playSound, setMuted, unlockAudio } from './arcade/audio';

const menu: RecipeId[] = ['karak', 'samboosa', 'halwa', 'balaleet', 'machboos'];
const stallNames = ['Little stall', 'Golden counter', 'Pistachio trim', 'Festival stall'];
type View = 'home' | 'warmup' | 'rush';
type Toast = { id: number; text: string; points: number; perfect: boolean; recipe?: RecipeId };
type Reward = { recipe?: RecipeId; level?: number; newBest: boolean };

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const progressRef = useRef(progress);
  const [view, setView] = useState<View>('home');
  const [run, setRun] = useState<Run | null>(null);
  const [paused, setPaused] = useState(false);
  const [practiceStep, setPracticeStep] = useState(0);
  const [tutorialSeen, setTutorialSeen] = useState(firstCupDone);
  const [toast, setToast] = useState<Toast | null>(null);
  const [reward, setReward] = useState<Reward>({ newBest: false });
  const runIdentity = useRef(0);
  const finalized = useRef(-1);
  const eventSeen = useRef(0);
  const selectedDay = useRef(1);
  const surface = useRef<HTMLDivElement>(null);
  const pauseDialog = useRef<HTMLDivElement>(null);
  const currentOrder = run ? activeOrder(run) : undefined;
  const finished = view === 'rush' && run?.status === 'finished';
  const inKitchen = view === 'warmup' || (view === 'rush' && !finished);
  const level = stallLevel(progress);

  const persist = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);
  useEffect(() => { setMuted(progress.muted); }, [progress.muted]);

  const beginRush = useCallback((day: number) => {
    runIdentity.current += 1;
    eventSeen.current = 0;
    const buffer = new Uint32Array(1);
    try { crypto.getRandomValues(buffer); } catch { buffer[0] = Date.now() + runIdentity.current; }
    setRun(createRun(day, buffer[0]));
    setToast(null);
    setReward({ newBest: false });
    setPaused(false);
    setView('rush');
    unlockAudio();
    playSound('tap');
  }, []);

  function openStall() {
    unlockAudio();
    selectedDay.current = nextDay(progressRef.current);
    if (!tutorialSeen) { setPracticeStep(0); setPaused(false); setView('warmup'); playSound('tap'); }
    else beginRush(selectedDay.current);
  }
  function servePractice() {
    if (practiceStep !== 2 || paused) return;
    rememberFirstCup();
    setTutorialSeen(true);
    beginRush(selectedDay.current);
    setToast({ id: -runIdentity.current, text: 'Shukran! Let’s open the stall.', points: 0, perfect: true });
    playSound('serve');
  }
  function toggleMute() {
    unlockAudio();
    const next = { ...progressRef.current, muted: !progressRef.current.muted };
    setMuted(next.muted);
    persist(next);
    if (!next.muted) playSound('tap');
  }

  useEffect(() => {
    if (view !== 'rush' || run?.status !== 'playing' || paused) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = now - previous;
      previous = now;
      setRun(value => value ? tickRun(value, dt) : value);
    }, 100);
    return () => window.clearInterval(timer);
  }, [view, run?.status, paused]);

  useEffect(() => {
    if (!inKitchen) return;
    const hide = () => { if (document.hidden) setPaused(true); };
    const blur = () => setPaused(true);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', blur);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('blur', blur); };
  }, [inKitchen]);

  useEffect(() => {
    const event = run?.lastEvent;
    if (!event || event.serial === eventSeen.current) return;
    eventSeen.current = event.serial;
    if (event.type === 'serve') {
      setToast({ id: event.serial, text: event.perfect ? 'Perfect! Shukran!' : 'Made with love!', points: event.points, perfect: !!event.perfect, recipe: event.recipe ?? undefined });
      playSound(event.perfect ? 'perfect' : 'serve');
    } else if (event.type === 'miss') {
      setToast({ id: event.serial, text: 'They had to go. Next one’s yours!', points: 0, perfect: false });
      playSound('miss');
    }
  }, [run?.lastEvent]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!run || run.status !== 'finished' || finalized.current === runIdentity.current) return;
    finalized.current = runIdentity.current;
    const before = progressRef.current;
    const after = recordRound(before, run);
    const beforeRecipes = dayConfig(nextDay(before)).recipes;
    const newRecipe = dayConfig(nextDay(after)).recipes.find(id => !beforeRecipes.includes(id));
    setReward({ recipe: newRecipe, level: stallLevel(after) > stallLevel(before) ? stallLevel(after) : undefined, newBest: run.score > before.bestScore });
    persist(after);
    submitScore(run.score, { day: run.day, stars: roundStars(run), served: run.served, combo: run.bestCombo, version: 1 });
    playSound('result');
    setToast(null);
  }, [run, persist]);

  useEffect(() => {
    if (!inKitchen || paused) return;
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { event.preventDefault(); setPaused(true); }
      if (view === 'rush' && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        const slot = Number(event.key) - 1;
        setRun(value => value && value.orders[slot] ? selectOrder(value, value.orders[slot].id) : value);
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [inKitchen, paused, view]);

  useEffect(() => {
    if (!surface.current) return;
    surface.current.inert = paused;
    if (!paused) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = pauseDialog.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setPaused(false); return; }
      if (event.key !== 'Tab') return;
      const buttons = [...(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    };
    window.addEventListener('keydown', trap);
    return () => { window.removeEventListener('keydown', trap); if (surface.current) surface.current.inert = false; previous?.focus(); };
  }, [paused]);

  const focusKey = `${view}:${finished}:${currentOrder?.id}:${currentOrder?.step}:${practiceStep}`;
  useEffect(() => {
    if (paused) return;
    const frame = requestAnimationFrame(() => {
      if (inKitchen) surface.current?.querySelector<HTMLElement>('[data-testid="cook-action"], [data-testid="serve-action"]')?.focus({ preventScroll: true });
      if (finished) surface.current?.querySelector<HTMLElement>('[data-testid="next-day"]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusKey, paused, inKitchen, finished]);

  const stars = run ? roundStars(run) : 0;
  const progressTarget = run ? dayConfig(run.day).starThresholds[2] : 2300;

  return <div className={`app app-${view}${finished ? ' app-finished' : ''}`} data-stall-level={level}>
    <div className="souq-backdrop" aria-hidden="true" />
    <div ref={surface} className="app-surface" onKeyDownCapture={event => {
      if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
    }}>
      <header className="topbar">
        {view === 'home' ? <span className="stall-sign"><Icon name="cup" />{stallNames[level - 1]}</span> : <Logo />}
        <div className="topbar-right">
          {view === 'home' && progress.bestScore > 0 && <span className="personal-best"><Star />{progress.bestScore.toLocaleString()}</span>}
          {inKitchen && <button className="icon-button" onClick={() => setPaused(true)} aria-label="Pause game" title="Pause (P)"><Icon name="pause" /></button>}
          <button className="icon-button" onClick={toggleMute} aria-label={progress.muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={progress.muted} title={progress.muted ? 'Unmute sound' : 'Mute sound'}><Icon name={progress.muted ? 'mute' : 'sound'} /></button>
        </div>
      </header>

      {view === 'home' && <main className="welcome screen-enter">
        <div className="welcome-title"><Logo large /><p>A little taste of Bahrain.</p></div>
        <div className="feast" aria-hidden="true"><div className="feast-cloth" /><Food recipe="samboosa" className="feast-samboosa" /><Food recipe="halwa" className="feast-halwa" /><Food recipe="karak" className="feast-karak" /><div className="welcome-steam"><i /><i /><i /></div><span className="saffron-dot dot-one" /><span className="saffron-dot dot-two" /></div>
        <div className="welcome-action"><button className="primary-button open-button" onClick={openStall} data-testid="open-stall">{nextDay(progress) === 1 ? 'Open my stall' : `Open day ${nextDay(progress)}`}<Icon name="arrow" /></button><p>One minute. Make their day.</p></div>
        <div className="recipe-shelf" aria-label="Your recipes">{menu.map(recipe => {
          const unlocked = dayConfig(nextDay(progress)).recipes.includes(recipe);
          return <div key={recipe} className={unlocked ? '' : 'recipe-locked'}><Food recipe={recipe} /><span>{RECIPES[recipe].name}</span>{!unlocked && <span className="recipe-lock-label">Day {recipe === 'halwa' ? 2 : recipe === 'balaleet' ? 3 : 4}</span>}</div>;
        })}</div>
        <div className="welcome-footer"><span lang="ar" dir="rtl">أهلاً وسهلاً</span><span>Fresh food. Happy people.</span></div>
      </main>}

      {inKitchen && <main className="kitchen screen-enter">
        <div className="rush-hud">
          <div className="score-display">{view === 'warmup' ? <><span className="score-label">On the house</span><strong>First cup</strong></> : <><span className="score-label">Day {run!.day} score</span><strong data-testid="score">{run!.score.toLocaleString()}</strong></>}</div>
          {view === 'rush' && <div className={`combo ${run!.combo >= 3 ? 'combo-hot' : ''}`} data-testid="combo"><span>Combo</span><strong>×{comboMultiplier(Math.max(1, run!.combo)).toFixed(1)}</strong></div>}
          <div className={`time-display ${view === 'rush' && run!.remainingMs <= 10000 ? 'time-low' : ''}`} aria-label={view === 'warmup' ? 'Untimed first cup' : `${Math.ceil(run!.remainingMs / 1000)} seconds left`}><Icon name="clock" /><strong data-testid="timer">{view === 'warmup' ? '∞' : Math.ceil(run!.remainingMs / 1000)}</strong><span>{view === 'warmup' ? 'no rush' : 'seconds'}</span></div>
        </div>
        {view === 'rush' && <div className="star-track" aria-label={`${stars} of 3 stars. Next star at ${dayConfig(run!.day).starThresholds[Math.min(stars, 2)]} points`}><div className="star-track-rail"><div style={{ transform: `scaleX(${Math.min(1, run!.score / progressTarget)})` }} /></div>{dayConfig(run!.day).starThresholds.map(target => <span key={target} className={run!.score >= target ? 'star-stop earned' : 'star-stop'} style={{ left: `${target / progressTarget * 100}%` }}><Star filled={run!.score >= target} /><span>{target.toLocaleString()}</span></span>)}</div>}

        <div className={`customer-row ${view === 'warmup' ? 'customer-row-warmup' : ''}`} aria-label="Customer orders">
          {view === 'warmup' ? <div className="customer customer-selected first-customer"><div className="order-bubble"><Food recipe="karak" /><span>Karak, please!</span></div><img className="customer-portrait" src={art('customer-1.svg')} width="180" height="200" alt="Your first guest" /></div> : run!.orders.map((order, i) => <button key={order.id} className={`customer ${order.id === run!.selectedId ? 'customer-selected' : ''} ${order.remainingMs < 5000 ? 'customer-hurrying' : ''}`} onClick={() => { setRun(value => value ? selectOrder(value, order.id) : value); playSound('tap'); }} aria-label={`${RECIPES[order.recipe].name} order, ${Math.ceil(order.remainingMs / 1000)} seconds patience${order.id === run!.selectedId ? ', selected' : ''}`} aria-pressed={order.id === run!.selectedId} data-testid={`order-${order.id}`}><div className="order-bubble"><Food recipe={order.recipe} /><span>{RECIPES[order.recipe].name}</span>{order.step >= 2 && <span className="order-done"><Icon name="check" size={14} /></span>}</div><img className="customer-portrait" src={art(`customer-${order.customer % 6 + 1}.svg`)} width="180" height="200" alt="" /><div className="patience-track" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, order.remainingMs / order.patienceMs)})` }} /></div><kbd className="order-key">{i + 1}</kbd></button>)}
          {view === 'rush' && run!.orders.length === 0 && <div className="next-guest"><img src={art('customer-3.svg')} width="90" height="100" alt="" /><span>Your next guest is on the way…</span></div>}
        </div>

        <section className="worktop" aria-label="Cooking counter">
          <div className="counter-trim" aria-hidden="true" />
          {(view === 'warmup' || currentOrder) ? <><div className="recipe-heading"><div><h1>{RECIPES[view === 'warmup' ? 'karak' : currentOrder!.recipe].name}</h1><span lang="ar" dir="rtl">{RECIPES[view === 'warmup' ? 'karak' : currentOrder!.recipe].arabic}</span></div><span className="step-count">{(view === 'warmup' ? practiceStep : currentOrder!.step) >= 2 ? 'Ready to serve' : `${(view === 'warmup' ? practiceStep : currentOrder!.step) + 1} / 2`}</span></div>
            {(view === 'warmup' ? practiceStep : currentOrder!.step) < 2 ? <CookingStation key={view === 'warmup' ? `practice-${practiceStep}` : `${currentOrder!.id}-${currentOrder!.step}`} recipe={view === 'warmup' ? 'karak' : currentOrder!.recipe} step={view === 'warmup' ? practiceStep : currentOrder!.step} disabled={paused} onSound={playSound} onComplete={quality => { if (paused) return; if (view === 'warmup') setPracticeStep(value => Math.min(2, value + 1)); else setRun(value => value && value.selectedId === currentOrder!.id && activeOrder(value)?.step === currentOrder!.step ? completeStep(value, quality) : value); }} /> : <div className="serve-station" key={`serve-${currentOrder?.id ?? 'first'}`}><div className="ready-dish"><Food recipe={view === 'warmup' ? 'karak' : currentOrder!.recipe} /><div className="dish-steam"><i /><i /><i /></div></div><p>Freshly made. Make someone happy.</p><button className="primary-button serve-button" data-testid="serve-action" disabled={paused} onClick={() => view === 'warmup' ? servePractice() : setRun(value => value ? serveOrder(value, currentOrder!.id) : value)}>Serve {RECIPES[view === 'warmup' ? 'karak' : currentOrder!.recipe].name.toLowerCase()}<Icon name="arrow" /></button></div>}
          </> : <div className="counter-rest"><Icon name="cup" size={44} /><h1>A little breather.</h1><p>Fresh cups at the ready.</p></div>}
        </section>
        <div className="kitchen-footer"><span>{stallNames[level - 1]}</span>{view === 'rush' && <span>{run!.served} happy {run!.served === 1 ? 'guest' : 'guests'}</span>}</div>
        {toast && <div key={toast.id} className={`serve-toast ${toast.perfect ? 'toast-perfect' : ''}`} role="status"><strong>{toast.points > 0 ? `+${toast.points}` : <Icon name="check" />}</strong><span>{toast.text}</span>{toast.recipe && <div className="served-plate"><Food recipe={toast.recipe} /></div>}{toast.perfect && <Confetti />}</div>}
      </main>}

      {finished && run && <main className="results screen-enter" data-testid="results">
        <div className="result-heading"><span className="day-closed">Day {run.day} complete</span><h1>{stars === 3 ? 'Souq superstar!' : stars > 0 ? 'You made their day.' : 'One more cup?'}</h1></div>
        <div className="result-stars" aria-label={`${stars} out of 3 stars`}>{[0, 1, 2].map(i => <Star key={i} filled={i < stars} />)}{stars > 0 && <Confetti />}</div>
        <div className="result-score"><strong data-testid="final-score">{run.score.toLocaleString()}</strong><span>{reward.newBest ? 'A delicious new best!' : `Personal best ${progress.bestScore.toLocaleString()}`}</span></div>
        <div className="result-stats"><div><strong>{run.served}</strong><span>guests served</span></div><div><strong>{run.bestCombo}</strong><span>best streak</span></div><div><strong>{run.perfect}</strong><span>perfect dishes</span></div></div>
        <div className="day-reward">{reward.recipe ? <><Food recipe={reward.recipe} /><div><span>On tomorrow’s menu</span><h2>{RECIPES[reward.recipe].name} unlocked!</h2><p>{RECIPES[reward.recipe].description}</p></div></> : reward.level ? <><div className="reward-emblem"><Icon name="cup" size={38} /></div><div><span>Your stall got cosier</span><h2>{stallNames[reward.level - 1]}</h2><p>A new look for your next rush.</p></div></> : <><Food recipe={stars > 0 ? 'halwa' : 'karak'} /><div><h2>{stars === 3 ? 'There’s always room for more.' : stars === 0 ? 'Your first star is close.' : 'A little faster, a little sweeter.'}</h2><p>{stars === 0 ? `Reach ${dayConfig(run.day).starThresholds[0]} points to open the next day.` : stars < 3 ? `${dayConfig(run.day).starThresholds[Math.min(stars, 2)].toLocaleString()} points earns your next star.` : 'Keep the orders flowing and beat your best.'}</p></div></>}</div>
        <div className="result-actions"><button className="primary-button" data-testid="next-day" onClick={() => beginRush(stars > 0 ? nextDay(progressRef.current) : run.day)}>{stars > 0 ? `Open day ${nextDay(progress)}` : 'Try again'}<Icon name="arrow" /></button><div className="result-secondary">{stars > 0 && <button className="text-button" onClick={() => beginRush(run.day)}>Replay day {run.day}</button>}<button className="text-button" onClick={() => setView('home')}><Icon name="home" size={18} />My stall</button></div></div>
      </main>}
    </div>

    {paused && <div className="pause-backdrop"><div className="pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title" ref={pauseDialog}><Food recipe="karak" /><h1 id="pause-title">Tea break.</h1><p>Your customers can wait.</p><button className="primary-button" onClick={() => { unlockAudio(); setPaused(false); }}><Icon name="play" />Keep cooking</button><button className="text-button" onClick={() => { setPaused(false); setView('home'); setRun(null); setToast(null); }}>Back to my stall</button></div></div>}
    <span className="sr-only" role="status" aria-live="polite">{finished ? `Day complete. ${run!.score} points. ${stars} stars.` : ''}</span>
  </div>;
}
