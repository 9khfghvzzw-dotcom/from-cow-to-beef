# Yes or No soli

The supplied HTML and Python files are preserved without edits. The Python generator produced `public/audio/yes-or-no-soli.mid` at dotted-quarter = 92 in 6/8, with 48 bars (62.609 seconds).

Rendered with FluidSynth 2.6.0 and FluidR3Mono GM (MIT license, copied to `public/audio/FluidR3Mono-LICENSE.md`). Instrument programs follow the supplied MIDI exactly: flute 73, square synth lead 80, clean electric guitar 27, fingered electric bass 33 (zero-based GM), and drums on channel 10.

The game plays `farm-rpg-with-soli.mp3`. The original `farm-rpg-fusion.mp3` is preserved. The original is split at 582.68 seconds (9:42.68); the soli is inserted there with 0.8-second crossfades before the second half resumes. The render keeps 64 seconds for the 48 bars and their final release, and normalizes the insert to -20 LUFS / -2 dBTP. Existing sound and pause controls apply to the entire track.

Soundfont source: https://github.com/LibreScore/sf3
Renderer source: https://github.com/FluidSynth/fluidsynth
