/* =========================================================================
   I  —  main.js   (bootstrap & chrome wiring)
   ========================================================================= */
'use strict';

(function () {
  // build everything that doesn't need a user gesture
  E.init();
  A.build();
  RC.initTextures();

  const warn = document.getElementById('warn');
  const startBtn = document.getElementById('startBtn');
  const reduceFlash = document.getElementById('reduceFlash');
  const muteAudio = document.getElementById('muteAudio');
  const hint = document.getElementById('hint');

  // restore prefs
  try {
    if (localStorage.getItem('I_reduceFlash') === '1') reduceFlash.checked = true;
    if (localStorage.getItem('I_mute') === '1') muteAudio.checked = true;
  } catch (e) {}

  let started = false;
  function begin() {
    if (started) return; started = true;
    E.reduceFlash = reduceFlash.checked;
    S.muted = muteAudio.checked;
    S.init();
    S.resume();
    if (S._pending) { S.playSong(S._pending); S._pending = null; }
    warn.classList.add('hidden');
    E.setScene(Scenes.boot);
    E.start();
  }
  startBtn.addEventListener('click', begin);
  addEventListener('keydown', (e) => { if (!started && (e.code === 'Enter' || e.code === 'Space')) begin(); });

  // control bar
  document.getElementById('bar').addEventListener('click', (e) => {
    const act = e.target.getAttribute('data-act'); if (!act) return;
    if (act === 'mute') { S.setMuted(!S.muted); persist(); }
    if (act === 'flash') { E.reduceFlash = !E.reduceFlash; flashPersist(); flashHint(); }
    if (act === 'full') toggleFull();
  });

  function flashHint() { hint.textContent = 'Reduced flashing: ' + (E.reduceFlash ? 'ON' : 'OFF'); }
  function persist() { try { localStorage.setItem('I_mute', S.muted ? '1' : '0'); } catch (e) {} }
  function flashPersist() { try { localStorage.setItem('I_reduceFlash', E.reduceFlash ? '1' : '0'); } catch (e) {} }

  // global hotkeys (after start)
  addEventListener('keydown', (e) => {
    if (!started) return;
    if (e.code === 'KeyM') { S.setMuted(!S.muted); persist(); }
    if (e.code === 'KeyF') toggleFull();
    // resume audio context if the browser suspended it
    S.resume();
  });
  // first interaction safety: resume audio on any click
  addEventListener('pointerdown', () => { if (started) S.resume(); });

  function toggleFull() {
    const el = document.getElementById('frame');
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    else (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }

  // keep checkbox prefs saved if toggled on the modal
  reduceFlash.addEventListener('change', () => { try { localStorage.setItem('I_reduceFlash', reduceFlash.checked ? '1' : '0'); } catch (e) {} });
  muteAudio.addEventListener('change', () => { try { localStorage.setItem('I_mute', muteAudio.checked ? '1' : '0'); } catch (e) {} });
})();
