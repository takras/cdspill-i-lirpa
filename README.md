# I

*Lirpa Entertainment, 1994.* (Read the studio name backwards.)

A browser reconstruction of a game that — according to the three hosts of the
podcast **cd SPILL** — came out exactly 30 years ago, was bought by Paradax
Systems, then by EA, then quietly shut down. Nobody can quite agree on what it
was. One of them only ever played the cyberpunk start; one only the fantasy
start; one only watched over a friend's shoulder. They are all describing the
same game. This is that game.

It is built entirely from code — no external image, audio or font files. Every
sprite, wall texture, sound effect and piece of music is generated procedurally
at runtime (a 320×200 VGA-style raycaster, a small Web Audio chiptune
sequencer, and a runtime-built bitmap font).

## Run it

Just open **`index.html`** in a modern browser (Chrome, Edge, Firefox). No build
step, no server.

If your browser is strict about `file://`, serve the folder instead:

```
python -m http.server 8000      # then visit http://localhost:8000
```

On the boot screen you can enable **Reduce flashing & screen-shake** and **Start
muted**. Headphones recommended. Keyboard required (it is 1994).

## Controls

| Key | Action |
|-----|--------|
| A / D  or  ← / → | Turn |
| W / S  or  ↑ / ↓ | Move forward / back |
| Shift + turn,  or  Q / . | Strafe |
| Space / Ctrl / Mouse | Fire (plasma in steel, fireball in sand) |
| E / Enter | Use / open doors / interact |
| P | Fire the **PF-1000** (one shot, ever) |
| G / H | Grow / shrink (the size room) |
| K + L | …you'll know when |
| M mute · F fullscreen · Esc back to title | |

There are **multiple beginnings, not endings.** On the title screen, hover and
click the **sun** (a beginning in the sand) or the lone **figure** in the street
(a beginning in steel). Press **R** for a random beginning, **A** for the
"lost in time" about page.

## What's in here, and where it came from in the episode

Almost everything is a deliberate nod to something the hosts (Sigve, Mr. Mamen,
Anders Ekroll) remember — or misremember:

- **The two beginnings** — sun → fantasy desert, figure → cyberpunk. ("Det har
  ulike *beginnings!*")
- **The speeder / "motorsykkel" chase** into the great white wall, saved by the
  plasma — later revealed as a *sperm cell* racing the *egg*. ("Star Speeder…
  den svære hvite veggen… så kom plasmaen.")
- **Fireball ⇄ Plasma**: carry the Ember Core between ages and it transforms.
  ("ildkula… ble plasma i fremtidsbyen.")
- **The anti-gravity zone**: gravity inverts and the arrow keys stop working —
  you must *discover* that **K / L** became the new left/right. ("K eller L var
  blitt en ny høyre-venstre.")
- **The Shadow Lady / Shadow Ninja** with the bladed "disco-plate" shuriken, the
  flashing screen and the awful screech. (Kept low-contrast and brief, with a
  photosensitivity toggle — we are not actually shipping a seizure.)
- **The dragon (or bear, red of beard)** that *fire will not bite* — you need the
  **Great Plank**, up close. ("kan ikke bruke ildkula på den, du må bruke
  planken.")
- **The dwarf in the mountain** — Dark Souls before Dark Souls. Very tanky.
- **The grow/shrink size room**: you can never get small enough for the door, so
  you don't go *through the door*, you go *through* — and are **born** into a
  256-colour world. ("du trenger deg gjennom… nytt spill på utsiden.")
- **The death-timer gate**: a sealing gate, rising gas, and the trick of handing
  your countdown to a foe (**T**) to pass.
- **The PF-1000**: hilariously overpowered, exactly one shot.
- **Triangle vs Square** ("more edges, more area"), a Matrix-style one-way choice.
- **The dongle & collector-card "skins" shop** — proto-microtransactions over a
  COM-port dongle, demo mode, no card inserted.
- **The eerie Olivetti / phone cutscene** ("your dad has been in a car accident")
  and the windows that open when real doors open. Handled briefly and softly.
- **The clock**: the game reads your real PC clock and shifts mood by day / dusk
  / night — "different levels depending on time of day."
- **The save that dumps you back where you were**, and a manual/box full of
  Bible verses, Shakespeare and an alchemy sand-set that you definitely should
  not mix. (Flavour, in the about page and boot.)
- **The Lexicon look**: an absurdly expensive font, so the UI is clean and the
  menus always sit in the same place.
- And the meta: *Lirpa = April backwards*, broken wiki links, "lost in time."

## Files

```
index.html          shell + photosensitivity/boot modal + control bar
css/style.css        bezel, modal, scaling
js/engine.js         320x200 backbuffer, loop, input, runtime bitmap font, draw helpers
js/audio.js          Web Audio SFX + chiptune sequencer (title/cyber/fantasy/dread/ending)
js/art.js            procedural sprites, wall textures, title painter
js/raycaster.js      textured DDA raycaster + z-buffered sprite billboards
js/scenes.js         state machine, inventory/HUD, every scene & set-piece
js/main.js           bootstrap + chrome wiring
```

## A note on flashing

The podcast remembers the Shadow Lady sequence as borderline seizure-inducing.
This reconstruction intentionally does **not** reproduce that: the flash is
low-contrast, ~5 Hz, very brief, and fully disabled by the **Reduce flashing**
option (on the boot screen and the ⚠ button). Please use it if you're sensitive.

*Stay kind. Sleep with salt under the bed.*
