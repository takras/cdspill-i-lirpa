/* =========================================================================
   I  —  engine.js
   Core: 320x200 VGA backbuffer, game loop, input, bitmap font, draw helpers.
   Everything hangs off the global E (engine) and GAME (shared state).
   ========================================================================= */
'use strict';

const E = {
  W: 320, H: 200,
  canvas: null, ctx: null,
  keys: {}, pressed: {},          // pressed = rising-edge for this frame
  mouse: { x: 0, y: 0, down: false, clicked: false, moved: false },
  t: 0, dt: 0, frame: 0,
  scene: null, _next: null,
  reduceFlash: false,
  shakeT: 0, shakeAmp: 0,
};

const GAME = {
  // shared player / run state, see scenes.js for full init
  inv: [],                 // inventory item ids
  begin: null,             // which beginning was chosen
  flags: {},               // misc story flags
  hp: 100, maxHp: 100,
  ammo: 60,
  weapon: 'fist',
  visited: {},
  clockBand: 'day',        // day | dusk | night  (from real PC clock)
};

/* ---------- boot ---------- */
E.init = function () {
  E.canvas = document.getElementById('screen');
  E.ctx = E.canvas.getContext('2d', { alpha: false });
  E.ctx.imageSmoothingEnabled = false;
  E.buildFont();
  E.bindInput();
  E.computeClockBand();
};

/* ---------- real PC clock → mood band (the game "follows the clock") ---- */
E.computeClockBand = function () {
  const h = new Date().getHours();
  if (h >= 6 && h < 17) GAME.clockBand = 'day';
  else if (h >= 17 && h < 21) GAME.clockBand = 'dusk';
  else GAME.clockBand = 'night';
};

/* ---------- input ---------- */
E.bindInput = function () {
  addEventListener('keydown', (e) => {
    const c = e.code;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(c)) e.preventDefault();
    if (!E.keys[c]) E.pressed[c] = true;
    E.keys[c] = true;
  });
  addEventListener('keyup', (e) => { E.keys[e.code] = false; });
  addEventListener('blur', () => { E.keys = {}; });

  const toLogical = (cx, cy) => {
    const r = E.canvas.getBoundingClientRect();
    E.mouse.x = ((cx - r.left) / r.width) * E.W;
    E.mouse.y = ((cy - r.top) / r.height) * E.H;
  };
  E.canvas.addEventListener('mousemove', (e) => { toLogical(e.clientX, e.clientY); E.mouse.moved = true; });
  E.canvas.addEventListener('mousedown', (e) => { toLogical(e.clientX, e.clientY); E.mouse.down = true; E.mouse.clicked = true; });
  addEventListener('mouseup', () => { E.mouse.down = false; });
  // touch → treat as click/move
  E.canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; toLogical(t.clientX, t.clientY);
    E.mouse.down = true; E.mouse.clicked = true; e.preventDefault();
  }, { passive: false });
  E.canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; toLogical(t.clientX, t.clientY); e.preventDefault();
  }, { passive: false });
  E.canvas.addEventListener('touchend', () => { E.mouse.down = false; });
};

E.key = (c) => !!E.keys[c];
E.hit = (c) => !!E.pressed[c];
// "any of" helpers for friendly bindings
E.keyAny = (...cs) => cs.some((c) => E.keys[c]);
E.hitAny = (...cs) => cs.some((c) => E.pressed[c]);

/* ---------- scene management ---------- */
E.setScene = function (s) { E._next = s; };

E._applyScene = function () {
  if (!E._next) return;
  if (E.scene && E.scene.leave) E.scene.leave();
  E.scene = E._next; E._next = null;
  E.shakeT = 0; E.shakeAmp = 0;
  if (E.scene.enter) E.scene.enter();
};

/* ---------- main loop ---------- */
E.start = function () {
  let last = performance.now();
  const loop = (now) => {
    E.dt = Math.min(0.05, (now - last) / 1000);
    last = now; E.t += E.dt; E.frame++;
    E._applyScene();
    if (E.scene) {
      if (E.scene.update) E.scene.update(E.dt);
      // screen shake
      let ox = 0, oy = 0;
      if (E.shakeT > 0 && !E.reduceFlash) {
        E.shakeT -= E.dt;
        const a = E.shakeAmp * Math.max(0, E.shakeT);
        ox = (Math.random() * 2 - 1) * a; oy = (Math.random() * 2 - 1) * a;
      }
      E.ctx.save();
      E.ctx.translate(ox | 0, oy | 0);
      if (E.scene.render) E.scene.render();
      E.ctx.restore();
    }
    // clear rising-edge state
    E.pressed = {}; E.mouse.clicked = false; E.mouse.moved = false;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

E.shake = function (amp, dur) {
  if (E.reduceFlash) return;
  E.shakeAmp = amp; E.shakeT = dur;
};

/* ---------- draw helpers (all operate on logical 320x200) ---------- */
const G = {};
G.clear = (col) => { E.ctx.fillStyle = col || '#000'; E.ctx.fillRect(0, 0, E.W, E.H); };
G.rect = (x, y, w, h, col) => { E.ctx.fillStyle = col; E.ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h)); };
G.rectO = (x, y, w, h, col) => { E.ctx.strokeStyle = col; E.ctx.lineWidth = 1; E.ctx.strokeRect((x | 0) + .5, (y | 0) + .5, w - 1, h - 1); };
G.px = (x, y, col) => { E.ctx.fillStyle = col; E.ctx.fillRect(x | 0, y | 0, 1, 1); };
G.line = (x0, y0, x1, y1, col) => {
  E.ctx.strokeStyle = col; E.ctx.lineWidth = 1;
  E.ctx.beginPath(); E.ctx.moveTo((x0 | 0) + .5, (y0 | 0) + .5); E.ctx.lineTo((x1 | 0) + .5, (y1 | 0) + .5); E.ctx.stroke();
};
G.circle = (x, y, r, col) => { E.ctx.fillStyle = col; E.ctx.beginPath(); E.ctx.arc(x, y, r, 0, 7); E.ctx.fill(); };
G.spr = (cv, x, y, scale) => {
  scale = scale || 1;
  E.ctx.imageSmoothingEnabled = false;
  E.ctx.drawImage(cv, x | 0, y | 0, cv.width * scale, cv.height * scale);
};
// vertical gradient fill helper
G.vgrad = (x, y, w, h, top, bot) => {
  const g = E.ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  E.ctx.fillStyle = g; E.ctx.fillRect(x | 0, y | 0, w, h);
};

/* ---------- hand-drawn 5x7 bitmap font (crisp & legible, tintable) -------- */
E.font = { glyphs: {}, w: 5, h: 7 };
E.FONT5x7 = {
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '&': ['.##..', '#..#.', '.##..', '.##.#', '#..#.', '#..#.', '.##.#'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  'D': ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
  'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  'N': ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  'S': ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
  '^': ['..#..', '.#.#.', '#...#', '.....', '.....', '.....', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
};
E.buildFont = function () {
  const glyphs = {};
  for (const ch in E.FONT5x7) {
    const rows = E.FONT5x7[ch].map((s) => {
      let bits = 0;
      for (let x = 0; x < 5; x++) if (s[x] === '#') bits |= (1 << x);
      return bits;
    });
    glyphs[ch] = rows;
  }
  E.font.glyphs = glyphs;
};

// width of one char cell incl. 1px spacing, at scale
E.textW = (str, scale) => str.length * (E.font.w + 1) * (scale || 1);

E.text = function (x, y, str, col, scale) {
  scale = scale || 1; col = col || '#fff';
  E.ctx.fillStyle = col;
  let cx = x | 0;
  const fh = E.font.h, fw = E.font.w;
  for (let i = 0; i < str.length; i++) {
    const g = E.font.glyphs[str[i].toUpperCase()] || E.font.glyphs[str[i]];
    if (g) {
      for (let ry = 0; ry < fh; ry++) {
        const bits = g[ry];
        if (!bits) continue;
        for (let rx = 0; rx < fw; rx++) {
          if (bits & (1 << rx)) E.ctx.fillRect(cx + rx * scale, y + ry * scale, scale, scale);
        }
      }
    }
    cx += (fw + 1) * scale;
  }
};

E.textC = function (cx, y, str, col, scale) {
  E.text(cx - E.textW(str, scale) / 2, y, str, col, scale);
};

// drop-shadow text (used for the "clean pro" UI look)
E.textS = function (x, y, str, col, scale, shadow) {
  E.text(x + (scale || 1), y + (scale || 1), str, shadow || '#000', scale);
  E.text(x, y, str, col, scale);
};

/* ---------- small util ---------- */
const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rnd: (a, b) => a + Math.random() * (b - a),
  rndi: (a, b) => (a + Math.random() * (b - a + 1)) | 0,
  pick: (arr) => arr[(Math.random() * arr.length) | 0],
  dist: (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0),
  now: () => performance.now() / 1000,
};
