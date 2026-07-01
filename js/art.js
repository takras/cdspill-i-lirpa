/* =========================================================================
   I  —  art.js
   Procedural VGA-style pixel art: sprites, item icons, wall textures,
   and title-screen painters. Everything generated to offscreen canvases.
   ========================================================================= */
'use strict';

const A = { spr: {}, tex: {} };

A.cv = function (w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c._c = c.getContext('2d'); c._c.imageSmoothingEnabled = false; return c;
};

// rows: array of equal-length strings; pal: {char:color}; '.'=' '=transparent
A.pix = function (rows, pal, scale) {
  scale = scale || 1;
  const h = rows.length, w = rows[0].length;
  const c = A.cv(w * scale, h * scale), x = c._c;
  for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) {
    const ch = rows[y][px];
    if (ch === '.' || ch === ' ') continue;
    const col = pal[ch]; if (!col) continue;
    x.fillStyle = col; x.fillRect(px * scale, y * scale, scale, scale);
  }
  return c;
};

A.build = function () {
  /* ---------------- ENEMIES ---------------- */

  // Tøffelgutta — the "slipper guys / tough little ladies" with open mouths
  A.spr.toffel = A.pix([
    '...kkkkkk...',
    '..kggggggk..',
    '.kgGGGGGGgk.',
    '.kGwwGGwwGk.',
    '.kGwbGGwbGk.',   // eyes
    '.kGGGGGGGGk.',
    '.kGmmmmmmGk.',   // open mouth
    '.kGmRRRRmGk.',
    '.kGmRRRRmGk.',
    '.kGmmmmmmGk.',
    '.kgGGGGGGgk.',
    '..kgGGGGgk..',
    '..k.kkkk.k..',
    '..k......k..',
  ], { k:'#0a1f12', g:'#1f6b3a', G:'#2fae5a', w:'#eaffea', b:'#06121e', m:'#0a0a0a', R:'#c2342f' }, 1);

  // The "smileplayer" companion — inverted tøffel, friendly
  A.spr.smiley = A.pix([
    '...kkkkkk...',
    '..kyyyyyyk..',
    '.kyYYYYYYyk.',
    '.kYbYYYYbYk.',
    '.kYYYYYYYYk.',
    '.kYYYYYYYYk.',
    '.kYbYYYYbYk.',   // smiling eyes
    '.kYYbbbbYYk.',
    '.kYbYYYYbYk.',   // smile
    '.kYYbbbbYYk.',
    '.kyYYYYYYyk.',
    '..kyYYYYyk..',
    '..k.kkkk.k..',
    '..k......k..',
  ], { k:'#2a1f00', y:'#b98a12', Y:'#f4c430', b:'#3a2a00' }, 1);

  // Shadow Lady / Shadow Ninja with the giant "disco-plate" shuriken
  A.spr.shadow = A.pix([
    '....SSSS....',
    '...SSSSSS...',
    '..SSPPPPSS..',   // hooded
    '..SPwSSwPS..',   // glowing eyes
    '..SSSSSSSS..',
    '.SSSSSSSSSS.',
    'SSS.SSSS.SSS',
    'SS..SSSS..SS',
    '.S..SSSS..S.',
    '....SSSS....',
    '...SS..SS...',
    '..SS....SS..',
    '.SS......SS.',
  ], { S:'#0b0b14', P:'#1a1a2e', w:'#7df0ff' }, 1);

  A.spr.star = A.pix([   // the bladed record
    '....RR....',
    '..R.RR.R..',
    '.RRRwwRRR.',
    'R.RwGGwR.R',
    'RRRwGGwRRR',
    'RRRwGGwRRR',
    'R.RwGGwR.R',
    '.RRRwwRRR.',
    '..R.RR.R..',
    '....RR....',
  ], { R:'#c9d2dd', w:'#5a6472', G:'#20242e' }, 1);

  // Dwarf in the mountain — "Dark Souls before Dark Souls"
  A.spr.dwarf = A.pix([
    '..hhhhhh..',
    '.hhHHHHhh.',
    '.hHsssssH.',
    '.HsskssksH',   // angry eyes
    '.Hssssss sH',
    '.RRRRRRRR.',   // big beard
    'RRRRRRRRRR',
    'RRRRwwRRRR',
    '.RRRRRRRR.',
    '..bbbbbb..',
    '.bBB..BBb.',
    '.bb....bb.',
  ], { h:'#3a2a18', H:'#5a4228', s:'#d6b78e', k:'#101010', R:'#8a3b22', w:'#b0512e', b:'#243', B:'#352' }, 1);

  // Dragon / bear (the eternal debate). Red-bearded, chunky, ambiguous.
  A.spr.dragon = A.pix([
    '...DDDDDD....',
    '..DDDDDDDD...',
    '.DDgwDDwgDD..',   // eyes
    '.DDDDDDDDDD..',
    '.DDRRRRRRDD..',   // red snout/beard
    'DDRRRRRRRRDD.',
    'DRRRwwwwRRRD.',   // teeth/mouth
    'DDRRRRRRRRDD.',
    '.DDDDDDDDDD..',
    'wDDDDDDDDDDw.',   // little wings
    'wwDD.DD.DDww.',
    '..DD....DD...',
  ], { D:'#2e5d34', g:'#0a0', w:'#f0f0d0', R:'#b8472a' }, 1);

  // Sun-god face (fantasy boss)
  A.spr.sungod = A.pix([
    '..o..o..o..',
    'o.OOOOOO.o.',
    '.OOyyyyOO..',
    'oOyYbYYbyOo',
    '.OyYYYYYyO.',
    'oOyYbbbbyOo',   // stern mouth
    '.OOyyyyOO..',
    'o.OOOOOO.o.',
    '..o..o..o..',
  ], { o:'#ffd24a', O:'#ffae1a', y:'#ffe98a', Y:'#fff3c0', b:'#7a4a00' }, 1);

  // Boy at the Olivetti (the creepy cutscene)
  A.spr.boy = A.pix([
    '..hhhh..',
    '.hssssh.',
    '.sskks s',
    '.ssssss.',
    '..bbbb..',
    '.bBBBBb.',
    'bBBBBBBb',
    'b.bBBb.b',
    '..bb.bb.',
  ], { h:'#5a3a1a', s:'#e8c39a', k:'#222', b:'#2a6', B:'#185' }, 1);

  /* ---------------- ITEM ICONS (12x12-ish) ---------------- */
  A.spr.fireball = A.pix([
    '.... oo ....','...oRRRo....','..oRYYRo o..','.oRYYYYRo...',
    'oRYYwwYYRo..','oRYwwwwYRo..','oRYYwwYYRo..','.oRYYYYRo...',
    '..oRYYRoo...','...oRRRo....','....ooo.....','............',
  ], { o:'#7a1a00', R:'#e2531a', Y:'#ffb02e', w:'#fff1b0' }, 1);

  A.spr.plasma = A.pix([
    '....pp......','...pPPp.....','..pPccPp.p..','.pPccwwPp...',
    'pPcwwwwcPp..','pPcwwwwcPp..','pPccwwccPp..','.pPccccPp...',
    '..pPccPpp...','...pPPp.....','....pp......','...p..p.....',
  ], { p:'#3a005a', P:'#7a2ad0', c:'#b86bff', w:'#ecc6ff' }, 1);

  A.spr.blueBall = A.pix([
    '...bbbb.....','..bBBBBb....','.bBwwBBBb...','bBwwwBBBBb..',
    'bBwwBBBBBb..','bBBBBBBBBb..','bBBBBBBBBb..','.bBBBBBBb...',
    '..bBBBBb....','...bbbb.....','............','............',
  ], { b:'#06204a', B:'#1e6bff', w:'#bcd8ff' }, 1);

  A.spr.yellowBall = A.pix([
    '...yyyy.....','..yYYYYy....','.yYwwYYYy...','yYwwwYYYYy..',
    'yYwwYYYYYy..','yYYYYYYYYy..','yYYYYYYYYy..','.yYYYYYYy...',
    '..yYYYYy....','...yyyy.....','............','............',
  ], { y:'#5a4a00', Y:'#ffd21e', w:'#fff6c0' }, 1);

  A.spr.lightsword = A.pix([
    '.....ww.....','.....cc.....','.....cc.....','.....cc.....',
    '....cccc....','.....cc.....','.....cc.....','....gggg....',
    '...g.gg.g...','.....hh.....','.....hh.....','............',
  ], { w:'#eaffff', c:'#7df0ff', g:'#cfa033', h:'#5a3a10' }, 1);

  A.spr.firesnake = A.pix([
    '.RR.........','RYYR..RRR...','RYwYRRYYYR..','.RYYYYYwYR..',
    '..RYYYRYYR..','..RYYRRYR...','.RYYR..RR...','RYYR........',
    'RYYR........','.RR.........','............','............',
  ], { R:'#7a1a00', Y:'#e2531a', w:'#ffd060' }, 1);

  A.spr.plankBig = A.pix([
    'wwwwwwwwwww.','wDDDDDDDDDw.','wDwDDwDDwDDw','wDDDDDDDDDDw',
    'wDwDDwDDwDDw','wDDDDDDDDDDw','wDwDDwDDwDDw','wwwwwwwwwww.',
    '............','............','............','............',
  ], { w:'#6a4a22', D:'#8a6630' }, 1);

  A.spr.plankSmall = A.pix([
    '............','...wwwwww...','...wDDDDw...','...wDwDDw...',
    '...wDDDDw...','...wwwwww...','............','............',
    '............','............','............','............',
  ], { w:'#6a4a22', D:'#8a6630' }, 1);

  A.spr.triangle = A.pix([
    '.....t......','.....tt.....','....tTt.....','....tTTt....',
    '...tTTTt....','...tTTTTt...','..tTTTTTt...','..tTTTTTTt..',
    '.tTTTTTTTt..','.ttttttttt..','............','............',
  ], { t:'#1a4a2a', T:'#2fae5a' }, 1);

  A.spr.square = A.pix([
    '............','.fffffffff..','.fSSSSSSSf..','.fSffffSSf..',
    '.fSfSSfSSf..','.fSfSSfSSf..','.fSffffSSf..','.fSSSSSSSf..',
    '.fffffffff..','............','............','............',
  ], { f:'#2a2a4a', S:'#5a6bff' }, 1);

  A.spr.pf1000 = A.pix([
    '............','.MMMMMMM....','MMwwwwwMMM..','MMwccccwMMMM',
    'MMwccccwMMMM','MMwwwwwMMM o','.MMMMMMM..oo','...MM...oOOo',
    '...MM..oOOo.','...MM.......','............','............',
  ], { M:'#3a3a44', w:'#9aa', c:'#cdd', o:'#ff7a1a', O:'#ffd24a' }, 1);

  A.spr.timeblast = A.pix([
    '....z.......','...zZz......','..zZwZz.....','.zZwwwZz....',
    'zZwwWwwZz...','.zZwwwZz....','..zZwZz.....','...zZz...z..',
    '....z...zZz.','.......zZz..','........z...','............',
  ], { z:'#1a3a6a', Z:'#2a8aff', w:'#9cd2ff', W:'#ffffff' }, 1);

  A.spr.deathtimer = A.pix([
    '....rrrr....','..rr....rr..','.r..rddr..r.','r..rd..dr..r',
    'r..d.r..d..r','r..d.rrrd..r','r..d....d..r','.r..dddd..r.',
    '..rr....rr..','....rrrr....','............','............',
  ], { r:'#5a0010', d:'#ff2a3a' }, 1);

  A.spr.card = A.pix([
    'cccccccccc..','cWWWWWWWWc..','cWpppppWWc..','cWpYYpWWWc..',
    'cWppppWWWc..','cWWWWWWWWc..','cWsymbolWc..','cWWWWWWWWc..',
    'cccccccccc..','............','............','............',
  ], { c:'#caa84a', W:'#1a1a2a', p:'#b86bff', Y:'#ffd21e', s:'#7df0ff', y:'#7df0ff', m:'#7df0ff', b:'#7df0ff', o:'#7df0ff', l:'#7df0ff' }, 1);

  A.spr.dongle = A.pix([
    '..gggggg....','.gDDDDDDg...','.gDwwwwDg...','.gDDDDDDg...',
    '..gg..gg....','...g..g.....','...g..g.....','...gggg.....',
    '..g....g....','.g......g...','............','............',
  ], { g:'#333', D:'#555', w:'#1de0f0' }, 1);

  // Carnage HUD face — half-flesh / half-machine
  A.spr.carnage = A.pix([
    '.kkkkkkkk.','kssssMMMMk','ksbssMcMMk','ksssMMMMMk',
    'ksRRsMMMMk','kssssMwMMk','.kkkkkkkk.',
  ], { k:'#101014', s:'#caa', b:'#206', M:'#445', c:'#0ff', w:'#0ff', R:'#922' }, 1);

  /* ---------------- WALL TEXTURES (32x32) ---------------- */
  A.tex.cyber = A.makeTex(32, (x, y) => {
    const panel = (Math.floor(x / 8) + Math.floor(y / 16)) % 2;
    let v = panel ? 60 : 44;
    if (x % 8 === 0 || y % 16 === 0) v = 22;            // seams
    if (y % 16 === 8 && x % 8 < 2) v = 90;              // rivets/lights
    const blue = v + 18;
    return `rgb(${v - 6},${v + 2},${blue})`;
  });
  A.tex.cyberLit = A.makeTex(32, (x, y) => {
    const stripe = (x % 6 < 1) ? 1 : 0;
    if (stripe) return '#1de0f0';
    const v = 30 + ((x * 3 + y) % 18);
    return `rgb(${v},${v + 4},${v + 20})`;
  });
  A.tex.stone = A.makeTex(32, (x, y) => {
    const by = Math.floor(y / 8), off = by % 2 ? 8 : 0;
    const brick = (Math.floor((x + off) / 8));
    let v = 96 + ((brick * 37 + by * 13) % 30) - 15;
    if ((x + off) % 8 === 0 || y % 8 === 0) v = 50;     // mortar
    v += ((x * 7 + y * 13) % 10) - 5;                   // grain
    return `rgb(${v + 14},${v + 6},${v - 18})`;
  });
  A.tex.sand = A.makeTex(32, (x, y) => {
    const v = 150 + ((x * 5 + y * 11) % 24) - 12 + (Math.sin(y * 0.4) * 8);
    return `rgb(${v + 30},${v + 6},${v - 60})`;
  });
  A.tex.white = A.makeTex(32, (x, y) => {
    const v = 210 + ((x + y) % 12);
    return `rgb(${v},${v},${v + 6})`;
  });
  A.tex.doorCyber = A.makeTex(32, (x, y) => {
    if (x < 2 || x > 29) return '#0c2230';
    if (Math.abs(x - 16) < 1) return '#1de0f0';
    const v = 40 + ((y * 2) % 30);
    return `rgb(${v - 8},${v},${v + 24})`;
  });
  A.tex.doorStone = A.makeTex(32, (x, y) => {
    if (x < 3 || x > 28) return '#3a2a14';
    const plank = Math.floor((x - 3) / 6);
    let v = 80 + (plank % 2 ? 16 : 0) + ((y * 3) % 10);
    if (Math.abs(y - 16) < 1) v = 40;
    return `rgb(${v + 20},${v},${v - 30})`;
  });
};

A.makeTex = function (size, fn) {
  const c = A.cv(size, size), x = c._c;
  for (let y = 0; y < size; y++) for (let px = 0; px < size; px++) {
    x.fillStyle = fn(px, y); x.fillRect(px, y, 1, 1);
  }
  // cache column color reads for the raycaster
  c._img = x.getImageData(0, 0, size, size).data;
  c._size = size;
  return c;
};

/* ---------------- TITLE-SCREEN PAINTER ----------------
   A circular "look through the stone tunnel": split down the middle —
   sand/fantasy (left) vs steel/cyber (right) — with the sun-eye and the
   descending beam at the centre. Modelled on the illustrator's watercolour.
   hot ∈ null | 'fantasy' | 'cyber' | 'sun'  (for hover highlight)        */
A.paintTitle = function (ctx, t, hot) {
  const cx = 160, cy = 86, R = 82, ringOut = 96;
  const cos = Math.cos, sin = Math.sin, TAU = Math.PI * 2;

  // dark stone/shadow backdrop (the corners)
  ctx.fillStyle = '#0b0a0d'; ctx.fillRect(0, 0, 320, 200);

  // ---- scene inside the round opening ----
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();

  // LEFT: sand / fantasy (blue sky, orange peaks, green)
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, cx, 200); ctx.clip();
  let g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  g.addColorStop(0, '#3f86c4'); g.addColorStop(0.55, '#8ec5e8'); g.addColorStop(1, '#d7e9cf');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cx, 200);
  // rolling green field
  ctx.fillStyle = '#3a9a45';
  ctx.beginPath(); ctx.moveTo(0, 150);
  for (let x = 0; x <= cx; x += 12) ctx.lineTo(x, 150 - sin(x * 0.05) * 6);
  ctx.lineTo(cx, 200); ctx.lineTo(0, 200); ctx.fill();
  // orange jagged mountains
  ctx.fillStyle = '#c9772e';
  ctx.beginPath(); ctx.moveTo(0, 168);
  ctx.lineTo(0, 128); ctx.lineTo(24, 150); ctx.lineTo(46, 96);
  ctx.lineTo(70, 138); ctx.lineTo(96, 108); ctx.lineTo(122, 150); ctx.lineTo(cx, 152);
  ctx.lineTo(cx, 168); ctx.closePath(); ctx.fill();
  // sunlit / shadow faces
  ctx.fillStyle = '#e39a4a';
  ctx.beginPath(); ctx.moveTo(46, 96); ctx.lineTo(70, 138); ctx.lineTo(58, 138); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9a5622';
  ctx.beginPath(); ctx.moveTo(96, 108); ctx.lineTo(122, 150); ctx.lineTo(96, 150); ctx.closePath(); ctx.fill();
  // little green thicket at the base
  ctx.fillStyle = '#2f8f3a';
  ctx.beginPath(); ctx.ellipse(30, 152, 15, 8, 0, 0, TAU); ctx.fill();
  ctx.restore();

  // RIGHT: steel / cyber (purple sky, buildings, portal, palm)
  ctx.save();
  ctx.beginPath(); ctx.rect(cx, 0, 320 - cx, 200); ctx.clip();
  g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  g.addColorStop(0, '#3a2450'); g.addColorStop(0.55, '#6b3a63'); g.addColorStop(1, '#9a5a4a');
  ctx.fillStyle = g; ctx.fillRect(cx, 0, 320 - cx, 200);
  // buildings (steel-brown blocks)
  const bld = [[188, 96, 22, 80], [206, 70, 30, 108], [234, 104, 22, 74], [186, 128, 66, 50]];
  for (let i = 0; i < bld.length; i++) {
    const [bx, by, bw, bh] = bld[i];
    ctx.fillStyle = i % 2 ? '#7a6a5a' : '#8c7c6a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(bx, by, 3, bh);      // shaded edge
    for (let wy = by + 6; wy < by + bh - 4; wy += 10)
      for (let wx = bx + 5; wx < bx + bw - 4; wx += 9) {
        const lit = ((wx * 7 + wy * 5) % 8 < 3);
        const fl = lit && sin(t * 3 + wx + wy) > 0.6;
        ctx.fillStyle = fl ? '#ffe98a' : (lit ? '#d8c060' : '#2a2018');
        ctx.fillRect(wx, wy, 4, 5);
      }
  }
  // the dark round portal (a tunnel mouth) lower-right
  ctx.fillStyle = '#0c0a12';
  ctx.beginPath(); ctx.ellipse(236, 150, 20, 26, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#6a6152'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(236, 150, 20, 26, 0, 0, TAU); ctx.stroke();
  // a small palm plant
  ctx.strokeStyle = '#2f8f3a'; ctx.lineWidth = 2;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath(); ctx.moveTo(210, 168);
    ctx.quadraticCurveTo(210 + k * 5, 150, 210 + k * 9, 148 + Math.abs(k) * 2); ctx.stroke();
  }

  ctx.restore();

  // central descending BEAM (the seed / the light)
  const bTop = cy + 14, bBot = cy + R;
  g = ctx.createLinearGradient(0, bTop, 0, bBot);
  g.addColorStop(0, 'rgba(255,224,90,0.95)'); g.addColorStop(1, 'rgba(255,196,60,0)');
  ctx.fillStyle = g;
  const flick = 1 + sin(t * 8) * 0.15;
  ctx.beginPath();
  ctx.moveTo(cx - 3, bTop); ctx.lineTo(cx + 3, bTop);
  ctx.lineTo(cx + 11 * flick, bBot); ctx.lineTo(cx - 11 * flick, bBot); ctx.closePath(); ctx.fill();

  // the SUN / EYE at the centre
  const sr = 27 + (hot === 'sun' ? 3 : 0) + sin(t * 2) * 1.5;
  for (let i = 6; i >= 0; i--) {                     // outer glow
    ctx.fillStyle = `rgba(255,210,90,${0.05 + (hot === 'sun' ? 0.035 : 0)})`;
    ctx.beginPath(); ctx.arc(cx, cy, sr + i * 7, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,180,40,0.35)'; ctx.lineWidth = 2;  // petals/rays
  for (let a = 0; a < 20; a++) {
    const an = a / 20 * TAU + t * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx + cos(an) * sr * 0.92, cy + sin(an) * sr * 0.92);
    ctx.lineTo(cx + cos(an) * (sr + 7), cy + sin(an) * (sr + 7)); ctx.stroke();
  }
  const sg = ctx.createRadialGradient(cx, cy, 2, cx, cy, sr);
  sg.addColorStop(0, '#180300'); sg.addColorStop(0.20, '#3a0800');
  sg.addColorStop(0.34, '#a51e08'); sg.addColorStop(0.55, '#e8681a');
  sg.addColorStop(0.78, '#ffc21e'); sg.addColorStop(1, '#fff2a6');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, sr, 0, TAU); ctx.fill();
  ctx.fillStyle = '#120200'; ctx.beginPath(); ctx.arc(cx, cy, sr * 0.16, 0, TAU); ctx.fill();  // pupil

  // hover highlight on the chosen half
  if (hot === 'fantasy') { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, 0, cx, 200); }
  if (hot === 'cyber') { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(cx, 0, 320 - cx, 200); }

  ctx.restore();   // end round clip

  // ---- STONE ARCH RING (voussoirs) ----
  const segs = 30;
  for (let a = 0; a < segs; a++) {
    const a0 = a / segs * TAU, a1 = (a + 1) / segs * TAU;
    const sh = 132 + ((a * 41) % 46) - 23;
    ctx.fillStyle = `rgb(${sh},${sh - 6},${sh - 16})`;
    ctx.beginPath();
    ctx.moveTo(cx + cos(a0) * R, cy + sin(a0) * R);
    ctx.lineTo(cx + cos(a0) * ringOut, cy + sin(a0) * ringOut);
    ctx.lineTo(cx + cos(a1) * ringOut, cy + sin(a1) * ringOut);
    ctx.lineTo(cx + cos(a1) * R, cy + sin(a1) * R);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(48,44,38,0.85)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // rims
  ctx.lineWidth = 2; ctx.strokeStyle = '#2f2b25';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#c3bdac';
  ctx.beginPath(); ctx.arc(cx, cy, ringOut, 0, TAU); ctx.stroke();

  return { cx, cy, R, sun: { x: cx, y: cy, r: sr } };
};
