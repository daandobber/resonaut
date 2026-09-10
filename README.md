# resonautweb

The application now features a **Parallax Starfield** background by default.
This animated wallpaper reacts to incoming audio, changing colour and motion
depending on the dominant frequencies. Louder peaks briefly create extra
connections that glow and then fade away. The colours adapt to the active musical
scale so the visuals match the selected theme.

Louder sections of music cause extra nodes to sprout near existing ones, giving
the network a bacterial growth vibe. Its hues also blend with the orb colours
for a more unified look.

## Tape Studio

Open **Tape** in the top bar. Select one of four stereo tracks and press **Record** to capture the live mix. **Finish & loop** ends recording and plays the take; **Stop** ends recording while keeping the take for later. **Replace take** records over the selected track. Track selection is locked while recording or waiting for a synced start. **Play all** plays every recorded track, and **Clear track** leaves the other tracks playing.

Choose seconds or 1, 2, 4 or 8 bars (four beats per bar). Global Sync starts recording on the next beat and adjusts tempo-linked tracks when BPM changes. The speed slider is a signed tape transport: center holds the current position in silence, right plays forward up to 2x, left plays backward up to 2x. Changing direction continues from the same position. The 1x button restores normal forward playback. With Sync enabled, the slider multiplies the tempo-matched speed. Speed changes also change pitch, like a physical tape machine. The cassette reels follow the direction and stop at zero. Open **Sound & recording** for the character presets and recording length in bars.

Each track has **Clean**, **Warm** and **Worn** presets, with independent **Warmth** (soft saturation), **Tone** (high-frequency roll-off), and **Drift** (subtle wow and flutter). Playback uses short fades at loop boundaries and on start/stop. Character processing leaves the original recorded buffer intact. Takes and character settings are held in memory for the current page session.

Browser regression checks, with Vite running: `node scripts/check-tape-studio.mjs`, `node scripts/check-tape-transport.mjs` and `node scripts/check-sequencer-connections.mjs`.

**Export take · WAV** downloads the selected loop as stereo PCM audio at its original recorded speed, without tape effects. Starting a new project clears every tape track and cancels recording, queued recording and playback. Loading another project also clears the tape; undo within a project keeps the tape intact.

## Workspace improvements

- **Home** fits all visible orbs; **Shift+Home** focuses the selection. Both are also in the Edit menu.
- **Ctrl/Cmd+S** exports the complete project settings; **Ctrl/Cmd+O** opens a project. Loading a file starts its own undo history.
- Typing in editable fields and using a focused button's keyboard controls does not activate canvas tools.
- Draggable panel headers stay reachable inside the window.
- Circle of Fifths, Tonnetz and Galactic Bloom accept cables across their full visible area. Auto-snap excludes embedded instruments, and loading a saved project repairs old cables that bypassed the sequencer by connecting directly to its hidden center instrument.
- Pending pulses are tied to their original orb, so deleting it or changing projects cannot trigger a new orb that reuses the same ID.

Project lifecycle checks: `node scripts/check-workspace-lifecycle.mjs` with Vite running.

## Deployment

1. Install dependencies with `npm install`.
2. Build the project using `npm run build`.
3. Set your web server's document root to the `dist` directory.
4. Start the WebSocket server with `npm run server` (or `npm run server-wss` for
   secure WebSockets).
5. If deploying under a custom domain, set the `host` (and `port` if needed) in
   `server-config.json`. The server copies these values to
   `public/config.json` on startup so the client connects to the right
   WebSocket endpoint.

## Radar

Use the **Radar** button in the toolbar to add a circular radar. It behaves like a radial timeline grid: a sweep line starts at the top (12 o'clock) and rotates clockwise, triggering any orb it crosses. Internal divisions can be displayed to help line up orbs on the radar.
Each radar can sync its rotation to the global tempo or run at a custom speed. You can also change its radius, number of divisions and whether nodes snap to those lines when dragging.
Radars support two motion modes: **Normal** (always clockwise) and **Reverse Sweep** (switches direction after each revolution). Enable **Crank Mode** in the edit panel to control the sweep manually using the yellow handle and pulse-driven pushes.

## Grid Sequencer

Click the **Grid** button (🔳) in the toolbar to add a Grid Sequencer. Each row exposes a connector on the right edge. Link a row to any pulse-receiving node to trigger it when the row fires. Drag the grid by its border; click cells inside to toggle them, or hold and drag to paint multiple steps. Press the global **Play** button to advance through the columns in time with the transport.

### Pattern Lab

Select a Grid Sequencer with the edit tool to open Pattern Lab in the side panel.
Use **Steady**, **Broken**, **Orbit** and **Space** as starting patterns, then set
the movement to forward, reverse, ping-pong or random. The mini step grid mirrors
the canvas grid, so you can edit dense patterns without hunting for tiny cells.

Each row has mute, solo and trigger-chance controls. Muted rows stay visible but
do not fire; solo rows temporarily isolate the rows you are shaping; chance adds
probabilistic skips per row during playback. The Euclidean row generator creates
evenly spaced hits for one selected row, and the four A-D memory slots store the
current steps, movement and row settings for quick recall.

## Canvas Switching

Multiple canvases can be added to a session. Use the **Canvas** menu to create
new canvases or switch between them. Combine **Canvas Orbs** with **Pulsars**
to automatically advance to the next canvas. When a pulse hits a Canvas Orb the
manager hides the current canvas and shows the targeted one so song sections
can chain together seamlessly.

Canvas Orbs now come in **Send** and **Receive** pairs. Place a Receive Orb on
the destination canvas and link a Send Orb to it by setting its
`targetCanvasIndex` and `receiverId` properties. When a pulse triggers the Send
Orb the view switches to the destination canvas and the pulse continues from
the Receive Orb's position.
Open the **Tools** menu (🛠️) to find buttons for adding Send and Receive
Canvas Orbs to the scene.

## Utilities

Reusable helper functions live in separate modules. `audioUtils.js` handles note
and scale calculations. `mathUtils.js` provides general math helpers such as
`clamp()`, `lerp()` and random number generators.
`fmShapeMorph.js` offers simple FM-based shape morphing utilities for visual experiments.

## Autosave

The app now stores your workspace in the browser's `localStorage` whenever you
make changes. Reloading the page will automatically restore the last session.
Choose **New** from the menu if you want to clear the saved data.


- Arvo Drone updated with a richer wavetable and adjustable filter resonance.
- Arvo Drone oscillators now use resonant bandpass filtering for a more string-like timbre.
- Arvo Drone now features a sitar-style resonator and short comb delay for enhanced string resonance.
- Arvo Drone gains extra oscillators and a single "Motion" control for evolving textures.
- Drone voices now include an `oscType` parameter allowing selection of sine, square, triangle or sawtooth waveforms (plus the original string wave).

## Orbitone System

Orbitones are optional “extra voices” that play alongside a node’s main note. They are rendered as additional oscillators mixed into the instrument before the instrument’s FX sends, with their own timing offsets and envelopes. The goal is to get instant, musical clusters without building a full chord engine into every synth.

Key concepts
- Enable: `audioParams.orbitonesEnabled` toggles the feature per node.
- Count: `audioParams.orbitoneCount` number of extra voices to create.
- Voicing: `audioParams.orbitoneIntervals` holds scale‑step offsets for each voice (e.g. [2, 4, 7]). These are mapped to frequencies via the current scale and root.
- Timing: `audioParams.orbitoneTimingOffsets` holds per‑voice delay in ms relative to the main note start.
- Mix: `audioParams.orbitoneMix` in [0..1] balances main voice vs orbitones. 0 = only main, 1 = only orbitones.

How to integrate Orbitone in a new synth
1) Create extra oscillators and gains
   - On instrument init, if `orbitonesEnabled && orbitoneCount > 0`:
     - Create `orbitoneCount` oscillators of the synth’s main type.
     - For each, create a Gain and connect: `osc -> voiceGain -> (shared pre‑amp bus) -> instrument mainGain`.
     - Store arrays on the synth’s audio node bundle:
       - `audioNodes.orbitoneOscillators: Oscillator[]`
       - `audioNodes.orbitoneIndividualGains: Gain[]`

2) Leave the instrument’s final output (“mainGain”) constant
   - Apply the main note’s ADSR on the main voice gain (e.g. `osc1Gain`), not on the final output. Orbitone voices use their own envelopes; late timing offsets would worden gedempt als de master‑envelop eerder sluit.

3) Schedule on trigger
   - Tijdens note start, compute all output frequencies using the scale utilities:
     - `getFrequency(scaleState.currentScale, baseScaleIndex + interval, 0, scaleState.currentRootNote, scaleState.globalTransposeOffset)`.
   - Mix toepassen:
     - Hoofdstem piek: `(1 - orbitoneMix)`.
     - Per‑Orbitone piek: `(peak * orbitoneMix) / max(1, count)`.
   - Voor elke Orbitone `i`:
     - `startT = now + (orbitoneTimingOffsets[i] || 0)/1000`.
     - Zet `osc.frequency` op `startT`, vorm `voiceGain.gain` met ADSR op `startT`.

4) Live updates
   - Reageer op live parameterwijzigingen (duty/detune/filter/send‑levels) voor zowel de hoofdstem als de orbitones waar relevant.

Minimal API contract voor synths
- Geef deze properties terug in `audioNodes`:
  - `oscillator1` (main pitch reference) en `gainNode` (final output). Indien aanwezig: `osc1Gain` voor de hoofdstem.
  - `orbitoneOscillators: Oscillator[]`
  - `orbitoneIndividualGains: Gain[]`
  - `triggerStart(time, velocity)` en `triggerStop(time)` zodat de engine enveloppen kan sturen.

Referenties
- Pulse Synth: `orbs/pulse-synth-orb.js` (main ADSR op `osc1Gain`, orbitones gemixed op shared bus).
- Orbitone planner voor Pulse: `orbs/pulse-orbitone.js` (frequenties, per‑stem ADSR en timing‑offsets).

Tips
- Bij synths met meerdere carriers (bv. FM) dupliceer je de carrier‑keten per Orbitone en mix je outputs in dezelfde pre‑FX bus.
- Houd per‑stem ADSR kort als je lange timing‑offsets gebruikt; anders wordt het snel een pad.

## Circle of Fifths Sequencer (Zodiac)

The Circle of Fifths is a single, integrated sequencer + instrument. You do not patch an output: the circle embeds its own center instrument and triggers it directly. Only the left input (−1) accepts pulses to advance steps.

How to use
- Place: add the Circle of Fifths; it embeds a sampler in the center automatically.
- Drive: send pulses into the left input; each pulse advances to the next segment.
- Notes/Chords: on each step, the circle plays a note or chord according to the active pattern and the current scale/root. All notes are diatonic to the selected scale.
- Zodiac presets: pick a sign to get a hidden movement pattern (direction + step/degree logic). Some signs (e.g., Taurus) intentionally hold the root.
- Glow: the triggered segment lights up briefly using the theme’s accent color.

UI
- Center Instrument (two dropdowns in the circle’s edit panel):
  - Engine: Sampler | FM Synth | Analog
  - Preset: list depends on Engine (samplers, FM presets, analog waveforms)
  - Changing Engine/Preset converts the embedded instrument in‑place (no extra nodes are created).
- Sequencer controls:
  - Pattern Source: Zodiac or Custom
  - Sequence: Step (around the ring) or Degree (diatonic degrees 1..7)
  - Direction (Step): clockwise/counterclockwise
  - Step Pattern (Step): e.g., `2,1` (alternate two then one segment)
  - Degree Pattern (Degree): e.g., `1,2,3,2,2` (diatonic degrees)
  - Mode: Note | Chord | Random; Chord Size: 2–4; Chord Probability
  - Chord Type: Auto (uses Size) | Triad | Seventh | Sus2 | Sus4 | Power | Random
  - Velocity Jitter: adds subtle, random per‑note velocity (0..1)
  - Voicing Spread: probability to lift chord tones by an octave (0..1)
  - Step Editor: per‑step +/− controls; negative steps move counterclockwise (e.g., `2, -1, 1`). A text input remains for quick edits.
  - Triggered Notes: compact Nexus Piano flashes the notes being played and adopts the current theme colours.

Technical notes
- Pulse flow: the circle advances by `stepPattern` + `direction`, or iterates the `degreePattern` when in Degree mode.
- Degree → frequency: the circle computes a scale‑index offset (e.g., 0, 2, 4) and triggers the center instrument using a `scaleIndexOverride`, keeping everything in key.
- Chords: triads use [0,2,4]; sevenths use [0,2,4,6] relative to the current degree.
  - Additional types: sus2 [0,1,4], sus4 [0,3,4], power [0,4]. When set to Random, a type is chosen each pulse from these.
  - Voicing: with Voicing Spread > 0, upper chord tones may be lifted +7 scale steps (one octave) randomly.
- Velocity: each triggered note uses `intensity * (1 ± jitter)` where `jitter` is the Velocity Jitter amount; values are safely clamped.
- Zodiac: presets set `sequenceMode`, `direction` and a hidden step/degree pattern; `holdRoot` forces the tonic.
- Embedded instrument: a `sound` node is created and marked as embedded; it’s not selectable and is anchored to the center every frame. Triggers go directly to this node; there are no output connectors.
- Rendering: twelve segments, a stylized sun center, and a theme‑colored glow that fades on the last triggered segment.

Why no outputs?
- The circle is meant to be a single “horoscope instrument”: one timing input, built‑in sound. Less cabling, faster results.

Tip: if you need external processing, use the embedded instrument’s effect sends instead of patching from the circle.

### Symphiose · a musical ensemble

Open **Symphiose → Create musical ensemble** to place a Queen, three Minds and five instruments, already connected for bass, three-note chords and melody. Press Play. You can also find the ensemble through Ctrl/Cmd + K.

- **Queen:** shares one clock and chord progression with connected Minds. Density, phrase variation and dynamics shape the ensemble without overwriting the members' settings.
- **Mind:** choose Auto, Bass, Chords, Melody or Rhythm. Auto distributes complementary roles; explicit roles stay yours. Pitched roles follow the current project scale and root. Rhythm preserves the instrument's pitch.
- **Veins:** connect Queen → Minds → instruments, dragging in either direction. The editor lists voices and lets you disconnect them. Saved projects and duplicated ensembles retain their own connections.
- **Phrases:** sixteen default steps make one cycle. Choose a progression and the number of cycles per chord. Motifs repeat; seeded variation and occasional fills develop at phrase boundaries. Ensemble, Breathe, Conversation and Pulse give useful starting points.
- Pause stops the musical clock. Moving the hive is optional under Advanced; the default arrangement stays in place. Existing manual timing, subdivisions and string controls remain available there.

In the Mind editor, **Starlight arp** plays chord tones in a rising, falling or pendulum pattern. **Chord color** offers triads, sevenths, added ninths, sus2 and sus4; a connected Queen supplies this color to the whole ensemble. Three-voice chords retain the extension by omitting the fifth. **Suspended** provides a spacious starting point.

Choose the **Rhythm** role for Euclidean, Backbeat, Son clave, Tresillo or Offbeat grooves. The **Clave** preset starts with a fixed rhythm; Phrase variation adds occasional fills. These settings are saved with the project. All pitched roles use the project's scale.

### Independent pattern orbs

Find **Orbit Rhythm** in **Pulsars**, **Note Loom**, **Chord Garden** and **Arp Orbit** as separate buttons beside the sequencers, or search their names with Ctrl/Cmd + K. Place an orb, connect it to an instrument, then select it with Edit.

- **Orbit Rhythm** distributes a chosen number of hits across 2–32 steps. Rotate the rhythm, add accents, and click individual steps to create your own overrides. Clear overrides returns to the generated pattern.
- **Note Loom** gives each step a note, rest switch, velocity and probability. Choose forward, reverse or pendulum playback, transpose the phrase, or reverse the notes themselves. Under **Note reference**, choose relative to each instrument or one absolute project-scale note for all receivers.
- Both have an internal clock with Sync subdivisions or a manual interval. Set **Clock → External** to advance once per incoming pulse. Ordinary cables work in either drawing direction; one-way cables retain their direction.
- Try **Orbit Rhythm → Note Loom → instrument**, with Note Loom on External. **Step** auditions the next step; **Restart** returns to the start. Patterns and per-step edits are saved with the project.

**Note pulses:** ordinary triggers play an instrument's current note. Note pulses change the receiving orb's actual scale index and frequency, so its label, color, note selector and later triggers follow the new note. The resulting tuning is saved with the project. Relative melodies keep a stable starting register across repeated cycles and save/load; manually retuning an instrument establishes a new reference. Note pulses appear as outlined diamonds on cables, with their degree shown when Info is enabled. Gates and relays preserve that note; another Note Loom replaces it with its next note.

For new sequencers, `utils/notePulse.js` provides the shared `withPulseNote`, `readPulseNote`, `musicalPulseType` and `resolvePulseScaleIndex` helpers. The message is `{ type: 'note', data: { intensity, note: { degree, mode: 'relative' | 'absolute' } } }`. Existing offset messages remain readable. Instruments and their retriggers resolve the message against the current project scale.

### Faster workspace navigation

- Click **Search** in the top bar or press **Ctrl/Cmd + K** to find an orb, synth preset, sample or workspace action. Use the arrow keys and Enter to choose; Escape closes search and keeps your active tool. Choosing a sound prepares it for placement on the canvas.
- Longer instrument and preset menus have a filter. Enter chooses the first available match; Escape clears the filter before closing the menu.
- **Home** fits the patch, **Shift + Home** focuses the selection, and **Space + drag** pans.
- **Ctrl/Cmd + A** selects all visible orbs and cables. Deleting, cutting or pasting a selection takes one undo step, including its cables. Text fields retain their normal editing shortcuts.


### Chord Garden and Arp Orbit

Chord Garden sends scale-based chords to sound orbs (Analog, Pulse, FM, Pluck, Ether Aura and samplers). Edit the root sequence directly, choose triads, sevenths, sixths or suspended shapes, then adjust inversion, open voicing and strum time. It starts on Incoming pulses; choose Internal to run its own progression. Other receiving orb types follow the root note.

Arp Orbit plays an editable note sequence through one to three octaves, forwards, backwards or back and forth. Incoming note pulses establish its root, including while its internal clock runs. It sends individual notes onward. Both editors keep every step, velocity and chance visible on one sidebar page, and all settings travel with the project. Labels sit below the shapes and follow the Info toggle.


### Acid Mycelium

The mushroom button beside the plant sequencers adds an acid bass sequencer with its own monophonic saw/square voice. Its flat sidebar exposes note/rest, velocity, chance, accent and slide for every step. Accent opens the filter and boosts the attack; Slide bends into that step, while a rest breaks the phrase. Cutoff, resonance, envelope sweep, decay, gate and slide time shape the sound. Use Internal clock or Incoming pulses; turn Voice to Note pulses only to drive connected flowers without the built-in bass. Connected instruments receive normal note pulses, preserving their existing release tails.

Plant sequencers now send winged seeds along their branches; Acid Mycelium sends spores with short trails. Both follow the active scale palette.


### Instrument controls

The plant sequencers, Mind/Hive, Pattern Lab and tape editor use knobs, sliders and choice keys instead of numeric entry fields. Drag knobs vertically (Shift for fine control) or use the arrow keys. Each sequencer note has plus/minus keys, with miniature sliders for velocity and chance. Choice keys show short option lists directly; longer lists have previous/next buttons. Presets, muted steps, disabled controls and saved settings keep their existing behavior.
