import type { CSSProperties } from 'react';
import type { RecipeId } from '../arcade/rules';

export const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}`;
export function Icon({ name, size = 22 }: { name: 'sound' | 'mute' | 'pause' | 'play' | 'arrow' | 'home' | 'cup' | 'clock' | 'check'; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'pause' ? <path d="M8 5v14M16 5v14" strokeWidth="4" /> :
      name === 'play' ? <path d="m9 5 10 7-10 7Z" fill="currentColor" stroke="none" /> :
      name === 'arrow' ? <path d="M4 12h15m-6-6 6 6-6 6" /> :
      name === 'home' ? <path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7" /> :
      name === 'clock' ? <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></> :
      name === 'check' ? <path d="m5 12 4 4L19 6" /> :
      name === 'cup' ? <path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 1h1a3 3 0 0 1 0 6h-1M7 3v2m4-2v2m4-2v2" /> :
      <><path d="M11 4 6 8H3v8h3l5 4Z" />{name === 'mute' ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />}</>}
  </svg>;
}
export function Star({ filled = true, className = '' }: { filled?: boolean; className?: string }) {
  return <svg className={`star ${filled ? 'star-filled' : ''} ${className}`} viewBox="0 0 40 40" aria-hidden="true"><path d="m20 3 5 10.5 11.5 1.7-8.3 8.1 2 11.4L20 29.3 9.8 34.7l2-11.4-8.3-8.1L15 13.5Z" /><path className="star-shine" d="m19 9-3 8-6 1" fill="none" strokeLinecap="round" /></svg>;
}
export function Food({ recipe, className = '' }: { recipe: RecipeId; className?: string }) {
  return <img className={`food-art ${className}`} src={art(`${recipe}.svg`)} alt="" draggable={false} width="240" height="200" />;
}
export function Logo({ large = false }: { large?: boolean }) {
  return <div className={`wordmark ${large ? 'wordmark-large' : ''}`} aria-label="Foodventure"><span>Food<span className="wordmark-tail">venture</span></span><svg className="logo-spark" viewBox="0 0 40 50" aria-hidden="true"><path d="M19 29C5 25 3 14 7 8c14 0 21 9 12 21Z" fill="#dc704f" /><path d="M20 35C20 20 25 12 37 13c3 13-4 21-17 22Z" fill="#347b68" /><path d="M20 44V28" fill="none" stroke="#347b68" strokeWidth="4" strokeLinecap="round" /></svg></div>;
}
export function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i, '--x': `${Math.sin(i * 2.4) * 145}px`, '--y': `${-60 - (i % 5) * 26}px`, '--r': `${i * 37}deg` } as CSSProperties} />)}</div>;
}
