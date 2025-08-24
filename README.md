# resonautweb

The application now features a **Parallax Starfield** background by default.
This animated wallpaper reacts to incoming audio, changing colour and motion
depending on the dominant frequencies. Louder peaks briefly create extra
connections that glow and then fade away. The colours adapt to the active musical
scale so the visuals match the selected theme.

Louder sections of music cause extra nodes to sprout near existing ones, giving
the network a bacterial growth vibe. Its hues also blend with the orb colours
for a more unified look.

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

## Radio Sampler

Use the **Radio** button in the top menu bar to open the sampler panel. Tune stations with the slider — you will hear static that gently fades in and out when not locked onto a channel, and it falls silent when the radio stops or locks to a stream. Each pad in the 3×3 grid has its own **Rec** button underneath for capturing a snippet directly from the radio. The dot next to it shows whether the pad will trigger on the currently selected step and can be clicked to toggle that step. Trim recordings with the waveform editor.

Program patterns by clicking the 16-step bar below the pads. Each step toggles the selected pad on or off for that position. The sequence loops automatically and a highlight shows the current playhead. You can still record pads live with **Record Sequence** if you want. A metronome toggle in the menu bar plays a short click on every beat.

Several built‑in streams are available including Dutch public radio and a few SomaFM channels such as Groove Salad, Lush, Drone Zone and Secret Agent.

Pads now respond immediately using WebAudio buffers and light up while they play. Drag the start and end markers directly on the waveform to quickly set loop points.
FX pad movements can be recorded from the Effects tab and will loop automatically over 16 steps. Use Delete FX to clear a recording.

## Radar

Use the **Radar** button in the toolbar to add a circular radar. It behaves like a radial timeline grid: a sweep line starts at the top (12 o'clock) and rotates clockwise, triggering any orb it crosses. Internal divisions can be displayed to help line up orbs on the radar.
Each radar can sync its rotation to the global tempo or run at a custom speed. You can also change its radius, number of divisions and whether nodes snap to those lines when dragging.
Radars support two motion modes: **Normal** (always clockwise) and **Reverse Sweep** (switches direction after each revolution). Enable **Crank Mode** in the edit panel to control the sweep manually using the yellow handle and pulse-driven pushes.

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


## PolySynth Orbitone Example
The file `polyChordExample.js` demonstrates using `Tone.PolySynth` to trigger chords for orbitone effects. Run it to hear a repeating progression where each chord is played as a polyphonic voice.
- Arvo Drone updated with a richer wavetable and adjustable filter resonance.
- Arvo Drone oscillators now use resonant bandpass filtering for a more string-like timbre.
- Arvo Drone now features a sitar-style resonator and short comb delay for enhanced string resonance.
- Arvo Drone gains extra oscillators and a single "Motion" control for evolving textures.
- Drone voices now include an `oscType` parameter allowing selection of sine, square, triangle or sawtooth waveforms (plus the original string wave).
