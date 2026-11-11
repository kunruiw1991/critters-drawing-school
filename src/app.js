// Interactive Step-by-Step Simple Drawing & 7-Part Guided Coloring Engine
// for Smiling Critters Drawing & Coloring School!

import { CHARACTER_LESSONS, SWATCH_PALETTE } from './characters.js';
import { createAudioSystem } from './audio.js';

const STORAGE_KEY = 'critters_drawing_school_v1';
const CANVAS_W = 800;
const CANVAS_H = 640;

const SUBTITLE_TEXTS = {
  welcome: 'Welcome to Smiling Critters Drawing & Coloring School! Pick a friend to draw step by step!',
  draw_step_1: 'Drawing Step 1/6: Trace from the GREEN DOT to draw the big round head!',
  draw_step_2: 'Drawing Step 2/6: Awesome! Now trace the cute ears on top of the head!',
  draw_step_3: 'Drawing Step 3/6: Draw the two big oval eyes, muzzle patch, and cute nose!',
  draw_step_4: 'Drawing Step 4/6: Draw a giant happy Smiling Critter grin and cheek circles!',
  draw_step_5: 'Drawing Step 5/6: Trace the cozy round tummy, waving arms, and paws!',
  draw_step_6: 'Drawing Step 6/6: Last drawing step! Trace the magic necklace charm and tail!',
  draw_complete: 'Hooray! Drawing complete! Now let us learn how to color each part step by step!',
  color_step_1: 'Color Step 1/7 (Main Fur & Body): Brush inside the glowing lines to color the head, body & tail!',
  color_step_2: 'Color Step 2/7 (Inner Ears & Muzzle): Pick the soft lighter color and fill inside the ears & face!',
  color_step_3: 'Color Step 3/7 (Cozy Tummy Patch): Color the round belly oval and collar strap nice and neat!',
  color_step_4: 'Color Step 4/7 (Rosy Cheeks & Smile): Brush sweet pink onto both cheeks and the happy tongue!',
  color_step_5: 'Color Step 5/7 (Magic Necklace Charm): Color the special pendant with bright golden shine!',
  color_step_6: 'Color Step 6/7 (3D Shading & Eye Sparkles): Add soft shadow under the chin & sparkles in the eyes!',
  color_step_7: 'Color Step 7/7 (Background & Stickers): Color the sunny sky around your friend and add sparkles!',
  celebrate: 'Bravo, little artist! Your Smiling Critter drawing is alive and dancing!',
  pick_catnap: "Let's draw and color CatNap the Purple Moon Kitty!",
  pick_dogday: "Let's draw and color DogDay the Sunny Leader Pup!",
  pick_bobby: "Let's draw and color Bobby BearHug the Sweet Red Bear!",
  pick_hoppy: "Let's draw and color Hoppy Hopscotch the Bouncy Mint Bunny!",
  pick_craftycorn: "Let's draw and color CraftyCorn the Rainbow Artist Unicorn!",
  pick_pickypiggy: "Let's draw and color PickyPiggy the Happy Pink Piggy!",
  pick_bubba: "Let's draw and color Bubba Bubbaphant the Clever Blue Elephant!",
  pick_kickin: "Let's draw and color KickinChicken the Cool Star Chicken!",
  pick_rainbow: "Let's draw and color Rainbow Friend!",
  pick_cupcake: "Let's draw and color Berry Cupcake Bear!",
};

function tracePointsToPath(ctx, pts, close = false) {
  if (!pts || pts.length === 0) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  if (close) ctx.closePath();
}

function addEllipseSubpath(ctx, cx, cy, rx, ry, rot = 0) {
  ctx.moveTo(cx + Math.cos(rot) * rx, cy + Math.sin(rot) * rx);
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.closePath();
}

function buildPartClipPath(ctx, lesson, partId) {
  ctx.beginPath();
  if (partId === 'background_frame') {
    ctx.rect(0, 0, CANVAS_W, CANVAS_H);
    return;
  }
  if (partId === 'main_fur') {
    for (const s of lesson.ears.outer) {
      tracePointsToPath(ctx, s, true);
    }
    addEllipseSubpath(ctx, 400, 200, 136, 104, 0);
    addEllipseSubpath(ctx, 400, 422, 114, 116, 0);
    addEllipseSubpath(ctx, 256, 396, 48, 26, -0.35);
    addEllipseSubpath(ctx, 544, 396, 48, 26, 0.35);
    addEllipseSubpath(ctx, 342, 538, 42, 26, 0);
    addEllipseSubpath(ctx, 458, 538, 42, 26, 0);
    addEllipseSubpath(ctx, 548, 442, 48, 24, -0.45);
    return;
  }
  if (partId === 'inner_ears_muzzle') {
    for (const s of lesson.ears.inner) {
      tracePointsToPath(ctx, s, true);
    }
    addEllipseSubpath(ctx, 400, 244, 68, 40, 0);
    return;
  }
  if (partId === 'tummy_collar') {
    addEllipseSubpath(ctx, 400, 434, 74, 76, 0);
    ctx.roundRect(312, 310, 176, 24, 12);
    return;
  }
  if (partId === 'cheeks_mouth') {
    addEllipseSubpath(ctx, 296, 222, 20, 14, 0);
    addEllipseSubpath(ctx, 504, 222, 20, 14, 0);
    ctx.moveTo(348, 238);
    ctx.quadraticCurveTo(400, 260, 452, 238);
    ctx.quadraticCurveTo(400, 288, 348, 238);
    ctx.closePath();
    return;
  }
  if (partId === 'magic_pendant') {
    addEllipseSubpath(ctx, 400, 382, 34, 34, 0);
    return;
  }
  if (partId === 'shading_sparkles') {
    addEllipseSubpath(ctx, 400, 298, 92, 18, 0);
    addEllipseSubpath(ctx, 400, 504, 84, 22, 0);
    addEllipseSubpath(ctx, 342, 544, 30, 14, 0);
    addEllipseSubpath(ctx, 458, 544, 30, 14, 0);
    return;
  }
}

function getPartTargetCenter(partId) {
  switch (partId) {
    case 'main_fur':
      return { x: 400, y: 155, label: 'HEAD & BODY FUR' };
    case 'inner_ears_muzzle':
      return { x: 400, y: 228, label: 'INNER EARS & MUZZLE' };
    case 'tummy_collar':
      return { x: 400, y: 434, label: 'TUMMY PATCH & COLLAR' };
    case 'cheeks_mouth':
      return { x: 400, y: 266, label: 'CHEEKS & HAPPY GRIN' };
    case 'magic_pendant':
      return { x: 400, y: 382, label: 'MAGIC PENDANT CHARM' };
    case 'shading_sparkles':
      return { x: 400, y: 304, label: '3D SHADING & EYE SPARKLES' };
    case 'background_frame':
    default:
      return { x: 155, y: 120, label: 'SUNNY SKY & STICKERS' };
  }
}

export function initDrawingSchoolApp() {
  const audio = createAudioSystem();
  const canvas = document.getElementById('easel-canvas');
  const ctx = canvas.getContext('2d');

  // Offscreen per-part paint layers so each coloring step is cleanly layered
  const partOrder = [
    'background_frame',
    'main_fur',
    'inner_ears_muzzle',
    'tummy_collar',
    'cheeks_mouth',
    'shading_sparkles',
    'magic_pendant',
  ];
  const partCanvases = {};
  for (const pid of partOrder) {
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    partCanvases[pid] = c;
  }

  const state = {
    characterId: 'catnap',
    phase: 'drawing', // 'drawing' | 'coloring' | 'celebrate'
    drawStepIndex: 0, // 0..5
    strokeSubIndex: 0,
    strokeProgress: 0, // 0..1 on current sub-stroke
    colorStepIndex: 0, // 0..6
    colorCoverage: 0, // 0..100 for current coloring step
    selectedColor: '#9B5DE5',
    selectedTool: 'crayon', // 'crayon' | 'marker' | 'watercolor' | 'glitter'
    completedCharacters: [],
    stickers: [],
    sparkles: [],
    teacherPhase: 0,
    danceTime: 0,
    pointerDown: false,
    lastPt: null,
    subtitleText: SUBTITLE_TEXTS.welcome,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.completedCharacters)) {
        state.completedCharacters = parsed.completedCharacters;
      }
    }
  } catch (_) {}

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedCharacters: state.completedCharacters,
          lastCharacterId: state.characterId,
        })
      );
    } catch (_) {}
  }

  function getLesson() {
    return CHARACTER_LESSONS.find((c) => c.id === state.characterId) || CHARACTER_LESSONS[0];
  }

  function setSubtitle(voiceId) {
    const txt = SUBTITLE_TEXTS[voiceId] || voiceId;
    state.subtitleText = txt;
    const subEl = document.getElementById('voice-subtitle-text');
    if (subEl) subEl.textContent = txt;
  }

  function clearPartCanvases() {
    for (const pid of partOrder) {
      const c = partCanvases[pid];
      c.getContext('2d').clearRect(0, 0, CANVAS_W, CANVAS_H);
    }
    state.stickers = [];
  }

  function spawnSparkles(x, y, color = '#FFD43B', count = 8) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 1.4 + Math.random() * 3.2;
      state.sparkles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 0.8,
        color,
        life: 1.0,
        size: 5 + Math.random() * 6,
      });
    }
  }

  function syncUI() {
    const lesson = getLesson();

    // Update character buttons
    document.querySelectorAll('.char-pill').forEach((btn) => {
      const active = btn.dataset.charId === state.characterId;
      btn.classList.toggle('active', active);
      const done = state.completedCharacters.includes(btn.dataset.charId);
      btn.classList.toggle('done', done);
    });

    // Update phase badge & step banner
    const phaseBadge = document.getElementById('phase-badge');
    const stepTitle = document.getElementById('step-title');
    const stepHint = document.getElementById('step-hint');
    const meterFill = document.getElementById('step-meter-fill');
    const meterLabel = document.getElementById('step-meter-label');

    if (state.phase === 'drawing') {
      const ds = lesson.drawSteps[state.drawStepIndex] || lesson.drawSteps[0];
      const totalSub = ds.strokes.length;
      const pct = Math.min(
        100,
        Math.round(((state.strokeSubIndex + state.strokeProgress) / totalSub) * 100)
      );
      if (phaseBadge) phaseBadge.textContent = `✏️ DRAW STEP ${state.drawStepIndex + 1} OF 6`;
      if (stepTitle) stepTitle.textContent = ds.title;
      if (stepHint) stepHint.textContent = ds.hint;
      if (meterFill) meterFill.style.width = `${pct}%`;
      if (meterLabel) meterLabel.textContent = `${pct}% Traced`;
    } else if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex] || lesson.colorSteps[0];
      const pct = Math.min(100, Math.round(state.colorCoverage));
      if (phaseBadge) phaseBadge.textContent = `🎨 COLOR STEP ${state.colorStepIndex + 1} OF 7`;
      if (stepTitle) stepTitle.textContent = cs.title;
      if (stepHint) stepHint.textContent = cs.hint;
      if (meterFill) meterFill.style.width = `${pct}%`;
      if (meterLabel) meterLabel.textContent = `${pct}% Colored`;
    } else {
      if (phaseBadge) phaseBadge.textContent = `🎉 FINISHED MASTERPIECE!`;
      if (stepTitle) stepTitle.textContent = `${lesson.name} is Alive & Dancing!`;
      if (stepHint) stepHint.textContent = 'Tap Next Friend or Replay any step!';
      if (meterFill) meterFill.style.width = '100%';
      if (meterLabel) meterLabel.textContent = '100% Complete ⭐';
    }

    // Update 13-step ladder on the left
    const ladderEl = document.getElementById('step-ladder');
    if (ladderEl) {
      const items = [];
      lesson.drawSteps.forEach((ds, idx) => {
        const isDone = state.phase !== 'drawing' || idx < state.drawStepIndex;
        const isCurrent = state.phase === 'drawing' && idx === state.drawStepIndex;
        items.push(`
          <button class="ladder-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}"
                  data-jump-phase="drawing" data-jump-idx="${idx}">
            <span class="step-badge">${isDone ? '✓' : `D${idx + 1}`}</span>
            <span class="step-text">${ds.title.replace(/^Step \d+:\s*/, '')}</span>
          </button>
        `);
      });
      lesson.colorSteps.forEach((cs, idx) => {
        const isDone =
          state.phase === 'celebrate' || (state.phase === 'coloring' && idx < state.colorStepIndex);
        const isCurrent = state.phase === 'coloring' && idx === state.colorStepIndex;
        items.push(`
          <button class="ladder-step color-kind ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}"
                  data-jump-phase="coloring" data-jump-idx="${idx}">
            <span class="step-badge" style="background:${cs.recommendedColor}">${isDone ? '✓' : `C${idx + 1}`}</span>
            <span class="step-text">${cs.title.replace(/^Color Step \d+\/7:\s*/, '')}</span>
          </button>
        `);
      });
      ladderEl.innerHTML = items.join('');
      ladderEl.querySelectorAll('.ladder-step').forEach((btn) => {
        btn.addEventListener('click', () => {
          const jp = btn.dataset.jumpPhase;
          const ji = Number(btn.dataset.jumpIdx) || 0;
          jumpToPhase(jp, ji);
        });
      });
    }

    // Highlight recommended swatch & active tool
    const recColor =
      state.phase === 'coloring'
        ? lesson.colorSteps[state.colorStepIndex]?.recommendedColor
        : lesson.palette.base;
    document.querySelectorAll('.swatch-btn').forEach((btn) => {
      const hex = btn.dataset.color;
      btn.classList.toggle('selected', hex.toUpperCase() === state.selectedColor.toUpperCase());
      btn.classList.toggle(
        'recommended',
        Boolean(recColor && hex.toUpperCase() === recColor.toUpperCase())
      );
    });

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === state.selectedTool);
    });
  }

  function selectCharacter(charId, quiet = false) {
    const found = CHARACTER_LESSONS.find((c) => c.id === charId) || CHARACTER_LESSONS[0];
    state.characterId = found.id;
    state.phase = 'drawing';
    state.drawStepIndex = 0;
    state.strokeSubIndex = 0;
    state.strokeProgress = 0;
    state.colorStepIndex = 0;
    state.colorCoverage = 0;
    state.selectedColor = found.palette.base;
    state.selectedTool = 'crayon';
    clearPartCanvases();
    syncUI();
    if (!quiet) {
      audio.speak(found.voicePickId, setSubtitle);
    }
  }

  function advanceDrawingSubStroke() {
    const lesson = getLesson();
    const ds = lesson.drawSteps[state.drawStepIndex];
    if (!ds) return;
    audio.playStepComplete();
    const lastPts = ds.strokes[state.strokeSubIndex];
    if (lastPts && lastPts.length) {
      const endPt = lastPts[lastPts.length - 1];
      spawnSparkles(endPt[0], endPt[1], '#FFD43B', 14);
    }

    if (state.strokeSubIndex + 1 < ds.strokes.length) {
      state.strokeSubIndex += 1;
      state.strokeProgress = 0;
      syncUI();
      return;
    }

    // Move to next drawing step or transition to Coloring Phase!
    if (state.drawStepIndex + 1 < lesson.drawSteps.length) {
      state.drawStepIndex += 1;
      state.strokeSubIndex = 0;
      state.strokeProgress = 0;
      const nextDs = lesson.drawSteps[state.drawStepIndex];
      audio.speak(nextDs.voiceId, setSubtitle);
      syncUI();
    } else {
      // Transition to Phase 2: Step-by-Step Part-by-Part Coloring!
      state.phase = 'coloring';
      state.colorStepIndex = 0;
      state.colorCoverage = 0;
      const firstCs = lesson.colorSteps[0];
      state.selectedColor = firstCs.recommendedColor;
      state.selectedTool = firstCs.defaultTool;
      audio.playFanfare();
      audio.speak('color_step_1', setSubtitle);
      syncUI();
    }
  }

  function fillPartCanvasSolid(partId, colorHex) {
    const lesson = getLesson();
    const pCanvas = partCanvases[partId];
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    pCtx.save();
    pCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    buildPartClipPath(pCtx, lesson, partId);
    pCtx.clip();

    if (partId === 'background_frame') {
      const grad = pCtx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, colorHex);
      grad.addColorStop(0.72, '#FFFFFF');
      grad.addColorStop(1, '#D3F9D8');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Add cute floating stars/hearts on the background
      state.stickers = [
        { x: 115, y: 120, emoji: '⭐' },
        { x: 685, y: 125, emoji: '🌈' },
        { x: 105, y: 470, emoji: '💖' },
        { x: 695, y: 465, emoji: '✨' },
      ];
    } else if (partId === 'shading_sparkles') {
      pCtx.globalAlpha = 0.36;
      pCtx.fillStyle = colorHex;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      pCtx.fillStyle = colorHex;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Add subtle warm highlight sheen
      const sheen = pCtx.createRadialGradient(350, 170, 15, 400, 320, 260);
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      pCtx.fillStyle = sheen;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    pCtx.restore();
  }

  function advanceColoringStep() {
    const lesson = getLesson();
    const cs = lesson.colorSteps[state.colorStepIndex];
    if (!cs) return;

    // Ensure the finished part is 100% cleanly filled inside its lines
    fillPartCanvasSolid(cs.partId, state.selectedColor || cs.recommendedColor);
    const center = getPartTargetCenter(cs.partId);
    spawnSparkles(center.x, center.y, state.selectedColor || '#FFD43B', 18);
    audio.playStepComplete();

    if (state.colorStepIndex + 1 < lesson.colorSteps.length) {
      state.colorStepIndex += 1;
      state.colorCoverage = 0;
      const nextCs = lesson.colorSteps[state.colorStepIndex];
      state.selectedColor = nextCs.recommendedColor;
      state.selectedTool = nextCs.defaultTool;
      audio.speak(nextCs.voiceId, setSubtitle);
      syncUI();
    } else {
      state.phase = 'celebrate';
      state.colorCoverage = 100;
      if (!state.completedCharacters.includes(state.characterId)) {
        state.completedCharacters.push(state.characterId);
        saveProgress();
      }
      audio.playFanfare();
      audio.speak('celebrate', setSubtitle);
      syncUI();
    }
  }

  function paintBrushDab(x, y) {
    const lesson = getLesson();
    const cs = lesson.colorSteps[state.colorStepIndex];
    if (!cs) return;
    const pCanvas = partCanvases[cs.partId];
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');

    pCtx.save();
    buildPartClipPath(pCtx, lesson, cs.partId);
    pCtx.clip();

    const color = state.selectedColor || cs.recommendedColor;
    if (state.selectedTool === 'crayon') {
      pCtx.fillStyle = color;
      pCtx.globalAlpha = 0.85;
      for (let i = 0; i < 9; i++) {
        const ox = (Math.random() - 0.5) * 34;
        const oy = (Math.random() - 0.5) * 34;
        pCtx.beginPath();
        pCtx.arc(x + ox, y + oy, 12 + Math.random() * 8, 0, Math.PI * 2);
        pCtx.fill();
      }
    } else if (state.selectedTool === 'watercolor') {
      pCtx.fillStyle = color;
      pCtx.globalAlpha = cs.partId === 'shading_sparkles' ? 0.25 : 0.45;
      pCtx.beginPath();
      pCtx.arc(x, y, 42, 0, Math.PI * 2);
      pCtx.fill();
    } else if (state.selectedTool === 'glitter') {
      pCtx.fillStyle = color;
      pCtx.globalAlpha = 0.9;
      pCtx.beginPath();
      pCtx.arc(x, y, 30, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillStyle = '#FFF9DB';
      for (let i = 0; i < 4; i++) {
        const sx = x + (Math.random() - 0.5) * 38;
        const sy = y + (Math.random() - 0.5) * 38;
        pCtx.fillRect(sx - 2, sy - 2, 5, 5);
      }
    } else {
      // Smooth marker
      pCtx.fillStyle = color;
      pCtx.globalAlpha = 0.95;
      pCtx.beginPath();
      pCtx.arc(x, y, 32, 0, Math.PI * 2);
      pCtx.fill();
    }
    pCtx.restore();

    state.colorCoverage = Math.min(100, state.colorCoverage + 6.5);
    if (Math.random() < 0.35) {
      audio.playTraceTick();
      spawnSparkles(x, y, color, 2);
    }
    syncUI();

    if (state.colorCoverage >= 65) {
      state.pointerDown = false;
      advanceColoringStep();
    }
  }

  function handlePointerMoveOnEasel(x, y) {
    const lesson = getLesson();
    if (state.phase === 'drawing') {
      const ds = lesson.drawSteps[state.drawStepIndex];
      if (!ds) return;
      const pts = ds.strokes[state.strokeSubIndex];
      if (!pts || pts.length < 2) return;

      const curIdx = Math.min(pts.length - 1, Math.floor(state.strokeProgress * (pts.length - 1)));
      const targetPt = pts[curIdx];
      const dist = Math.hypot(x - targetPt[0], y - targetPt[1]);

      // Kid-forgiving magnetic radius (135px) or any drag motion across the canvas
      const stepIncrement = dist <= 145 ? 0.085 : 0.045;
      state.strokeProgress = Math.min(1, state.strokeProgress + stepIncrement);
      const newIdx = Math.min(pts.length - 1, Math.floor(state.strokeProgress * (pts.length - 1)));
      const sparkPt = pts[newIdx];
      if (Math.random() < 0.45) {
        audio.playTraceTick();
        spawnSparkles(sparkPt[0], sparkPt[1], '#FFD43B', 2);
      }
      syncUI();

      if (state.strokeProgress >= 0.96) {
        state.pointerDown = false;
        advanceDrawingSubStroke();
      }
    } else if (state.phase === 'coloring') {
      paintBrushDab(x, y);
    } else if (state.phase === 'celebrate') {
      spawnSparkles(x, y, '#FF6B9D', 10);
      audio.playTraceTick();
    }
  }

  function autoCompleteCurrentStep() {
    if (state.phase === 'drawing') {
      const lesson = getLesson();
      const ds = lesson.drawSteps[state.drawStepIndex];
      if (ds && ds.strokes && ds.strokes.length > 0) {
        state.strokeSubIndex = ds.strokes.length - 1;
      }
      state.strokeProgress = 1;
      advanceDrawingSubStroke();
    } else if (state.phase === 'coloring') {
      state.colorCoverage = 100;
      advanceColoringStep();
    } else {
      // Advance to next character
      const idx = CHARACTER_LESSONS.findIndex((c) => c.id === state.characterId);
      const next = CHARACTER_LESSONS[(idx + 1) % CHARACTER_LESSONS.length];
      selectCharacter(next.id);
    }
  }

  function jumpToPhase(targetPhase, stepIdx = 0) {
    const lesson = getLesson();
    if (targetPhase === 'drawing') {
      clearPartCanvases();
      state.phase = 'drawing';
      state.drawStepIndex = Math.max(0, Math.min(lesson.drawSteps.length - 1, stepIdx));
      state.strokeSubIndex = 0;
      state.strokeProgress = 0;
      audio.speak(lesson.drawSteps[state.drawStepIndex].voiceId, setSubtitle);
      syncUI();
      return;
    }
    if (targetPhase === 'coloring') {
      clearPartCanvases();
      state.phase = 'coloring';
      const clampedIdx = Math.max(0, Math.min(lesson.colorSteps.length - 1, stepIdx));
      for (let i = 0; i < clampedIdx; i++) {
        const cs = lesson.colorSteps[i];
        fillPartCanvasSolid(cs.partId, cs.recommendedColor);
      }
      state.colorStepIndex = clampedIdx;
      state.colorCoverage = 0;
      const curCs = lesson.colorSteps[clampedIdx];
      state.selectedColor = curCs.recommendedColor;
      state.selectedTool = curCs.defaultTool;
      audio.speak(curCs.voiceId, setSubtitle);
      syncUI();
      return;
    }
    if (targetPhase === 'celebrate') {
      clearPartCanvases();
      for (const cs of lesson.colorSteps) {
        fillPartCanvasSolid(cs.partId, cs.recommendedColor);
      }
      state.phase = 'celebrate';
      state.colorCoverage = 100;
      audio.speak('celebrate', setSubtitle);
      syncUI();
    }
  }

  function drawStrokePolyline(targetCtx, pts, ratio = 1.0, style = {}) {
    if (!pts || pts.length < 2 || ratio <= 0) return;
    const maxIdx = Math.max(1, Math.floor((pts.length - 1) * Math.min(1, ratio)));
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= maxIdx; i++) {
      targetCtx.lineTo(pts[i][0], pts[i][1]);
    }
    targetCtx.strokeStyle = style.color || '#3B2314';
    targetCtx.lineWidth = style.width || 7;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    if (style.dash) {
      targetCtx.setLineDash(style.dash);
      targetCtx.lineDashOffset = style.dashOffset || 0;
    }
    targetCtx.stroke();
    targetCtx.restore();
  }

  function renderTeacherPencil(targetCtx, x, y) {
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(-0.55);
    // Pencil tip cone
    targetCtx.fillStyle = '#FFE066';
    targetCtx.beginPath();
    targetCtx.moveTo(0, 0);
    targetCtx.lineTo(12, -26);
    targetCtx.lineTo(-12, -26);
    targetCtx.closePath();
    targetCtx.fill();
    // Pencil lead
    targetCtx.fillStyle = '#FA5252';
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 5, 0, Math.PI * 2);
    targetCtx.fill();
    // Pencil barrel
    targetCtx.fillStyle = '#FF922B';
    targetCtx.fillRect(-12, -74, 24, 48);
    // Eraser cap
    targetCtx.fillStyle = '#FF85C0';
    targetCtx.fillRect(-12, -88, 24, 14);
    targetCtx.restore();
  }

  function renderEasel(nowMs) {
    const dt = 1 / 60;
    state.teacherPhase = (state.teacherPhase + dt * 0.55) % 1;
    state.danceTime += dt;

    const lesson = getLesson();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Cream sketchbook paper background with subtle notebook grid
    ctx.fillStyle = '#FFFDF7';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(220, 205, 185, 0.28)';
    ctx.lineWidth = 1;
    for (let gx = 40; gx < CANVAS_W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, CANVAS_H);
      ctx.stroke();
    }
    for (let gy = 40; gy < CANVAS_H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(CANVAS_W, gy);
      ctx.stroke();
    }

    ctx.save();
    if (state.phase === 'celebrate') {
      const bounceY = Math.sin(state.danceTime * 5.2) * 12;
      const sway = Math.sin(state.danceTime * 2.8) * 0.045;
      ctx.translate(400, 340 + bounceY);
      ctx.rotate(sway);
      ctx.translate(-400, -340);
    }

    // 1. Composite all colored part layers underneath the ink lines
    if (state.phase === 'coloring' || state.phase === 'celebrate') {
      for (const pid of partOrder) {
        ctx.drawImage(partCanvases[pid], 0, 0);
      }
      // Draw background stickers if any
      ctx.font = '44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < state.stickers.length; i++) {
        const st = state.stickers[i];
        const bob = Math.sin(state.danceTime * 3 + i) * 6;
        ctx.fillText(st.emoji, st.x, st.y + bob);
      }
    }

    // 2. If in Coloring Phase, draw a pulsing spotlight outline around the ACTIVE part
    if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        ctx.save();
        buildPartClipPath(ctx, lesson, cs.partId);
        ctx.strokeStyle = cs.recommendedColor || '#FFD43B';
        ctx.lineWidth = 14 + Math.sin(state.danceTime * 6) * 4;
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -state.danceTime * 40;
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.95;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw completed ink steps
    const completedDrawStepCount =
      state.phase === 'drawing' ? state.drawStepIndex : lesson.drawSteps.length;
    for (let sIdx = 0; sIdx < completedDrawStepCount; sIdx++) {
      const ds = lesson.drawSteps[sIdx];
      for (const strokePts of ds.strokes) {
        drawStrokePolyline(ctx, strokePts, 1.0, { color: '#3B2314', width: 7 });
      }
    }

    // Fill eye pupils & eye sparkle catchlights once Step 3 (eyes & nose) is drawn
    if (completedDrawStepCount >= 3) {
      ctx.fillStyle = '#21183C';
      ctx.beginPath();
      addEllipseSubpath(ctx, 344, 178, 16, 21, 0);
      addEllipseSubpath(ctx, 456, 178, 16, 21, 0);
      addEllipseSubpath(ctx, 400, 220, 11, 8, 0);
      ctx.fill();

      // White eye catchlights (separate subpaths so no line connects them!)
      const bigCatch = state.phase === 'celebrate' || state.colorStepIndex >= 5 ? 8 : 6;
      ctx.fillStyle = '#FFFFFF';
      for (const [cx, cy, r] of [
        [338, 170, bigCatch],
        [450, 170, bigCatch],
        [351, 186, 3.8],
        [463, 186, 3.8],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. If in Drawing Phase, render the active step's sub-strokes, guide dots & teacher pencil
    if (state.phase === 'drawing') {
      const ds = lesson.drawSteps[state.drawStepIndex];
      if (ds) {
        // Already finished sub-strokes of current step
        for (let sub = 0; sub < state.strokeSubIndex; sub++) {
          drawStrokePolyline(ctx, ds.strokes[sub], 1.0, { color: '#3B2314', width: 7 });
        }
        // Remaining preview sub-strokes in faint lavender
        for (let sub = state.strokeSubIndex + 1; sub < ds.strokes.length; sub++) {
          drawStrokePolyline(ctx, ds.strokes[sub], 1.0, {
            color: 'rgba(155, 93, 229, 0.25)',
            width: 5,
            dash: [10, 10],
          });
        }
        // Active sub-stroke guide path + traced portion + teacher pencil
        const activePts = ds.strokes[state.strokeSubIndex];
        if (activePts && activePts.length >= 2) {
          drawStrokePolyline(ctx, activePts, 1.0, {
            color: 'rgba(112, 72, 232, 0.55)',
            width: 11,
            dash: [16, 12],
            dashOffset: -state.danceTime * 45,
          });
          drawStrokePolyline(ctx, activePts, state.strokeProgress, {
            color: '#3B2314',
            width: 8,
          });

          const startPt = activePts[0];
          const endPt = activePts[activePts.length - 1];

          // Green START dot
          ctx.fillStyle = '#2B8A3E';
          ctx.beginPath();
          ctx.arc(startPt[0], startPt[1], 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('START', startPt[0], startPt[1]);

          // Gold FINISH dot
          ctx.fillStyle = '#F59F00';
          ctx.beginPath();
          ctx.arc(endPt[0], endPt[1], 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('★', endPt[0], endPt[1]);

          // Floating teacher demo pencil along the active stroke
          const demoIdx = Math.min(
            activePts.length - 1,
            Math.floor(state.teacherPhase * (activePts.length - 1))
          );
          const demoPt = activePts[demoIdx];
          renderTeacherPencil(ctx, demoPt[0], demoPt[1]);
        }
      }
    }

    // 5. If in Coloring Phase, draw a friendly floating pointer pill over the active part
    if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        const target = getPartTargetCenter(cs.partId);
        const bobY = Math.sin(state.danceTime * 5) * 6;
        ctx.save();
        ctx.fillStyle = 'rgba(33, 24, 60, 0.86)';
        ctx.beginPath();
        ctx.roundRect(target.x - 115, target.y - 54 + bobY, 230, 34, 17);
        ctx.fill();
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#FFF9DB';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🖌️ ${target.label}`, target.x, target.y - 37 + bobY);
        ctx.restore();
      }
    }

    ctx.restore();

    // 6. Update & draw sparkles
    for (let i = state.sparkles.length - 1; i >= 0; i--) {
      const sp = state.sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= 0.035;
      if (sp.life <= 0) {
        state.sparkles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderEasel);
  }

  // Wire DOM controls
  const charStrip = document.getElementById('character-strip');
  if (charStrip) {
    charStrip.innerHTML = CHARACTER_LESSONS.map(
      (c) => `
      <button class="char-pill" data-char-id="${c.id}" id="btn-char-${c.id}">
        <span class="char-emoji">${c.emoji}</span>
        <span class="char-name">${c.name}</span>
      </button>
    `
    ).join('');
    charStrip.querySelectorAll('.char-pill').forEach((btn) => {
      btn.addEventListener('click', () => selectCharacter(btn.dataset.charId));
    });
  }

  const swatchGrid = document.getElementById('swatch-grid');
  if (swatchGrid) {
    swatchGrid.innerHTML = SWATCH_PALETTE.map(
      (sw, idx) => `
      <button class="swatch-btn" data-color="${sw.hex}" id="btn-swatch-${idx}"
              style="background:${sw.hex}" title="${sw.name}" aria-label="${sw.name}">
      </button>
    `
    ).join('');
    swatchGrid.querySelectorAll('.swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedColor = btn.dataset.color;
        audio.playTraceTick();
        syncUI();
      });
    });
  }

  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedTool = btn.dataset.tool;
      audio.playTraceTick();
      syncUI();
    });
  });

  const btnAutoStep = document.getElementById('btn-auto-step');
  if (btnAutoStep) {
    btnAutoStep.addEventListener('click', () => autoCompleteCurrentStep());
  }

  const btnFillPart = document.getElementById('btn-fill-part');
  if (btnFillPart) {
    btnFillPart.addEventListener('click', () => {
      if (state.phase === 'coloring') {
        state.colorCoverage = 100;
        advanceColoringStep();
      } else {
        autoCompleteCurrentStep();
      }
    });
  }

  const btnVoiceReplay = document.getElementById('btn-voice-replay');
  if (btnVoiceReplay) {
    btnVoiceReplay.addEventListener('click', () => audio.replayLast(setSubtitle));
  }

  const btnNextChar = document.getElementById('btn-next-char');
  if (btnNextChar) {
    btnNextChar.addEventListener('click', () => {
      const idx = CHARACTER_LESSONS.findIndex((c) => c.id === state.characterId);
      const next = CHARACTER_LESSONS[(idx + 1) % CHARACTER_LESSONS.length];
      selectCharacter(next.id);
    });
  }

  function toCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * CANVAS_W,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * CANVAS_H,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    state.pointerDown = true;
    const pt = toCanvasCoords(e);
    state.lastPt = pt;
    handlePointerMoveOnEasel(pt.x, pt.y);
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    const pt = toCanvasCoords(e);
    handlePointerMoveOnEasel(pt.x, pt.y);
    state.lastPt = pt;
  });

  window.addEventListener('pointerup', () => {
    state.pointerDown = false;
  });

  // Expose QA seam on window.__DRAW_SCHOOL__
  window.__DRAW_SCHOOL__ = {
    getState() {
      const lesson = getLesson();
      return {
        characterId: state.characterId,
        characterName: lesson.name,
        phase: state.phase,
        drawStepIndex: state.drawStepIndex,
        drawStepCount: lesson.drawSteps.length,
        strokeSubIndex: state.strokeSubIndex,
        strokeProgress: state.strokeProgress,
        colorStepIndex: state.colorStepIndex,
        colorStepCount: lesson.colorSteps.length,
        currentColorPartId: lesson.colorSteps[state.colorStepIndex]?.partId || null,
        colorCoverage: state.colorCoverage,
        selectedColor: state.selectedColor,
        selectedTool: state.selectedTool,
        completedCharacters: [...state.completedCharacters],
        subtitleText: state.subtitleText,
        audio: audio.getState(),
        totalCharacters: CHARACTER_LESSONS.length,
      };
    },
    selectCharacter(id) {
      selectCharacter(id, false);
      return this.getState();
    },
    autoCompleteCurrentStep() {
      autoCompleteCurrentStep();
      return this.getState();
    },
    jumpToPhase(phase, idx = 0) {
      jumpToPhase(phase, idx);
      return this.getState();
    },
    replayVoice() {
      audio.replayLast(setSubtitle);
      return this.getState();
    },
  };

  selectCharacter('catnap', true);
  setSubtitle('welcome');
  requestAnimationFrame(renderEasel);
}
