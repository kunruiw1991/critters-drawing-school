// 10 Step-by-Step Simple Drawing & 7-Step Part-by-Part Coloring Lessons
// for Smiling Critters Drawing & Coloring School!
// Canvas coordinate system: 800 x 640 (center = 400, 320).

function sampleEllipse(cx, cy, rx, ry, startAngle = 0, endAngle = Math.PI * 2, steps = 48) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = startAngle + ((endAngle - startAngle) * i) / steps;
    pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
  }
  return pts;
}

function sampleQuad(x0, y0, cx, cy, x1, y1, steps = 28) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    pts.push([
      mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
      mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
    ]);
  }
  return pts;
}

function sampleCubic(x0, y0, cx1, cy1, cx2, cy2, x1, y1, steps = 34) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    pts.push([
      mt * mt * mt * x0 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x1,
      mt * mt * mt * y0 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y1,
    ]);
  }
  return pts;
}

function sampleHeart(cx, cy, size = 34, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([cx + (x / 16) * size, cy + (y / 16) * size]);
  }
  return pts;
}

function sampleStar(cx, cy, outerR = 34, innerR = 15, points = 5) {
  const pts = [];
  for (let i = 0; i <= points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return pts;
}

function buildEarStrokes(earType) {
  switch (earType) {
    case 'cat':
      return {
        outer: [
          [
            [275, 165],
            [240, 62],
            [335, 115],
          ],
          [
            [465, 115],
            [560, 62],
            [525, 165],
          ],
        ],
        inner: [
          [
            [284, 152],
            [258, 86],
            [324, 124],
          ],
          [
            [476, 124],
            [542, 86],
            [516, 152],
          ],
        ],
      };
    case 'floppy':
      return {
        outer: [
          sampleCubic(268, 145, 182, 130, 176, 265, 258, 255, 32),
          sampleCubic(532, 145, 618, 130, 624, 265, 542, 255, 32),
        ],
        inner: [
          sampleCubic(258, 165, 204, 158, 200, 244, 252, 238, 26),
          sampleCubic(542, 165, 596, 158, 600, 244, 548, 238, 26),
        ],
      };
    case 'bear':
      return {
        outer: [
          sampleEllipse(272, 112, 46, 46, Math.PI * 0.75, Math.PI * 2.15, 28),
          sampleEllipse(528, 112, 46, 46, -Math.PI * 0.15, Math.PI * 1.25, 28),
        ],
        inner: [
          sampleEllipse(272, 112, 26, 26, 0, Math.PI * 2, 24),
          sampleEllipse(528, 112, 26, 26, 0, Math.PI * 2, 24),
        ],
      };
    case 'bunny':
      return {
        outer: [
          sampleCubic(318, 118, 282, 12, 355, 12, 356, 115, 34),
          sampleCubic(444, 115, 445, 12, 518, 12, 482, 118, 34),
        ],
        inner: [
          sampleCubic(326, 110, 302, 34, 344, 34, 346, 108, 26),
          sampleCubic(454, 108, 456, 34, 498, 34, 474, 110, 26),
        ],
      };
    case 'unicorn':
      return {
        outer: [
          [
            [282, 152],
            [248, 86],
            [328, 118],
          ],
          [
            [472, 118],
            [552, 86],
            [518, 152],
          ],
          [
            [374, 104],
            [400, 18],
            [426, 104],
          ],
        ],
        inner: [
          [
            [290, 144],
            [266, 102],
            [320, 124],
          ],
          [
            [480, 124],
            [534, 102],
            [510, 144],
          ],
        ],
      };
    case 'piggy':
      return {
        outer: [
          sampleCubic(274, 142, 224, 72, 315, 68, 336, 116, 28),
          sampleCubic(464, 116, 485, 68, 576, 72, 526, 142, 28),
        ],
        inner: [
          sampleCubic(284, 134, 248, 90, 306, 86, 324, 120, 22),
          sampleCubic(476, 120, 494, 86, 552, 90, 516, 134, 22),
        ],
      };
    case 'elephant':
      return {
        outer: [
          sampleCubic(264, 142, 148, 102, 146, 285, 268, 268, 36),
          sampleCubic(536, 142, 652, 102, 654, 285, 532, 268, 36),
        ],
        inner: [
          sampleCubic(258, 162, 178, 135, 176, 262, 260, 250, 28),
          sampleCubic(542, 162, 622, 135, 624, 262, 540, 250, 28),
        ],
      };
    case 'chicken':
    default:
      return {
        outer: [
          sampleCubic(356, 106, 350, 34, 392, 42, 392, 98, 22),
          sampleCubic(392, 98, 404, 24, 442, 34, 424, 102, 22),
          sampleCubic(424, 102, 454, 52, 476, 72, 446, 112, 20),
        ],
        inner: [
          sampleEllipse(310, 148, 22, 14, 0, Math.PI * 2, 18),
          sampleEllipse(490, 148, 22, 14, 0, Math.PI * 2, 18),
        ],
      };
  }
}

function buildPendantStrokes(pendantType) {
  const cx = 400;
  const cy = 382;
  switch (pendantType) {
    case 'moon':
      return [
        sampleCubic(cx + 12, cy - 28, cx - 32, cy - 22, cx - 32, cy + 26, cx + 14, cy + 28, 28),
        sampleCubic(cx + 14, cy + 28, cx - 8, cy + 16, cx - 8, cy - 14, cx + 12, cy - 28, 24),
      ];
    case 'sun':
      return [
        sampleEllipse(cx, cy, 24, 24, 0, Math.PI * 2, 28),
        ...Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return [
            [cx + Math.cos(a) * 27, cy + Math.sin(a) * 27],
            [cx + Math.cos(a) * 36, cy + Math.sin(a) * 36],
          ];
        }),
      ];
    case 'heart':
      return [sampleHeart(cx, cy, 28, 36)];
    case 'bolt':
      return [
        [
          [cx + 8, cy - 32],
          [cx - 18, cy + 2],
          [cx + 2, cy + 2],
          [cx - 10, cy + 34],
          [cx + 20, cy - 4],
          [cx + 2, cy - 4],
          [cx + 8, cy - 32],
        ],
      ];
    case 'flower':
      return [
        sampleEllipse(cx, cy, 12, 12, 0, Math.PI * 2, 18),
        ...Array.from({ length: 5 }, (_, i) => {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          return sampleEllipse(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 11, 11, 0, Math.PI * 2, 16);
        }),
      ];
    case 'apple':
      return [
        sampleEllipse(cx, cy + 4, 25, 23, 0, Math.PI * 2, 28),
        [
          [cx, cy - 18],
          [cx + 6, cy - 30],
        ],
      ];
    case 'bulb':
      return [
        sampleEllipse(cx, cy - 4, 22, 22, 0, Math.PI * 2, 28),
        [
          [cx - 10, cy + 16],
          [cx + 10, cy + 16],
          [cx + 8, cy + 26],
          [cx - 8, cy + 26],
          [cx - 10, cy + 16],
        ],
      ];
    case 'star':
    default:
      return [sampleStar(cx, cy, 29, 13, 5)];
  }
}

function makeCritterLesson(spec) {
  const ears = buildEarStrokes(spec.earType);
  const pendantStrokes = buildPendantStrokes(spec.pendantType);

  const headStroke = sampleEllipse(400, 200, 136, 104, -Math.PI * 0.5, Math.PI * 1.5, 56);
  const muzzleStroke = sampleEllipse(400, 244, 68, 40, 0, Math.PI * 2, 36);

  const leftEyeStroke = sampleEllipse(344, 178, 21, 26, 0, Math.PI * 2, 26);
  const rightEyeStroke = sampleEllipse(456, 178, 21, 26, 0, Math.PI * 2, 26);
  const noseStroke =
    spec.earType === 'piggy'
      ? sampleEllipse(400, 222, 22, 15, 0, Math.PI * 2, 24)
      : sampleEllipse(400, 220, 13, 9, 0, Math.PI * 2, 20);

  const smileUpper = sampleQuad(348, 238, 400, 260, 452, 238, 28);
  const smileLower = sampleQuad(348, 238, 400, 288, 452, 238, 32);
  const cheekL = sampleEllipse(296, 222, 20, 14, 0, Math.PI * 2, 20);
  const cheekR = sampleEllipse(504, 222, 20, 14, 0, Math.PI * 2, 20);

  const bodyStroke = sampleEllipse(400, 422, 114, 116, 0, Math.PI * 2, 48);
  const tummyStroke = sampleEllipse(400, 434, 74, 76, 0, Math.PI * 2, 40);
  const collarStroke = sampleQuad(312, 316, 400, 336, 488, 316, 24);
  const leftArmStroke = sampleEllipse(256, 396, 48, 26, -0.35, Math.PI * 2 - 0.35, 28);
  const rightArmStroke = sampleEllipse(544, 396, 48, 26, 0.35, Math.PI * 2 + 0.35, 28);
  const leftFootStroke = sampleEllipse(342, 538, 42, 26, 0, Math.PI * 2, 26);
  const rightFootStroke = sampleEllipse(458, 538, 42, 26, 0, Math.PI * 2, 26);
  const tailStroke = sampleEllipse(548, 442, 48, 24, -0.45, Math.PI * 2 - 0.45, 28);

  const drawSteps = [
    {
      stepNum: 1,
      id: 'draw_head',
      title: 'Step 1: Big Round Head',
      hint: 'Start at the green dot and trace the big round head!',
      voiceId: 'draw_step_1',
      strokes: [headStroke],
    },
    {
      stepNum: 2,
      id: 'draw_ears',
      title: `Step 2: ${spec.earLabel}`,
      hint: `Trace ${spec.name}'s cute ${spec.earLabel.toLowerCase()} on top!`,
      voiceId: 'draw_step_2',
      strokes: [...ears.outer, ...ears.inner],
    },
    {
      stepNum: 3,
      id: 'draw_eyes_nose',
      title: 'Step 3: Big Eyes & Cute Nose',
      hint: 'Draw the two oval eyes, muzzle patch, and button nose!',
      voiceId: 'draw_step_3',
      strokes: [muzzleStroke, leftEyeStroke, rightEyeStroke, noseStroke],
    },
    {
      stepNum: 4,
      id: 'draw_smile',
      title: 'Step 4: Big Smiling Critter Grin!',
      hint: 'Trace the wide happy smile and rosy cheek circles!',
      voiceId: 'draw_step_4',
      strokes: [smileUpper, smileLower, cheekL, cheekR],
    },
    {
      stepNum: 5,
      id: 'draw_body_limbs',
      title: 'Step 5: Cozy Tummy, Arms & Paws',
      hint: 'Draw the round body, tummy oval, waving arms, and feet!',
      voiceId: 'draw_step_5',
      strokes: [bodyStroke, tummyStroke, leftArmStroke, rightArmStroke, leftFootStroke, rightFootStroke],
    },
    {
      stepNum: 6,
      id: 'draw_pendant_tail',
      title: `Step 6: ${spec.pendantLabel} & Tail`,
      hint: `Finish with the collar, ${spec.pendantLabel.toLowerCase()}, and tail!`,
      voiceId: 'draw_step_6',
      strokes: [collarStroke, ...pendantStrokes, tailStroke],
    },
  ];

  const colorSteps = [
    {
      stepNum: 1,
      partId: 'main_fur',
      title: 'Color Step 1/7: Main Fur, Head & Limbs',
      hint: `Pick ${spec.baseColorName} and brush inside the head, body, arms, feet, and tail!`,
      voiceId: 'color_step_1',
      recommendedColor: spec.palette.base,
      defaultTool: 'crayon',
    },
    {
      stepNum: 2,
      partId: 'inner_ears_muzzle',
      title: 'Color Step 2/7: Inner Ears & Face Patch',
      hint: `Switch to soft ${spec.innerColorName} to color inside both ears and the face patch!`,
      voiceId: 'color_step_2',
      recommendedColor: spec.palette.inner,
      defaultTool: 'marker',
    },
    {
      stepNum: 3,
      partId: 'tummy_collar',
      title: 'Color Step 3/7: Cozy Tummy Patch & Collar',
      hint: 'Color the soft round belly patch and collar band inside the lines!',
      voiceId: 'color_step_3',
      recommendedColor: spec.palette.belly,
      defaultTool: 'crayon',
    },
    {
      stepNum: 4,
      partId: 'cheeks_mouth',
      title: 'Color Step 4/7: Rosy Blush Cheeks & Smile',
      hint: 'Brush sweet rosy pink onto both cheek circles and the happy smile!',
      voiceId: 'color_step_4',
      recommendedColor: spec.palette.cheek,
      defaultTool: 'watercolor',
    },
    {
      stepNum: 5,
      partId: 'magic_pendant',
      title: `Color Step 5/7: ${spec.pendantLabel}`,
      hint: `Use sparkling ${spec.pendantColorName} to make the ${spec.pendantLabel.toLowerCase()} shine!`,
      voiceId: 'color_step_5',
      recommendedColor: spec.palette.pendant,
      defaultTool: 'glitter',
    },
    {
      stepNum: 6,
      partId: 'shading_sparkles',
      title: 'Color Step 6/7: Soft 3D Shading & Eye Sparkles',
      hint: 'Artist secret! Brush soft shadow under the chin & paws to make your drawing 3D!',
      voiceId: 'color_step_6',
      recommendedColor: spec.palette.shade,
      defaultTool: 'watercolor',
    },
    {
      stepNum: 7,
      partId: 'background_frame',
      title: 'Color Step 7/7: Sunny Sky Background & Stickers',
      hint: 'Color the sky around your friend and add magic sparkles!',
      voiceId: 'color_step_7',
      recommendedColor: spec.palette.bg,
      defaultTool: 'glitter',
    },
  ];

  return {
    ...spec,
    ears,
    pendantStrokes,
    drawSteps,
    colorSteps,
  };
}

export const CHARACTER_LESSONS = [
  makeCritterLesson({
    id: 'catnap',
    name: 'CatNap',
    emoji: '🐱🌙',
    subtitle: 'Purple Moon Kitty',
    voicePickId: 'pick_catnap',
    earType: 'cat',
    earLabel: 'Pointed Kitty Ears',
    pendantType: 'moon',
    pendantLabel: 'Crescent Moon Charm',
    baseColorName: 'Lavender Purple',
    innerColorName: 'Soft Lilac',
    pendantColorName: 'Golden Yellow',
    palette: {
      base: '#9B5DE5',
      inner: '#E599F7',
      belly: '#F3D9FA',
      cheek: '#FF85C0',
      pendant: '#FFD43B',
      shade: '#6741D9',
      bg: '#D0BFFF',
    },
  }),
  makeCritterLesson({
    id: 'dogday',
    name: 'DogDay',
    emoji: '🐶☀️',
    subtitle: 'Sunny Leader Pup',
    voicePickId: 'pick_dogday',
    earType: 'floppy',
    earLabel: 'Floppy Puppy Ears',
    pendantType: 'sun',
    pendantLabel: 'Golden Sun Charm',
    baseColorName: 'Sunny Orange',
    innerColorName: 'Honey Amber',
    pendantColorName: 'Bright Sun Gold',
    palette: {
      base: '#FF922B',
      inner: '#FFD8A8',
      belly: '#FFF4E6',
      cheek: '#FF6B6B',
      pendant: '#FFD43B',
      shade: '#D9480F',
      bg: '#FFF3BF',
    },
  }),
  makeCritterLesson({
    id: 'bobby',
    name: 'Bobby BearHug',
    emoji: '🐻❤️',
    subtitle: 'Sweet Red Bear',
    voicePickId: 'pick_bobby',
    earType: 'bear',
    earLabel: 'Round Bear Ears',
    pendantType: 'heart',
    pendantLabel: 'Glowing Heart Charm',
    baseColorName: 'Cherry Red',
    innerColorName: 'Rose Pink',
    pendantColorName: 'Ruby Gold',
    palette: {
      base: '#FA5252',
      inner: '#FFCCD5',
      belly: '#FFF0F6',
      cheek: '#FF85C0',
      pendant: '#FFD43B',
      shade: '#C92A2A',
      bg: '#FFD8E4',
    },
  }),
  makeCritterLesson({
    id: 'hoppy',
    name: 'Hoppy Hopscotch',
    emoji: '🐰⚡',
    subtitle: 'Bouncy Mint Bunny',
    voicePickId: 'pick_hoppy',
    earType: 'bunny',
    earLabel: 'Tall Bunny Ears',
    pendantType: 'bolt',
    pendantLabel: 'Lightning Bolt Charm',
    baseColorName: 'Mint Green',
    innerColorName: 'Pastel Lime',
    pendantColorName: 'Electric Gold',
    palette: {
      base: '#40C057',
      inner: '#B2F2BB',
      belly: '#EBFBEE',
      cheek: '#FF85C0',
      pendant: '#FFD43B',
      shade: '#2B8A3E',
      bg: '#D3F9D8',
    },
  }),
  makeCritterLesson({
    id: 'craftycorn',
    name: 'CraftyCorn',
    emoji: '🦄🌈',
    subtitle: 'Rainbow Artist Unicorn',
    voicePickId: 'pick_craftycorn',
    earType: 'unicorn',
    earLabel: 'Unicorn Horn & Ears',
    pendantType: 'flower',
    pendantLabel: 'Rainbow Flower Charm',
    baseColorName: 'Sky Cyan',
    innerColorName: 'Cloud Aqua',
    pendantColorName: ' Blossom Pink',
    palette: {
      base: '#4DABF7',
      inner: '#C5F6FA',
      belly: '#F8F9FA',
      cheek: '#FF85C0',
      pendant: '#FF6B9D',
      shade: '#1971C2',
      bg: '#E7F5FF',
    },
  }),
  makeCritterLesson({
    id: 'pickypiggy',
    name: 'PickyPiggy',
    emoji: '🐷🍎',
    subtitle: 'Happy Pink Piggy',
    voicePickId: 'pick_pickypiggy',
    earType: 'piggy',
    earLabel: 'Perky Piggy Ears',
    pendantType: 'apple',
    pendantLabel: 'Crisp Apple Charm',
    baseColorName: 'Bubblegum Pink',
    innerColorName: 'Blush Peach',
    pendantColorName: 'Apple Red',
    palette: {
      base: '#F783AC',
      inner: '#FFDEEB',
      belly: '#FFF0F6',
      cheek: '#FF4D6D',
      pendant: '#FA5252',
      shade: '#C2255C',
      bg: '#FFE3EC',
    },
  }),
  makeCritterLesson({
    id: 'bubba',
    name: 'Bubba Bubbaphant',
    emoji: '🐘💡',
    subtitle: 'Clever Blue Elephant',
    voicePickId: 'pick_bubba',
    earType: 'elephant',
    earLabel: 'Big Elephant Ears',
    pendantType: 'bulb',
    pendantLabel: 'Bright Lightbulb Charm',
    baseColorName: 'Cerulean Blue',
    innerColorName: 'Powder Blue',
    pendantColorName: 'Bright Lemon Gold',
    palette: {
      base: '#339AF0',
      inner: '#A5D8FF',
      belly: '#E7F5FF',
      cheek: '#FF85C0',
      pendant: '#FFD43B',
      shade: '#1864AB',
      bg: '#D0EBFF',
    },
  }),
  makeCritterLesson({
    id: 'kickin',
    name: 'KickinChicken',
    emoji: '🐥⭐',
    subtitle: 'Cool Star Chicken',
    voicePickId: 'pick_kickin',
    earType: 'chicken',
    earLabel: 'Cool Feather Crest',
    pendantType: 'star',
    pendantLabel: 'Shining Star Charm',
    baseColorName: 'Sunny Yellow',
    innerColorName: 'Tangerine Orange',
    pendantColorName: 'Cyan Star Glow',
    palette: {
      base: '#FCC419',
      inner: '#FF922B',
      belly: '#FFF9DB',
      cheek: '#FF6B6B',
      pendant: '#22B8CF',
      shade: '#E67700',
      bg: '#FFF3BF',
    },
  }),
  makeCritterLesson({
    id: 'rainbow',
    name: 'Rainbow Friend',
    emoji: '🌈☁️',
    subtitle: 'Easy Starter Friend',
    voicePickId: 'pick_rainbow',
    earType: 'bear',
    earLabel: 'Puffy Cloud Ears',
    pendantType: 'star',
    pendantLabel: 'Rainbow Star Charm',
    baseColorName: 'Cloud Aqua',
    innerColorName: 'Sunny Gold',
    pendantColorName: 'Star Yellow',
    palette: {
      base: '#74C0FC',
      inner: '#FFE066',
      belly: '#FFFFFF',
      cheek: '#FF85C0',
      pendant: '#FFD43B',
      shade: '#339AF0',
      bg: '#FFF9DB',
    },
  }),
  makeCritterLesson({
    id: 'cupcake',
    name: 'Berry Cupcake Bear',
    emoji: '🧁🍓',
    subtitle: 'Sweet Frosting Friend',
    voicePickId: 'pick_cupcake',
    earType: 'bear',
    earLabel: 'Frosting Swirl Ears',
    pendantType: 'heart',
    pendantLabel: 'Strawberry Heart Charm',
    baseColorName: 'Strawberry Pink',
    innerColorName: 'Vanilla Cream',
    pendantColorName: 'Berry Red',
    palette: {
      base: '#FF85C0',
      inner: '#FFF0F6',
      belly: '#FFF9DB',
      cheek: '#FA5252',
      pendant: '#FA5252',
      shade: '#D6336C',
      bg: '#FFF0F6',
    },
  }),
];

export const SWATCH_PALETTE = [
  { hex: '#9B5DE5', name: 'CatNap Purple' },
  { hex: '#E599F7', name: 'Soft Lilac' },
  { hex: '#FF922B', name: 'DogDay Orange' },
  { hex: '#FFD43B', name: 'Sun Gold' },
  { hex: '#FA5252', name: 'Bobby Red' },
  { hex: '#FF85C0', name: 'Rosy Pink' },
  { hex: '#40C057', name: 'Hoppy Mint' },
  { hex: '#B2F2BB', name: 'Pastel Lime' },
  { hex: '#4DABF7', name: 'Crafty Sky' },
  { hex: '#22B8CF', name: 'Star Cyan' },
  { hex: '#F783AC', name: 'Piggy Pink' },
  { hex: '#FFF4E6', name: 'Cozy Cream' },
  { hex: '#6741D9', name: 'Royal Shade' },
  { hex: '#D9480F', name: 'Amber Shade' },
];
