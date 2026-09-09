# Yes or No soli

The supplied HTML and Python files are preserved without edits. The Python generator produced `public/audio/yes-or-no-soli.mid` at dotted-quarter = 92 in 6/8, with 48 bars (62.609 seconds).

Rendered with FluidSynth 2.6.0 and FluidR3Mono GM (MIT license, copied to `public/audio/FluidR3Mono-LICENSE.md`). Instrument programs follow the supplied MIDI exactly: flute 73, square synth lead 80, clean electric guitar 27, fingered electric bass 33 (zero-based GM), and drums on channel 10.

The game plays `farm-rpg-with-soli.mp3`. The original `farm-rpg-fusion.mp3` is preserved. The original is split at 582.68 seconds (9:42.68); the soli is inserted there with 0.8-second crossfades before the second half resumes. The render keeps 64 seconds for the 48 bars and their final release, and normalizes the insert to -20 LUFS / -2 dBTP. Existing sound and pause controls apply to the entire track.

Soundfont source: https://github.com/LibreScore/sf3
Renderer source: https://github.com/FluidSynth/fluidsynth

## Polyphonic revision (2026-09-09)
The game plays `farm-rpg-counterpoint-v2.mp3`. Original files and supplied MIDI are preserved. `arrange_polyphonic.py` retains every source note's pitch, onset and instrument identity across all 48 6/8 bars, adding separately timed alto and tenor lines around the original melody, parallel layers and bass. The original melody and rhythm are not recomposed. Sound is re-rendered with an analog saw lead, flute, plucked guitar, bass and counter-voice timbres. The synthesis is Moog-inspired, not an exact recovered original patch.

The complete 48-bar solo remains at the user-corrected 11:00 insertion (split at 660.8s with a 0.8s crossfade, so the new solo begins at 660.0s). Only AFTER the uninterrupted solo comes a new 16-bar open chorus in 4/4 swing (quarter=92, 2:1 eighths); the original recording then resumes. The original 6/8 dotted-quarter pulse and the new quarter pulse both equal 92. The chorus begins around 12:02.61 in the complete recording. Insert duration with release: 105.85s. The original MIDI remains the original soli; `arrangement.json` documents the revised arrangement, with `original: true` marking preserved notes.

Run `python music-source/arrange_polyphonic.py` with NumPy and `.qa` present. Normalize the output WAV with FFmpeg loudnorm I=-20, TP=-2, LRA=9 and splice between the original recording's halves. Technical checks validate source pitches/onsets, independent counter-lines, swing rhythm, sections, decoding and browser playback. Musical taste and exact original-preset matching still require the composer's listening judgment.

### Editing without rebuilding the composition
Run `python music-source/build_music.py` (Python + NumPy + FFmpeg). This reads `arrangement.json` as the editable score; it does not regenerate its notes from the source. Each event exposes `voice`, `p` (MIDI pitch), `t` (seconds), `d` (seconds), and `v` (velocity). Edit those to adjust the arrangement. Keep `original` notes intact when preserving the supplied melody/rhythm. `verify_arrangement.py` verifies those notes against the supplied Python generator.

`music-config.json` controls insertion time (currently 660 seconds), crossfade, loudness and individual voice gains. The builder caches the synthesized insert using a hash of the score, renderer and voice gains. Placement or final loudness changes reuse that audio; note/timbre changes rerender only the short insert, never recompose the original track. Final MP3 export still runs after a placement change. `--render-only` prepares or verifies the cached insert without exporting the complete track. `arrange_polyphonic.py` regenerates the draft score, so use `build_music.py` to retain manual score edits.

### 20-minute string continuation
`build_strings.py` creates `strings-score.json` once from the supplied motif and then reads the editable score on later runs. It scores ten distinct 120-second sections for violin I, violin II, viola and cello, using synthetic bowed-string timbres. The renderer caches each section independently in `.qa/strings`; changing notes in one section rebuilds only that section, followed by MP3 export. The renderer is deterministic and requires only NumPy and FFmpeg.

The game plays the original track with the revised solo, then `strings-continuation.mp3` (20 minutes), then returns to the first track. Sound off and Pause apply to both. Files stay separate to keep each asset within free static-hosting file limits. This is an original algorithmically arranged continuation inspired by the supplied motif, not a sample-library recording of a live orchestra.
The user additionally supplied a screenshot of Hindemith's complete string quartets as a general development reference. Section 7 now uses staggered subject entries, inversion and augmentation across the quartet. It does not transcribe that recording. Exact score-based reference would require the relevant score excerpt.

Audio delivery: `audio-worker.js` handles GET/HEAD and byte-range requests for MP3 files, supplying Content-Length and Content-Range so long-track seeking works on the live host. Other assets keep default routing. This follows the Cloudflare static assets binding model: https://developers.cloudflare.com/workers/static-assets/binding/ . The Node range test covers bounded/suffix requests, HEAD and invalid ranges.

## Corrected 40-minute programme
The current programme is 20:00 for `main-20min.mp3`, followed by 20:00 for `atonal-quartet-20min.mp3`. The solo remains at 11:00 with its original pitches/onsets intact. Only the original recording's post-insert tail is moderately time-compressed with pitch preservation to keep the first track at twenty minutes; the solo itself is not accelerated or cut.

`build_atonal_strings.py` and `atonal-strings-score.json` supersede the earlier tonal string draft for playback. Four separately timed lines use complete chromatic twelve-note cells, with transposition, inversion and reversal. There is no root/triad chord-progression generator. All voices remain in their assigned string ranges. Arco, pizzicato and marcato envelopes create articulation contrast suggested by the reference pages. This is original synthetic quartet writing, not a transcription or an assertion that Hindemith's reference is strict twelve-tone music. Old drafts remain archived and are not in the playlist.

Use `build_music.py` and `build_atonal_strings.py` for the current programme. The cache still permits unchanged sections to be reused. Score tests verify duration plans, complete chromatic aggregates in each phrase, independent onsets, ranges and articulations; they cannot establish subjective musical quality.

Playback packaging: run `assemble_40min.py` after the two builders. The game now serves one `complete-40min.m4a` file (AAC 80 kb/s, fast-start metadata), so the iPhone lock-screen player shows the complete forty-minute duration. The two twenty-minute source renders remain editable separately. Byte-range delivery covers both MP3 and M4A. Final browser verification checks playback and seeking at 11:00, after 20:00 and near 40:00.
