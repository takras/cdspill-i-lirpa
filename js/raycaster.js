/* =========================================================================
   I  —  raycaster.js
   A compact textured raycaster (Doom-ish, "3D if you can call it 3D").
   Walls via DDA + 1px texture slices; sprites as z-buffered billboards.
   Scenes own the rules; RC owns the rendering & movement math.
   ========================================================================= */
'use strict';

const RC = {};

RC.TEX = {};   // id -> texture canvas
RC.initTextures = function () {
  RC.TEX = {
    1: A.tex.cyber, 2: A.tex.cyberLit, 3: A.tex.stone, 4: A.tex.sand,
    5: A.tex.white, 6: A.tex.doorCyber, 7: A.tex.doorStone,
  };
};

/* world = { map, w, h, player, entities, theme, doors } */
RC.make = function (mapRows, opts) {
  opts = opts || {};
  const map = mapRows.map((r) => r.split('').map((c) => (c === '#' ? 1 :
    c === '%' ? 2 : c === 'S' ? 3 : c === '.' ? 0 : c === ',' ? 0 :
    c === 'W' ? 5 : c === 'D' ? 6 : c === 'd' ? 7 : c === 'B' ? 4 :
    parseInt(c, 36) || 0)));
  // translate convenience chars: . , = floor(0); we used 0 for empties.
  const h = map.length, w = map[0].length;
  const world = {
    map, w, h,
    player: { x: opts.px || 2.5, y: opts.py || 2.5, a: opts.pa || 0, fov: opts.fov || Math.PI / 3 },
    entities: [],
    doors: {},
    theme: opts.theme || 'cyber',
    invertGrav: false,
  };
  return world;
};

RC.cell = function (world, x, y) {
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return 1;
  return world.map[y | 0][x | 0];
};
RC.solid = function (world, x, y) {
  const c = RC.cell(world, x, y);
  if (c === 0) return false;
  if (c === 6 || c === 7) {                       // door
    const k = (x | 0) + ',' + (y | 0);
    return !(world.doors[k] && world.doors[k] >= 1);
  }
  return true;
};

RC.move = function (world, forward, strafe, rot, dt) {
  const p = world.player;
  p.a += rot * dt;
  const spd = 2.6 * dt, ss = 2.0 * dt;
  const dx = Math.cos(p.a), dy = Math.sin(p.a);
  let nx = p.x + dx * forward * spd - dy * strafe * ss;
  let ny = p.y + dy * forward * spd + dx * strafe * ss;
  const r = 0.22;
  if (!RC.solid(world, nx + Math.sign(nx - p.x) * r, p.y)) p.x = nx;
  if (!RC.solid(world, p.x, ny + Math.sign(ny - p.y) * r)) p.y = ny;
};

// cell directly in front of the player (for "use"/door)
RC.front = function (world, range) {
  const p = world.player; range = range || 1.0;
  const fx = p.x + Math.cos(p.a) * range, fy = p.y + Math.sin(p.a) * range;
  return { x: fx | 0, y: fy | 0, c: RC.cell(world, fx, fy) };
};

RC.openDoor = function (world, cx, cy) {
  const c = RC.cell(world, cx, cy);
  if (c === 6 || c === 7) {
    const k = cx + ',' + cy;
    world.doors[k] = 1;
    S.sfx('door');
    return true;
  }
  return false;
};

/* ---------- render ---------- */
RC.zbuf = new Float32Array(E.W);

RC.render = function (world) {
  const ctx = E.ctx, W = E.W, H = E.H;
  const p = world.player;
  const horizon = (H >> 1) + (world.pitch || 0);

  // sky / ceiling + floor
  RC._sky(world, horizon);

  const dirX = Math.cos(p.a), dirY = Math.sin(p.a);
  const planeLen = Math.tan(p.fov / 2);
  const planeX = -dirY * planeLen, planeY = dirX * planeLen;

  for (let x = 0; x < W; x++) {
    const camX = 2 * x / W - 1;
    const rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
    let mapX = p.x | 0, mapY = p.y | 0;
    const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
    let stepX, stepY, sideX, sideY;
    if (rdx < 0) { stepX = -1; sideX = (p.x - mapX) * ddx; } else { stepX = 1; sideX = (mapX + 1 - p.x) * ddx; }
    if (rdy < 0) { stepY = -1; sideY = (p.y - mapY) * ddy; } else { stepY = 1; sideY = (mapY + 1 - p.y) * ddy; }
    let hit = 0, side = 0, tile = 0, guard = 0;
    while (!hit && guard++ < 64) {
      if (sideX < sideY) { sideX += ddx; mapX += stepX; side = 0; }
      else { sideY += ddy; mapY += stepY; side = 1; }
      tile = RC.cell(world, mapX, mapY);
      if (tile !== 0) {
        if ((tile === 6 || tile === 7) && world.doors[mapX + ',' + mapY] >= 1) { tile = 0; }
        else hit = 1;
      }
    }
    let perp = side === 0 ? (sideX - ddx) : (sideY - ddy);
    if (perp < 0.0001) perp = 0.0001;
    RC.zbuf[x] = perp;

    const lineH = (H / perp) | 0;
    let dStart = horizon - (lineH >> 1);
    let dEnd = horizon + (lineH >> 1);

    // texture column
    const tex = RC.TEX[tile] || A.tex.cyber;
    const tsz = tex._size;
    let wallX = side === 0 ? p.y + perp * rdy : p.x + perp * rdx;
    wallX -= Math.floor(wallX);
    let texX = (wallX * tsz) | 0;
    if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) texX = tsz - texX - 1;

    ctx.drawImage(tex, texX, 0, 1, tsz, x, dStart, 1, dEnd - dStart);

    // shading: side + distance fog
    let fog = U.clamp(perp / 11, 0, 0.82);
    if (side === 1) fog = Math.min(0.9, fog + 0.16);
    if (world.theme === 'night') fog = Math.min(0.92, fog + 0.1);
    if (fog > 0.02) {
      ctx.fillStyle = `rgba(${world._fog || '4,6,12'},${fog})`;
      ctx.fillRect(x, dStart, 1, dEnd - dStart);
    }
  }

  RC._sprites(world, dirX, dirY, planeX, planeY, horizon);
};

RC._sky = function (world, horizon) {
  const ctx = E.ctx, W = E.W, H = E.H;
  let cTop, cBot, fTop, fBot, fog;
  if (world.theme === 'cyber') { cTop = '#0a1426'; cBot = '#243a5a'; fTop = '#10131c'; fBot = '#04060a'; world._fog = '6,10,20'; }
  else if (world.theme === 'fantasy') { cTop = '#3a4e86'; cBot = '#caa36a'; fTop = '#6a4a26'; fBot = '#2a1c10'; world._fog = '40,26,12'; }
  else if (world.theme === 'mono') { cTop = '#202024'; cBot = '#3a3a40'; fTop = '#2a2a2e'; fBot = '#101012'; world._fog = '8,8,10'; }
  else if (world.theme === 'night') { cTop = '#04060c'; cBot = '#0a1024'; fTop = '#080608'; fBot = '#020203'; world._fog = '2,3,8'; }
  else { cTop = '#102'; cBot = '#214'; fTop = '#111'; fBot = '#000'; world._fog = '6,6,12'; }
  const g1 = ctx.createLinearGradient(0, 0, 0, horizon);
  g1.addColorStop(0, cTop); g1.addColorStop(1, cBot);
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, horizon);
  const g2 = ctx.createLinearGradient(0, horizon, 0, H);
  g2.addColorStop(0, fTop); g2.addColorStop(1, fBot);
  ctx.fillStyle = g2; ctx.fillRect(0, horizon, W, H - horizon);
};

RC._sprites = function (world, dirX, dirY, planeX, planeY, horizon) {
  const ctx = E.ctx, W = E.W, H = E.H, p = world.player;
  const list = world.entities.filter((e) => !e.dead && e.tex);
  for (const e of list) e._d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
  list.sort((a, b) => b._d - a._d);
  const invDet = 1 / (planeX * dirY - dirX * planeY);

  for (const e of list) {
    const sx = e.x - p.x, sy = e.y - p.y;
    const tX = invDet * (dirY * sx - dirX * sy);
    const tY = invDet * (-planeY * sx + planeX * sy);   // depth
    if (tY <= 0.1) continue;
    const screenX = ((W / 2) * (1 + tX / tY)) | 0;
    const scale = e.scale || 1;
    const sh = Math.abs((H / tY) * scale) | 0;
    const sw = sh * (e.tex.width / e.tex.height) | 0;
    const vert = (e.vOff || 0) * (H / tY);
    let dStartY = (horizon - sh / 2 + vert) | 0;
    let dStartX = (screenX - sw / 2) | 0;
    const tsz = e.tex.width, tszH = e.tex.height;
    for (let stripe = dStartX; stripe < dStartX + sw; stripe++) {
      if (stripe < 0 || stripe >= W) continue;
      if (tY >= RC.zbuf[stripe]) continue;            // occluded by wall
      const texX = (((stripe - dStartX) * tsz / sw) | 0);
      ctx.drawImage(e.tex, texX, 0, 1, tszH, stripe, dStartY, 1, sh);
      // distance fog on sprites too
      let fog = U.clamp(tY / 12, 0, 0.7);
      if (fog > 0.03) { ctx.fillStyle = `rgba(${world._fog || '4,6,12'},${fog})`; ctx.fillRect(stripe, dStartY, 1, sh); }
    }
    e._screenX = screenX; e._screenScale = sh;        // for hit testing
  }
};

// pick the nearest entity roughly in front of the player within range/cone
RC.targetInFront = function (world, range, cone) {
  const p = world.player; cone = cone || 0.5;
  let best = null, bestD = range * range;
  for (const e of world.entities) {
    if (e.dead || !e.hp) continue;
    const dx = e.x - p.x, dy = e.y - p.y;
    const d = dx * dx + dy * dy;
    if (d > bestD) continue;
    const ang = Math.atan2(dy, dx);
    let da = ang - p.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(da) < cone) { best = e; bestD = d; }
  }
  return best;
};
