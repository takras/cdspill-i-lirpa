/* =========================================================================
   I  —  audio.js
   Procedural Web Audio: SFX synth + a tiny chiptune sequencer.
   (AdLib / Pro Audio Spectrum / Roland Sound Canvas, in spirit.)
   ========================================================================= */
'use strict';

const S = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  muted: false, ready: false,
  _noise: null,
  song: null, step: 0, nextTime: 0, timer: null, songName: null,
};

S.init = function () {
  if (S.ready) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  S.ctx = new AC();
  S.master = S.ctx.createGain(); S.master.gain.value = S.muted ? 0 : 0.85;
  S.master.connect(S.ctx.destination);
  S.musicGain = S.ctx.createGain(); S.musicGain.gain.value = 0.55; S.musicGain.connect(S.master);
  S.sfxGain = S.ctx.createGain(); S.sfxGain.gain.value = 0.9; S.sfxGain.connect(S.master);
  // shared noise buffer
  const n = S.ctx.createBuffer(1, S.ctx.sampleRate * 1, S.ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  S._noise = n;
  S.ready = true;
};

S.resume = function () { if (S.ctx && S.ctx.state === 'suspended') S.ctx.resume(); };
S.setMuted = function (m) { S.muted = m; if (S.master) S.master.gain.value = m ? 0 : 0.85; };

/* ---------- low level voices ---------- */
S._env = function (node, dest, t, a, d, s, r, peak, sus) {
  const g = S.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.linearRampToValueAtTime(peak * sus, t + a + d);
  g.gain.setValueAtTime(peak * sus, t + a + d + s);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + s + r);
  node.connect(g); g.connect(dest);
  return { g, end: t + a + d + s + r };
};

S.tone = function (freq, dur, type, vol, dest, slideTo) {
  if (!S.ready) return;
  const t = S.ctx.currentTime;
  const o = S.ctx.createOscillator();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  const e = S._env(o, dest || S.sfxGain, t, 0.005, dur * 0.3, dur * 0.2, dur * 0.5, vol == null ? 0.4 : vol, 0.6);
  o.start(t); o.stop(e.end + 0.02);
};

S.noiseHit = function (dur, vol, hp, dest) {
  if (!S.ready) return;
  const t = S.ctx.currentTime;
  const src = S.ctx.createBufferSource(); src.buffer = S._noise; src.loop = true;
  const f = S.ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 1800;
  src.connect(f);
  const e = S._env(f, dest || S.sfxGain, t, 0.001, dur * 0.4, 0, dur * 0.6, vol == null ? 0.5 : vol, 0.2);
  src.start(t); src.stop(e.end + 0.02);
};

/* ---------- named SFX ---------- */
S.sfx = function (name) {
  if (!S.ready) return;
  switch (name) {
    case 'blip':     S.tone(660, 0.06, 'square', 0.25); break;
    case 'select':   S.tone(880, 0.05, 'square', 0.3); setTimeout(() => S.tone(1320, 0.06, 'square', 0.25), 40); break;
    case 'deny':     S.tone(180, 0.18, 'sawtooth', 0.3, null, 90); break;
    case 'type':     S.tone(1200 + Math.random() * 300, 0.02, 'square', 0.08); break;
    case 'pickup':   S.tone(523, 0.08, 'square', 0.3, null, 784); setTimeout(() => S.tone(1046, 0.1, 'triangle', 0.25), 70); break;
    case 'fireball': S.tone(420, 0.22, 'sawtooth', 0.35, null, 140); S.noiseHit(0.18, 0.25, 900); break;
    case 'plasma':   S.tone(720, 0.18, 'square', 0.3, null, 220); S.tone(360, 0.2, 'triangle', 0.2, null, 110); S.noiseHit(0.12, 0.18, 1200); break;
    case 'pf1000':   // the one-shot overpowered cannon
      S.tone(120, 0.5, 'sawtooth', 0.45, null, 40); S.noiseHit(0.5, 0.5, 600); S.tone(900, 0.4, 'square', 0.2, null, 80); break;
    case 'hit':      S.noiseHit(0.08, 0.3, 2400, null); S.tone(200, 0.06, 'square', 0.2, null, 120); break;
    case 'hurt':     S.tone(160, 0.25, 'sawtooth', 0.4, null, 70); S.noiseHit(0.15, 0.25); break;
    case 'door':     S.tone(90, 0.5, 'sawtooth', 0.25, null, 70); S.noiseHit(0.4, 0.12, 400); break;
    case 'explode':  S.noiseHit(0.6, 0.5, 500); S.tone(80, 0.6, 'sawtooth', 0.4, null, 30); break;
    case 'timeblast':
      for (let i = 0; i < 6; i++) setTimeout(() => S.tone(300 + i * 220, 0.12, 'triangle', 0.22, null, 1200), i * 45);
      S.noiseHit(0.5, 0.18, 3000); break;
    case 'jump':     S.tone(300, 0.12, 'square', 0.25, null, 720); break;
    case 'land':     S.tone(140, 0.08, 'square', 0.2, null, 80); break;
    case 'dwarf':    S.tone(70, 0.4, 'sawtooth', 0.4, null, 50); S.tone(110, 0.4, 'square', 0.2, null, 80); break;
    case 'grow':     S.tone(200, 0.5, 'sine', 0.3, null, 600); break;
    case 'shrink':   S.tone(600, 0.5, 'sine', 0.3, null, 180); break;
    case 'phone':    // brief two-tone ring
      S.tone(440, 0.4, 'sine', 0.25); S.tone(480, 0.4, 'sine', 0.25); break;
    case 'screech':  S.screech(); break;
    case 'powerdown':S.tone(800, 0.7, 'sawtooth', 0.35, null, 40); break;
    case 'heart':    S.tone(60, 0.12, 'sine', 0.4); setTimeout(() => S.tone(55, 0.1, 'sine', 0.3), 160); break;
  }
};

// Shadow-lady screech — intentionally harsh, but volume-capped & short.
S.screech = function () {
  if (!S.ready) return;
  const t = S.ctx.currentTime;
  const o = S.ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.linearRampToValueAtTime(2600, t + 0.12);
  o.frequency.linearRampToValueAtTime(900, t + 0.3);
  const g = S.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);   // capped, not painful
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  o.connect(g); g.connect(S.sfxGain); o.start(t); o.stop(t + 0.36);
  S.noiseHit(0.3, 0.18, 2200);
};

/* =========================================================================
   Music sequencer
   ========================================================================= */
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);   // midi → Hz
// note-name helper for readability: C4=60
const N = {};
(() => { const names = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];
  for (let o = 1; o <= 7; o++) for (let i = 0; i < 12; i++) N[names[i] + o] = 12 * (o + 1) + i; })();

S.songs = {};

// helper to build a melodic line: array of [midiOrNull, steps]
function line(seq, baseStep) {
  const out = []; let s = baseStep || 0;
  for (const [m, len] of seq) { if (m != null) out.push([s, m, len]); s += len; }
  return out;
}

/* --- TITLE THEME: the catchy, slightly-too-cheerful riff they remember --- */
S.songs.title = {
  bpm: 132, steps: 32,
  tracks: [
    { wave: 'square', gain: 0.22, seq: [].concat(
        line([[N.A4,2],[N.C5,2],[N.E5,2],[N.A5,2],[N.G5,2],[N.E5,2],[N.D5,2],[N.C5,2],
              [N.A4,2],[N.C5,2],[N.E5,2],[N.D5,2],[N.C5,2],[N.B4,2],[N.A4,2],[N.E5,2]]) ) },
    { wave: 'triangle', gain: 0.3, seq: [].concat(
        line([[N.A2,4],[N.A2,4],[N.F2,4],[N.F2,4],[N.G2,4],[N.G2,4],[N.E2,4],[N.E2,4]]) ) },
    { wave: 'square', gain: 0.12, seq: [].concat(
        // arpeggio sparkle
        (() => { const a = []; const ch = [N.A4,N.E5,N.A5,N.E5]; for (let i = 0; i < 32; i++) a.push([i, ch[i % 4], 1]); return a; })() ) },
  ]
};

/* --- CYBER DRIVE: pulsing, forward-motion --- */
S.songs.cyber = {
  bpm: 150, steps: 16,
  tracks: [
    { wave: 'sawtooth', gain: 0.18, seq: (() => { const a = []; const r = [N.E2,N.E2,N.E3,N.E2,N.G2,N.E2,N.D3,N.E2]; for (let i = 0; i < 16; i++) a.push([i, r[i % 8], 1]); return a; })() },
    { wave: 'square', gain: 0.14, seq: line([[N.E4,4],[N.G4,2],[N.B4,2],[N.D5,4],[N.B4,2],[N.A4,2]]) },
  ]
};

/* --- FANTASY: mysterious desert --- */
S.songs.fantasy = {
  bpm: 96, steps: 32,
  tracks: [
    { wave: 'triangle', gain: 0.26, seq: line([[N.D3,8],[N.A2,8],[N.As2,8],[N.A2,8]]) },
    { wave: 'square', gain: 0.13, seq: line([[N.D4,4],[N.F4,2],[N.A4,2],[N.G4,4],[N.F4,2],[N.E4,2],
                                              [N.F4,4],[N.A4,2],[N.D5,2],[N.C5,4],[N.A4,4]]) },
  ]
};

/* --- DREAD: the creepy room / shadow --- */
S.songs.dread = {
  bpm: 60, steps: 16,
  tracks: [
    { wave: 'sawtooth', gain: 0.12, seq: line([[N.C2,8],[N.Cs2,8]]) },
    { wave: 'sine', gain: 0.18, seq: line([[N.G2,16]]) },
    { wave: 'triangle', gain: 0.08, seq: line([[N.Gs4,3],[null,5],[N.G4,3],[null,5]]) },
  ]
};

/* --- ENDING: resolving / posthuman calm --- */
S.songs.ending = {
  bpm: 80, steps: 32,
  tracks: [
    { wave: 'triangle', gain: 0.26, seq: line([[N.A2,8],[N.F2,8],[N.C3,8],[N.G2,8]]) },
    { wave: 'sine', gain: 0.2, seq: line([[N.A4,8],[N.C5,8],[N.E5,8],[N.D5,4],[N.C5,4]]) },
  ]
};

S.playSong = function (name) {
  if (!S.ready) { S._pending = name; return; }
  if (S.songName === name) return;
  S.songName = name;
  S.song = S.songs[name] || null;
  S.step = 0;
  S.nextTime = S.ctx.currentTime + 0.06;
  if (!S.timer) S.timer = setInterval(S._sched, 25);
};

S.stopSong = function () { S.songName = null; S.song = null; };

S._sched = function () {
  if (!S.ready || !S.song) return;
  const spb = 60 / S.song.bpm / 2;          // seconds per step (8th notes)
  while (S.nextTime < S.ctx.currentTime + 0.12) {
    const step = S.step % S.song.steps;
    for (const tr of S.song.tracks) {
      for (const [st, midi, len] of tr.seq) {
        if (st === step) S._note(tr, midi, len * spb, S.nextTime);
      }
    }
    S.nextTime += spb; S.step++;
  }
};

S._note = function (tr, midi, dur, when) {
  const o = S.ctx.createOscillator(); o.type = tr.wave;
  o.frequency.setValueAtTime(NOTE(midi), when);
  const g = S.ctx.createGain();
  const peak = tr.gain;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.01);
  g.gain.setValueAtTime(peak, when + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g); g.connect(S.musicGain);
  o.start(when); o.stop(when + dur + 0.02);
};
