# Yes or No soli

The supplied HTML and Python files are preserved without edits. The Python generator produced `public/audio/yes-or-no-soli.mid` at dotted-quarter = 92 in 6/8, with 48 bars (62.609 seconds).

Rendered with FluidSynth 2.6.0 and FluidR3Mono GM (MIT license, copied to `public/audio/FluidR3Mono-LICENSE.md`). Instrument programs follow the supplied MIDI exactly: flute 73, square synth lead 80, clean electric guitar 27, fingered electric bass 33 (zero-based GM), and drums on channel 10.

The game plays `farm-rpg-with-soli.mp3`. The original `farm-rpg-fusion.mp3` is preserved. The original is split at 582.68 seconds (9:42.68); the soli is inserted there with 0.8-second crossfades before the second half resumes. The render keeps 64 seconds for the 48 bars and their final release, and normalizes the insert to -20 LUFS / -2 dBTP. Existing sound and pause controls apply to the entire track.

Soundfont source: https://github.com/LibreScore/sf3
Renderer source: https://github.com/FluidSynth/fluidsynth

## Polyphonic revision (2026-09-09)
The game plays `farm-rpg-counterpoint.mp3`. Original files and supplied MIDI are preserved. `arrange_polyphonic.py` retains every source note's pitch, onset and instrument identity across all 48 6/8 bars, adding separately timed alto and tenor lines around the original melody, parallel layers and bass. The original melody and rhythm are not recomposed. Sound is re-rendered with an analog saw lead, flute, plucked guitar, bass and counter-voice timbres. The synthesis is Moog-inspired, not an exact recovered original patch.

The complete 48-bar solo remains at the same midpoint insertion (582.68s, 0.8s crossfade). Only AFTER the uninterrupted solo comes a new 16-bar open chorus in 4/4 swing (quarter=92, 2:1 eighths); the original recording then resumes. The original 6/8 dotted-quarter pulse and the new quarter pulse both equal 92. The chorus begins around 10:44.49 in the complete recording. Insert duration with release: 105.85s. The original MIDI remains the original soli; `arrangement.json` documents the revised arrangement, with `original: true` marking preserved notes.

Run `python music-source/arrange_polyphonic.py` with NumPy and `.qa` present. Normalize the output WAV with FFmpeg loudnorm I=-20, TP=-2, LRA=9 and splice between the original recording's halves. Technical checks validate source pitches/onsets, independent counter-lines, swing rhythm, sections, decoding and browser playback. Musical taste and exact original-preset matching still require the composer's listening judgment.
