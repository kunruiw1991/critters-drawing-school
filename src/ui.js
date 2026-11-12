// Sketchbook page UI for the Smiling Critters Drawing School.
// Owns every DOM template, icon and visual state of the page, plus the canvas
// paper texture and the teacher pencil sprite. It never changes game state:
// it reads the state it is handed in sync() and reports taps through handlers.

const INK = '#4A3426';

/* ------------------------------------------------------------------ icons */

function starPath(cx, cy, outerR, innerR, points = 5) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
  }
  return `${d}Z`;
}

const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const svg = (body, box = '0 0 48 48') =>
  `<svg viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;

const ICONS = {
  speaker: svg(
    `<path d="M7 19h8.500l10-8.500v27l-10-8.500H7z" fill="#fff" ${S}/>
     <path class="wave wave-1" d="M31.500 18.500q4 5.500 0 11" fill="none" ${S}/>
     <path class="wave wave-2" d="M36.500 13q8 11 0 22" fill="none" ${S}/>`
  ),
  wand: svg(
    `<path d="M9 39.500 26.500 22" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
     <path d="M9 39.500 26.500 22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
     <path d="${starPath(32, 16, 11.5, 5.2)}" fill="#FFCB45" ${S}/>
     <path d="M11 8v8M7 12h8M40 30v7M36.500 33.500h7" fill="none" ${S}/>`
  ),
  bucket: svg(
    `<path d="M10.500 20C10.500 5 37.500 5 37.500 20" fill="none" ${S}/>
     <path d="M10.500 20h27l-3 19.500q-.4 2.500-3 2.500h-15q-2.600 0-3-2.500z" fill="#fff" ${S}/>
     <ellipse cx="24" cy="20" rx="13.500" ry="4.800" fill="var(--cur)" ${S}/>
     <path d="M28 21.500v8.500a3.200 3.200 0 0 0 6.400 0v-9.500" fill="var(--cur)" ${S}/>`
  ),
  next: svg(
    `<path d="M11 24h24M26 13.500 36.500 24 26 34.500" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M11 24h24M26 13.500 36.500 24 26 34.500" fill="none" stroke="#fff" stroke-width="4.500" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  check: svg(
    `<path d="M12 25.500 21 34l15.500-18" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M12 25.500 21 34l15.500-18" fill="none" stroke="#fff" stroke-width="4.500" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  star: svg(`<path d="${starPath(24, 25.5, 20, 9.2)}" fill="#FFCB45" ${S}/>`),
  close: svg(`<path d="M14 14l20 20M34 14 14 34" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
  friends: svg(
    `<rect x="7" y="7" width="14" height="14" rx="4.500" fill="#FF8FA3" ${S}/>
     <rect x="27" y="7" width="14" height="14" rx="4.500" fill="#FFCB45" ${S}/>
     <rect x="7" y="27" width="14" height="14" rx="4.500" fill="#7CC4F5" ${S}/>
     <rect x="27" y="27" width="14" height="14" rx="4.500" fill="#5EC27F" ${S}/>`
  ),
  pencil: svg(
    `<g transform="rotate(38 24 24)">
       <path d="M18 13h12v21l-6 10-6-10z" fill="#FFCB45" ${S}/>
       <path d="M18 34h12l-6 10z" fill="#F6DDB8" ${S}/>
       <path d="M18 6.500h12V13H18z" fill="#FF8FA3" ${S}/>
     </g>`
  ),
  palette: svg(
    `<path d="M24 6.500C13 6.500 5.500 14 5.500 24c0 9.500 7 17 16.500 17 4 0 5-2.800 3.800-5-1.300-2.500.2-5 3.200-5h4.500c5.500 0 9-4 9-9C42.500 13 34.500 6.500 24 6.500z" fill="#F6DDB8" ${S}/>
     <circle cx="14.500" cy="23" r="3.400" fill="#FF7F7F" stroke="${INK}" stroke-width="2"/>
     <circle cx="20.500" cy="14.500" r="3.400" fill="#FFCB45" stroke="${INK}" stroke-width="2"/>
     <circle cx="30" cy="14" r="3.400" fill="#7CC4F5" stroke="${INK}" stroke-width="2"/>
     <circle cx="36" cy="21.500" r="3.400" fill="#5EC27F" stroke="${INK}" stroke-width="2"/>`
  ),
  // Brush tools: tip down on the paper in the colour that is currently selected,
  // with a little sample of the mark each one makes.
  crayon: svg(
    `<g transform="rotate(-142 25 23)">
       <path d="M18 17h14v24H18z" fill="var(--cur)" ${S}/>
       <path d="M18 23h14v11H18z" fill="#fff" fill-opacity=".6" stroke="${INK}" stroke-width="2"/>
       <path d="M19.500 17 23 7.500q2-3 4 0L30.500 17z" fill="var(--cur)" ${S}/>
     </g>
     <path d="M19 43h5M28 43h4M36 43h6" fill="none" stroke="var(--cur)" stroke-width="5" stroke-linecap="round"/>`
  ),
  marker: svg(
    `<g transform="rotate(-142 25 23)">
       <rect x="17.500" y="15" width="15" height="27" rx="4" fill="#fff" ${S}/>
       <path d="M17.500 29h15v7h-15z" fill="var(--cur)" stroke="${INK}" stroke-width="2"/>
       <rect x="20.500" y="9" width="9" height="7" rx="1.500" fill="var(--cur)" ${S}/>
       <path d="M22.500 9.500v-3q2.500-4 5 0v3z" fill="${INK}" stroke="${INK}" stroke-width="1.500" stroke-linejoin="round"/>
     </g>
     <path d="M18 43q4-5 8 0t8 0 8 0" fill="none" stroke="var(--cur)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  watercolor: svg(
    `<ellipse cx="27" cy="42" rx="15" ry="4.500" fill="var(--cur)" fill-opacity=".5"/>
     <g transform="rotate(-142 25 23)">
       <rect x="22" y="23" width="6" height="20" rx="3" fill="#E2AD73" ${S}/>
       <rect x="20" y="17.500" width="10" height="7" rx="2" fill="#D5DAE2" ${S}/>
       <path d="M20 17.500q-1.500-8 5-13.500 6.500 5.500 5 13.500z" fill="var(--cur)" ${S}/>
     </g>`
  ),
  glitter: svg(
    `<path d="M22 8q2.200 13.500 15.500 16-13.300 2.500-15.500 16-2.200-13.500-15.500-16 13.300-2.500 15.500-16z" fill="var(--cur)" ${S}/>
     <path d="M38 5.500q.9 4.600 5.500 5.500-4.600.9-5.500 5.500-.9-4.600-5.500-5.500 4.600-.9 5.500-5.500zM38 33q.7 3.800 4.500 4.500-3.800.7-4.500 4.500-.7-3.800-4.500-4.500 3.800-.7 4.500-4.500z" fill="#FFCB45" stroke="${INK}" stroke-width="2.200" stroke-linejoin="round"/>`
  ),
};

// A crayon that stretches with its slot: fixed-shape tip + flexible body.
const CRAYON_HTML = `<span class="cr" aria-hidden="true">
  <svg class="cr-tip" viewBox="0 0 40 27" preserveAspectRatio="none" focusable="false">
    <path d="M1.300 28v-6q0-5 5.700-6L15 4.500q5-6 10 0L33 16q5.700 1 5.700 6v6" fill="var(--c)" stroke="${INK}" stroke-width="2.500" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <path d="M17 7.500q3-3.500 6 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.500" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>
  <span class="cr-body"><i class="cr-wrap"></i></span>
</span>`;

/* ------------------------------------------------------------- thumbnails */

const THUMB_BY_ID = {
  catnap: 'catnap',
  dogday: 'dogday',
  bobby: 'bobby_bearhug',
  hoppy: 'hoppy_hopscotch',
  craftycorn: 'craftycorn',
  pickypiggy: 'picky_piggy',
  bubba: 'bubba_bubbaphant',
  kickin: 'kickin_chicken',
};
const THUMB_STEMS = Object.values(THUMB_BY_ID);

function thumbUrl(lesson) {
  if (!lesson) return '';
  if (lesson.thumb) return lesson.thumb;
  const id = String(lesson.id || '').toLowerCase();
  let stem = THUMB_BY_ID[id];
  if (!stem) {
    const flat = id.replace(/[^a-z]/g, '');
    stem =
      THUMB_STEMS.find((s) => s.replace(/_/g, '') === flat) ||
      THUMB_STEMS.find((s) => flat.length >= 4 && s.replace(/_/g, '').startsWith(flat));
  }
  return stem ? `assets/thumbs/${stem}.png` : '';
}

const esc = (v) =>
  String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

// A friend's signature colour for cards and badges. Near-white coats (the unicorn)
// would vanish on cream paper, so those fall back to the friend's next vivid colour.
function isVivid(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * light - 1));
  return sat >= 0.35 && light >= 0.3 && light <= 0.84;
}

const friendColorCache = new Map();
function friendColor(lesson) {
  if (!lesson) return '#FFCB45';
  if (friendColorCache.has(lesson.id)) return friendColorCache.get(lesson.id);
  const palette = lesson.palette || {};
  const candidates = [palette.base, palette.inner, palette.belly, palette.cheek, palette.pendant, palette.bg];
  const color = candidates.find(isVivid) || palette.base || '#FFCB45';
  friendColorCache.set(lesson.id, color);
  return color;
}

// How many grid cells the starred crayon takes so that the box is always a full rectangle.
function starSpanForCols(n, cols) {
  const area = (cols - (n % cols)) % cols || cols;
  return area === 4 && cols >= 4 ? { cs: 2, rs: 2 } : { cs: area, rs: 1 };
}
function starSpanForRows(n, rows) {
  const area = (rows - (n % rows)) % rows || rows;
  return { cs: 1, rs: area, cols: (n + area) / rows };
}

function friendArt(lesson) {
  const url = thumbUrl(lesson);
  if (url) {
    return `<span class="friend-tint" style="-webkit-mask-image:url(${url});mask-image:url(${url})"></span><img class="friend-img" src="${url}" alt="" draggable="false" decoding="async">`;
  }
  // No line art for this lesson: fall back to its emoji so the card still shows who it is.
  return `<span class="friend-emoji">${esc(lesson.emoji || (lesson.name || '?').charAt(0))}</span>`;
}

/* ------------------------------------------------------------------ mount */

export function createSketchbookUI({ lessons, swatches, handlers }) {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const call = (name, ...args) => {
    const fn = handlers && handlers[name];
    return typeof fn === 'function' ? fn(...args) : undefined;
  };

  // Icons for the static buttons in index.html.
  document.querySelectorAll('[data-ico]').forEach((el) => {
    el.innerHTML = ICONS[el.dataset.ico] || '';
  });

  // Keep the layout exact on browsers whose 100vh ignores the toolbars.
  const fitViewport = () => {
    root.style.setProperty('--vh', `${window.innerHeight}px`);
    root.style.setProperty('--vw', `${window.innerWidth}px`);
  };
  fitViewport();
  window.addEventListener('resize', fitViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitViewport, 120));

  // Small hands rest on the screen: no pinch zoom, long-press menu or image drag.
  // (Scrolling and bounce are already switched off in ui.css; taps and drawing are untouched.)
  const stop = (e) => e.preventDefault();
  document.addEventListener('gesturestart', stop);
  document.addEventListener('contextmenu', stop);
  document.addEventListener('dragstart', stop);
  // iOS only shows :active (the button press) when a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });

  /* ---- friend picker ---- */
  const pickerEl = $('friend-picker');
  const gridEl = $('character-strip');
  const deskEl = $('desk');
  // index.html starts with the cover showing, so there is something friendly to look at while scripts load.
  let pickerOpen = root.dataset.picker === 'open';

  if (gridEl) {
    gridEl.dataset.count = String(lessons.length);
    if (lessons.length > 8) gridEl.dataset.many = '1';
    gridEl.innerHTML = lessons
      .map(
        (c) => `
      <button type="button" class="char-pill friend-card" data-char-id="${esc(c.id)}" id="btn-char-${esc(c.id)}"
              style="--fc:${esc(friendColor(c))}" aria-label="Draw ${esc(c.name)}">
        <span class="friend-art">${friendArt(c)}</span>
        <span class="char-name friend-name">${esc(c.name)}</span>
        <span class="friend-star">${ICONS.star}</span>
      </button>`
      )
      .join('');
    gridEl.addEventListener('click', (e) => {
      const card = e.target.closest('.char-pill');
      if (!card) return;
      // Peeking at the friends in the middle of a picture and tapping the same friend
      // goes back to that picture instead of wiping it. (On the party screen it starts again.)
      const resume =
        pickerOpen &&
        root.dataset.pickerClosable === '1' &&
        card.classList.contains('active') &&
        cache.phase !== 'celebrate';
      closePicker();
      if (!resume) call('onPickFriend', card.dataset.charId);
    });
  }

  function openPicker({ closable = true } = {}) {
    pickerOpen = true;
    root.dataset.picker = 'open';
    root.dataset.pickerClosable = closable ? '1' : '0';
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'false');
    if (deskEl) deskEl.inert = true; // keyboard and screen readers stay on the cover
  }
  function closePicker() {
    if (!pickerOpen) return;
    pickerOpen = false;
    root.dataset.picker = 'closed';
    if (pickerEl) pickerEl.setAttribute('aria-hidden', 'true');
    if (deskEl) deskEl.inert = false;
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pickerOpen && root.dataset.pickerClosable === '1') closePicker();
  });

  const openBtn = $('btn-open-picker');
  if (openBtn) openBtn.addEventListener('click', () => openPicker({ closable: true }));
  const closeBtn = $('btn-close-picker');
  if (closeBtn) closeBtn.addEventListener('click', closePicker);
  const coverVoice = $('btn-cover-voice');
  if (coverVoice) coverVoice.addEventListener('click', () => call('onVoice'));

  /* ---- step trail (beads on the sketchbook binding) ---- */
  const trailEl = $('step-ladder');
  if (trailEl) {
    trailEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump-phase]');
      if (!b) return;
      closePicker();
      call('onJump', b.dataset.jumpPhase, Number(b.dataset.jumpIdx) || 0);
    });
  }

  /* ---- crayons ---- */
  const swatchEl = $('swatch-grid');
  if (swatchEl) {
    const n = swatches.length;
    const wide = starSpanForCols(n, 2); // crayon column beside the paper
    const tall = starSpanForRows(n, 3); // three rows under the paper (tablet portrait)
    const phone = starSpanForCols(n, 5); // five across on a phone
    const short = starSpanForCols(n, 6); // six across on a short phone
    const land = starSpanForCols(n, 4); // phone on its side
    const land3 = starSpanForCols(n, 3); // small phone on its side
    const spans = { wide, tall, phone, short, land, land3 };
    Object.keys(spans).forEach((k) => {
      swatchEl.style.setProperty(`--${k}-cs`, String(spans[k].cs));
      swatchEl.style.setProperty(`--${k}-rs`, String(spans[k].rs));
    });
    swatchEl.style.setProperty('--tall-cols', String(tall.cols));
    swatchEl.innerHTML =
      `<button type="button" class="swatch-btn crayon crayon-star recommended" id="btn-swatch-rec" data-color="#FFCB45"
               style="--c:#FFCB45;--i:0" aria-label="Teacher's pick colour">
         ${CRAYON_HTML}<span class="crayon-badge">${ICONS.star}</span>
       </button>` +
      swatches
        .map(
          (sw, idx) => `
      <button type="button" class="swatch-btn crayon" data-color="${esc(sw.hex)}" id="btn-swatch-${idx}"
              style="--c:${esc(sw.hex)};--i:${idx + 1}" title="${esc(sw.name)}" aria-label="${esc(sw.name)}">
        ${CRAYON_HTML}
      </button>`
        )
        .join('');
    swatchEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch-btn');
      if (!btn) return;
      closePicker();
      call('onColor', btn.dataset.color);
    });
  }

  /* ---- brushes + the big buttons ---- */
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      closePicker();
      call('onTool', btn.dataset.tool);
    });
  });
  const wire = (id, name) => {
    const el = $(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        closePicker();
        call(name);
      });
    }
  };
  wire('btn-auto-step', 'onAutoStep');
  wire('btn-fill-part', 'onFillPart');
  wire('btn-voice-replay', 'onVoice');
  wire('btn-next-char', 'onNextFriend');
  // The whole speech bubble repeats the teacher, not only the round button in it.
  const bubble = $('voice-subtitle-pill');
  if (bubble) bubble.addEventListener('click', () => call('onVoice'));

  // Whenever the teacher says something new (the game writes the words into the bubble),
  // the bubble gives a little pop and the speaker waves for a moment.
  const wordsEl = $('voice-subtitle-text');
  let talkTimer = 0;
  if (wordsEl && typeof MutationObserver === 'function') {
    new MutationObserver(() => {
      root.classList.remove('is-talking');
      void root.offsetWidth;
      root.classList.add('is-talking');
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => root.classList.remove('is-talking'), 2400);
    }).observe(wordsEl, { childList: true, characterData: true, subtree: true });
  }

  /* ---- templates for the trail ---- */
  const cleanTitle = (t) => String(t || '').replace(/^(Color\s+)?Step\s+\d+(\/\d+)?:\s*/i, '');

  function trailHTML(state, lesson) {
    const phase = state.phase;
    const drawing = phase === 'drawing';
    const out = [];
    if (drawing) {
      out.push(`<span class="trail-chip is-active" role="img" aria-label="Drawing steps">${ICONS.pencil}</span>`);
      lesson.drawSteps.forEach((ds, i) => {
        const st = i < state.drawStepIndex ? 'done' : i === state.drawStepIndex ? 'current' : 'todo';
        out.push(bead('drawing', i, st, null, `Draw step ${i + 1}: ${cleanTitle(ds.title)}`));
      });
      out.push(
        `<button type="button" class="ladder-step trail-chip is-button" data-jump-phase="coloring" data-jump-idx="0"
                 aria-label="Skip to colouring" title="Skip to colouring">${ICONS.palette}</button>`
      );
    } else {
      out.push(
        `<button type="button" class="ladder-step trail-chip is-button is-done" data-jump-phase="drawing" data-jump-idx="0"
                 aria-label="Draw it again" title="Draw it again">${ICONS.pencil}</button>`
      );
      lesson.colorSteps.forEach((cs, i) => {
        const st =
          phase === 'celebrate' || i < state.colorStepIndex ? 'done' : i === state.colorStepIndex ? 'current' : 'todo';
        out.push(bead('coloring', i, st, cs.recommendedColor, `Colour step ${i + 1}: ${cleanTitle(cs.title)}`));
      });
      out.push(
        `<span class="trail-chip ${phase === 'celebrate' ? 'is-done' : 'is-active'}" role="img" aria-label="Colouring steps">${ICONS.palette}</span>`
      );
    }
    return out.join('');
  }

  function bead(jumpPhase, idx, st, color, label) {
    const kind = jumpPhase === 'drawing' ? 'kind-draw' : 'kind-color';
    const style = color ? ` style="--bc:${esc(color)}"` : '';
    const inner =
      st === 'current'
        ? '<span class="bead-fill" id="step-meter-fill"></span>'
        : st === 'done'
          ? ICONS.check
          : '';
    return `<button type="button" class="ladder-step bead ${kind} is-${st} ${st === 'current' ? 'current' : ''} ${st === 'done' ? 'done' : ''}"
              data-jump-phase="${jumpPhase}" data-jump-idx="${idx}"${style}
              aria-label="${esc(label)}" title="${esc(label)}"${st === 'current' ? ' aria-current="step"' : ''}>
        <span class="bead-dot">${inner}</span>
      </button>`;
  }

  /* ---- celebrate confetti ---- */
  const CONFETTI = ['#FF7F7F', '#FFCB45', '#5EC27F', '#7CC4F5', '#B58CF2', '#FF8FA3'];
  function throwConfetti() {
    const host = $('app');
    if (!host) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    box.setAttribute('aria-hidden', 'true');
    let html = '';
    for (let i = 0; i < 26; i++) {
      const left = (i * 37 + 11) % 100;
      const delay = ((i * 53) % 90) / 100;
      const dur = 2.2 + ((i * 29) % 14) / 10;
      const tilt = ((i * 47) % 60) - 30;
      html += `<i style="left:${left}%;background:${CONFETTI[i % CONFETTI.length]};animation-delay:${delay}s;animation-duration:${dur}s;--tilt:${tilt}deg"></i>`;
    }
    box.innerHTML = html;
    host.appendChild(box);
    setTimeout(() => box.remove(), 4600);
  }

  /* ---- sync: paint the page from the game state ---- */
  const cache = {};
  const setText = (id, text) => {
    // Compared with the live DOM, not a cache: the render loop also writes the meter label.
    const el = $(id);
    if (el && el.textContent !== text) el.textContent = text;
  };
  const setVar = (name, value) => {
    if (!value || cache[name] === value) return;
    cache[name] = value;
    root.style.setProperty(name, value);
  };
  const sameHex = (a, b) => Boolean(a && b && String(a).toUpperCase() === String(b).toUpperCase());

  function sync(state, lesson) {
    const phase = state.phase;
    if (cache.phase !== phase) {
      const before = cache.phase;
      cache.phase = phase;
      root.dataset.phase = phase;
      if (phase === 'celebrate' && before) throwConfetti();
    }

    const draw = lesson.drawSteps || [];
    const color = lesson.colorSteps || [];
    const cs = color[state.colorStepIndex] || color[0] || {};
    const ds = draw[state.drawStepIndex] || draw[0] || { strokes: [] };
    const rec =
      phase === 'coloring' ? cs.recommendedColor : (lesson.palette && lesson.palette.base) || friendColor(lesson);

    setVar('--cur', state.selectedColor);
    setVar('--rec', rec);
    setVar('--fc', friendColor(lesson));

    // Words for grown-ups and screen readers (kept off the child's screen).
    let pct = 100;
    if (phase === 'drawing') {
      const subs = Math.max(1, (ds.strokes || []).length);
      pct = Math.min(100, Math.round(((state.strokeSubIndex + state.strokeProgress) / subs) * 100));
      setText('phase-badge', `DRAW STEP ${state.drawStepIndex + 1} OF ${draw.length}`);
      setText('step-title', ds.title || '');
      setText('step-hint', ds.hint || '');
      setText('step-meter-label', `${pct}% Traced`);
    } else if (phase === 'coloring') {
      pct = Math.min(100, Math.round(state.colorCoverage));
      setText('phase-badge', `COLOR STEP ${state.colorStepIndex + 1} OF ${color.length}`);
      setText('step-title', cs.title || '');
      setText('step-hint', cs.hint || '');
      setText('step-meter-label', `${pct}% Colored`);
    } else {
      setText('phase-badge', 'FINISHED MASTERPIECE!');
      setText('step-title', `${lesson.name} is Alive & Dancing!`);
      setText('step-hint', 'Tap Next Friend or Replay any step!');
      setText('step-meter-label', '100% Complete');
    }

    // Step beads: rebuilt only when the step changes, the meter moves on every call.
    const trailKey = `${lesson.id}|${phase}|${state.drawStepIndex}|${state.colorStepIndex}|${draw.length}|${color.length}`;
    if (trailEl && cache.trailKey !== trailKey) {
      cache.trailKey = trailKey;
      trailEl.innerHTML = trailHTML(state, lesson);
      trailEl.dataset.count = String(trailEl.children.length);
    }
    const fill = $('step-meter-fill');
    if (fill) fill.style.width = `${pct}%`;

    // Friends: who is on the page, who is finished, who comes next.
    const doneKey = `${lesson.id}|${(state.completedCharacters || []).join(',')}`;
    if (cache.doneKey !== doneKey) {
      cache.doneKey = doneKey;
      document.querySelectorAll('.char-pill').forEach((btn) => {
        const active = btn.dataset.charId === lesson.id;
        btn.classList.toggle('active', active);
        btn.classList.toggle('done', (state.completedCharacters || []).includes(btn.dataset.charId));
        if (active) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
      const face = $('friend-face');
      if (face) face.innerHTML = friendArt(lesson);
      if (openBtn) openBtn.setAttribute('aria-label', `${lesson.name}. Choose another friend`);
      const idx = lessons.findIndex((c) => c.id === lesson.id);
      const nextLesson = lessons[(idx + 1) % lessons.length];
      const nextFace = $('next-face');
      if (nextFace && nextLesson) {
        nextFace.innerHTML = friendArt(nextLesson);
        nextFace.style.setProperty('--fc', friendColor(nextLesson));
      }
      const nextBtn = $('btn-next-char');
      if (nextBtn && nextLesson) nextBtn.setAttribute('aria-label', `Next friend: ${nextLesson.name}`);
    }

    // Crayons: the starred crayon always carries the colour the teacher suggests.
    const swKey = `${state.selectedColor}|${rec}|${phase}`;
    if (cache.swKey !== swKey) {
      cache.swKey = swKey;
      const starBtn = $('btn-swatch-rec');
      if (starBtn && rec) {
        if (!sameHex(starBtn.dataset.color, rec) || cache.recPhase !== phase) {
          // New suggestion: let the starred crayon hop a few times.
          cache.recPhase = phase;
          starBtn.classList.remove('nudge');
          void starBtn.offsetWidth;
          starBtn.classList.add('nudge');
        }
        starBtn.dataset.color = rec;
        starBtn.style.setProperty('--c', rec);
      }
      const starPicked = sameHex(rec, state.selectedColor);
      document.querySelectorAll('.swatch-btn').forEach((btn) => {
        const hex = btn.dataset.color;
        const isStar = btn === starBtn;
        const picked = sameHex(hex, state.selectedColor) && (isStar || !starPicked);
        btn.classList.toggle('selected', picked);
        btn.classList.toggle('recommended', isStar || sameHex(hex, rec));
        btn.setAttribute('aria-pressed', picked ? 'true' : 'false');
      });
    }

    if (cache.tool !== state.selectedTool) {
      cache.tool = state.selectedTool;
      document.querySelectorAll('.tool-btn').forEach((btn) => {
        const on = btn.dataset.tool === state.selectedTool;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  return {
    sync,
    openPicker,
    closePicker,
    isPickerOpen: () => pickerOpen,
  };
}

/* ------------------------------------------------------------ canvas paper */

let paperTexture = null;

function buildPaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#FFFCF4';
  g.fillRect(0, 0, w, h);

  // Deterministic grain so the sheet looks the same on every visit.
  let seed = 20240607;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  g.lineCap = 'round';
  for (let i = 0; i < 700; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 3 + rnd() * 10;
    const a = rnd() * Math.PI;
    g.strokeStyle = `rgba(158, 124, 86, ${(0.035 + rnd() * 0.05).toFixed(3)})`;
    g.lineWidth = 0.6 + rnd() * 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(166, 130, 90, ${(0.04 + rnd() * 0.06).toFixed(3)})`;
    g.fillRect(rnd() * w, rnd() * h, 1.2, 1.2);
  }

  // Quiet dot grid, like a sketch journal.
  g.fillStyle = 'rgba(172, 140, 104, 0.24)';
  for (let y = 40; y < h; y += 40) {
    for (let x = 40; x < w; x += 40) {
      g.beginPath();
      g.arc(x, y, 1.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Warm edges.
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.max(w, h) * 0.74);
  v.addColorStop(0, 'rgba(255, 238, 205, 0)');
  v.addColorStop(1, 'rgba(216, 180, 128, 0.17)');
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
  return c;
}

export function paintPaper(ctx, w, h) {
  if (!paperTexture || paperTexture.width !== w || paperTexture.height !== h) {
    paperTexture = buildPaper(w, h);
  }
  ctx.drawImage(paperTexture, 0, 0);
}

/* ----------------------------------------------------------- teacher pencil */

// Tip sits exactly on (x, y); the body leans up and to the left, as before.
export function paintTeacherPencil(ctx, x, y, opts = {}) {
  const crayon = opts.crayonColor || null;
  const HW = 13; // half width of the barrel
  ctx.save();
  ctx.translate(x, y);

  // Soft contact shadow on the paper.
  ctx.fillStyle = 'rgba(74, 52, 38, 0.16)';
  ctx.beginPath();
  ctx.ellipse(-3, 5, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(-0.55);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  const face = (cy) => {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-5, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(5, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, cy, 6.5, Math.PI * 0.16, Math.PI * 0.84);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 127, 127, 0.55)';
    ctx.beginPath();
    ctx.arc(-9.5, cy + 2, 2.4, 0, Math.PI * 2);
    ctx.arc(9.5, cy + 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  };

  if (crayon) {
    // Crayon in the colour the teacher is showing.
    ctx.fillStyle = crayon;
    ctx.beginPath();
    ctx.moveTo(-HW, -30);
    ctx.lineTo(-HW, -104);
    ctx.quadraticCurveTo(-HW, -110, -HW + 6, -110);
    ctx.lineTo(HW - 6, -110);
    ctx.quadraticCurveTo(HW, -110, HW, -104);
    ctx.lineTo(HW, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Tip.
    ctx.beginPath();
    ctx.moveTo(-HW + 2, -30);
    ctx.lineTo(-4, -4);
    ctx.quadraticCurveTo(0, 2, 4, -4);
    ctx.lineTo(HW - 2, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Paper wrapper.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.beginPath();
    ctx.rect(-HW, -86, HW * 2, 44);
    ctx.fill();
    ctx.stroke();
    // Shine.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-HW + 5, -100);
    ctx.lineTo(-HW + 5, -92);
    ctx.stroke();
    ctx.strokeStyle = INK;
    face(-62);
  } else {
    // Eraser.
    ctx.fillStyle = '#FF8FA3';
    ctx.beginPath();
    ctx.moveTo(-HW, -100);
    ctx.lineTo(-HW, -110);
    ctx.quadraticCurveTo(-HW, -117, -HW + 7, -117);
    ctx.lineTo(HW - 7, -117);
    ctx.quadraticCurveTo(HW, -117, HW, -110);
    ctx.lineTo(HW, -100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Metal band.
    ctx.fillStyle = '#D5DAE2';
    ctx.beginPath();
    ctx.rect(-HW, -101, HW * 2, 11);
    ctx.fill();
    ctx.stroke();
    // Wooden cone.
    ctx.fillStyle = '#F6DDB8';
    ctx.beginPath();
    ctx.moveTo(-HW, -30);
    ctx.lineTo(0, 0);
    ctx.lineTo(HW, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Graphite point.
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-4.4, -10);
    ctx.lineTo(0, 0);
    ctx.lineTo(4.4, -10);
    ctx.closePath();
    ctx.fill();
    // Painted barrel with a scalloped edge over the wood.
    ctx.fillStyle = '#FFCB45';
    ctx.beginPath();
    ctx.moveTo(-HW, -90);
    ctx.lineTo(HW, -90);
    ctx.lineTo(HW, -30);
    ctx.quadraticCurveTo(HW * 0.66, -22, HW / 3, -30);
    ctx.quadraticCurveTo(0, -22, -HW / 3, -30);
    ctx.quadraticCurveTo(-HW * 0.66, -22, -HW, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Light and dark faces of the barrel.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.fillRect(-HW + 3, -87, 5, 53);
    ctx.fillStyle = 'rgba(190, 110, 20, 0.22)';
    ctx.fillRect(HW - 7, -87, 5, 53);
    face(-58);
  }
  ctx.restore();
}

/* ------------------------------------------------- small canvas sprites */
// Optional helpers so marks drawn on the paper share the page's look
// (cream fill, brown ink outline, rounded letters). All sizes are canvas units.

const CANVAS_FONT =
  'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Nunito", "Comic Sans MS", system-ui, sans-serif';

// A paper label centred on (cx, cy), as wide as its text.
export function paintLabelPill(ctx, cx, cy, text) {
  ctx.save();
  ctx.font = `800 15px ${CANVAS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = Math.ceil(ctx.measureText(text).width) + 34;
  const h = 34;
  ctx.fillStyle = 'rgba(74, 52, 38, 0.2)';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2 + 4, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFCF4';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

// Green "go" dot for the start of a stroke: a white arrow instead of a word.
export function paintStartDot(ctx, x, y, r = 15) {
  ctx.save();
  ctx.fillStyle = '#3FAE63';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, y - r * 0.48);
  ctx.lineTo(x + r * 0.52, y);
  ctx.lineTo(x - r * 0.3, y + r * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Gold star for the end of a stroke.
export function paintFinishStar(ctx, x, y, r = 15) {
  ctx.save();
  ctx.fillStyle = '#FFCB45';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.46;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
