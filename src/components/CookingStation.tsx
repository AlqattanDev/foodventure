import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { RECIPES, pourQuality, type GestureKind, type RecipeId } from '../arcade/rules';
import type { SoundName } from '../arcade/audio';
import './cooking.css';

export interface CookingStationProps {
  recipe: RecipeId;
  step: number;
  onComplete: (quality: number) => void;
  onSound?: (name: SoundName) => void;
  disabled?: boolean;
}

type Interaction = {
  mode: 'pour' | 'stir-hold' | 'stir-drag' | 'fold' | 'auto-pour' | 'auto-stir';
  owner: 'pointer' | 'keyboard' | 'automatic';
  key?: string;
  pointerId?: number;
  startX?: number;
  startY?: number;
  angle?: number;
  travel?: number;
};

const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));
const dishArt = (recipe: RecipeId) => `${import.meta.env.BASE_URL}art/${recipe}.svg`;
const propArt = (name: string) => `${import.meta.env.BASE_URL}art/${name}.svg`;

function readyHint(recipe: RecipeId, kind: GestureKind, step: number): string {
  if (kind === 'pour') return 'Release at the gold line.';
  if (kind === 'stir') return 'Circle, or hold to stir.';
  if (kind === 'fold') return 'Swipe up, or tap to fold.';
  if (recipe === 'samboosa') return 'Tap the pan to sizzle.';
  if (recipe === 'karak') return 'Tap to add cardamom.';
  if (recipe === 'halwa') return 'Tap to add pistachios.';
  if (recipe === 'balaleet') return 'Tap to add the egg.';
  return step === 0 ? 'Tap to scoop rice.' : 'Tap to add chicken.';
}

function Steam({ x = 160, y = 50 }: { x?: number; y?: number }) {
  return <g className="cook-steam-group" transform={`translate(${x} ${y})`}>
    <path className="cook-steam cook-steam-a" d="M-28 0C-42-13-16-17-27-31" />
    <path className="cook-steam cook-steam-b" d="M0-3C-12-17 12-23 1-38" />
    <path className="cook-steam cook-steam-c" d="M28 0C17-12 39-18 29-30" />
  </g>;
}

function PourArt({ fill, active, id }: { fill: number; active: boolean; id: string }) {
  const level = 180 - Math.min(fill, 1.15) * 99;
  return <>
    <defs>
      <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFF9E7" /><stop offset="1" stopColor="#E6CD9D" /></linearGradient>
      <linearGradient id={`${id}-tea`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E9B467" /><stop offset="1" stopColor="#AE582E" /></linearGradient>
      <clipPath id={`${id}-inside`}><path d="M110 73H205L194 165Q191 183 159 183Q126 183 122 165Z" /></clipPath>
    </defs>
    <ellipse cx="160" cy="199" rx="101" ry="11" fill="#77492B" opacity=".14" />
    <ellipse cx="160" cy="185" rx="95" ry="22" fill="#E4C893" />
    <ellipse cx="160" cy="180" rx="96" ry="23" fill="#FFF9E8" stroke="#DCC295" strokeWidth="2" />
    <ellipse cx="160" cy="181" rx="75" ry="16" fill="none" stroke="#81A895" strokeWidth="2" />
    <path d="M204 99C246 86 248 145 201 146" fill="none" stroke="#C4A06A" strokeWidth="16" />
    <path d="M204 96C244 87 244 139 203 139" fill="none" stroke="#FFF2D3" strokeWidth="10" />
    <path d="M106 69H209L198 166Q194 189 159 189Q124 189 119 166Z" fill={`url(#${id}-cup)`} stroke="#C4A271" strokeWidth="2.5" />
    <g clipPath={`url(#${id}-inside)`}>
      <rect x="107" y={level} width="103" height="130" fill={`url(#${id}-tea)`} />
      <ellipse cx="158" cy={level} rx="52" ry="8" fill="#F0BF77" />
      <path d={`M131 ${level + 1}Q149 ${level - 5} 175 ${level + 1}`} fill="none" stroke="#FFE2A8" strokeWidth="2.5" opacity={fill > .06 ? .8 : 0} />
      <rect x="106" y="99" width="106" height="20" fill="#EFC15C" opacity=".18" />
      <path d="M111 109H203" fill="none" stroke="#C18D2A" strokeWidth="3" strokeDasharray="5 4" />
      <path d="M119 81L129 160" fill="none" stroke="#FFFBE7" strokeWidth="5" opacity=".5" strokeLinecap="round" />
    </g>
    <ellipse cx="158" cy="70" rx="51" ry="10" fill="none" stroke="#FDF4DD" strokeWidth="6" />
    <ellipse cx="158" cy="70" rx="52" ry="11" fill="none" stroke="#C4A271" strokeWidth="2" />
    <path className={fill >= .62 && fill <= .82 ? 'cook-gold-arrow cook-gold-arrow-ready' : 'cook-gold-arrow'} d="M88 101L101 109L88 117Z" fill="#B78625" />
    <g className="cook-pour-stream" opacity={active ? 1 : 0}>
      <path d={`M167 51Q164 72 158 ${Math.max(74, level)}`} fill="none" stroke="#C88743" strokeWidth="8" strokeLinecap="round" />
      <path d={`M167 52Q165 74 160 ${Math.max(76, level - 3)}`} fill="none" stroke="#F4C17A" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g transform="translate(294 -8) scale(-.56 .56)">
      <g className="cook-kettle" style={{ transform: `rotate(${active ? 18 : 0}deg)`, transformOrigin: '120px 136px' }}>
        <image href={propArt('kettle')} width="240" height="200" />
      </g>
    </g>
    {fill > .12 && <Steam x={152} y={61} />}
    {fill > 1 && <g className="cook-spill" fill="#C48848"><ellipse cx="212" cy="179" rx="12" ry="4" /><path d="M205 91Q214 116 207 140" stroke="#C48848" strokeWidth="5" fill="none" strokeLinecap="round" /></g>}
  </>;
}

const noodles = [
  'M84 115C93 86 193 98 228 122C251 145 112 158 98 129C85 103 194 114 211 134',
  'M88 125C110 94 215 105 226 132C214 152 92 145 101 114C121 96 199 104 219 125',
  'M98 104C129 78 223 109 215 136C181 159 101 141 102 125C111 106 190 111 199 129',
  'M116 102C166 89 220 121 202 139C155 156 103 124 130 114C162 109 192 122 181 132',
  'M82 132C115 151 190 158 228 134M103 96C143 80 188 91 219 111',
];

function PanArt({ recipe, angle, progress, frying, done }: { recipe: RecipeId; angle: number; progress: number; frying?: boolean; done: boolean }) {
  const sweet = recipe === 'halwa';
  return <>
    <ellipse cx="160" cy="193" rx="109" ry="13" fill="#77492B" opacity=".16" />
    <path d="M248 121L303 139Q315 145 308 156Q304 162 294 158L245 139" fill="#345C49" stroke="#224735" strokeWidth="3" />
    <path d="M63 112C55 165 85 190 160 192C232 190 264 166 259 112" fill="#BD7145" stroke="#965735" strokeWidth="3" />
    <path d="M80 163C114 188 213 186 240 158" fill="none" stroke="#E2A164" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="160" cy="116" rx="108" ry="56" fill="#284C3B" stroke="#CCAA6D" strokeWidth="5" />
    <ellipse cx="160" cy="116" rx="95" ry="45" fill={frying ? '#8F672C' : sweet ? '#B76D36' : '#F0BA54'} />
    {frying ? <>
      {[[108, 96, -12], [181, 91, 19], [151, 132, -5]].map(([x, y, rotate], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${rotate})`}>
        <path className="cook-fried-pastry" d="M-30 19L0-29L33 20Q0 32-30 19Z" fill={done ? '#DEA041' : '#E9BF73'} stroke="#C08037" strokeWidth="2" />
        <path d="M-19 15L0-17L21 16" fill="none" stroke="#F9DB97" strokeWidth="3" strokeLinecap="round" />
        {done && <g fill="#AF6528"><ellipse cx="2" cy="7" rx="2.5" ry="2" /><ellipse cx="-9" cy="13" rx="2" ry="1.5" /><ellipse cx="7" cy="-4" rx="2" ry="1.5" /></g>}
      </g>)}
      {done && [0, 1, 2, 3, 4, 5].map(index => <circle key={index} className={`cook-sizzle cook-sizzle-${index % 3}`} cx={85 + index * 30} cy={106 + index % 2 * 34} r={3 + index % 3} fill="none" stroke="#FFF1A7" strokeWidth="2" />)}
    </> : <>
      <g transform={`rotate(${angle * .18} 160 116)`}>
        {sweet ? <g fill="none" strokeLinecap="round"><path d="M84 120C111 88 206 84 231 119C218 152 110 151 97 125C109 98 213 98 215 122C193 144 127 141 123 124C130 109 197 110 193 124C181 134 151 133 148 123" stroke="#E8A158" strokeWidth="10" /><path d="M94 115C126 91 203 93 222 114M127 129C145 139 184 139 201 128" stroke="#F7BD6F" strokeWidth="3" /><ellipse cx="102" cy="123" rx="4" ry="2" fill="#FFD990" /><ellipse cx="194" cy="104" rx="5" ry="2" fill="#FFD990" /></g> : <g fill="none" strokeLinecap="round">{noodles.map((path, index) => <path key={path} d={path} stroke={index % 2 ? '#FFDE8A' : '#C78B35'} strokeWidth={index % 2 ? '3.5' : '2.5'} />)}</g>}
      </g>
      {progress < .08 && <g className="cook-circle-cue" fill="none" stroke="#FFF2C1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M108 105C110 82 195 80 211 104" /><path d="M211 94L212 106L200 105" /></g>}
      <g className="cook-spoon" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '160px 116px' }}>
        <path d="M160 33L164 99" stroke="#70492C" strokeWidth="14" strokeLinecap="round" />
        <path d="M156 33L161 94" stroke="#BE8C52" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="164" cy="115" rx="18" ry="26" fill="#795133" stroke="#D5A568" strokeWidth="3" transform="rotate(-4 164 115)" />
        <path d="M158 101Q169 99 172 116" stroke="#BA8A53" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </>}
    <Steam x={157} y={62} />
  </>;
}

function FoldArt({ progress }: { progress: number }) {
  return <>
    <ellipse cx="160" cy="202" rx="115" ry="11" fill="#77492B" opacity=".15" />
    <rect x="29" y="33" width="262" height="164" rx="28" fill="#A96936" />
    <rect x="29" y="25" width="262" height="164" rx="27" fill="#D6A16A" />
    <path d="M46 68Q74 72 87 65M232 168Q252 162 274 169M41 134Q58 128 70 131M252 51H273" fill="none" stroke="#BB824D" strokeWidth="3" strokeLinecap="round" opacity=".65" />
    <path d="M75 111L160 34L245 111Z" fill="#F7D991" stroke="#D8AC60" strokeWidth="2.5" strokeLinejoin="round" />
    <g fill="#9D763D"><ellipse cx="157" cy="91" rx="31" ry="15" /><ellipse cx="145" cy="77" rx="10" ry="7" /><ellipse cx="179" cy="92" rx="9" ry="7" /></g>
    <g fill="#74A05C"><ellipse cx="142" cy="88" rx="5" ry="3" transform="rotate(30 142 88)" /><ellipse cx="163" cy="79" rx="5" ry="3" /><ellipse cx="177" cy="95" rx="5" ry="3" /><ellipse cx="159" cy="99" rx="5" ry="3" /></g>
    <g className="cook-pastry-fold" style={{ transform: `translateY(111px) scaleY(${1 - progress * 2}) translateY(-111px)` }}>
      <path d="M75 111L160 188L245 111Z" fill="#F4D28B" stroke="#D8AC60" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M92 117L160 178L228 117" fill="none" stroke="#FFEBB8" strokeWidth="4" strokeLinejoin="round" />
    </g>
    <path d="M79 111H241" stroke="#C89B50" strokeWidth="2" strokeDasharray="5 5" opacity={1 - progress} />
    {progress < .15 && <g className="cook-fold-cue" fill="none" stroke="#805630" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M160 161V129M149 140L160 129L171 140" /></g>}
  </>;
}

function RicePlate({ noodles: isNoodles = false, empty = false }: { noodles?: boolean; empty?: boolean }) {
  return <>
    <ellipse cx="160" cy="187" rx="114" ry="13" fill="#77492B" opacity=".15" />
    <ellipse cx="160" cy="157" rx="121" ry="35" fill="#D9BD8F" />
    <ellipse cx="160" cy="151" rx="123" ry="35" fill="#FFF8E0" stroke="#E4CDA7" strokeWidth="2" />
    <ellipse cx="160" cy="151" rx="106" ry="27" fill="none" stroke="#77A99A" strokeWidth="2.5" />
    {!empty && <>
      <path d="M61 145C64 126 82 111 108 104C137 86 181 89 207 105C233 112 253 129 259 145C240 176 89 180 61 145Z" fill="#EFB959" />
      {isNoodles ? <g transform="translate(0 21)" fill="none" strokeLinecap="round">{noodles.map((path, index) => <path key={path} d={path} stroke={index % 2 ? '#FFE39A' : '#C38B37'} strokeWidth={index % 2 ? '4' : '2.5'} />)}</g> : <g strokeLinecap="round">{Array.from({ length: 38 }, (_, index) => {
        const x = 85 + (index * 37 % 145);
        const y = 117 + (index * 17 % 43);
        return <path key={index} d={`M${x} ${y}l${index % 2 ? 6 : -5} ${index % 3 ? 3 : -4}`} stroke={index % 4 ? '#FFE8A6' : '#C78E3C'} strokeWidth={index % 4 ? 3.5 : 2.5} />;
      })}</g>}
    </>}
  </>;
}

function Garnish({ recipe, step, done }: { recipe: RecipeId; step: number; done: boolean }) {
  return <g className={`cook-garnish${done ? ' cook-garnish-done' : ''}`}>
    {recipe === 'karak' || recipe === 'halwa' ? <g transform="translate(156 102)">
      {[[-18, -12, -25], [3, -19, 32], [21, -6, -18], [-5, 4, 25], [24, 11, 56]].map(([x, y, rotation], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`}><ellipse rx={recipe === 'halwa' ? 5 : 6} ry={recipe === 'halwa' ? 9 : 10} fill={index % 2 ? '#749143' : '#A3B765'} stroke="#607B3D" strokeWidth="1.5" /><path d="M0-6V6" stroke="#D4D593" strokeWidth="1.5" strokeLinecap="round" /></g>)}
    </g> : recipe === 'balaleet' ? done ? <g transform="translate(160 106)">
      <path d="M-69 3C-58-34-25-48 6-43C36-41 62-23 70 10C39 40-31 41-63 19Z" fill="#F4C956" stroke="#D89930" strokeWidth="2.5" />
      <path d="M-65 7C-27-4 34-1 66 14C38 40-31 39-63 19Z" fill="#E8AE38" />
      <path d="M-60 9C-30 1 27 5 58 15M-53-1C-39-23-21-31-4-32" fill="none" stroke="#FFF0AA" strokeWidth="4" strokeLinecap="round" />
      <g fill="#C78B28"><ellipse cx="-28" cy="-16" rx="5" ry="3" /><ellipse cx="13" cy="-17" rx="5" ry="3" /><ellipse cx="39" cy="-2" rx="3" ry="2" /><ellipse cx="6" cy="20" rx="4" ry="2" /></g>
    </g> : <image href={propArt('egg')} x="92" y="50" width="136" height="113" /> : recipe === 'machboos' && step === 1 ? <g transform="translate(160 107) rotate(-18)">
      <path d="M22 2L53-15C61-13 67-21 61-26C61-34 49-34 46-25L16-13Z" fill="#F7E1BA" stroke="#C69A62" strokeWidth="2" />
      <path d="M-49-9C-43-33-5-38 12-18C33-16 35 5 15 15C-4 35-41 30-51 11C-56 6-56-3-49-9Z" fill="#CB762D" stroke="#935024" strokeWidth="2.5" />
      <path d="M-43-11C-27-34-8-25 2-9C5 3 16 0 18 7C1 23-34 23-43 10" fill="none" stroke="#EEAE58" strokeWidth="5" strokeLinecap="round" />
      <path d="M-28-17L-35-3M-9-12L-17 3M7-4L1 10" stroke="#984821" strokeWidth="3.5" strokeLinecap="round" />
    </g> : <g transform="translate(158 104)">
      <path d="M13-68L5-14" stroke="#8A5A35" strokeWidth="13" strokeLinecap="round" /><ellipse cx="0" cy="0" rx="32" ry="23" fill="#DAA45D" stroke="#9B6839" strokeWidth="3" /><ellipse cx="0" cy="-5" rx="27" ry="17" fill="#F9D684" />
      <g stroke="#FFF0B8" strokeWidth="3.5" strokeLinecap="round"><path d="M-18-5L-12-1M-4-12L2-9M10-2L15-7M-5 4L0 7M-15 5L-9 8M8 9L14 6" /></g>
    </g>}
  </g>;
}

function TapArt({ recipe, step, done }: { recipe: RecipeId; step: number; done: boolean }) {
  if (recipe === 'samboosa') return <PanArt recipe={recipe} angle={0} progress={1} frying done={done} />;
  return <>
    {recipe === 'machboos' ? <RicePlate empty={step === 0 && !done} /> : recipe === 'balaleet' ? <RicePlate noodles /> : <image className={done ? 'cook-plated-food cook-food-pop' : 'cook-plated-food'} href={dishArt(recipe)} x="35" y="1" width="250" height="208" />}
    <Garnish recipe={recipe} step={step} done={done} />
    {(recipe === 'machboos' || recipe === 'balaleet') && <Steam x={160} y={68} />}
  </>;
}

/** A gesture is accepted once; cancellation never finishes an order in the background. */
export function CookingStation({ recipe, step, onComplete, onSound, disabled = false }: CookingStationProps) {
  const definition = RECIPES[recipe].steps[step] ?? RECIPES[recipe].steps[0];
  const kind = definition.kind;
  const id = useId().replace(/:/g, '');
  const hintId = `cook-hint-${id}`;
  const [progress, setProgress] = useState(0);
  const [angle, setAngle] = useState(0);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [cue, setCue] = useState('');
  const current = useRef({ onComplete, onSound, disabled });
  current.current = { onComplete, onSound, disabled };
  const mounted = useRef(true);
  const actor = useRef<Interaction | null>(null);
  const captured = useRef<{ element: HTMLButtonElement; id: number } | null>(null);
  const frame = useRef<number | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressValue = useRef(0);
  const angleValue = useRef(0);
  const lastFrame = useRef(0);
  const nextSound = useRef(0);
  const lastKeyboard = useRef(-Infinity);
  const finishing = useRef(false);
  const delivered = useRef(false);
  const cancelRef = useRef<() => void>(() => undefined);

  function emit(name: SoundName) {
    try { current.current.onSound?.(name); } catch { /* Cooking also works without audio. */ }
  }

  function updateProgress(value: number) {
    progressValue.current = value;
    if (mounted.current) setProgress(value);
  }

  function releaseCapture() {
    const capture = captured.current;
    captured.current = null;
    if (!capture) return;
    try {
      if (capture.element.hasPointerCapture(capture.id)) capture.element.releasePointerCapture(capture.id);
    } catch { /* The browser may have cancelled the pointer already. */ }
  }

  function halt() {
    actor.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    releaseCapture();
    if (mounted.current) setActive(false);
  }

  function cancel() {
    halt();
    if (finishTimer.current !== null) clearTimeout(finishTimer.current);
    finishTimer.current = null;
    if (delivered.current) return;
    finishing.current = false;
    updateProgress(0);
    angleValue.current = 0;
    if (mounted.current) { setAngle(0); setDone(false); setCue(''); }
  }
  cancelRef.current = cancel;

  function finish(quality: number) {
    if (!mounted.current || current.current.disabled || finishing.current || delivered.current) return;
    finishing.current = true;
    halt();
    if (kind !== 'pour') updateProgress(1);
    setDone(true);
    setCue(quality >= .9 ? 'Lovely!' : 'Looking good!');
    if (kind === 'pour' || kind === 'stir') emit(quality >= .9 ? 'perfect' : 'tap');
    finishTimer.current = setTimeout(() => {
      finishTimer.current = null;
      if (!mounted.current || current.current.disabled || delivered.current) return;
      delivered.current = true;
      current.current.onComplete(clamp(quality));
    }, kind === 'tap' || kind === 'fold' ? 340 : 230);
  }

  function tick(now: number) {
    frame.current = null;
    const interaction = actor.current;
    if (!interaction || current.current.disabled || !mounted.current) { halt(); return; }
    const dt = Math.min(.06, Math.max(0, (now - lastFrame.current) / 1_000));
    lastFrame.current = now;
    if (interaction.mode === 'pour' || interaction.mode === 'auto-pour') {
      const limit = interaction.mode === 'auto-pour' ? .72 : 1.15;
      const value = Math.min(limit, progressValue.current + dt * .48);
      updateProgress(value);
      if (value >= limit) { finish(pourQuality(value)); return; }
    } else if (interaction.mode === 'stir-hold' || interaction.mode === 'auto-stir') {
      const value = Math.min(1, progressValue.current + dt * .7);
      updateProgress(value);
      angleValue.current += dt * 270;
      setAngle(angleValue.current);
      if (value >= 1) { finish(1); return; }
    } else return;
    if (now >= nextSound.current) {
      emit(kind === 'pour' ? 'pour' : 'stir');
      nextSound.current = now + 300;
    }
    if (actor.current && !finishing.current) frame.current = requestAnimationFrame(tick);
  }

  function begin(interaction: Interaction) {
    if (current.current.disabled || finishing.current || delivered.current || actor.current) return false;
    actor.current = interaction;
    setActive(true);
    setCue('');
    lastFrame.current = performance.now();
    nextSound.current = lastFrame.current + 300;
    if (kind === 'pour') { updateProgress(0); emit('pour'); }
    else if (kind === 'stir') emit('stir');
    if (interaction.mode !== 'stir-drag' && interaction.mode !== 'fold') frame.current = requestAnimationFrame(tick);
    return true;
  }

  function end() {
    const interaction = actor.current;
    if (!interaction) return;
    if (interaction.mode === 'pour' || interaction.mode === 'auto-pour') {
      if (progressValue.current < .055) {
        halt(); updateProgress(0); setCue('Keep holding to pour the tea.');
      } else finish(pourQuality(progressValue.current));
    } else if (interaction.mode === 'stir-hold' || interaction.mode === 'stir-drag' || interaction.mode === 'auto-stir') {
      halt();
      if (progressValue.current >= .98) finish(1);
      else setCue(interaction.mode === 'stir-drag' ? 'Circle, or hold to finish.' : 'Keep holding to finish.');
    } else halt();
  }

  function point(event: PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    // The SVG uses xMidYMid meet, so wide buttons add space on both sides.
    const scale = Math.min(box.width / 320, box.height / 216);
    if (scale <= 0) return { x: 160, y: 116 };
    return {
      x: (event.clientX - box.left - (box.width - 320 * scale) / 2) / scale,
      y: (event.clientY - box.top - (box.height - 216 * scale) / 2) / scale,
    };
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, surface: boolean) {
    if (event.button !== 0 || event.isPrimary === false || current.current.disabled || finishing.current || delivered.current) return;
    if (kind === 'tap' || kind === 'fold' && !surface) return;
    event.preventDefault();
    let interaction: Interaction;
    if (kind === 'pour') interaction = { mode: 'pour', owner: 'pointer', pointerId: event.pointerId };
    else if (kind === 'fold') interaction = { mode: 'fold', owner: 'pointer', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    else if (surface) {
      const position = point(event);
      interaction = { mode: 'stir-drag', owner: 'pointer', pointerId: event.pointerId, angle: Math.atan2(position.y - 116, position.x - 160), travel: progressValue.current * Math.PI * 2 };
    } else interaction = { mode: 'stir-hold', owner: 'pointer', pointerId: event.pointerId };
    if (!begin(interaction)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); captured.current = { element: event.currentTarget, id: event.pointerId }; } catch { /* Window blur still cancels safely. */ }
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const interaction = actor.current;
    if (interaction?.owner !== 'pointer' || interaction.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (interaction.mode === 'fold') {
      const distance = (interaction.startY ?? event.clientY) - event.clientY;
      updateProgress(clamp(distance / 85));
      if (progressValue.current >= .95) { emit('fold'); finish(1); }
    } else if (interaction.mode === 'stir-drag') {
      const position = point(event);
      const x = position.x - 160, y = position.y - 116;
      const radius = Math.hypot(x, y);
      if (radius < 28 || radius > 122) { interaction.angle = undefined; return; }
      const nextAngle = Math.atan2(y, x);
      if (interaction.angle !== undefined) {
        const delta = Math.atan2(Math.sin(nextAngle - interaction.angle), Math.cos(nextAngle - interaction.angle));
        if (Math.abs(delta) < Math.PI * .6) interaction.travel = (interaction.travel ?? 0) + Math.abs(delta);
      }
      interaction.angle = nextAngle;
      angleValue.current = nextAngle * 180 / Math.PI + 90;
      setAngle(angleValue.current);
      updateProgress(clamp((interaction.travel ?? 0) / (Math.PI * 2)));
      if (performance.now() >= nextSound.current) { emit('stir'); nextSound.current = performance.now() + 250; }
      if (progressValue.current >= .98) finish(1);
    }
  }

  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    const interaction = actor.current;
    if (interaction?.owner !== 'pointer' || interaction.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (interaction.mode === 'fold') {
      const distance = Math.hypot(event.clientX - (interaction.startX ?? event.clientX), event.clientY - (interaction.startY ?? event.clientY));
      if (progressValue.current >= .4 || distance < 10) { emit('fold'); finish(1); }
      else { halt(); updateProgress(0); setCue('Swipe up, or tap the fold button.'); }
    } else end();
  }

  function pointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (actor.current?.owner === 'pointer' && actor.current.pointerId === event.pointerId) cancel();
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    lastKeyboard.current = performance.now();
    if (event.repeat) return;
    if (kind === 'pour' || kind === 'stir') begin({ mode: kind === 'pour' ? 'pour' : 'stir-hold', owner: 'keyboard', key: event.key });
    else {
      emit(kind === 'fold' ? 'fold' : recipe === 'samboosa' ? 'sizzle' : 'tap');
      finish(1);
    }
  }

  function keyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    // Also suppress a held key's native click after focus moves to the next step.
    event.preventDefault();
    if (actor.current?.owner === 'keyboard' && actor.current.key === event.key) end();
  }

  function click(event: MouseEvent<HTMLButtonElement>, surface: boolean) {
    if (current.current.disabled || finishing.current || delivered.current) return;
    if (kind === 'tap' || kind === 'fold') {
      if (kind === 'fold' && surface && event.detail !== 0) return;
      emit(kind === 'fold' ? 'fold' : recipe === 'samboosa' ? 'sizzle' : 'tap');
      finish(1);
    } else if (event.detail === 0 && performance.now() - lastKeyboard.current > 300) {
      // A screen reader's virtual click has no held key or pointer: finish a guided gesture.
      begin({ mode: kind === 'pour' ? 'auto-pour' : 'auto-stir', owner: 'automatic' });
    }
  }

  useEffect(() => {
    mounted.current = true;
    const onBlur = () => cancelRef.current();
    const onVisibility = () => { if (document.hidden) cancelRef.current(); };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted.current = false;
      cancelRef.current();
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => { if (disabled) cancelRef.current(); }, [disabled]);
  useEffect(() => {
    delivered.current = false;
    cancelRef.current();
  }, [recipe, step]);

  const inGold = kind === 'pour' && active && progress >= .62 && progress <= .82;
  const hint = cue || (inGold ? 'Now release!' : readyHint(recipe, kind, step));
  const action = done ? 'Lovely!' : kind === 'pour' ? active ? inGold ? 'Release!' : progress > .82 ? 'Release to finish' : 'Keep pouring…' : 'Hold to pour' : kind === 'stir' ? active ? 'Keep stirring…' : recipe === 'balaleet' ? 'Hold to toss' : 'Hold to stir' : kind === 'fold' ? 'Fold samboosa' : definition.label;
  const controls = {
    onPointerMove: pointerMove,
    onPointerUp: pointerUp,
    onPointerCancel: pointerCancel,
    onLostPointerCapture: pointerCancel,
    onKeyDown: keyDown,
    onKeyUp: keyUp,
    onBlur: () => { if (actor.current?.owner === 'keyboard') cancel(); },
    disabled: disabled || done,
    'aria-describedby': hintId,
  };

  return <div className={`cook-station cook-${kind}${active ? ' cook-is-active' : ''}${done ? ' cook-is-done' : ''}`} data-testid="cooking-station" data-kind={kind} data-progress={Math.round(progress * 100)}>
    <button className="cook-surface" type="button" {...controls} onPointerDown={event => pointerDown(event, true)} onClick={event => click(event, true)} aria-label={`${definition.label}: ${readyHint(recipe, kind, step)}`} data-testid="cook-surface">
      <svg className="cook-illustration" viewBox="0 0 320 216" aria-hidden="true">
        {kind === 'pour' ? <PourArt fill={progress} active={active} id={id} /> : kind === 'stir' ? <PanArt recipe={recipe} angle={angle} progress={progress} done={done} /> : kind === 'fold' ? <FoldArt progress={progress} /> : <TapArt recipe={recipe} step={step} done={done} />}
      </svg>
    </button>
    {done && <div className="cook-sparks" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} style={{ '--cook-x': `${Math.cos(index * Math.PI / 4) * 92}px`, '--cook-y': `${Math.sin(index * Math.PI / 4) * 70 - 28}px`, '--cook-rotation': `${index * 38}deg` } as CSSProperties} />)}</div>}
    <p className={`cook-hint${inGold ? ' cook-hint-ready' : ''}`} id={hintId} aria-live="polite">{hint}</p>
    <button className="cook-action" type="button" {...controls} onPointerDown={event => pointerDown(event, false)} onClick={event => click(event, false)} data-testid="cook-action">
      <span className="cook-action-progress" aria-hidden="true" style={{ transform: `scaleX(${kind === 'pour' ? clamp(progress / .72) : progress})` }} />
      <span className="cook-action-label">{action}</span>
      {kind === 'fold' ? <svg className="cook-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M6 11L12 5L18 11" /></svg> : kind === 'tap' ? <svg className="cook-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12H19M13 6L19 12L13 18" /></svg> : <svg className="cook-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></svg>}
    </button>
  </div>;
}

export default CookingStation;
