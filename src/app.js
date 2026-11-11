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
    ctx.roundRect(22, 22, CANVAS_W - 44, CANVAS_H - 44, 20);
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
    teacherHoldTimer: 1.0,
    teacherDemoDone: false,
    teacherSpeedPxPerSec: 28, // 5-year-old slow hand speed (~28 px/sec, min 12s per stroke)
    lastFrameMs: 0,
    lastPointerMs: 0,
    danceTime: 0,
    pointerDown: false,
    lastPt: null,
    lastDabPt: null,
    paintedCells: new Set(),
    strokeTargetDist: 0, // furthest arc-length (px) the child's finger has traced along the active stroke
    subtitleText: SUBTITLE_TEXTS.welcome,
  };

  // Area-based coloring coverage: a coarse grid of cells whose centers lie inside the active part.
  const COVER_CELL = 14;
  const coverageGridCache = {};
  function getCoverageGrid(partId) {
    const lesson = getLesson();
    const key = `${lesson.id}:${partId}`;
    if (coverageGridCache[key]) return coverageGridCache[key];
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    const g = c.getContext('2d');
    buildPartClipPath(g, lesson, partId);
    const cells = [];
    for (let cy = COVER_CELL / 2; cy < CANVAS_H; cy += COVER_CELL) {
      for (let cx = COVER_CELL / 2; cx < CANVAS_W; cx += COVER_CELL) {
        if (g.isPointInPath(cx, cy)) cells.push([cx, cy]);
      }
    }
    coverageGridCache[key] = cells;
    return cells;
  }
  function brushRadius(tool, partId) {
    if (partId === 'background_frame') return 48;
    return tool === 'watercolor' ? 42 : tool === 'glitter' ? 30 : tool === 'marker' ? 32 : 26;
  }
  function coverageGoal(partId) {
    return partId === 'background_frame' ? 25 : 80;
  }

  function resetTeacherDemo() {
    state.teacherPhase = 0;
    state.teacherHoldTimer = 1.0;
    state.teacherDemoDone = false;
  }

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
    state.strokeTargetDist = 0;
    state.colorStepIndex = 0;
    state.colorCoverage = 0;
    state.selectedColor = found.palette.base;
    state.selectedTool = 'crayon';
    resetTeacherDemo();
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
      state.strokeTargetDist = 0;
      resetTeacherDemo();
      syncUI();
      return;
    }

    // Move to next drawing step or transition to Coloring Phase!
    if (state.drawStepIndex + 1 < lesson.drawSteps.length) {
      state.drawStepIndex += 1;
      state.strokeSubIndex = 0;
      state.strokeProgress = 0;
      state.strokeTargetDist = 0;
      resetTeacherDemo();
      const nextDs = lesson.drawSteps[state.drawStepIndex];
      audio.speak(nextDs.voiceId, setSubtitle);
      syncUI();
    } else {
      // Transition to Phase 2: Step-by-Step Part-by-Part Coloring!
      state.phase = 'coloring';
      state.strokeSubIndex = 0;
      state.strokeProgress = 0;
      state.strokeTargetDist = 0;
      state.colorStepIndex = 0;
      state.colorCoverage = 0;
      state.lastDabPt = null;
      state.paintedCells = new Set();
      resetTeacherDemo();
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
    if (partId !== 'background_frame') {
      buildPartClipPath(pCtx, lesson, partId);
      pCtx.clip();
    }

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
      state.lastDabPt = null;
      state.paintedCells = new Set();
      resetTeacherDemo();
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

    // Require at least 18px of real finger/brush movement between counted dabs so a wiggle never skips a coloring step!
    if (state.lastDabPt) {
      const dabDist = Math.hypot(x - state.lastDabPt.x, y - state.lastDabPt.y);
      if (dabDist < 18) return;
    }
    state.lastDabPt = { x, y };

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

    // Coverage = share of the active part's own grid cells actually under the brush;
    // scribbles outside the lines touch zero part cells and therefore never count.
    const cells = getCoverageGrid(cs.partId);
    const r2 = brushRadius(state.selectedTool, cs.partId) ** 2;
    for (let i = 0; i < cells.length; i++) {
      const dx = cells[i][0] - x;
      const dy = cells[i][1] - y;
      if (dx * dx + dy * dy <= r2) state.paintedCells.add(i);
    }
    state.colorCoverage = Math.min(100, (100 * state.paintedCells.size) / Math.max(1, cells.length));
    if (Math.random() < 0.35) {
      audio.playTraceTick();
      spawnSparkles(x, y, color, 2);
    }
    syncUI();

    if (state.colorCoverage >= coverageGoal(cs.partId)) {
      state.pointerDown = false;
      state.lastDabPt = null;
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
      // The finger only sets a TARGET along the stroke (projection inside a forward window);
      // the ink itself crawls toward it at <= 38 px/s in renderEasel, so it can never rocket,
      // never stalls when a child traces faster, and rubbing in place does not advance it.
      const cum = getPolylineArcLengths(pts);
      const total = cum[cum.length - 1] || 1;
      const reached = Math.max(state.strokeProgress * total, state.strokeTargetDist);
      const lo = Math.max(0, reached - 24);
      const hi = Math.min(total, reached + 160);
      let bestD = -1;
      let bestGap = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        if (cum[i + 1] < lo || cum[i] > hi) continue;
        const ax = pts[i][0];
        const ay = pts[i][1];
        const vx = pts[i + 1][0] - ax;
        const vy = pts[i + 1][1] - ay;
        const l2 = vx * vx + vy * vy || 1e-9;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
        const d = cum[i] + t * (cum[i + 1] - cum[i]);
        if (d < lo || d > hi) continue;
        const gap = Math.hypot(ax + vx * t - x, ay + vy * t - y);
        if (gap < bestGap) {
          bestGap = gap;
          bestD = d;
        }
      }
      if (bestD >= 0 && bestGap <= 70) {
        state.strokeTargetDist = Math.max(state.strokeTargetDist, bestD);
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
      state.strokeTargetDist = 0;
      state.colorCoverage = 0;
      resetTeacherDemo();
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
      state.strokeProgress = 0;
      state.strokeTargetDist = 0;
      state.lastDabPt = null;
      state.paintedCells = new Set();
      resetTeacherDemo();
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

  function getPolylineArcLengths(pts) {
    if (!pts || pts.length === 0) return [0];
    const cum = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      cum.push(total);
    }
    return cum;
  }

  function getPolylineTotalLength(pts) {
    const cum = getPolylineArcLengths(pts);
    return cum[cum.length - 1] || 0;
  }

  function samplePointOnPolyline(pts, ratio = 0) {
    if (!pts || pts.length === 0) return [400, 320];
    if (pts.length === 1) return pts[0];
    const clamped = Math.max(0, Math.min(1, ratio));
    const cum = getPolylineArcLengths(pts);
    const total = cum[cum.length - 1];
    if (total <= 0) return pts[0];
    const targetDist = clamped * total;
    for (let i = 0; i < cum.length - 1; i++) {
      if (targetDist <= cum[i + 1] || i === cum.length - 2) {
        const segLen = Math.max(1e-6, cum[i + 1] - cum[i]);
        const frac = Math.max(0, Math.min(1, (targetDist - cum[i]) / segLen));
        const p0 = pts[i];
        const p1 = pts[i + 1];
        return [p0[0] + (p1[0] - p0[0]) * frac, p0[1] + (p1[1] - p0[1]) * frac];
      }
    }
    return pts[pts.length - 1];
  }

  function drawStrokePolyline(targetCtx, pts, ratio = 1.0, style = {}) {
    if (!pts || pts.length < 2 || ratio <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const cum = getPolylineArcLengths(pts);
    const total = cum[cum.length - 1];
    if (total <= 0) return;
    const targetDist = clamped * total;

    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < cum.length - 1; i++) {
      if (targetDist >= cum[i + 1]) {
        targetCtx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      } else if (targetDist > cum[i]) {
        const segLen = Math.max(1e-6, cum[i + 1] - cum[i]);
        const frac = (targetDist - cum[i]) / segLen;
        const p0 = pts[i];
        const p1 = pts[i + 1];
        targetCtx.lineTo(p0[0] + (p1[0] - p0[0]) * frac, p0[1] + (p1[1] - p0[1]) * frac);
        break;
      } else {
        break;
      }
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
    const ts = typeof nowMs === 'number' ? nowMs : performance.now();
    const dt = state.lastFrameMs > 0
      ? Math.min(0.05, Math.max(0.001, (ts - state.lastFrameMs) / 1000))
      : 1 / 60;
    state.lastFrameMs = ts;

    const lesson = getLesson();

    // True 5-year-old child slow demonstration speed (~28 px/sec along true pixel arc-length, min 12.0s pass!)
    const childActive = state.pointerDown ||
      (state.phase === 'drawing' && state.strokeProgress > 0) ||
      (state.phase === 'coloring' && state.colorCoverage > 0);
    if (childActive) {
      state.teacherDemoDone = true;
    } else if (!state.teacherDemoDone) {
      if (state.teacherHoldTimer > 0) {
        state.teacherHoldTimer = Math.max(0, state.teacherHoldTimer - dt);
      } else {
        let demoDurationSec = 14.0;
        if (state.phase === 'drawing') {
          const ds = lesson.drawSteps[state.drawStepIndex];
          const activePts = ds?.strokes?.[state.strokeSubIndex];
          const arcPx = getPolylineTotalLength(activePts);
          // 28 px/sec along true Euclidean arc-length (756.9px head takes 27.07s; tiny 9px sun rays take 3.5s)
          demoDurationSec = Math.max(3.5, arcPx / Math.max(15, state.teacherSpeedPxPerSec));
        } else if (state.phase === 'coloring') {
          demoDurationSec = 10.0;
        }
        state.teacherPhase += dt / demoDurationSec;
        if (state.teacherPhase >= 1.0) {
          state.teacherPhase = 1.0;
          state.teacherDemoDone = true;
        }
      }
    }
    state.danceTime += dt;

    // Child ink follows the finger's traced target at a steady 5-year-old pace (<= 38 px/s).
    if (state.phase === 'drawing') {
      const dsA = lesson.drawSteps[state.drawStepIndex];
      const ptsA = dsA?.strokes?.[state.strokeSubIndex];
      const totalA = getPolylineTotalLength(ptsA);
      if (totalA > 0) {
        const tipA = state.strokeProgress * totalA;
        if (state.strokeTargetDist > tipA + 0.01) {
          const nextA = Math.min(state.strokeTargetDist, tipA + 38 * dt);
          state.strokeProgress = Math.min(1, nextA / totalA);
          const meterFill = document.getElementById('step-meter-fill');
          const meterLabel = document.getElementById('step-meter-label');
          const pctA = Math.min(100, Math.round(((state.strokeSubIndex + state.strokeProgress) / dsA.strokes.length) * 100));
          if (meterFill) meterFill.style.width = `${pctA}%`;
          if (meterLabel) meterLabel.textContent = `${pctA}% Traced`;
          if (Math.random() < 0.06) {
            const sparkA = samplePointOnPolyline(ptsA, state.strokeProgress);
            audio.playTraceTick();
            spawnSparkles(sparkA[0], sparkA[1], '#FFD43B', 2);
          }
          if (state.strokeProgress >= 0.985) {
            state.pointerDown = false;
            advanceDrawingSubStroke();
          }
        }
      }
    }

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

    // 2. If in Coloring Phase, draw a calm spotlight outline around the ACTIVE part
    if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        ctx.save();
        buildPartClipPath(ctx, lesson, cs.partId);
        ctx.strokeStyle = cs.recommendedColor || '#FFD43B';
        ctx.lineWidth = 14;
        ctx.globalAlpha = 0.28 + Math.sin(state.danceTime * 2.2) * 0.08;
        ctx.stroke();
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = 0;
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.92;
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
            color: 'rgba(112, 72, 232, 0.50)',
            width: 11,
            dash: [16, 12],
            dashOffset: 0,
          });

          // During the ONE-TIME steady 5-year-old slow demonstration pass (28 px/sec, linear along true arc-length), show a soft preview trail
          const linearDemoT = Math.max(0, Math.min(1, state.teacherPhase));
          if (!state.teacherDemoDone && state.strokeProgress === 0) {
            drawStrokePolyline(ctx, activePts, linearDemoT, {
              color: 'rgba(255, 146, 43, 0.45)',
              width: 9,
            });
          }

          drawStrokePolyline(ctx, activePts, state.strokeProgress, {
            color: '#3B2314',
            width: 8,
          });

          const startPt = activePts[0];
          const endPt = activePts[activePts.length - 1];

          // Gold FINISH dot drawn first so Green START dot always sits on top on closed loops
          ctx.fillStyle = '#F59F00';
          ctx.beginPath();
          ctx.arc(endPt[0], endPt[1], 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', endPt[0], endPt[1]);

          // Green START dot (drawn on top of FINISH dot when startPt == endPt)
          ctx.fillStyle = '#2B8A3E';
          ctx.beginPath();
          ctx.arc(startPt[0], startPt[1], 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('START', startPt[0], startPt[1]);

          // Teacher pencil: glides at constant 5-year-old speed (28 px/sec) ONCE during !teacherDemoDone, then parks calmly at child's stroke tip (or START)
          const pencilRatio = !state.teacherDemoDone ? linearDemoT : state.strokeProgress;
          const pencilPt = samplePointOnPolyline(activePts, pencilRatio);
          renderTeacherPencil(ctx, pencilPt[0], pencilPt[1]);
        }
      }
    }

    // 5. If in Coloring Phase, draw a friendly floating pointer pill AND a slow 1-pass coloring teacher demonstration
    if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        const target = getPartTargetCenter(cs.partId);
        const bobY = Math.sin(state.danceTime * 1.4) * 2.0;
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

        if (!state.teacherDemoDone && state.colorCoverage === 0) {
          const demoT = Math.max(0, Math.min(1, state.teacherPhase));
          const partCells = getCoverageGrid(cs.partId);
          let demoWaypoints = [];
          if (partCells.length >= 6) {
            const wpCount = 7;
            for (let w = 0; w < wpCount; w++) {
              const idx = Math.min(
                partCells.length - 1,
                Math.floor(((w + 0.5) / wpCount) * partCells.length)
              );
              demoWaypoints.push(partCells[idx]);
            }
          } else {
            demoWaypoints = [
              [target.x - 36, target.y - 16],
              [target.x + 36, target.y],
              [target.x - 24, target.y + 18],
              [target.x + 28, target.y + 16],
            ];
          }
          ctx.save();
          buildPartClipPath(ctx, lesson, cs.partId);
          ctx.clip();
          drawStrokePolyline(ctx, demoWaypoints, demoT, {
            color: cs.recommendedColor || state.selectedColor || '#FFD43B',
            width: 24,
          });
          ctx.restore();
          const sweepPt = samplePointOnPolyline(demoWaypoints, demoT);
          renderTeacherPencil(ctx, sweepPt[0], sweepPt[1]);
        }
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
    btnVoiceReplay.addEventListener('click', () => {
      if (
        (state.phase === 'drawing' && state.strokeProgress === 0) ||
        (state.phase === 'coloring' && state.colorCoverage === 0)
      ) {
        resetTeacherDemo();
      }
      audio.replayLast(setSubtitle);
    });
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
    state.lastPointerMs = performance.now();
    const pt = toCanvasCoords(e);
    state.lastPt = pt;
    handlePointerMoveOnEasel(pt.x, pt.y);
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    const pt = toCanvasCoords(e);
    const consumed = handlePointerMoveOnEasel(pt.x, pt.y);
    if (consumed !== false) state.lastPt = pt;
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
        teacherPhase: state.teacherPhase,
        teacherHoldTimer: state.teacherHoldTimer,
        teacherDemoDone: state.teacherDemoDone,
        teacherSpeedPxPerSec: state.teacherSpeedPxPerSec,
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
      if (
        (state.phase === 'drawing' && state.strokeProgress === 0) ||
        (state.phase === 'coloring' && state.colorCoverage === 0)
      ) {
        resetTeacherDemo();
      }
      audio.replayLast(setSubtitle);
      return this.getState();
    },
  };

  selectCharacter('catnap', true);
  setSubtitle('welcome');
  requestAnimationFrame(renderEasel);
}
