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

/* ---------------- TITLE-SCREEN PAINTERS ---------------- */
// Cyberpunk skyline with the low sun upper-left. tHover: 0..1 sun glow boost.
A.paintTitle = function (ctx, t, sunHover, figHover) {
  // sky gradient (dusk over steel)
  const g = ctx.createLinearGradient(0, 0, 0, 130);
  g.addColorStop(0, '#1a2740'); g.addColorStop(0.5, '#3a2b4a'); g.addColorStop(1, '#6a3a50');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 130);

  // the sun (upper-left), choice hot-spot for the FANTASY beginning
  const sx = 54, sy = 40, baseR = 22 + (sunHover ? 4 : 0);
  for (let i = 6; i >= 0; i--) {
    const a = 0.06 + (sunHover ? 0.05 : 0);
    ctx.fillStyle = `rgba(255,200,90,${a})`;
    ctx.beginPath(); ctx.arc(sx, sy, baseR + i * 6, 0, 7); ctx.fill();
  }
  const sg = ctx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, baseR);
  sg.addColorStop(0, '#fff6cf'); sg.addColorStop(0.6, '#ffd24a'); sg.addColorStop(1, '#ff8a2a');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, baseR, 0, 7); ctx.fill();
  // sun reflecting down the city
  ctx.fillStyle = 'rgba(255,180,80,0.06)'; ctx.fillRect(0, 0, 320, 130);

  // skyline silhouettes (parallax-ish, static)
  const towers = [
    [10, 70, 26, 60], [40, 84, 18, 46], [64, 58, 30, 72], [100, 78, 22, 52],
    [128, 66, 26, 64], [160, 86, 20, 44], [184, 54, 34, 76], [224, 72, 24, 58],
    [252, 84, 18, 46], [276, 60, 30, 70],
  ];
  for (const [x, y, w, h] of towers) {
    ctx.fillStyle = '#101622'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0a0e16'; ctx.fillRect(x, y, 2, h);
    // windows, some flicker
    for (let wy = y + 4; wy < y + h - 2; wy += 6)
      for (let wx = x + 3; wx < x + w - 2; wx += 5) {
        const lit = ((wx * 13 + wy * 7) % 9 < 4);
        const fl = lit && (Math.sin(t * 3 + wx + wy) > 0.7);
        ctx.fillStyle = fl ? '#ffe98a' : (lit ? '#3a86c0' : '#0c1018');
        ctx.fillRect(wx, wy, 2, 3);
      }
  }
  // ground / street
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(0, 128, 320, 72);
  for (let x = -((t * 30) % 24); x < 320; x += 24) {
    ctx.strokeStyle = 'rgba(61,240,255,0.18)'; ctx.beginPath();
    ctx.moveTo(160, 130); ctx.lineTo(x, 200); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(61,240,255,0.10)';
  for (let i = 1; i < 6; i++) { const yy = 130 + i * i * 2.2; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(320, yy); ctx.stroke(); }

  // the lone figure standing in the street — the "I" / choice hot-spot for CYBER
  const fx = 198, fy = 150;
  ctx.fillStyle = figHover ? '#7df0ff' : '#0c1018';
  // simple long-coat silhouette
  ctx.fillRect(fx - 4, fy - 18, 8, 20);
  ctx.fillRect(fx - 5, fy - 8, 10, 16);
  ctx.fillRect(fx - 3, fy - 24, 6, 7);
  if (figHover) { ctx.fillStyle = 'rgba(125,240,255,0.25)'; ctx.fillRect(fx - 8, fy - 26, 16, 30); }
  // neon reflection
  ctx.fillStyle = 'rgba(125,240,255,0.10)'; ctx.fillRect(fx - 5, fy + 2, 10, 12);

  return { sun: { x: sx, y: sy, r: baseR + 10 }, fig: { x: fx, y: fy - 12, r: 16 } };
};
