/* =========================================================================
   I  —  scenes.js
   State machine, inventory/HUD, and every scene & set-piece the podcast
   "remembers": boot, title (sun vs figure beginnings), the speeder chase,
   the cyber & fantasy raycast worlds (anti-gravity, shadow lady, dwarf,
   death-timer, dragon, plank), the grow/shrink size-room birth, the eerie
   Olivetti phone cutscene, the dongle/card "skins" shop, and the ending.
   ========================================================================= */
'use strict';

const Scenes = {};

/* ---------------- shared run state ---------------- */
const ITEMS = {
  fire:       { name: 'EMBER CORE', cyber: 'PLASMA',  fantasy: 'FIREBALL', spr: () => GAME.theme === 'fantasy' ? A.spr.fireball : A.spr.plasma },
  blue:       { name: 'BLUE ORB',   spr: () => A.spr.blueBall },
  yellow:     { name: 'GOLD ORB',   spr: () => A.spr.yellowBall },
  lightsword: { name: 'LIGHT BLADE',spr: () => A.spr.lightsword },
  firesnake:  { name: 'FIRE SERPENT',spr: () => A.spr.firesnake },
  plankBig:   { name: 'GREAT PLANK',spr: () => A.spr.plankBig },
  plankSmall: { name: 'SMALL PLANK',spr: () => A.spr.plankSmall },
  pf1000:     { name: 'PF-1000',    spr: () => A.spr.pf1000, oneShot: true },
  shape:      { name: 'CHOSEN FORM',spr: () => GAME.shapeKind === 'square' ? A.spr.square : A.spr.triangle },
  deathtimer: { name: 'DEATH TIMER',spr: () => A.spr.deathtimer },
};

GAME.reset = function () {
  GAME.inv = []; GAME.flags = {}; GAME.visited = {};
  GAME.hp = 100; GAME.maxHp = 100; GAME.ammo = 60;
  GAME.theme = 'cyber'; GAME.shapeKind = null;
  GAME.msg = []; GAME.score = 0; GAME.pf1000Fired = false;
};
GAME.give = function (id) {
  if (!GAME.inv.includes(id)) { GAME.inv.push(id); GAME.flash(ITEMS[id].name + ' ACQUIRED'); S.sfx('pickup'); }
};
GAME.has = (id) => GAME.inv.includes(id);
GAME.flash = function (txt, dur) { GAME.msg.push({ t: txt, life: dur || 3.0 }); if (GAME.msg.length > 4) GAME.msg.shift(); };

GAME.save = function (where) {
  try { localStorage.setItem('I_save', JSON.stringify({ inv: GAME.inv, hp: GAME.hp, where, flags: GAME.flags, shape: GAME.shapeKind, band: GAME.clockBand })); } catch (e) {}
};
GAME.load = function () { try { return JSON.parse(localStorage.getItem('I_save')); } catch (e) { return null; } };

/* =========================================================================
   HUD  (clean, consistent placement — "the Lexicon look")
   ========================================================================= */
function drawHUD(world) {
  const H = E.H, W = E.W;
  // bottom bar
  G.rect(0, H - 26, W, 26, '#0a0c12');
  G.rect(0, H - 27, W, 1, '#1de0f0');
  // carnage face
  G.spr(A.spr.carnage, 5, H - 22, 2);
  // HP
  E.text(34, H - 22, 'HP', '#7df0ff', 1);
  G.rect(50, H - 22, 52, 6, '#202a3a');
  G.rect(50, H - 22, 52 * U.clamp(GAME.hp / GAME.maxHp, 0, 1), 6, GAME.hp > 30 ? '#2fae5a' : '#e2531a');
  // AMMO
  E.text(34, H - 13, 'AM', '#7df0ff', 1);
  G.rect(50, H - 13, 52, 6, '#202a3a');
  G.rect(50, H - 13, 52 * U.clamp(GAME.ammo / 120, 0, 1), 6, '#ffd21e');
  E.text(106, H - 17, String(Math.round(GAME.ammo)), '#ffd', 1);

  // weapon name
  const wn = GAME.has('fire') ? (GAME.theme === 'fantasy' ? ITEMS.fire.fantasy : ITEMS.fire.cyber) : 'FISTS';
  E.text(140, H - 22, 'WEAPON ' + wn, '#9df', 1);
  E.text(140, H - 13, GAME.theme.toUpperCase() + ' / ' + GAME.clockBand.toUpperCase(), '#69a', 1);

  // inventory icons (right)
  let ix = W - 6;
  for (let i = GAME.inv.length - 1; i >= 0; i--) {
    const id = GAME.inv[i]; const sp = ITEMS[id].spr();
    ix -= 14;
    G.spr(sp, ix, H - 24, 1);
  }
  // messages
  let my = 6;
  for (const m of GAME.msg) {
    const a = U.clamp(m.life, 0, 1);
    E.textS((W - E.textW(m.t, 1)) / 2, my, m.t, `rgba(180,240,255,${a})`, 1, '#000');
    my += 9;
  }
}
function updateMsgs(dt) { for (const m of GAME.msg) m.life -= dt; GAME.msg = GAME.msg.filter((m) => m.life > 0); }

/* first-person weapon viewmodel + muzzle flash */
function drawViewmodel(world, fireGlow) {
  const W = E.W, H = E.H, baseY = H - 26;
  const bob = Math.sin(E.t * 6) * 2 * (world._bob || 0);
  if (GAME.has('fire')) {
    const sp = ITEMS.fire.spr();
    const big = 3;
    G.spr(sp, W / 2 - sp.width * big / 2, baseY - sp.height * big + 8 + bob, big);
    if (fireGlow > 0) {
      E.ctx.fillStyle = `rgba(${GAME.theme === 'fantasy' ? '255,150,40' : '180,120,255'},${0.25 * fireGlow})`;
      E.ctx.fillRect(0, 0, W, H);
    }
  } else {
    // fists
    G.rect(W / 2 - 26, baseY - 14 + bob, 14, 14, '#caa');
    G.rect(W / 2 + 12, baseY - 14 + bob, 14, 14, '#caa');
  }
}

/* =========================================================================
   BOOT  —  DOS / CD-ROM spin-up, Lirpa logo
   ========================================================================= */
Scenes.boot = {
  enter() { this.t = 0; this.lines = []; this.li = 0; this.acc = 0; this.done = false;
    this.script = [
      'LIRPA-DOS  Version 5.0',
      '(C) 1994 Lirpa Entertainment A/S',
      '',
      'HIMEM is testing extended memory... 4096 KB OK',
      'Detecting CD-ROM drive (2x)............ MSCDEX 2.23',
      'Sound: AdLib / Pro Audio Spectrum / Roland Sound Canvas',
      'Graphics: VGA 320x200x256',
      'Mounting volume  [ I ]  ............... OK',
      '',
      'Loading LEXICON.FON .................. OK',
      'Loading CARNAGE.EXE .................. OK',
      'Verifying dongle on COM1 ............. NOT FOUND (demo mode)',
      '',
      'Starting  I ...',
    ];
  },
  update(dt) {
    this.t += dt; this.acc += dt;
    if (this.li < this.script.length && this.acc > 0.16) {
      this.acc = 0; this.lines.push(this.script[this.li++]); S.sfx('type');
    }
    if (this.li >= this.script.length) { this.done = true; }
    if (this.done && (this.t > this.script.length * 0.16 + 1.4 || E.hitAny('Space', 'Enter'))) {
      E.setScene(Scenes.title);
    }
    if (E.hitAny('Escape')) E.setScene(Scenes.title);
  },
  render() {
    G.clear('#000');
    let y = 8;
    for (const ln of this.lines) { E.text(8, y, ln, '#36c06a', 1); y += 9; }
    // blinking cursor
    if (Math.sin(this.t * 6) > 0) G.rect(8 + E.textW(this.lines[this.lines.length - 1] || '', 1), y - 9, 5, 7, '#36c06a');
    // CD spin indicator
    const cx = E.W - 26, cy = 18;
    G.circle(cx, cy, 10, '#222'); G.circle(cx, cy, 3, '#000');
    const a = this.t * 8; G.line(cx, cy, cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, '#1de0f0');
    if (this.done) E.textC(E.W / 2, E.H - 14, 'PRESS ENTER', '#9df', 1);
  }
};

/* =========================================================================
   TITLE  —  sun (fantasy) vs figure (cyber): "multiple beginnings"
   ========================================================================= */
Scenes.title = {
  enter() { this.t = 0; this.hot = null; S.playSong('title'); this.blink = 0; },
  update(dt) {
    this.t += dt; this.blink += dt;
    // hot-spots from last paint: sun (fate), left half (sand), right half (steel)
    const hs = this._hs;
    this.hot = null;
    if (hs) {
      if (U.dist(E.mouse.x, E.mouse.y, hs.sun.x, hs.sun.y) < hs.sun.r + 3) this.hot = 'sun';
      else if (U.dist(E.mouse.x, E.mouse.y, hs.cx, hs.cy) < hs.R)
        this.hot = E.mouse.x < hs.cx ? 'fantasy' : 'cyber';
    }
    document.getElementById('hint').textContent =
      this.hot === 'sun' ? 'The sun-eye: let fate pick a beginning.'
      : this.hot === 'fantasy' ? 'Left: a beginning in the sand.'
      : this.hot === 'cyber' ? 'Right: a beginning in steel.'
      : 'Many beginnings. Click a half, or the sun.';

    const chooseFan = (this.hot === 'fantasy' && E.mouse.clicked) || E.hitAny('Digit1', 'ArrowLeft');
    const chooseCyb = (this.hot === 'cyber' && E.mouse.clicked) || E.hitAny('Digit2', 'ArrowRight');
    const chooseSun = (this.hot === 'sun' && E.mouse.clicked) || E.hitAny('KeyR', 'Space');
    const goFan = () => { S.sfx('select'); GAME.reset(); GAME.begin = 'fantasy'; E.setScene(Scenes.fantasyIntro); };
    const goCyb = () => { S.sfx('select'); GAME.reset(); GAME.begin = 'cyber'; E.setScene(Scenes.chase); };
    if (chooseSun) { S.sfx('select'); (U.pick(['f', 'c']) === 'f' ? goFan : goCyb)(); }
    else if (chooseFan) goFan();
    else if (chooseCyb) goCyb();
    if (E.hitAny('KeyA')) E.setScene(Scenes.about);
  },
  render() {
    const ctx = E.ctx;
    this._hs = A.paintTitle(ctx, this.t, this.hot);
    // title text over the top of the arch
    E.textCS(E.W / 2, 4, 'LIRPA  ENTERTAINMENT', '#e7dcc2', 1, '#000');
    // the game's name, small and central like a maker's mark under the sun
    E.textS(6, 6, 'I', '#eafcff', 2, '#000');
    E.textS(E.W - 46, 6, 'MCMXCIV', '#e7dcc2', 1, '#000');
    // prompts in the dark band below the arch
    if (Math.sin(this.blink * 2) > -0.3)
      E.textCS(E.W / 2, E.H - 15, 'CLICK LEFT: SAND    RIGHT: STEEL', '#ffe08a', 1, '#000');
    E.textCS(E.W / 2, E.H - 7, 'SUN / SPACE: FATE    A: ABOUT', '#9cc', 1, '#000');
  }
};

/* =========================================================================
   CHASE  —  the "motorsykkel"/Star-Speeder: a sperm-cell toward the white
   wall; all seems lost; the plasma blasts; a timeblast → birth into cyber.
   ========================================================================= */
Scenes.chase = {
  enter() {
    this.t = 0; this.speed = 60; this.lane = 0; this.px = 0; this.obs = []; this.spawn = 0;
    this.wall = 0; this.phase = 'run'; this.flashT = 0;
    S.playSong('cyber'); GAME.flash('FULL SPEED. DO NOT STOP.', 4);
  },
  update(dt) {
    this.t += dt;
    if (this.phase === 'run') {
      this.speed = Math.min(220, this.speed + dt * 14);
      const steer = (E.keyAny('ArrowLeft', 'KeyA') ? -1 : 0) + (E.keyAny('ArrowRight', 'KeyD') ? 1 : 0);
      this.px = U.clamp(this.px + steer * dt * 2.2, -1, 1);
      // obstacles
      this.spawn -= dt;
      if (this.spawn <= 0) { this.spawn = U.rnd(0.35, 0.7); this.obs.push({ z: 1, x: U.rnd(-0.9, 0.9) }); }
      for (const o of this.obs) {
        o.z -= dt * (this.speed / 120);
        if (o.z < 0.12 && o.z > 0 && Math.abs(o.x - this.px) < 0.22) {
          o.hit = true; o.z = -1; GAME.hp -= 12; S.sfx('hurt'); E.shake(4, 0.3);
          if (GAME.hp <= 0) { GAME.hp = 1; }
        }
      }
      this.obs = this.obs.filter((o) => o.z > 0);
      // approach the wall
      if (this.t > 11) { this.phase = 'wall'; this.wall = 0; GAME.flash('THE WALL. ALL IS LOST.', 3); }
    } else if (this.phase === 'wall') {
      this.wall = Math.min(1, this.wall + dt * 0.6);
      if (this.wall >= 1) {
        if (E.hitAny('Space', 'ControlLeft', 'Enter') || this.t > 16) {
          this.phase = 'blast'; this.flashT = 1; S.sfx('plasma'); S.sfx('explode'); E.shake(8, 0.6);
          GAME.give('fire');
        }
      }
    } else if (this.phase === 'blast') {
      this.flashT -= dt * 0.7;
      if (this.flashT <= 0) {
        S.sfx('timeblast');
        E.setScene(Scenes.cutscenePC.with(Scenes.makeCyber()));
      }
    }
    if (E.hitAny('Escape')) E.setScene(Scenes.title);
  },
  render() {
    const W = E.W, H = E.H, ctx = E.ctx, hz = H / 2;
    // tunnel
    G.vgrad(0, 0, W, hz, '#0a1430', '#102a4a');
    G.vgrad(0, hz, W, H - hz, '#04060a', '#0a1020');
    const cx = W / 2 + this.px * 60;
    // streaking rails toward vanishing point
    for (let i = 0; i < 18; i++) {
      const f = ((i / 18) + (this.t * this.speed / 600)) % 1;
      const z = 1 - f; const sc = 1 / (z * 6 + 0.05);
      const col = `rgba(61,240,255,${0.5 * (1 - f)})`;
      G.line(cx, hz, cx - 200 * sc * 0.01 * (W), hz + 120 * sc * 0.01 * (H), col);
    }
    // grid floor rushing
    ctx.strokeStyle = 'rgba(61,240,255,0.25)';
    for (let i = 0; i < 12; i++) {
      const f = ((i / 12) + (this.t * this.speed / 400)) % 1;
      const y = hz + f * f * (H - hz);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let gx = -6; gx <= 6; gx++) {
      ctx.beginPath(); ctx.moveTo(cx + gx * 8, hz); ctx.lineTo(cx + gx * 80, H); ctx.stroke();
    }
    // obstacles (antidata blocks)
    for (const o of this.obs) {
      const sc = 1 / (o.z * 6 + 0.1);
      const ox = cx + o.x * 60 * (1 / (o.z + 0.2));
      const oy = hz + (1 - o.z) * 30;
      const s = 6 * sc;
      G.rect(ox - s / 2, oy - s / 2, s, s, o.hit ? '#e23' : '#2fae5a');
      G.rectO(ox - s / 2, oy - s / 2, s, s, '#7df0ff');
    }
    // the player craft (sperm-cell / speeder)
    const pyl = H - 50;
    G.circle(cx, pyl, 7, '#cfe'); G.circle(cx, pyl, 4, '#7df0ff');
    ctx.strokeStyle = '#9df'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(cx, pyl + 6);
    for (let k = 1; k <= 6; k++) ctx.lineTo(cx + Math.sin(this.t * 20 + k) * k * 1.4, pyl + 6 + k * 4);
    ctx.stroke();

    if (this.phase === 'wall' || this.phase === 'blast') {
      ctx.fillStyle = `rgba(240,244,255,${this.phase === 'blast' ? Math.max(0, this.flashT) : this.wall})`;
      ctx.fillRect(0, 0, W, H);
      if (this.phase === 'wall' && this.wall >= 1)
        E.textC(W / 2, H / 2 + 30, 'PRESS SPACE - RELEASE THE PLASMA', '#024', 1);
    }
    drawHUD({});
    E.textC(W / 2, 30, 'STEER L/R   -   ' + Math.round(this.speed) + ' U/S', '#9df', 1);
  }
};

/* small fantasy intro before the dungeon (sun beginning) */
Scenes.fantasyIntro = {
  enter() { this.t = 0; S.playSong('fantasy'); },
  update(dt) {
    this.t += dt;
    if (this.t > 3.2 || E.hitAny('Space', 'Enter')) { GAME.give('fire'); E.setScene(Scenes.makeFantasy()); }
    if (E.hitAny('Escape')) E.setScene(Scenes.title);
  },
  render() {
    G.vgrad(0, 0, E.W, E.H, '#caa36a', '#6a3a2a');
    // big low sun
    G.circle(E.W / 2, E.H / 2 + 20, 60, '#ffae1a');
    G.circle(E.W / 2, E.H / 2 + 20, 50, '#ffd24a');
    // dunes
    E.ctx.fillStyle = '#7a4a26';
    E.ctx.beginPath(); E.ctx.moveTo(0, E.H);
    for (let x = 0; x <= E.W; x += 8) E.ctx.lineTo(x, E.H - 30 - Math.sin(x * 0.04 + this.t) * 8);
    E.ctx.lineTo(E.W, E.H); E.ctx.fill();
    E.textC(E.W / 2, 24, 'A BEGINNING IN THE SAND', '#3a1c0a', 1);
    if (Math.sin(this.t * 4) > 0) E.textC(E.W / 2, E.H - 16, 'PRESS SPACE', '#2a140a', 1);
  }
};

/* =========================================================================
   WORLD factory  —  raycast exploration shared by cyber & fantasy.
   cfg: { theme, map, opts, populate(world,scene), next, music }
   ========================================================================= */
function makeWorld(cfg) {
  return {
    enter() {
      GAME.theme = cfg.theme === 'fantasy' ? 'fantasy' : 'cyber';
      this.world = RC.make(cfg.map, Object.assign({ theme: cfg.theme }, cfg.opts));
      this.world.pitch = 0; this.world._bob = 0;
      this.shots = []; this.flash = 0; this.fireGlow = 0; this.fireCd = 0;
      this.antigrav = false; this.agDiscovered = false; this.agTimer = 0;
      this.shadowFlash = 0; this.useCd = 0;
      this.triggers = cfg.triggers ? JSON.parse(JSON.stringify(cfg.triggers)) : [];
      this.gas = 0; this.gasActive = false;
      this.cfg = cfg;
      cfg.populate && cfg.populate(this.world, this);
      S.playSong(cfg.music || (cfg.theme === 'fantasy' ? 'fantasy' : 'cyber'));
      GAME.save(cfg.theme);
      this._startHp = GAME.hp;
      this._spawn = { x: this.world.player.x, y: this.world.player.y };
    },
    update(dt) {
      const world = this.world, p = world.player;
      updateMsgs(dt);
      if (this.fireCd > 0) this.fireCd -= dt;
      if (this.useCd > 0) this.useCd -= dt;
      if (this.fireGlow > 0) this.fireGlow -= dt * 3;
      if (this.flash > 0) this.flash -= dt * 2;
      if (this.shadowFlash > 0) this.shadowFlash -= dt * 4;

      /* ---- ANTI-GRAVITY zone: jam normal turn keys, must discover K/L ---- */
      this.antigrav = false;
      for (const tr of this.triggers) if (tr.type === 'antigrav' && pInRect(p, tr)) this.antigrav = true;

      let fwd = 0, str = 0, rot = 0;
      const turnSpd = 2.2;
      if (this.antigrav) {
        // controls "shifted": arrows do nothing for turning; K/L are the new turn
        world.pitch = Math.sin(E.t * 2) * 8;        // disorienting bob
        if (E.keyAny('ArrowUp', 'KeyW')) fwd = -1;  // inverted!
        if (E.keyAny('ArrowDown', 'KeyS')) fwd = 1;
        if (E.keyAny('KeyK')) { rot = -turnSpd; this.agDiscovered = true; }
        if (E.keyAny('KeyL')) { rot = turnSpd; this.agDiscovered = true; }
        this.agTimer += dt;
        GAME.flags.agSeen = true;
      } else {
        world.pitch = U.lerp(world.pitch || 0, 0, 0.2);
        if (E.keyAny('ArrowUp', 'KeyW')) fwd = 1;
        if (E.keyAny('ArrowDown', 'KeyS')) fwd = -1;
        const left = E.keyAny('ArrowLeft', 'KeyA'), right = E.keyAny('ArrowRight', 'KeyD');
        const strafeMode = E.keyAny('ShiftLeft', 'ShiftRight', 'AltLeft');
        if (strafeMode) { if (left) str = -1; if (right) str = 1; }
        else { if (left) rot = -turnSpd; if (right) rot = turnSpd; }
        // dedicated strafe keys too (Q / . )
        if (E.keyAny('KeyQ', 'Comma')) str = -1;
        if (E.keyAny('Period')) str = 1;
      }
      RC.move(world, fwd, str, rot, dt);
      world._bob = (fwd || str) ? 1 : U.lerp(world._bob, 0, 0.2);

      /* ---- use / doors / dragon-mount easter egg ---- */
      if (E.hitAny('KeyE', 'Enter') && this.useCd <= 0) {
        this.useCd = 0.3;
        const f = RC.front(world, 1.1);
        if (!RC.openDoor(world, f.x, f.y)) this.tryInteract();
      }
      // Easter egg: press K & L together near the dragon to mount & fly it
      if (E.keyAny('KeyK') && E.keyAny('KeyL') && !this.antigrav) this.tryDragonMount();

      /* ---- fire weapon ---- */
      if ((E.keyAny('Space', 'ControlLeft') || E.mouse.down) && this.fireCd <= 0) this.fire();
      if (E.hitAny('KeyP')) this.firePF1000();

      /* ---- projectiles ---- */
      this.updateShots(dt);
      /* ---- enemies ---- */
      this.updateEnemies(dt);
      /* ---- triggers under player ---- */
      this.checkTriggers(dt);
      /* ---- gas / death timer ---- */
      if (this.gasActive) {
        this.gas = Math.min(1, this.gas + dt * 0.06);
        GAME.hp -= dt * 6 * this.gas;
        if (GAME.has('deathtimer') && E.hitAny('KeyT')) this.handTimer();
      }

      if (GAME.hp <= 0) this.die();
      if (E.hitAny('Escape')) E.setScene(Scenes.title);
      E.computeClockBand();
    },

    /* --- combat & interaction helpers --- */
    fire() {
      const world = this.world, p = world.player;
      // the dragon/bear can only be met up close, and only with the GREAT PLANK
      const near = RC.targetInFront(world, 1.35, 0.85);
      if (near && near.kind === 'dragon') {
        this.fireCd = 0.4;
        if (GAME.has('plankBig')) { this.damage(near, 26); S.sfx('hit'); E.shake(2, 0.12); }
        else { GAME.flash("THE FIRE WON'T BITE IT. SWING THE GREAT PLANK."); S.sfx('deny'); }
        return;
      }
      if (!GAME.has('fire')) {       // fists: short melee
        this.fireCd = 0.35;
        const t = RC.targetInFront(world, 1.1, 0.6);
        if (t) { this.damage(t, 8); S.sfx('hit'); }
        return;
      }
      if (GAME.ammo <= 0) { GAME.flash('OUT OF AMMO'); S.sfx('deny'); this.fireCd = 0.3; return; }
      GAME.ammo -= 1; this.fireCd = 0.22; this.fireGlow = 1;
      S.sfx(GAME.theme === 'fantasy' ? 'fireball' : 'plasma');
      this.shots.push({ x: p.x, y: p.y, vx: Math.cos(p.a) * 6, vy: Math.sin(p.a) * 6, life: 1.4, dmg: 22, mine: true,
        tex: GAME.theme === 'fantasy' ? A.spr.fireball : A.spr.plasma });
    },
    firePF1000() {
      if (!GAME.has('pf1000')) { GAME.flash('NO PF-1000'); S.sfx('deny'); return; }
      if (GAME.pf1000Fired) { GAME.flash('PF-1000: ONE SHOT. IT IS SPENT.'); S.sfx('deny'); return; }
      GAME.pf1000Fired = true; S.sfx('pf1000'); E.shake(10, 0.7); this.flash = 1;
      // obliterate everything in view
      for (const e of this.world.entities) if (e.hp) this.damage(e, 9999);
      GAME.flash('PF-1000 DISCHARGED. EVERYTHING IS CARNAGE.', 4);
    },
    updateShots(dt) {
      const world = this.world;
      for (const s of this.shots) {
        s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (RC.solid(world, s.x, s.y)) { s.life = 0; S.sfx('hit'); continue; }
        for (const e of world.entities) {
          if (e.dead || !e.hp) continue;
          if (s.mine === !!e.enemy && U.dist(s.x, s.y, e.x, e.y) < 0.4) {
            if (e.kind === 'dragon') {           // immune to fire/plasma — needs the plank
              s.life = 0; S.sfx('hit');
              if (!this._plankWarned) { this._plankWarned = true; GAME.flash('THE FIRE GLANCES OFF. GET CLOSE WITH THE PLANK.', 4); }
              break;
            }
            this.damage(e, s.dmg); s.life = 0; S.sfx('hit'); break;
          }
        }
        if (!s.mine && U.dist(s.x, s.y, world.player.x, world.player.y) < 0.4) {
          s.life = 0; GAME.hp -= s.dmg; S.sfx('hurt'); E.shake(3, 0.2);
        }
        s.ent = { x: s.x, y: s.y, tex: s.tex, scale: 0.5, vOff: -0.1 };
      }
      this.shots = this.shots.filter((s) => s.life > 0);
    },
    damage(e, dmg) {
      e.hp -= dmg; e.hurt = 0.15;
      if (e.kind === 'dragon' && GAME.theme === 'fantasy' && !this._plankWarned && !GAME.has('plankBig')) {
        this._plankWarned = true; GAME.flash('THE FIRE DOES NOTHING. YOU NEED THE GREAT PLANK.', 4);
      }
      if (e.hp <= 0 && !e.dead) {
        e.dead = true; GAME.score += e.score || 10; S.sfx('explode');
        if (e.drop) GAME.give(e.drop);
        if (e.onDeath) e.onDeath(this);
      }
    },
    updateEnemies(dt) {
      const world = this.world, p = world.player;
      for (const e of world.entities) {
        if (e.dead || !e.enemy) continue;
        if (e.hurt) e.hurt -= dt;
        const d = U.dist(e.x, e.y, p.x, p.y);
        // shadow lady triggers the flashing + screech when close
        if (e.kind === 'shadow' && d < 4 && !e.seen) { e.seen = true; this.triggerShadow(); }
        if (e.kind === 'shadow' && d < 5) { e.starCd = (e.starCd || 0) - dt; if (e.starCd <= 0) { e.starCd = 1.4; this.enemyShot(e, A.spr.star, 14, 4); } }
        // dragon must be hit with plank (melee); ignores fire
        const canHurtByFire = !(e.kind === 'dragon' && !GAME.has('plankBig'));
        e._fireImmune = !canHurtByFire;
        // move toward player
        if (e.spd && d > (e.range || 0.9)) {
          const ang = Math.atan2(p.y - e.y, p.x - e.x);
          const nx = e.x + Math.cos(ang) * e.spd * dt, ny = e.y + Math.sin(ang) * e.spd * dt;
          if (!RC.solid(world, nx, e.y)) e.x = nx;
          if (!RC.solid(world, e.x, ny)) e.y = ny;
        }
        // melee
        if (d < (e.range || 0.9)) {
          e.atkCd = (e.atkCd || 0) - dt;
          if (e.atkCd <= 0) { e.atkCd = e.kind === 'dwarf' ? 0.6 : 1.0; GAME.hp -= e.dmg || 8; S.sfx('hurt'); E.shake(2, 0.15); }
        }
        // tint sprite when hurt by setting a flag the renderer reads via overlay (simplified)
      }
    },
    enemyShot(e, tex, dmg, spd) {
      const p = this.world.player; const ang = Math.atan2(p.y - e.y, p.x - e.x);
      this.shots.push({ x: e.x, y: e.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 2, dmg, mine: false, tex });
      S.sfx('hit');
    },
    triggerShadow() {
      this.shadowFlash = 1; S.sfx('screech');
      GAME.flash('!! SHADOW LADY !!', 2.5);
      if (!E.reduceFlash) E.shake(3, 0.4);
    },
    tryInteract() {
      const world = this.world, p = world.player;
      // interact with nearby trigger objects (terminal/shop, pedestal/shape, gate)
      for (const tr of this.triggers) {
        if (U.dist(p.x, p.y, tr.x + 0.5, tr.y + 0.5) < 1.3) {
          if (tr.type === 'shop') { E.setScene(Scenes.shop.with(this)); return; }
          if (tr.type === 'shape' && !GAME.has('shape')) { E.setScene(Scenes.shapeChoice.with(this)); return; }
          if (tr.type === 'gate' && !this.gasActive && !tr.used) { tr.used = true; this.startGate(); return; }
        }
      }
      GAME.flash('NOTHING HAPPENS.');
    },
    startGate() {
      this.gasActive = true; this.gas = 0.05;
      GAME.flash('THE GATE SEALS. THE GAS RISES.', 4);
      if (GAME.has('deathtimer')) GAME.flash('PRESS T NEAR A FOE TO PASS THE DEATH-TIMER ON.', 5);
      else GAME.give('deathtimer');
    },
    handTimer() {
      const t = RC.targetInFront(this.world, 1.6, 0.8);
      if (t) {
        this.gasActive = false; this.gas = 0;
        t.hp = 0; this.damage(t, 9999);
        GAME.inv = GAME.inv.filter((i) => i !== 'deathtimer');
        GAME.flash('THE DEATH-TIMER IS THEIRS NOW. YOU PASS.', 4);
        // open the gate door if present
        for (const tr of this.triggers) if (tr.type === 'gate') RC.openDoor(this.world, tr.dx, tr.dy);
      } else GAME.flash('NO ONE TO RECEIVE IT.');
    },
    tryDragonMount() {
      const t = RC.targetInFront(this.world, 2.0, 0.9);
      if (t && t.kind === 'dragon' && !GAME.flags.flewDragon) {
        GAME.flags.flewDragon = true; S.sfx('grow');
        GAME.flash('* YOU MOUNT THE DRAGON. (a blind hen finds corn)', 6);
        t.mount = true;
      }
    },
    checkTriggers(dt) {
      const world = this.world, p = world.player;
      for (const tr of this.triggers) {
        if (tr.type === 'timeblast' && pInRect(p, tr) && !tr.used) {
          tr.used = true; S.sfx('timeblast'); this.flash = 1;
          E.setScene((tr.to === 'fantasy' ? Scenes.makeFantasy() : tr.to === 'cyber' ? Scenes.makeCyber() : tr.to === 'size' ? Scenes.sizeRoom : Scenes.ending));
        }
        if (tr.type === 'cutscene' && pInRect(p, tr) && !tr.used) {
          tr.used = true; E.setScene(Scenes.cutscenePC.with(tr.to === 'size' ? Scenes.sizeRoom : Scenes.makeFantasy()));
        }
      }
    },
    die() {
      // the game "dumps you back where you were", with a wink
      GAME.hp = Math.max(40, GAME.maxHp * 0.5); GAME.flash('YOU ARE CARNAGE. AGAIN.', 4);
      this.world.player.x = this._spawn.x; this.world.player.y = this._spawn.y;
      this.gasActive = false; this.gas = 0; S.sfx('powerdown');
    },

    render() {
      const world = this.world;
      RC.render(world);
      // draw projectiles as billboards (re-use sprite renderer quickly)
      for (const s of this.shots) {
        if (s.ent) drawBillboard(world, s.ent);
      }
      // hurt flashes on enemies
      drawViewmodel(world, this.fireGlow);
      drawHUD(world);

      // anti-gravity overlay & the cruel hint
      if (this.antigrav) {
        E.ctx.fillStyle = 'rgba(80,0,120,0.12)'; E.ctx.fillRect(0, 0, E.W, E.H);
        E.textC(E.W / 2, 40, 'GRAVITY INVERTED', '#d9b3ff', 1);
        if (this.agTimer > 4 && !this.agDiscovered)
          E.textC(E.W / 2, 52, 'THE ARROWS DO NOTHING... TRY OTHER KEYS', '#b98aff', 1);
        if (this.agDiscovered) E.textC(E.W / 2, 52, 'K / L ARE THE NEW LEFT / RIGHT', '#9df', 1);
      }
      // shadow-lady flash — the podcast remembers it as seizure-grade; we do
      // NOT ship that. Kept low-contrast, ~4-5Hz, brief, and off under reduce-flash.
      if (this.shadowFlash > 0) {
        if (E.reduceFlash) {
          E.ctx.fillStyle = `rgba(120,120,160,${0.10 * this.shadowFlash})`;
        } else {
          const a = 0.20 * this.shadowFlash;
          E.ctx.fillStyle = (Math.floor(E.t * 5) % 2) ? `rgba(210,220,255,${a})` : `rgba(10,10,40,${a})`;
        }
        E.ctx.fillRect(0, 0, E.W, E.H);
      }
      // pf1000 / generic white flash
      if (this.flash > 0) { E.ctx.fillStyle = `rgba(240,244,255,${this.flash * 0.6})`; E.ctx.fillRect(0, 0, E.W, E.H); }
      // gas
      if (this.gasActive) {
        E.ctx.fillStyle = `rgba(120,200,60,${0.1 + this.gas * 0.45})`;
        E.ctx.fillRect(0, E.H - 26 - this.gas * (E.H - 26), E.W, this.gas * (E.H - 26));
        E.textC(E.W / 2, 20, 'DEATH-TIMER ACTIVE - FIND A FOE - PRESS T', '#dfd', 1);
      }
      // controls helper line
      E.text(6, 6, 'A/D OR ARROWS TURN  W/S MOVE  SPACE FIRE  E USE', '#69a', 1);
    }
  };
}

function pInRect(p, r) { return p.x >= r.x && p.x < r.x + (r.w || 1) && p.y >= r.y && p.y < r.y + (r.h || 1); }
function drawBillboard(world, e) {
  // minimal single-sprite billboard for projectiles
  const p = world.player, dirX = Math.cos(p.a), dirY = Math.sin(p.a);
  const planeLen = Math.tan(p.fov / 2), planeX = -dirY * planeLen, planeY = dirX * planeLen;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const sx = e.x - p.x, sy = e.y - p.y;
  const tX = invDet * (dirY * sx - dirX * sy), tY = invDet * (-planeY * sx + planeX * sy);
  if (tY <= 0.1) return;
  const screenX = ((E.W / 2) * (1 + tX / tY)) | 0;
  const sh = Math.abs((E.H / tY) * (e.scale || 1)) | 0, sw = sh;
  const horizon = (E.H >> 1) + (world.pitch || 0);
  for (let st = screenX - sw / 2; st < screenX + sw / 2; st++) {
    const c = st | 0; if (c < 0 || c >= E.W || tY >= RC.zbuf[c]) continue;
    const texX = ((c - (screenX - sw / 2)) * e.tex.width / sw) | 0;
    E.ctx.drawImage(e.tex, texX, 0, 1, e.tex.height, c, horizon - sh / 2, 1, sh);
  }
}

/* =========================================================================
   CYBER WORLD  (after the chase)
   ========================================================================= */
Scenes.makeCyber = function () {
  const map = [
    '################',
    '#......%.......#',   // % (col7) = tele-shop terminal
    '#..............#',
    '#..##......##..#',
    '#..#........#..#',
    '#..............#',   // antigrav rect cols6-9 rows5-7 (all floor)
    '#..............#',
    '#..............#',
    '#..#........#..#',
    '#..##......##..#',
    '#..............#',
    '#..............#',
    '################',
  ];
  const cfg = {
    theme: 'cyber', map,
    opts: { px: 2.5, py: 2.5, pa: 0 },
    music: 'cyber',
    triggers: [
      { type: 'antigrav', x: 6, y: 5, w: 4, h: 3 },
      { type: 'shop', x: 7, y: 1 },                  // interact from below the terminal
      { type: 'timeblast', x: 8, y: 11, w: 2, h: 1, to: 'fantasy' },
    ],
    populate(world, scene) {
      // tøffelgutta (the "tough little slipper-ladies")
      for (const [x, y, drop] of [[6, 2, null], [9, 2, 'blue'], [6, 10, null], [9, 10, null], [12, 6, null]])
        world.entities.push({ x: x + .5, y: y + .5, tex: A.spr.toffel, enemy: true, kind: 'toffel', hp: 30, spd: 0.9, dmg: 7, score: 10, vOff: 0.05, drop });
      // a shadow lady on the right
      world.entities.push({ x: 13.5, y: 6.5, tex: A.spr.shadow, enemy: true, kind: 'shadow', hp: 16, spd: 0.6, dmg: 5, score: 25, vOff: 0 });
      // smileplayer companion (decor / lore)
      world.entities.push({ x: 2.5, y: 11.5, tex: A.spr.smiley, vOff: 0.05 });
      // pickups
      world.entities.push({ x: 13.5, y: 2.5, tex: A.spr.pf1000, item: 'pf1000', vOff: 0.1 });
      world.entities.push({ x: 2.5, y: 10.5, tex: A.spr.yellowBall, item: 'yellow', vOff: 0.1 });
      GAME.flash('PLASMA ONLINE. THE TIMEBLAST PAD IS BELOW.', 5);
    }
  };
  const sc = makeWorld(cfg);
  patchPickups(sc);
  return sc;
};

/* =========================================================================
   FANTASY WORLD
   ========================================================================= */
Scenes.makeFantasy = function () {
  const map = [
    '################',
    '#SS..........SS#',
    '#S....SSSS....S#',
    '#.....S..S.....#',
    '#.....S..S.....#',
    '#.....SddS.....#',   // inner sanctum doors
    '#..............#',
    '#..SS......SS..#',
    '#..S........S..#',
    '#..S..SSSS..S..d',   // door d → mountain/gate corridor (right)
    '#.....S..S.....#',
    '#SS...d..d...SS#',
    '################',
  ];
  const cfg = {
    theme: 'fantasy', map,
    opts: { px: 2.5, py: 2.5, pa: 0 },
    music: 'fantasy',
    triggers: [
      { type: 'shape', x: 7, y: 4 },                  // pedestal inside the sanctum
      { type: 'gate', x: 13, y: 8, dx: 15, dy: 9 },   // death-timer gate near the dwarf
      { type: 'cutscene', x: 1, y: 6, w: 1, h: 1, to: 'size' }, // left edge → eerie PC scene → size room
      { type: 'timeblast', x: 7, y: 11, w: 2, h: 1, to: 'cyber' },
    ],
    populate(world, scene) {
      // the dragon/bear (needs the GREAT PLANK)
      world.entities.push({ x: 8.5, y: 7.5, tex: A.spr.dragon, enemy: true, kind: 'dragon', hp: 80, spd: 0.5, dmg: 12, score: 50, vOff: 0, scale: 1.4,
        onDeath: () => GAME.flash('THE DRAGON FALLS. (or was it a bear, red of beard?)', 5) });
      // sun-god
      world.entities.push({ x: 12.5, y: 3.5, tex: A.spr.sungod, enemy: true, kind: 'sungod', hp: 40, spd: 0.7, dmg: 9, score: 30, vOff: -0.05 });
      // the dwarf — Dark Souls before Dark Souls — guards the gate corridor
      world.entities.push({ x: 13.5, y: 9.5, tex: A.spr.dwarf, enemy: true, kind: 'dwarf', hp: 120, spd: 1.3, dmg: 10, range: 0.8, score: 80, vOff: 0.1,
        onDeath: () => { GAME.flash('THE DWARF YIELDS. UNHEARD OF.', 5); } });
      // pickups: the great plank (to beat the dragon), light blade, fire serpent
      world.entities.push({ x: 2.5, y: 10.5, tex: A.spr.plankBig, item: 'plankBig', vOff: 0.1 });
      world.entities.push({ x: 11.5, y: 1.5, tex: A.spr.lightsword, item: 'lightsword', vOff: 0.1 });
      world.entities.push({ x: 2.5, y: 2.5, tex: A.spr.firesnake, item: 'firesnake', vOff: 0.1 });
      GAME.flash('FIREBALL READY. THE TIMEBLAST WAITS BELOW.', 5);
      GAME.flash('STEP TO THE LEFT EDGE WHEN YOU DARE.', 6);
    }
  };
  const sc = makeWorld(cfg);
  patchPickups(sc);
  return sc;
};

// add pickup handling (items lying in the world) to a world scene
function patchPickups(sc) {
  const baseUpdate = sc.update;
  sc.update = function (dt) {
    baseUpdate.call(this, dt);
    const p = this.world.player;
    for (const e of this.world.entities) {
      if (e.item && !e.dead && U.dist(e.x, e.y, p.x, p.y) < 0.6) {
        e.dead = true; GAME.give(e.item);
        if (e.item === 'fire') {} // already
      }
    }
  };
  return sc;
}

/* =========================================================================
   SHAPE CHOICE  —  triangle vs square ("more area is better", says Ekroll)
   ========================================================================= */
Scenes.shapeChoice = {
  with(parent) { this.parent = parent; return this; },
  enter() { this.t = 0; this.sel = 0; S.playSong('dread'); },
  update(dt) {
    this.t += dt;
    if (E.hitAny('ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD')) { this.sel ^= 1; S.sfx('blip'); }
    if (E.hitAny('Enter', 'Space', 'KeyE')) {
      GAME.shapeKind = this.sel === 0 ? 'triangle' : 'square';
      GAME.give('shape');
      GAME.flash(GAME.shapeKind === 'square' ? 'THE SQUARE. MORE EDGES, MORE AREA.' : 'THE PYRAMID. SHARP, FOR CHUGGING.', 5);
      // square grants +max ammo capacity, triangle grants +damage (flavor)
      if (GAME.shapeKind === 'square') GAME.ammo = Math.min(120, GAME.ammo + 40);
      else GAME.maxHp += 20, GAME.hp += 20;
      E.setScene(this.parent);
    }
    if (E.hitAny('Escape')) E.setScene(this.parent);
  },
  render() {
    G.clear('#06070c');
    E.textC(E.W / 2, 24, 'A GREAT CHOICE. MATRIX-STYLE.', '#9df', 1);
    E.textC(E.W / 2, 36, 'YOU MAY CARRY ONLY ONE FORM ONWARD', '#69a', 1);
    const opts = [['triangle', A.spr.triangle, 'PYRAMID'], ['square', A.spr.square, 'CUBE']];
    for (let i = 0; i < 2; i++) {
      const x = E.W / 2 - 70 + i * 110, y = 80;
      if (this.sel === i) G.rectO(x - 18, y - 18, 52, 56, '#1de0f0');
      G.spr(opts[i][1], x - 6, y - 6, 2);
      E.textC(x + 6, y + 40, opts[i][2], this.sel === i ? '#fff' : '#9ab', 1);
    }
    E.textC(E.W / 2, 150, 'L/R  CHOOSE      ENTER  TAKE', '#9df', 1);
    E.textC(E.W / 2, 164, '(you will not get to choose again)', '#557', 1);
  }
};

/* =========================================================================
   SHOP  —  the dongle / collector-card "skins" price list (proto-MTX)
   ========================================================================= */
Scenes.shop = {
  with(parent) { this.parent = parent; return this; },
  enter() { this.t = 0; this.sel = 0; S.playSong('cyber');
    this.items = [
      { id: 'plasmaSkin', name: 'VIOLET PLASMA SKIN', price: 'CR 7', sym: '#b86bff' },
      { id: 'ammo', name: 'AMMO CRATE  (+40)', price: 'CR 12', sym: '#ffd21e' },
      { id: 'medkit', name: 'REPAIR  (+40 HP)', price: 'CR 9', sym: '#2fae5a' },
      { id: 'pf1000', name: 'PF-1000  (one shot)', price: 'CR 99', sym: '#ff7a1a' },
    ];
  },
  update(dt) {
    this.t += dt;
    if (E.hitAny('ArrowUp', 'KeyW')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; S.sfx('blip'); }
    if (E.hitAny('ArrowDown', 'KeyS')) { this.sel = (this.sel + 1) % this.items.length; S.sfx('blip'); }
    if (E.hitAny('Enter', 'Space', 'KeyE')) this.buy();
    if (E.hitAny('Escape', 'KeyQ')) E.setScene(this.parent);
  },
  buy() {
    const it = this.items[this.sel];
    // "demo mode, no dongle" — purchases mostly mocked, with a wink
    if (it.id === 'ammo') { GAME.ammo = Math.min(120, GAME.ammo + 40); GAME.flash('AMMO +40'); }
    else if (it.id === 'medkit') { GAME.hp = Math.min(GAME.maxHp, GAME.hp + 40); GAME.flash('HP +40'); }
    else if (it.id === 'pf1000') { GAME.give('pf1000'); }
    else if (it.id === 'plasmaSkin') { GAME.flags.skin = true; GAME.flash('SKIN APPLIED (it looks the same in VGA)'); }
    S.sfx('select');
  },
  render() {
    G.clear('#070a12');
    G.rect(0, 0, E.W, 14, '#0a1422'); G.rect(0, 14, E.W, 1, '#1de0f0');
    E.textS(8, 4, 'LIRPA TELE-SHOP  -  INSERT CARD INTO DONGLE', '#9df', 1, '#000');
    G.spr(A.spr.dongle, E.W - 30, 18, 1);
    G.spr(A.spr.card, E.W - 54, 18, 1);
    E.text(E.W - 70, 50, 'COM1: empty', '#558', 1);
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i], y = 40 + i * 22;
      if (this.sel === i) G.rect(6, y - 4, 200, 18, '#0e2230');
      G.rect(10, y, 8, 8, it.sym);
      E.text(24, y, it.name, this.sel === i ? '#fff' : '#9ab', 1);
      E.text(170, y, it.price, '#ffd', 1);
    }
    E.textC(E.W / 2, E.H - 22, 'BEFORE MICROTRANSACTIONS WERE A THING.', '#69a', 1);
    E.textC(E.W / 2, E.H - 12, 'UP/DN SELECT   ENTER BUY   ESC LEAVE', '#9df', 1);
  }
};

/* =========================================================================
   CUTSCENE  —  the eerie Olivetti / phone scene the podcast can't forget
   ========================================================================= */
Scenes.cutscenePC = {
  with(next) { this.next = next; return this; },
  enter() { this.t = 0; this.stage = 0; S.playSong('dread'); this.windows = 0; this.rang = false; },
  update(dt) {
    this.t += dt;
    if (this.t > 1.6 && !this.rang) { this.rang = true; S.sfx('phone'); }
    if (this.t > 5.5) this.windows = Math.min(1, this.windows + dt * 0.5);
    if (this.t > 9 || E.hitAny('Space', 'Enter')) {
      S.sfx('timeblast'); E.setScene(this.next || Scenes.title);
    }
    if (E.hitAny('Escape')) E.setScene(this.next || Scenes.title);
  },
  render() {
    G.clear('#06070a');
    // room
    G.rect(0, 120, E.W, 80, '#14110e');
    G.vgrad(0, 0, E.W, 120, '#0a0a12', '#14131c');
    // window(s) that creep open as real-house doors "open"
    const wx = 30, ww = 50;
    G.rect(wx, 30, ww, 50, '#05070c');
    const open = this.windows * (ww - 6);
    G.rect(wx + 3, 33, open, 44, '#1a2a44');
    G.rect(E.W - wx - ww, 30, ww, 50, '#05070c');
    G.rect(E.W - wx - ww + 3, 33, open, 44, '#1a2a44');
    // desk + Olivetti + boy
    G.rect(E.W / 2 - 40, 110, 80, 14, '#3a2a1a');
    G.rect(E.W / 2 - 18, 92, 36, 22, '#cfd2d6');     // monitor
    G.rect(E.W / 2 - 14, 96, 28, 14, (Math.sin(this.t * 3) > 0) ? '#0a3a2a' : '#082a20'); // screen glow
    G.spr(A.spr.boy, E.W / 2 - 8, 96, 2);
    // phone
    if (this.rang && Math.sin(this.t * 8) > 0) G.rect(E.W / 2 + 44, 104, 8, 6, '#caa');

    // captions (kept restrained)
    if (this.t > 1.0) E.textC(E.W / 2, 150, 'A BOY SITS AT THE PC. THE PHONE RINGS.', '#9ab', 1);
    if (this.t > 3.0) E.textC(E.W / 2, 162, '"YOUR DAD HAS BEEN IN A CAR ACCIDENT."', '#cdd', 1);
    if (this.t > 5.5) E.textC(E.W / 2, 174, 'somewhere, a real door opens. so does one here.', '#668', 1);
    if (this.t > 7.5 && Math.sin(this.t * 4) > 0) E.textC(E.W / 2, 186, 'PRESS SPACE', '#7df0ff', 1);
  }
};

/* =========================================================================
   SIZE ROOM  —  grow / shrink; you can never fit the door, so you BURST
   through into a 256-colour world (a birth). Then → ending.
   ========================================================================= */
Scenes.sizeRoom = {
  enter() { this.t = 0; this.size = 1; this.burst = 0; this.born = 0; this.tries = 0; S.playSong('dread'); GAME.theme = 'mono';
    GAME.flash('THE SIZE ROOM. G GROW / H SHRINK.', 5); },
  update(dt) {
    this.t += dt;
    if (this.born > 0) { this.born = Math.min(1, this.born + dt * 0.4); if (this.born >= 1 && E.hitAny('Space', 'Enter')) E.setScene(Scenes.ending); return; }
    if (this.burst > 0) { this.burst += dt; if (this.burst > 1.2) { this.born = 0.01; S.sfx('timeblast'); } return; }
    if (E.keyAny('KeyG')) { this.size = Math.min(2.4, this.size + dt * 0.7); S.sfx('grow'); }
    if (E.keyAny('KeyH')) { this.size = Math.max(0.35, this.size - dt * 0.7); S.sfx('shrink'); }
    // approaching the door while small: it's never quite enough (by design)
    if (this.size < 0.45) { this.tries++; if (this.tries % 60 === 0) GAME.flash('STILL TOO BIG FOR THE DOOR. (it was coded so.)', 3); }
    if (E.hitAny('Space')) { // burst through — "trenge deg gjennom"
      this.burst = 0.01; S.sfx('explode'); E.shake(8, 0.6);
      GAME.flash('YOU DO NOT GO THROUGH THE DOOR. YOU GO THROUGH.', 4);
    }
    if (E.hitAny('Escape')) E.setScene(Scenes.title);
    updateMsgs(dt);
  },
  render() {
    if (this.born > 0) { // 256-colour birth
      for (let i = 0; i < 40; i++) {
        const a = (this.t + i) % 1;
        E.ctx.fillStyle = `hsl(${(i * 9 + this.t * 60) % 360},80%,${30 + this.born * 30}%)`;
        const r = (1 - a) * 200 * this.born;
        G.circle(E.W / 2, E.H / 2, r, E.ctx.fillStyle);
      }
      E.ctx.fillStyle = `rgba(255,255,255,${1 - this.born})`; E.ctx.fillRect(0, 0, E.W, E.H);
      E.textC(E.W / 2, E.H / 2, 'B O R N', '#fff', 2);
      if (this.born >= 1) E.textC(E.W / 2, E.H - 20, 'PRESS SPACE', '#000', 1);
      return;
    }
    // monochrome size room
    G.vgrad(0, 0, E.W, E.H, '#26262c', '#101014');
    // the door (fixed, small)
    const dw = 26, dh = 50, dx = E.W / 2 - dw / 2, dy = E.H - 26 - dh;
    G.rect(dx, dy, dw, dh, '#3a3a42'); G.rectO(dx, dy, dw, dh, '#5a5a66');
    G.rect(dx + dw - 6, dy + dh / 2 - 2, 4, 4, '#888');
    // YOU — a square that grows/shrinks
    const s = 26 * this.size;
    const yx = E.W / 2, yy = E.H - 26 - s / 2;
    let col = this.burst > 0 ? `rgba(255,255,255,${Math.min(1, this.burst)})` : '#cfe';
    G.rect(yx - s / 2, yy - s / 2, s, s, col);
    G.rectO(yx - s / 2, yy - s / 2, s, s, '#9af');
    E.text(yx - 5, yy - 3, 'I', '#024', Math.max(1, this.size | 0));
    if (this.burst > 0) { E.ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.burst)})`; E.ctx.fillRect(0, 0, E.W, E.H); }
    E.textC(E.W / 2, 24, 'IS IT YOU THAT GROWS, OR THE ROOM THAT SHRINKS?', '#9ab', 1);
    E.textC(E.W / 2, E.H - 14, 'G GROW   H SHRINK   SPACE: GO THROUGH', '#cde', 1);
    drawHUDmini();
  }
};
function drawHUDmini() { E.text(6, 6, 'SIZE ROOM', '#69a', 1); }

/* =========================================================================
   ENDING  —  the reveal: Carnage, the son of Fiona, biology → technology.
   ========================================================================= */
Scenes.ending = {
  enter() { this.t = 0; this.page = 0; S.playSong('ending');
    this.text = [
      'YOU COME FROM CARNAGE.',
      'YOU ARE CARNAGE.',
      'THRUST INTO THE TIMEFRAMES OF LIFE,',
      'YOU HAD ONE GOAL AND ONE ROAD:',
      'THE SON OF FIONA.',
      '',
      'THE SPEEDER WAS A SEED. THE WALL, AN EGG.',
      'THE GROWING ROOM WAS A BIRTH.',
      'BIOLOGY ENDS HERE. NOW: TECHNOLOGY.',
      'CARNAGE MEETS ITS REFLECTION - A MACHINE.',
      '',
      'YOU WERE NEVER THE KIND ONE.',
      'THE SLIPPER-FOLK, THE SHADOW, THE BEARS,',
      'THEY WERE.',
      '',
      'THERE ARE MANY BEGINNINGS. THIS WAS ONE.',
    ];
  },
  update(dt) {
    this.t += dt;
    if (E.hitAny('Space', 'Enter') || this.t > this.text.length * 1.0 + 6) { if (this.t > 2) E.setScene(Scenes.about); }
    if (E.hitAny('Escape')) E.setScene(Scenes.about);
  },
  render() {
    G.clear('#04050a');
    // slow rising eye / sun motif
    const cy = E.H / 2 - 8;
    G.circle(E.W / 2, cy, 30 + Math.sin(this.t) * 2, '#0a1830');
    G.circle(E.W / 2, cy, 16, '#13355a');
    G.circle(E.W / 2, cy, 7, '#7df0ff');
    G.circle(E.W / 2, cy, 3, '#04050a');
    let y = 96;
    const shown = Math.floor(this.t / 1.0);
    for (let i = 0; i < this.text.length && i <= shown; i++) {
      const a = U.clamp((this.t - i) , 0, 1);
      E.textC(E.W / 2, y, this.text[i], `rgba(190,230,255,${a})`, 1); y += 9;
      if (y > E.H - 16) break;
    }
    if (Math.sin(this.t * 4) > 0) E.textC(E.W / 2, E.H - 8, 'PRESS SPACE', '#69a', 1);
  }
};

/* =========================================================================
   ABOUT  —  the "lost in time" meta / credits (Lirpa = April, backwards)
   ========================================================================= */
Scenes.about = {
  enter() { this.t = 0; S.playSong('dread'); },
  update(dt) {
    this.t += dt;
    if (E.hitAny('Space', 'Enter', 'Escape')) { S.sfx('select'); E.setScene(Scenes.title); }
  },
  render() {
    G.clear('#05060b');
    E.textC(E.W / 2, 12, 'I', '#eafcff', 3);
    const lines = [
      '',
      'LIRPA ENTERTAINMENT, 1994.',
      '(read the studio name backwards.)',
      '',
      'A game of many beginnings and no easy ends.',
      'Bought by Paradax Systems, then by EA, then',
      'shut down. The wiki links are broken now.',
      'It is, as they say, lost in time.',
      '',
      'Reconstructed from three people remembering',
      'three different games, all of them this one.',
      '',
      'CONTROLS: A/D OR ARROWS TURN, W/S MOVE',
      'STRAFE: SHIFT+TURN OR Q / .   SPACE FIRE  E USE',
      'P PF-1000   G/H SIZE',
      'K+L ... YOU WILL KNOW WHEN.',
      '',
      'Stay kind. Sleep with salt under the bed.',
    ];
    let y = 44;
    for (const ln of lines) { E.textC(E.W / 2, y, ln, ln.indexOf('CONTROLS') === 0 || ln.indexOf('SPACE') === 0 || ln.indexOf('K+L') === 0 ? '#9df' : '#8ab', 1); y += 9; }
    if (Math.sin(this.t * 4) > 0) E.textC(E.W / 2, E.H - 8, 'PRESS SPACE - RETURN TO TITLE', '#7df0ff', 1);
  }
};
