// Interactive Step-by-Step Simple Drawing & 7-Part Guided Coloring Engine
// for Smiling Critters Drawing & Coloring School!

import { CHARACTER_LESSONS, SWATCH_PALETTE } from './characters.js';
import { createAudioSystem } from './audio.js';
import {
  createSketchbookUI,
  paintLabelPill,
  paintPaper,
  paintTeacherPencil,
} from './ui.js';

const STORAGE_KEY = 'critters_drawing_school_v1';
const CANVAS_W = 800;
const CANVAS_H = 640;

const SUBTITLE_TEXTS = {
  welcome: 'Welcome to Smiling Critters Drawing & Coloring School! Pick a friend to draw step by step!',
  draw_step_1: 'Drawing Step 1/6: Watch the pencil slowly draw the big round head, or trace along!',
  draw_step_2: 'Drawing Step 2/6: Awesome! Now trace the cute ears on top of the head!',
  draw_step_3: 'Drawing Step 3/6: Draw the two big expressive eyes and cute nose!',
  draw_step_4: 'Drawing Step 4/6: Draw a giant happy Smiling Critter grin and tongue!',
  draw_step_5: 'Drawing Step 5/6: Trace the cozy tummy, arms, hands, and paws!',
  draw_step_6: 'Drawing Step 6/6: Last drawing step! Trace the magic necklace charm and tail!',
  draw_complete: 'Hooray! Drawing complete! Now let us learn how to color each part step by step!',
  color_step_1: 'Color Step 1/7 (Main Fur & Body): Brush inside the glowing lines to color the main coat!',
  color_step_2: 'Color Step 2/7 (Ears & Accents): Pick the recommended color and fill inside the lines!',
  color_step_3: 'Color Step 3/7 (Cozy Tummy & Paws): Color the tummy, paws, and collar nice and neat!',
  color_step_4: 'Color Step 4/7 (Happy Tongue & Details): Brush bright color onto the happy tongue!',
  color_step_5: 'Color Step 5/7 (Magic Necklace Charm): Color the special pendant with bright shine!',
  color_step_6: 'Color Step 6/7 (Velvet Smile & Eye Sparkles): Fill the wide smile and pupils so the eyes sparkle!',
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
};

function tracePointsToPath(ctx, pts, close = false) {
  if (!pts || pts.length === 0) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  if (close) ctx.closePath();
}

function buildPartClipPath(ctx, lesson, partId) {
  ctx.beginPath();
  const rings = lesson?.regions?.[partId];
  if (rings && rings.length > 0) {
    for (const ring of rings) {
      tracePointsToPath(ctx, ring, true);
    }
    return;
  }
  if (partId === 'background_frame') {
    ctx.roundRect(20, 20, CANVAS_W - 40, CANVAS_H - 40, 20);
  }
}

function getPartTargetCenter(lesson, partId) {
  const cs = lesson?.colorSteps?.find((s) => s.partId === partId);
  const pt = cs?.targetCenter || lesson?.targets?.[partId];
  const shortLabel = cs?.title
    ? cs.title.replace(/^Color Step \d+\/\d+:\s*/i, '').toUpperCase()
    : partId.replace(/_/g, ' ').toUpperCase();
  if (pt && pt.length >= 2) {
    return { x: pt[0], y: pt[1], label: shortLabel };
  }
  return { x: 400, y: 320, label: shortLabel };
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
  const partFilledColors = {};
  for (const pid of partOrder) {
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    partCanvases[pid] = c;
  }

  // Pixel-locked 800x640 colored reference canvases built from assets/colored/*_colored.png
  const coloredFillCanvases = {};
  const coloredFillLoading = {};
  const sameHexColor = (a, b) =>
    Boolean(a && b && String(a).trim().toUpperCase() === String(b).trim().toUpperCase());

  function ensureColoredFillCanvas(lesson) {
    if (!lesson || !lesson.coloredArt || !lesson.coloredRect) return null;
    if (coloredFillCanvases[lesson.id]) return coloredFillCanvases[lesson.id];
    if (!coloredFillLoading[lesson.id]) {
      coloredFillLoading[lesson.id] = true;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = CANVAS_W;
        c.height = CANVAS_H;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, CANVAS_W, CANVAS_H);
        const { dx, dy, dw, dh } = lesson.coloredRect;
        g.drawImage(img, dx, dy, dw, dh);
        // Dilate bright region colors 3px into dark outline pixels (using snapshot per pass so it never cascades!)
        const id = g.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const d = id.data;
        for (let pass = 0; pass < 3; pass++) {
          const src = new Uint8ClampedArray(d);
          for (let y = 1; y < CANVAS_H - 1; y++) {
            for (let x = 1; x < CANVAS_W - 1; x++) {
              const o = (y * CANVAS_W + x) * 4;
              if (src[o] + src[o + 1] + src[o + 2] < 180) {
                const nbs = [o - 4, o + 4, o - CANVAS_W * 4, o + CANVAS_W * 4];
                for (let k = 0; k < 4; k++) {
                  const nb = nbs[k];
                  if (src[nb] + src[nb + 1] + src[nb + 2] >= 180) {
                    d[o] = src[nb];
                    d[o + 1] = src[nb + 1];
                    d[o + 2] = src[nb + 2];
                    break;
                  }
                }
              }
            }
          }
        }
        g.putImageData(id, 0, 0);
        coloredFillCanvases[lesson.id] = c;
        // Refresh any already-filled part layers for this character
        if (state.characterId === lesson.id) {
          for (const pid of Object.keys(partFilledColors)) {
            fillPartCanvasSolid(pid, partFilledColors[pid]);
          }
        }
      };
      img.src = lesson.coloredArt;
    }
    return null;
  }

  // Free Play Mode: pixel-exact boundary-locked coloring built directly from assets/lineart/*_line_art.png
  const N_PIXELS = CANVAS_W * CANVAS_H;
  const freePlayDataCache = {};
  const freePlayLoading = {};
  const freePlayPaintCanvases = {};
  const FREEPLAY_RADII = { crayon: 22, marker: 30, watercolor: 38, glitter: 28 };
  const FREEPLAY_ALPHA = { crayon: 0.9, marker: 0.96, watercolor: 0.56, glitter: 0.94 };

  function parseHexRgb(hex) {
    const clean = String(hex || '#9B5DE5').trim().replace(/^#/, '');
    const n = parseInt(clean.length === 6 ? clean : '9B5DE5', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getFreePlayPaintCanvas(charId) {
    if (!freePlayPaintCanvases[charId]) {
      const c = document.createElement('canvas');
      c.width = CANVAS_W;
      c.height = CANVAS_H;
      c.getContext('2d', { willReadFrequently: true });
      freePlayPaintCanvases[charId] = c;
    }
    return freePlayPaintCanvases[charId];
  }

  function buildFreePlayDataFromImage(lesson, img) {
    const lc = document.createElement('canvas');
    lc.width = CANVAS_W;
    lc.height = CANVAS_H;
    const lg = lc.getContext('2d');
    lg.fillStyle = '#FFFFFF';
    lg.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const r = lesson.coloredRect;
    lg.drawImage(img, r.dx, r.dy, r.dw, r.dh);

    // Measure on the exact Frame-1 paper+multiply composite so visible cores and fringe match pixel-for-pixel
    const baseC = document.createElement('canvas');
    baseC.width = CANVAS_W;
    baseC.height = CANVAS_H;
    const bg = baseC.getContext('2d', { willReadFrequently: true });
    paintPaper(bg, CANVAS_W, CANVAS_H);
    bg.save();
    bg.globalCompositeOperation = 'multiply';
    bg.drawImage(lc, 0, 0);
    bg.restore();
    const d0 = bg.getImageData(0, 0, CANVAS_W, CANVAS_H).data;

    const isPaper = new Uint8Array(N_PIXELS);
    for (let p = 0, o = 0; p < N_PIXELS; p++, o += 4) {
      const lum = 0.2126 * d0[o] + 0.7152 * d0[o + 1] + 0.0722 * d0[o + 2];
      if (lum >= 196) isPaper[p] = 1;
    }

    // 4-connected components over paper pixels
    const lab = new Int32Array(N_PIXELS);
    const stack = new Int32Array(N_PIXELS);
    const areas = [0];
    let nextId = 0;
    for (let s = 0; s < N_PIXELS; s++) {
      if (!isPaper[s] || lab[s]) continue;
      nextId += 1;
      let sp = 0;
      let area = 0;
      stack[sp++] = s;
      lab[s] = nextId;
      while (sp > 0) {
        const p = stack[--sp];
        area += 1;
        const x = p % CANVAS_W;
        if (x > 0 && isPaper[p - 1] && !lab[p - 1]) { lab[p - 1] = nextId; stack[sp++] = p - 1; }
        if (x < CANVAS_W - 1 && isPaper[p + 1] && !lab[p + 1]) { lab[p + 1] = nextId; stack[sp++] = p + 1; }
        if (p >= CANVAS_W && isPaper[p - CANVAS_W] && !lab[p - CANVAS_W]) { lab[p - CANVAS_W] = nextId; stack[sp++] = p - CANVAS_W; }
        if (p < N_PIXELS - CANVAS_W && isPaper[p + CANVAS_W] && !lab[p + CANVAS_W]) { lab[p + CANVAS_W] = nextId; stack[sp++] = p + CANVAS_W; }
      }
      areas.push(area);
    }

    // Merge tiny enclosed specks (< 40px) into their nearest real region (>= 40px)
    for (let p = 0; p < N_PIXELS; p++) {
      if (lab[p] && areas[lab[p]] < 40) lab[p] = 0;
    }

    // Multi-source city-block BFS from all real regions (>= 40px)
    const dist = new Int32Array(N_PIXELS).fill(-1);
    const own = new Int32Array(N_PIXELS);
    const qd = new Int32Array(N_PIXELS);
    let qh = 0;
    let qt = 0;
    for (let p = 0; p < N_PIXELS; p++) {
      if (lab[p]) {
        dist[p] = 0;
        own[p] = lab[p];
        qd[qt++] = p;
      }
    }
    while (qh < qt) {
      const p = qd[qh++];
      const x = p % CANVAS_W;
      const dNext = dist[p] + 1;
      if (x > 0 && dist[p - 1] < 0) { dist[p - 1] = dNext; own[p - 1] = own[p]; qd[qt++] = p - 1; }
      if (x < CANVAS_W - 1 && dist[p + 1] < 0) { dist[p + 1] = dNext; own[p + 1] = own[p]; qd[qt++] = p + 1; }
      if (p >= CANVAS_W && dist[p - CANVAS_W] < 0) { dist[p - CANVAS_W] = dNext; own[p - CANVAS_W] = own[p]; qd[qt++] = p - CANVAS_W; }
      if (p < N_PIXELS - CANVAS_W && dist[p + CANVAS_W] < 0) { dist[p + CANVAS_W] = dNext; own[p + CANVAS_W] = own[p]; qd[qt++] = p + CANVAS_W; }
    }

    const regionMap = new Int32Array(N_PIXELS);
    for (let p = 0; p < N_PIXELS; p++) {
      if (isPaper[p] || (dist[p] >= 0 && dist[p] <= 8)) {
        regionMap[p] = own[p];
      }
    }

    return { lineCanvas: lc, regionMap, regionCount: nextId };
  }

  function ensureFreePlayData(lesson) {
    if (!lesson || !lesson.lineArt || !lesson.coloredRect) return null;
    if (freePlayDataCache[lesson.id]) return freePlayDataCache[lesson.id];
    if (!freePlayLoading[lesson.id]) {
      const retryAfter = freePlayRetryAfterMs[lesson.id] || 0;
      if (performance.now() < retryAfter) return null;
      freePlayLoading[lesson.id] = true;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        freePlayFailCount[lesson.id] = 0;
        freePlayRetryAfterMs[lesson.id] = 0;
        freePlayDataCache[lesson.id] = buildFreePlayDataFromImage(lesson, img);
      };
      img.onerror = () => {
        const fails = (freePlayFailCount[lesson.id] || 0) + 1;
        freePlayFailCount[lesson.id] = fails;
        freePlayRetryAfterMs[lesson.id] = performance.now() + Math.min(8000, 500 * 2 ** (fails - 1));
        freePlayLoading[lesson.id] = false;
      };
      img.src = lesson.lineArt;
    }
    return null;
  }

  const freePlayRetryAfterMs = {};
  const freePlayFailCount = {};
  const freePlayUndoBackupCanvases = {};
  const savedLessonSnapshots = {};

  const state = {
    mode: 'guided', // 'guided' | 'freeplay'
    characterId: 'catnap',
    phase: 'drawing', // 'drawing' | 'coloring' | 'celebrate' | 'freeplay'
    drawStepIndex: 0, // 0..5
    strokeSubIndex: 0,
    strokeProgress: 0, // 0..1 on current sub-stroke
    colorStepIndex: 0, // 0..6
    colorCoverage: 0, // 0..100 for current coloring step
    selectedColor: '#944EE8',
    selectedTool: 'crayon', // 'crayon' | 'marker' | 'watercolor' | 'glitter'
    completedCharacters: [],
    stickers: [],
    sparkles: [],
    teacherPhase: 0,
    teacherHoldTimer: 0.45,
    strokeEndTimer: 0,
    teacherDemoDone: false,
    stepWaitingNext: false, // Pauses at end of each step & pops up top-right Next Step button
    confirmingClear: false, // 2-tap confirmation guard before wiping Free Play page
    confirmClearArmedAt: 0,
    canUndoClear: false,
    teacherSpeedPxPerSec: 28, // 5-year-old slow hand speed (~28 px/sec)
    lastFrameMs: 0,
    lastPointerMs: 0,
    lastFreePlayTickMs: 0,
    danceTime: 0,
    pointerDown: false,
    activePointerId: null,
    freePlayActiveRegionId: 0,
    freePlayLastPt: null,
    lastPt: null,
    lastDabPt: null,
    paintedCells: new Set(),
    strokeTargetDist: 0, // furthest arc-length (px) the child's finger has traced along the active stroke
    subtitleText: SUBTITLE_TEXTS.welcome,
  };

  // Area-based coloring coverage: an 8px grid of cells whose centers lie inside the active 'evenodd' part.
  const COVER_CELL = 8;
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
        if (g.isPointInPath(cx, cy, 'evenodd')) cells.push([cx, cy]);
      }
    }
    if (cells.length === 0) {
      const fallback = getPartTargetCenter(lesson, partId);
      cells.push([fallback.x, fallback.y]);
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
    state.teacherHoldTimer = 0.45;
    state.strokeEndTimer = 0;
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
      const nc = document.createElement('canvas');
      nc.width = CANVAS_W;
      nc.height = CANVAS_H;
      partCanvases[pid] = nc;
      delete partFilledColors[pid];
    }
    state.stickers = [];
    state.sparkles = [];
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
    // Everything on the page around the paper (step beads, crayons, friends, helper
    // buttons, words for grown-ups) is painted by ./ui.js from this state.
    ui.sync(state, getLesson());
  }

  let clearConfirmTimer = 0;
  let undoClearTimer = 0;

  function saveCurrentLessonSnapshot() {
    if (state.phase === 'freeplay') return;
    const clonedParts = {};
    for (const pid of partOrder) {
      const srcC = partCanvases[pid];
      const dstC = document.createElement('canvas');
      dstC.width = CANVAS_W;
      dstC.height = CANVAS_H;
      if (srcC) dstC.getContext('2d').drawImage(srcC, 0, 0);
      clonedParts[pid] = dstC;
    }
    savedLessonSnapshots[state.characterId] = {
      phase: state.phase,
      drawStepIndex: state.drawStepIndex,
      strokeSubIndex: state.strokeSubIndex,
      strokeProgress: state.strokeProgress,
      strokeTargetDist: state.strokeTargetDist,
      colorStepIndex: state.colorStepIndex,
      colorCoverage: state.colorCoverage,
      selectedColor: state.selectedColor,
      selectedTool: state.selectedTool,
      stepWaitingNext: state.stepWaitingNext,
      teacherPhase: state.teacherPhase,
      teacherHoldTimer: state.teacherHoldTimer,
      teacherDemoDone: state.teacherDemoDone,
      paintedCells: new Set(state.paintedCells),
      stickers: state.stickers.map((s) => ({ ...s })),
      partFilledColors: { ...partFilledColors },
      partCanvases: clonedParts,
      subtitleText: state.subtitleText,
    };
  }

  function restoreLessonSnapshot(charId, quiet = false) {
    const snap = savedLessonSnapshots[charId];
    if (!snap) return false;
    state.characterId = charId;
    state.phase = snap.phase;
    state.drawStepIndex = snap.drawStepIndex;
    state.strokeSubIndex = snap.strokeSubIndex;
    state.strokeProgress = snap.strokeProgress;
    state.strokeTargetDist = snap.strokeTargetDist;
    state.colorStepIndex = snap.colorStepIndex;
    state.colorCoverage = snap.colorCoverage;
    state.selectedColor = snap.selectedColor;
    state.selectedTool = snap.selectedTool;
    state.stepWaitingNext = snap.stepWaitingNext;
    state.teacherPhase = snap.teacherPhase;
    state.teacherHoldTimer = snap.teacherHoldTimer;
    state.teacherDemoDone = snap.teacherDemoDone;
    state.paintedCells = new Set(snap.paintedCells);
    state.stickers = snap.stickers.map((s) => ({ ...s }));
    state.sparkles = [];
    for (const k of Object.keys(partFilledColors)) delete partFilledColors[k];
    Object.assign(partFilledColors, snap.partFilledColors);
    for (const pid of partOrder) {
      const nc = document.createElement('canvas');
      nc.width = CANVAS_W;
      nc.height = CANVAS_H;
      if (snap.partCanvases[pid]) nc.getContext('2d').drawImage(snap.partCanvases[pid], 0, 0);
      partCanvases[pid] = nc;
    }
    state.subtitleText = snap.subtitleText;
    const subEl = document.getElementById('voice-subtitle-text');
    if (subEl) subEl.textContent = snap.subtitleText;
    syncUI();
    if (!quiet) {
      const lesson = getLesson();
      if (state.phase === 'drawing') {
        const ds = lesson.drawSteps[state.drawStepIndex];
        if (ds) audio.speak(ds.voiceId);
      } else if (state.phase === 'coloring') {
        const cs = lesson.colorSteps[state.colorStepIndex];
        if (cs) audio.speak(cs.voiceId);
      } else if (state.phase === 'celebrate') {
        audio.speak('celebrate');
      }
    }
    return true;
  }

  function setFreePlaySubtitle(lesson) {
    const who = lesson ? lesson.name : 'your friend';
    const txt = `Free Play Coloring! Pick any color and brush for ${who} — colors stay neatly inside the lines!`;
    state.subtitleText = txt;
    const subEl = document.getElementById('voice-subtitle-text');
    if (subEl) subEl.textContent = txt;
  }

  function defaultVividColorForLesson(lesson) {
    const base = lesson?.palette?.base || '';
    if (
      base &&
      base.toUpperCase() !== '#F8F9FA' &&
      base.toUpperCase() !== '#F3F0FF' &&
      SWATCH_PALETTE.some((s) => sameHexColor(s.hex, base))
    ) {
      return base;
    }
    const cs0 = lesson?.colorSteps?.[0]?.recommendedColor;
    if (cs0 && cs0.toUpperCase() !== '#F8F9FA' && cs0.toUpperCase() !== '#F3F0FF') {
      return cs0;
    }
    return '#9B5DE5';
  }

  function selectCharacter(charId, quiet = false) {
    const found = CHARACTER_LESSONS.find((c) => c.id === charId) || CHARACTER_LESSONS[0];
    clearTimeout(clearConfirmTimer);
    clearTimeout(undoClearTimer);
    state.confirmingClear = false;
    state.confirmClearArmedAt = 0;
    state.canUndoClear = false;
    state.pointerDown = false;
    state.activePointerId = null;
    state.freePlayActiveRegionId = 0;
    state.freePlayLastPt = null;

    if (state.mode === 'freeplay') {
      ensureFreePlayData(found);
      getFreePlayPaintCanvas(found.id);
      state.characterId = found.id;
      state.phase = 'freeplay';
      state.stepWaitingNext = false;
      state.selectedColor = defaultVividColorForLesson(found);
      setFreePlaySubtitle(found);
      syncUI();
      if (!quiet) {
        audio.speak('freeplay_welcome', () => setFreePlaySubtitle(found));
      }
      return;
    }

    delete savedLessonSnapshots[found.id];
    ensureColoredFillCanvas(found);
    state.characterId = found.id;
    state.phase = 'drawing';
    state.drawStepIndex = 0;
    state.strokeSubIndex = 0;
    state.strokeProgress = 0;
    state.strokeTargetDist = 0;
    state.colorStepIndex = 0;
    state.colorCoverage = 0;
    state.stepWaitingNext = false;
    state.selectedColor = found.palette.base;
    state.selectedTool = 'crayon';
    resetTeacherDemo();
    clearPartCanvases();
    syncUI();
    if (!quiet) {
      audio.speak(found.voicePickId, setSubtitle);
    }
  }

  function setMode(nextMode, { keepPicker = false, quiet = false } = {}) {
    const norm = String(nextMode || '').toLowerCase().replace(/[-_]/g, '');
    const target = ['freeplay', 'free', 'freecolor', 'freecolour'].includes(norm) ? 'freeplay' : 'guided';
    if (
      target === state.mode &&
      ((target === 'freeplay' && state.phase === 'freeplay') || (target === 'guided' && state.phase !== 'freeplay'))
    ) {
      syncUI();
      return;
    }

    clearTimeout(clearConfirmTimer);
    clearTimeout(undoClearTimer);
    state.confirmingClear = false;
    state.confirmClearArmedAt = 0;
    state.canUndoClear = false;
    state.pointerDown = false;
    state.activePointerId = null;
    state.freePlayActiveRegionId = 0;
    state.freePlayLastPt = null;

    if (target === 'freeplay') {
      saveCurrentLessonSnapshot();
      state.mode = 'freeplay';
      state.stepWaitingNext = false;
      const lesson = getLesson();
      ensureFreePlayData(lesson);
      getFreePlayPaintCanvas(lesson.id);
      state.phase = 'freeplay';
      if (!state.selectedColor || state.selectedColor.toUpperCase() === '#F8F9FA') {
        state.selectedColor = defaultVividColorForLesson(lesson);
      }
      setFreePlaySubtitle(lesson);
      syncUI();
      if (!quiet && !keepPicker) {
        audio.playTraceTick();
        audio.speak('freeplay_welcome', () => setFreePlaySubtitle(lesson));
      }
    } else {
      state.mode = 'guided';
      if (!restoreLessonSnapshot(state.characterId, quiet || keepPicker)) {
        selectCharacter(state.characterId, quiet || keepPicker);
      }
    }
  }

  function handleCleanPage() {
    if (state.phase !== 'freeplay') return;

    // If an undo backup is active, 1 tap restores the child's picture immediately!
    if (state.canUndoClear && freePlayUndoBackupCanvases[state.characterId]) {
      clearTimeout(undoClearTimer);
      state.canUndoClear = false;
      state.confirmingClear = false;
      const fpCanvas = getFreePlayPaintCanvas(state.characterId);
      const pg = fpCanvas.getContext('2d', { willReadFrequently: true });
      pg.clearRect(0, 0, CANVAS_W, CANVAS_H);
      pg.drawImage(freePlayUndoBackupCanvases[state.characterId], 0, 0);
      audio.playStepComplete();
      const txt = 'Hooray, your picture is back!';
      state.subtitleText = txt;
      const subEl = document.getElementById('voice-subtitle-text');
      if (subEl) subEl.textContent = txt;
      audio.speak('undo_restore', () => {
        state.subtitleText = txt;
        if (subEl) subEl.textContent = txt;
      });
      syncUI();
      return;
    }

    if (!state.confirmingClear) {
      state.confirmingClear = true;
      state.confirmClearArmedAt = performance.now();
      audio.playTraceTick();
      const txt = 'Tap the new-page button again if you want a fresh blank page!';
      state.subtitleText = txt;
      const subEl = document.getElementById('voice-subtitle-text');
      if (subEl) subEl.textContent = txt;
      audio.speak('clean_page_confirm', () => {
        state.subtitleText = txt;
        if (subEl) subEl.textContent = txt;
      });
      syncUI();
      clearTimeout(clearConfirmTimer);
      clearConfirmTimer = setTimeout(() => {
        if (state.confirmingClear) {
          state.confirmingClear = false;
          state.confirmClearArmedAt = 0;
          if (state.phase === 'freeplay') setFreePlaySubtitle(getLesson());
          syncUI();
        }
      }, 5000);
      return;
    }

    // Ignore rapid accidental double-taps (< 750 ms after the 1st tap)
    if (performance.now() - state.confirmClearArmedAt < 750) {
      return;
    }

    clearTimeout(clearConfirmTimer);
    state.confirmingClear = false;
    state.confirmClearArmedAt = 0;

    // Back up current painting for 12s undo before clearing
    const fpCanvas = getFreePlayPaintCanvas(state.characterId);
    const backup = document.createElement('canvas');
    backup.width = CANVAS_W;
    backup.height = CANVAS_H;
    backup.getContext('2d').drawImage(fpCanvas, 0, 0);
    freePlayUndoBackupCanvases[state.characterId] = backup;

    fpCanvas.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, CANVAS_W, CANVAS_H);
    state.canUndoClear = true;
    audio.playStepComplete();
    const txt = 'Fresh blank page! Tap the undo arrow if you want your picture back!';
    state.subtitleText = txt;
    const subEl = document.getElementById('voice-subtitle-text');
    if (subEl) subEl.textContent = txt;
    audio.speak('clean_page_done', () => {
      state.subtitleText = txt;
      if (subEl) subEl.textContent = txt;
    });
    syncUI();

    clearTimeout(undoClearTimer);
    undoClearTimer = setTimeout(() => {
      if (state.canUndoClear) {
        state.canUndoClear = false;
        if (state.phase === 'freeplay') setFreePlaySubtitle(getLesson());
        syncUI();
      }
    }, 12000);
  }

  function paintFreePlayDab(x, y) {
    const lesson = getLesson();
    const fpData = ensureFreePlayData(lesson);
    if (!fpData || !state.freePlayActiveRegionId) return;
    const lockId = state.freePlayActiveRegionId;
    const tool = FREEPLAY_RADII[state.selectedTool] ? state.selectedTool : 'marker';
    const rad = FREEPLAY_RADII[tool];
    const baseAlpha = FREEPLAY_ALPHA[tool];
    const [cr, cg, cb] = parseHexRgb(state.selectedColor);

    const x0 = Math.max(0, Math.floor(x - rad));
    const y0 = Math.max(0, Math.floor(y - rad));
    const x1 = Math.min(CANVAS_W - 1, Math.ceil(x + rad));
    const y1 = Math.min(CANVAS_H - 1, Math.ceil(y + rad));
    if (x1 < x0 || y1 < y0) return;

    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const fpCanvas = getFreePlayPaintCanvas(lesson.id);
    const pg = fpCanvas.getContext('2d', { willReadFrequently: true });
    const imgData = pg.getImageData(x0, y0, w, h);
    const px = imgData.data;
    const r2 = rad * rad;
    const innerGlitterR2 = Math.max(4, (rad - 3) * (rad - 3));
    const regionMap = fpData.regionMap;

    for (let yy = y0; yy <= y1; yy++) {
      const dy = yy - y;
      const dy2 = dy * dy;
      const rowOff = yy * CANVAS_W;
      const localRow = (yy - y0) * w;
      for (let xx = x0; xx <= x1; xx++) {
        const dx = xx - x;
        const d2 = dx * dx + dy2;
        if (d2 > r2) continue;
        if (regionMap[rowOff + xx] !== lockId) continue;

        let a = baseAlpha;
        let pr = cr;
        let pgc = cg;
        let pb = cb;
        if (tool === 'crayon') {
          const grain = (((xx * 73856093) ^ (yy * 19349663)) >>> 0) & 15;
          a = 0.82 + (grain / 15) * 0.15;
        } else if (tool === 'watercolor') {
          a = baseAlpha * (1 - 0.32 * (d2 / r2));
        } else if (tool === 'glitter' && d2 <= innerGlitterR2) {
          const spark = (((xx * 83492791) ^ (yy * 2971215073)) >>> 0) & 63;
          if (spark === 0) {
            pr = 255;
            pgc = 249;
            pb = 219;
            a = 0.98;
          }
        }

        const o = (localRow + (xx - x0)) * 4;
        const da = px[o + 3] / 255;
        const oa = a + da * (1 - a);
        px[o] = (pr * a + px[o] * da * (1 - a)) / oa;
        px[o + 1] = (pgc * a + px[o + 1] * da * (1 - a)) / oa;
        px[o + 2] = (pb * a + px[o + 2] * da * (1 - a)) / oa;
        px[o + 3] = oa * 255;
      }
    }
    pg.putImageData(imgData, x0, y0);
  }

  function strokeFreePlayTo(x, y) {
    if (!state.freePlayActiveRegionId) {
      state.freePlayLastPt = { x, y };
      return;
    }
    const last = state.freePlayLastPt;
    if (!last) {
      paintFreePlayDab(x, y);
      state.freePlayLastPt = { x, y };
    } else {
      const dist = Math.hypot(x - last.x, y - last.y);
      const rad = FREEPLAY_RADII[state.selectedTool] || 30;
      const step = Math.max(2, rad * 0.32);
      const n = Math.max(1, Math.ceil(dist / step));
      for (let i = 1; i <= n; i++) {
        paintFreePlayDab(last.x + ((x - last.x) * i) / n, last.y + ((y - last.y) * i) / n);
      }
      state.freePlayLastPt = { x, y };
    }
    const now = performance.now();
    if (now - state.lastFreePlayTickMs > 150) {
      state.lastFreePlayTickMs = now;
      audio.playTraceTick();
    }
  }

  function goToNextDrawingStep() {
    const lesson = getLesson();
    state.stepWaitingNext = false;
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
      clearPartCanvases();
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

    // All sub-strokes of the current drawing step are complete!
    // Pause here and pop up the top-right NEXT STEP button so the child can finish drawing on paper!
    state.strokeProgress = 1;
    state.stepWaitingNext = true;
    const baseSub = SUBTITLE_TEXTS[ds.voiceId] || ds.hint || '';
    setSubtitle(`${baseSub} — Draw it on your paper, then tap NEXT STEP ➔!`);
    syncUI();
  }

  function fillPartCanvasSolid(partId, colorHex) {
    const lesson = getLesson();
    const pCanvas = partCanvases[partId];
    if (!pCanvas) return;
    partFilledColors[partId] = colorHex;
    const pCtx = pCanvas.getContext('2d');
    pCtx.save();
    pCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    buildPartClipPath(pCtx, lesson, partId);
    pCtx.clip('evenodd');

    const stepSpec = lesson.colorSteps?.find((s) => s.partId === partId);
    const useOfficialArt =
      !colorHex || !stepSpec || sameHexColor(colorHex, stepSpec.recommendedColor);
    const officialCanvas = ensureColoredFillCanvas(lesson);

    if (partId === 'background_frame') {
      const grad = pCtx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, colorHex);
      grad.addColorStop(0.72, '#FFFFFF');
      grad.addColorStop(1, '#D3F9D8');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Add cute floating stars/hearts on the background
      state.stickers = [
        { x: 96, y: 112, emoji: '⭐' },
        { x: 704, y: 116, emoji: '🌈' },
        { x: 94, y: 508, emoji: '💖' },
        { x: 706, y: 504, emoji: '✨' },
      ];
    } else if (partId === 'shading_sparkles') {
      pCtx.fillStyle = colorHex || '#16131C';
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else if (useOfficialArt && officialCanvas) {
      pCtx.drawImage(officialCanvas, 0, 0);
    } else {
      pCtx.fillStyle = colorHex;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Add subtle warm highlight sheen
      const sheen = pCtx.createRadialGradient(350, 170, 15, 400, 320, 260);
      sheen.addColorStop(0, 'rgba(255,255,255,0.18)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      pCtx.fillStyle = sheen;
      pCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    pCtx.restore();
  }

  function completeCurrentColoringPart() {
    const lesson = getLesson();
    const cs = lesson.colorSteps[state.colorStepIndex];
    if (!cs) return;
    fillPartCanvasSolid(cs.partId, state.selectedColor || cs.recommendedColor);
    state.colorCoverage = 100;
    state.stepWaitingNext = true;
    const center = getPartTargetCenter(lesson, cs.partId);
    spawnSparkles(center.x, center.y, state.selectedColor || '#FFD43B', 18);
    audio.playStepComplete();
    const baseSub = SUBTITLE_TEXTS[cs.voiceId] || cs.hint || '';
    setSubtitle(`${baseSub} — Color it on your paper, then tap NEXT STEP ➔!`);
    syncUI();
  }

  function goToNextColoringStep() {
    const lesson = getLesson();
    const cs = lesson.colorSteps[state.colorStepIndex];
    if (!cs) return;
    fillPartCanvasSolid(cs.partId, state.selectedColor || cs.recommendedColor);
    state.stepWaitingNext = false;

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

  function advanceColoringStep() {
    completeCurrentColoringPart();
  }

  function paintBrushDab(x, y, isAuto = false) {
    const lesson = getLesson();
    const cs = lesson.colorSteps[state.colorStepIndex];
    if (!cs) return;
    const pCanvas = partCanvases[cs.partId];
    if (!pCanvas) return;

    // Require real movement between counted dabs so a wiggle never skips a coloring step!
    const minHop = isAuto ? 10 : 18;
    if (state.lastDabPt) {
      const dabDist = Math.hypot(x - state.lastDabPt.x, y - state.lastDabPt.y);
      if (dabDist < minHop) return;
    }
    state.lastDabPt = { x, y };

    const pCtx = pCanvas.getContext('2d');

    pCtx.save();
    buildPartClipPath(pCtx, lesson, cs.partId);
    pCtx.clip('evenodd');

    const color = state.selectedColor || cs.recommendedColor;
    const officialCanvas = ensureColoredFillCanvas(lesson);
    const useOfficialArt =
      officialCanvas &&
      cs.partId !== 'background_frame' &&
      cs.partId !== 'shading_sparkles' &&
      sameHexColor(color, cs.recommendedColor);

    if (useOfficialArt) {
      pCtx.beginPath();
      pCtx.arc(x, y, brushRadius(state.selectedTool, cs.partId) + 6, 0, Math.PI * 2);
      pCtx.clip();
      pCtx.drawImage(officialCanvas, 0, 0);
    } else if (state.selectedTool === 'crayon') {
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
      pCtx.globalAlpha = 0.52;
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
    if (state.phase === 'freeplay') {
      strokeFreePlayTo(x, y);
      return true;
    }
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
        if (pts[i + 1][2]) continue;
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

  function confirmAndAdvanceStep() {
    if (state.phase === 'drawing') {
      const lesson = getLesson();
      const ds = lesson.drawSteps[state.drawStepIndex];
      if (!state.stepWaitingNext) {
        if (ds && ds.strokes && ds.strokes.length > 0) {
          state.strokeSubIndex = ds.strokes.length - 1;
        }
        state.strokeProgress = 1;
        advanceDrawingSubStroke();
        return;
      }
      goToNextDrawingStep();
    } else if (state.phase === 'coloring') {
      if (!state.stepWaitingNext) {
        completeCurrentColoringPart();
        return;
      }
      goToNextColoringStep();
    } else {
      const idx = CHARACTER_LESSONS.findIndex((c) => c.id === state.characterId);
      const next = CHARACTER_LESSONS[(idx + 1) % CHARACTER_LESSONS.length];
      selectCharacter(next.id);
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
      if (state.stepWaitingNext) {
        goToNextDrawingStep();
      } else {
        advanceDrawingSubStroke();
      }
    } else if (state.phase === 'coloring') {
      if (state.stepWaitingNext) {
        goToNextColoringStep();
      } else {
        completeCurrentColoringPart();
      }
    } else {
      // Advance to next character
      const idx = CHARACTER_LESSONS.findIndex((c) => c.id === state.characterId);
      const next = CHARACTER_LESSONS[(idx + 1) % CHARACTER_LESSONS.length];
      selectCharacter(next.id);
    }
  }

  function jumpToPhase(targetPhase, stepIdx = 0) {
    if (targetPhase === 'freeplay') {
      setMode('freeplay');
      return;
    }
    state.mode = 'guided';
    const lesson = getLesson();
    state.stepWaitingNext = false;
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
      if (!pts[i][2]) {
        total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      }
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
    if (pts.length === 1) return [pts[0][0], pts[0][1]];
    const clamped = Math.max(0, Math.min(1, ratio));
    const cum = getPolylineArcLengths(pts);
    const total = cum[cum.length - 1];
    if (total <= 0) return [pts[0][0], pts[0][1]];
    const targetDist = clamped * total;
    for (let i = 0; i < cum.length - 1; i++) {
      if (pts[i + 1][2]) continue;
      if (targetDist <= cum[i + 1] || i === cum.length - 2) {
        const segLen = Math.max(1e-6, cum[i + 1] - cum[i]);
        const frac = Math.max(0, Math.min(1, (targetDist - cum[i]) / segLen));
        const p0 = pts[i];
        const p1 = pts[i + 1];
        return [p0[0] + (p1[0] - p0[0]) * frac, p0[1] + (p1[1] - p0[1]) * frac];
      }
    }
    const last = pts[pts.length - 1];
    return [last[0], last[1]];
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
      const p1 = pts[i + 1];
      if (p1[2]) {
        if (targetDist > cum[i + 1]) {
          targetCtx.moveTo(p1[0], p1[1]);
          continue;
        }
        break;
      }
      if (targetDist >= cum[i + 1]) {
        targetCtx.lineTo(p1[0], p1[1]);
      } else if (targetDist > cum[i]) {
        const segLen = Math.max(1e-6, cum[i + 1] - cum[i]);
        const frac = (targetDist - cum[i]) / segLen;
        const p0 = pts[i];
        targetCtx.lineTo(p0[0] + (p1[0] - p0[0]) * frac, p0[1] + (p1[1] - p0[1]) * frac);
        break;
      } else {
        break;
      }
    }
    targetCtx.strokeStyle = style.color || '#231B18';
    targetCtx.lineWidth = style.width || 6.2;
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
    // Sprite lives in ./ui.js: a pencil while drawing, a crayon in the suggested colour while colouring.
    const cs = state.phase === 'coloring' ? getLesson().colorSteps[state.colorStepIndex] : null;
    paintTeacherPencil(targetCtx, x, y, {
      crayonColor: cs ? cs.recommendedColor || state.selectedColor : null,
    });
  }

  function renderEasel(nowMs) {
    const ts = typeof nowMs === 'number' ? nowMs : performance.now();
    const dt = state.lastFrameMs > 0
      ? Math.min(0.05, Math.max(0.001, (ts - state.lastFrameMs) / 1000))
      : 1 / 60;
    state.lastFrameMs = ts;

    const lesson = getLesson();
    if (state.phase === 'freeplay') {
      const fpData = ensureFreePlayData(lesson);
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      paintPaper(ctx, CANVAS_W, CANVAS_H);
      if (fpData) {
        const fpPaint = getFreePlayPaintCanvas(lesson.id);
        ctx.drawImage(fpPaint, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(fpData.lineCanvas, 0, 0);
        ctx.restore();
      }
      requestAnimationFrame(renderEasel);
      return;
    }

    ensureColoredFillCanvas(lesson);
    state.danceTime += dt;

    // Automatic slow 5-year-old pencil glides across each stroke (~28 px/sec along true pixel arc-length)
    // and pauses when the step finishes so the child can finish drawing on paper and tap NEXT STEP!
    if (state.phase === 'drawing' && !state.stepWaitingNext) {
      const dsA = lesson.drawSteps[state.drawStepIndex];
      const ptsA = dsA?.strokes?.[state.strokeSubIndex];
      const totalA = getPolylineTotalLength(ptsA);
      if (totalA > 0) {
        if (state.teacherHoldTimer > 0 && !state.pointerDown && state.strokeTargetDist <= 0) {
          state.teacherHoldTimer = Math.max(0, state.teacherHoldTimer - dt);
        } else {
          const autoSpeed = Math.max(15, state.teacherSpeedPxPerSec);
          const minStepSec = 2.6;
          const effAutoSpeed = Math.min(autoSpeed, totalA / minStepSec);
          const autoNextDist = state.strokeProgress * totalA + effAutoSpeed * dt;
          const fingerNextDist =
            state.strokeTargetDist > state.strokeProgress * totalA + 0.01
              ? Math.min(state.strokeTargetDist, state.strokeProgress * totalA + 38 * dt)
              : 0;
          const nextDist = Math.max(autoNextDist, fingerNextDist);
          state.strokeProgress = Math.min(1, nextDist / totalA);
          state.teacherPhase = state.strokeProgress;

          const meterFill = document.getElementById('step-meter-fill');
          const meterLabel = document.getElementById('step-meter-label');
          const pctA = Math.min(
            100,
            Math.round(((state.strokeSubIndex + state.strokeProgress) / dsA.strokes.length) * 100)
          );
          if (meterFill) meterFill.style.width = `${pctA}%`;
          if (meterLabel) meterLabel.textContent = `${pctA}% Traced`;
          if (state.strokeProgress < 0.995 && Math.random() < 0.04) {
            const sparkA = samplePointOnPolyline(ptsA, state.strokeProgress);
            spawnSparkles(sparkA[0], sparkA[1], '#FFD43B', 1);
          }
          if (state.strokeProgress >= 0.995) {
            state.strokeProgress = 1;
            state.strokeEndTimer = (state.strokeEndTimer || 0) + dt;
            if (state.strokeEndTimer >= 0.35 || state.pointerDown) {
              state.pointerDown = false;
              state.strokeEndTimer = 0;
              advanceDrawingSubStroke();
            }
          }
        }
      }
    } else if (state.phase === 'coloring' && !state.stepWaitingNext) {
      if (!state.pointerDown) {
        if (state.teacherHoldTimer > 0) {
          state.teacherHoldTimer = Math.max(0, state.teacherHoldTimer - dt);
        } else {
          state.teacherPhase = Math.min(1.0, state.teacherPhase + dt / 9.5);
        }
      }
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Cream sketchbook paper with a quiet dot grid (cached texture from ./ui.js)
    paintPaper(ctx, CANVAS_W, CANVAS_H);

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
      // Keep eye sclera crisp paper white above background/fur fills
      if (lesson.eyeWhites && lesson.eyeWhites.length > 0) {
        ctx.save();
        ctx.beginPath();
        for (const ring of lesson.eyeWhites) {
          tracePointsToPath(ctx, ring, true);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fill('evenodd');
        ctx.restore();
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

    // 2. If in Coloring Phase (and not yet waiting for Next Step), draw a calm spotlight outline around the ACTIVE part
    if (state.phase === 'coloring' && !state.stepWaitingNext) {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        ctx.save();
        buildPartClipPath(ctx, lesson, cs.partId);
        ctx.strokeStyle = cs.recommendedColor || '#FFD43B';
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.28 + Math.sin(state.danceTime * 2.2) * 0.08;
        ctx.stroke();
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = 0;
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = 0.92;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw completed ink steps
    const inkWidth = lesson.strokeWidth || 6.2;
    const completedDrawStepCount =
      state.phase === 'drawing' ? state.drawStepIndex : lesson.drawSteps.length;
    for (let sIdx = 0; sIdx < completedDrawStepCount; sIdx++) {
      const ds = lesson.drawSteps[sIdx];
      for (const strokePts of ds.strokes) {
        drawStrokePolyline(ctx, strokePts, 1.0, { color: '#231B18', width: inkWidth });
      }
    }

    // Add gleaming white eye sparkle catchlights once Step 6 (Velvet Smile & Eye Sparkles) is filled
    if (
      (state.phase === 'celebrate' ||
        (state.phase === 'coloring' &&
          (state.colorStepIndex > 5 || (state.colorStepIndex === 5 && state.stepWaitingNext)))) &&
      lesson.catchlights
    ) {
      ctx.fillStyle = '#FFFFFF';
      for (const [cx, cy, r] of lesson.catchlights) {
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
          drawStrokePolyline(ctx, ds.strokes[sub], 1.0, { color: '#231B18', width: inkWidth });
        }
        // Remaining preview sub-strokes in faint lavender
        for (let sub = state.strokeSubIndex + 1; sub < ds.strokes.length; sub++) {
          drawStrokePolyline(ctx, ds.strokes[sub], 1.0, {
            color: 'rgba(155, 93, 229, 0.22)',
            width: 4.5,
            dash: [10, 10],
          });
        }
        // Active sub-stroke guide path + automatically drawn ink + slow teacher pencil (no green start icon!)
        const activePts = ds.strokes[state.strokeSubIndex];
        if (activePts && activePts.length >= 2) {
          if (!state.stepWaitingNext) {
            drawStrokePolyline(ctx, activePts, 1.0, {
              color: 'rgba(112, 72, 232, 0.36)',
              width: inkWidth + 2.5,
              dash: [14, 12],
              dashOffset: 0,
            });
          }

          drawStrokePolyline(ctx, activePts, state.strokeProgress, {
            color: '#231B18',
            width: state.stepWaitingNext ? inkWidth : inkWidth + 0.6,
          });

          if (!state.stepWaitingNext) {
            const pencilPt = samplePointOnPolyline(activePts, state.strokeProgress);
            renderTeacherPencil(ctx, pencilPt[0], pencilPt[1]);
          }
        }
      }
    }

    // 5. If in Coloring Phase, draw a friendly floating pointer pill AND automatic slow crayon coloring
    if (state.phase === 'coloring' && !state.stepWaitingNext) {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        const target = getPartTargetCenter(lesson, cs.partId);
        const pillX = Math.max(135, Math.min(CANVAS_W - 135, target.x));
        const pillY = Math.max(66, Math.min(CANVAS_H - 20, target.y));
        const bobY = Math.sin(state.danceTime * 1.4) * 2.0;
        paintLabelPill(ctx, pillX, pillY - 37 + bobY, target.label);

        if (!state.pointerDown) {
          const demoT = Math.max(0, Math.min(1, state.teacherPhase));
          const partCells = getCoverageGrid(cs.partId);
          let demoWaypoints = [];
          if (partCells.length >= 6) {
            const wpCount = 14;
            for (let w = 0; w < wpCount; w++) {
              const idx = Math.min(
                partCells.length - 1,
                Math.floor(((w + 0.5) / wpCount) * partCells.length)
              );
              demoWaypoints.push(partCells[idx]);
            }
          } else {
            demoWaypoints = [
              [target.x - 24, target.y - 12],
              [target.x + 24, target.y],
              [target.x - 16, target.y + 12],
              [target.x + 20, target.y + 10],
            ];
          }
          const sweepPt = samplePointOnPolyline(demoWaypoints, demoT);
          if (state.teacherHoldTimer <= 0 && demoT > 0) {
            paintBrushDab(sweepPt[0], sweepPt[1], true);
          }
          if (state.phase === 'coloring' && !state.stepWaitingNext) {
            renderTeacherPencil(ctx, sweepPt[0], sweepPt[1]);
            if (demoT >= 0.995) {
              advanceColoringStep();
            }
          }
        } else if (state.lastPt) {
          renderTeacherPencil(ctx, state.lastPt.x, state.lastPt.y);
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

  // Wire DOM controls: the markup and listeners live in ./ui.js, the game supplies the actions.
  const replayTeacherVoice = () => {
    const lesson = getLesson();
    if (state.phase === 'freeplay') {
      setFreePlaySubtitle(lesson);
      audio.speak('freeplay_welcome', () => setFreePlaySubtitle(lesson));
      syncUI();
      return;
    }
    if (state.phase === 'drawing') {
      state.stepWaitingNext = false;
      state.strokeSubIndex = 0;
      state.strokeProgress = 0;
      state.strokeTargetDist = 0;
      resetTeacherDemo();
      const ds = lesson.drawSteps[state.drawStepIndex];
      if (ds) audio.speak(ds.voiceId, setSubtitle);
      syncUI();
      return;
    }
    if (state.phase === 'coloring') {
      const cs = lesson.colorSteps[state.colorStepIndex];
      if (cs) {
        const pCanvas = partCanvases[cs.partId];
        if (pCanvas) pCanvas.getContext('2d').clearRect(0, 0, CANVAS_W, CANVAS_H);
        delete partFilledColors[cs.partId];
      }
      state.stepWaitingNext = false;
      state.colorCoverage = 0;
      state.lastDabPt = null;
      state.paintedCells = new Set();
      resetTeacherDemo();
      if (cs) audio.speak(cs.voiceId, setSubtitle);
      syncUI();
      return;
    }
    audio.replayLast(setSubtitle);
  };
  const goToNextFriend = () => {
    const idx = CHARACTER_LESSONS.findIndex((c) => c.id === state.characterId);
    const next = CHARACTER_LESSONS[(idx + 1) % CHARACTER_LESSONS.length];
    selectCharacter(next.id);
  };
  const ui = createSketchbookUI({
    lessons: CHARACTER_LESSONS,
    swatches: SWATCH_PALETTE,
    handlers: {
      onPickFriend: (id) => selectCharacter(id),
      onModeSelect: (m) => setMode(m, { keepPicker: true }),
      onToggleMode: () => setMode(state.mode === 'freeplay' ? 'guided' : 'freeplay'),
      onCleanPage: () => handleCleanPage(),
      onJump: (phase, idx) => jumpToPhase(phase, idx),
      onColor: (hex) => {
        state.selectedColor = hex;
        state.confirmingClear = false;
        audio.playTraceTick();
        syncUI();
      },
      onTool: (tool) => {
        state.selectedTool = tool;
        state.confirmingClear = false;
        audio.playTraceTick();
        syncUI();
      },
      onAutoStep: () => autoCompleteCurrentStep(),
      onFillPart: () => autoCompleteCurrentStep(),
      onNextStep: () => confirmAndAdvanceStep(),
      onVoice: replayTeacherVoice,
      onNextFriend: goToNextFriend,
    },
  });

  function toCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * CANVAS_W,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * CANVAS_H,
    };
  }

  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    if (state.phase === 'freeplay') {
      if (
        state.pointerDown &&
        state.activePointerId !== null &&
        e.pointerId !== state.activePointerId &&
        e.isPrimary === false
      ) {
        return;
      }
      const fpData = ensureFreePlayData(getLesson());
      if (!fpData) return;
      if (state.confirmingClear || state.canUndoClear) {
        clearTimeout(clearConfirmTimer);
        clearTimeout(undoClearTimer);
        state.confirmingClear = false;
        state.confirmClearArmedAt = 0;
        state.canUndoClear = false;
        setFreePlaySubtitle(getLesson());
      }
      state.pointerDown = true;
      state.activePointerId = e.pointerId ?? null;
      state.lastPointerMs = performance.now();
      const pt = toCanvasCoords(e);
      state.lastPt = pt;
      const cxp = Math.max(0, Math.min(CANVAS_W - 1, Math.round(pt.x)));
      const cyp = Math.max(0, Math.min(CANVAS_H - 1, Math.round(pt.y)));
      state.freePlayActiveRegionId = fpData.regionMap[cyp * CANVAS_W + cxp] || 0;
      state.freePlayLastPt = null;
      strokeFreePlayTo(pt.x, pt.y);
      syncUI();
      return;
    }
    state.pointerDown = true;
    state.lastPointerMs = performance.now();
    const pt = toCanvasCoords(e);
    state.lastPt = pt;
    handlePointerMoveOnEasel(pt.x, pt.y);
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    if (state.phase === 'freeplay') {
      if (state.activePointerId !== null && e.pointerId !== undefined && e.pointerId !== state.activePointerId) {
        return;
      }
      const pt = toCanvasCoords(e);
      state.lastPt = pt;
      strokeFreePlayTo(pt.x, pt.y);
      return;
    }
    const pt = toCanvasCoords(e);
    const consumed = handlePointerMoveOnEasel(pt.x, pt.y);
    if (consumed !== false) state.lastPt = pt;
  });

  const endPointer = (e) => {
    if (
      state.phase === 'freeplay' &&
      state.activePointerId !== null &&
      e &&
      e.pointerId !== undefined &&
      e.pointerId !== state.activePointerId
    ) {
      return;
    }
    state.pointerDown = false;
    state.activePointerId = null;
    state.freePlayActiveRegionId = 0;
    state.freePlayLastPt = null;
  };
  const resetPointerAll = () => {
    state.pointerDown = false;
    state.activePointerId = null;
    state.freePlayActiveRegionId = 0;
    state.freePlayLastPt = null;
  };
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  window.addEventListener('blur', resetPointerAll);

  // Expose QA seam on window.__DRAW_SCHOOL__
  window.__DRAW_SCHOOL__ = {
    getState() {
      const lesson = getLesson();
      return {
        mode: state.mode,
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
        stepWaitingNext: state.stepWaitingNext,
        confirmingClear: state.confirmingClear,
        canUndoClear: state.canUndoClear,
        freePlayReady: Boolean(freePlayDataCache[state.characterId]),
        freePlayActiveRegionId: state.freePlayActiveRegionId,
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
        pickerOpen: ui.isPickerOpen(),
      };
    },
    setMode(mode) {
      ui.closePicker();
      setMode(mode);
      return this.getState();
    },
    setColor(hex) {
      state.selectedColor = hex;
      syncUI();
      return this.getState();
    },
    setTool(tool) {
      state.selectedTool = tool;
      syncUI();
      return this.getState();
    },
    selectCharacter(id) {
      ui.closePicker();
      selectCharacter(id, false);
      return this.getState();
    },
    autoCompleteCurrentStep() {
      ui.closePicker();
      autoCompleteCurrentStep();
      return this.getState();
    },
    confirmNextStep() {
      ui.closePicker();
      confirmAndAdvanceStep();
      return this.getState();
    },
    jumpToPhase(phase, idx = 0) {
      ui.closePicker();
      jumpToPhase(phase, idx);
      return this.getState();
    },
    replayVoice() {
      replayTeacherVoice();
      return this.getState();
    },
    openPicker() {
      ui.openPicker({ closable: true });
      return this.getState();
    },
    closePicker() {
      ui.closePicker();
      return this.getState();
    },
  };

  // Boot from URL params (?mode=freeplay, ?play=<id>)
  const searchParams = new URLSearchParams(window.location.search);
  const rawMode = (searchParams.get('mode') || '').toLowerCase().replace(/[-_]/g, '');
  const wantFreePlay = ['freeplay', 'free', 'freecolor', 'freecolour'].includes(rawMode);
  const playParam = searchParams.get('play');
  const bootCharId = CHARACTER_LESSONS.find((c) => c.id === playParam)?.id || 'catnap';

  if (wantFreePlay) {
    state.mode = 'freeplay';
    selectCharacter(bootCharId, true);
    ui.closePicker();
  } else {
    state.mode = 'guided';
    selectCharacter(bootCharId, true);
    if (playParam === null) {
      setSubtitle('welcome');
      ui.openPicker({ closable: false });
    } else {
      setSubtitle(getLesson().drawSteps[0]?.voiceId || 'draw_step_1');
      ui.closePicker();
    }
  }
  requestAnimationFrame(renderEasel);
}
