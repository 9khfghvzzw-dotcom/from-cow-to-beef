#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
yes_or_no_soli.py — three consecutive soli for "Yes or No" (6/8), Meat Lover game cue.

Straight 16th-note quartal lines, alternating YES / NO phrases:
  Soli I   (bars 1-16)  flute + guitar   F minor <-> E minor
  Soli II  (bars 17-32) synth lead       B minor <-> C minor   (guitar comps quartal stabs)
  Soli III (bars 33-48) tutti            3-part parallel quartal, worlds rotate per bar

Writes a MIDI file with ONE TRACK PER INSTRUMENT (flute / synth / guitar / bass / drums)
so you can drag the parts straight into your arrangement. Optionally writes MusicXML.

Standard library only. No installs.

------------------------------------------------------------------------------
USAGE
------------------------------------------------------------------------------
  python yes_or_no_soli.py
      -> yes_or_no_soli_92.mid   (48 bars, dotted-quarter = 92)

  python yes_or_no_soli.py --bpm 132 --out soli_fast.mid
      -> faster version

  python yes_or_no_soli.py --midi-in my_piano_idea.mid --derive inv
      -> builds the soli on YOUR melody instead of the built-in quartal draft.
         Your line is monophonised, quantised to 16ths and tiled across the 48 bars.
         Rising (YES) bars use it straight, falling (NO) bars use the derived version.

  python yes_or_no_soli.py --xml soli.musicxml
      -> also writes notation you can open in MuseScore / Sibelius / Dorico

  python yes_or_no_soli.py --at-time 20 --bpm 92
      -> prints which bar of the 25-minute cue the soli should start on

  python yes_or_no_soli.py --offset-bars 920
      -> writes the MIDI with the soli already placed at bar 921 of your project

  python yes_or_no_soli.py --notes notes.txt
      -> writes a readable bar.step / instrument / pitch list

------------------------------------------------------------------------------
OPTIONS
  --bpm N             dotted-quarter tempo (default 92)
  --out FILE          output MIDI path
  --xml FILE          also write MusicXML to this path
  --notes FILE        also write a plain-text note list
  --midi-in FILE      use your own MIDI sketch as the YES line
  --derive MODE       how the NO line is made from YES:
                      inv | retro | down4 | retroinv | tritone   (default inv)
  --transpose N       transpose your imported line by N semitones
  --offset-bars N     shift everything N bars later (for dropping into a project)
  --at-time MINUTES   print the start bar for that timecode and exit
------------------------------------------------------------------------------
"""

import argparse
import os
import struct
import sys

# --------------------------------------------------------------------------
# material
# --------------------------------------------------------------------------
SPB = 12                      # 16th-note steps in one 6/8 bar

WORLDS = {                    # pentatonic worlds the lines drift through
    "Fm": {"root": 53, "bass": 41},   # F  (F3)
    "Em": {"root": 52, "bass": 40},   # E
    "Bm": {"root": 47, "bass": 35},   # B
    "Cm": {"root": 48, "bass": 36},   # C
}

# rhythm templates, one bar = 12 steps. a negative number is a rest of that length
R = {
    "RUN":  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    "TAG":  [1, 1, 1, 1, 1, 1, 3, 3],
    "SYNC": [2, 1, 1, 2, 1, 1, 2, 2],
    "NO":   [1, 1, 1, 1, -2, 1, 1, 1, 1, -2],
    "REST": [1, 1, 1, 1, 1, 1, -6],
    "LONG": [12],
}

RANGE = {                     # (lowest, highest) midi note per instrument
    "flute":  (60, 86),
    "synth":  (48, 79),
    "guitar": (40, 71),
    "bass":   (28, 52),
}

NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def note_name(m):
    return "%s%d" % (NAMES[m % 12], m // 12 - 1)


def clamp_oct(p, lo, hi):
    while p > hi:
        p -= 12
    while p < lo:
        p += 12
    return p


def bar(r, w, direction, mode, parts, dyn=0.7, hit=False):
    return {"r": r, "w": w, "dir": direction, "mode": mode,
            "parts": parts, "dyn": dyn, "hit": hit}


# 48 bars. direction +1 = a YES bar (rising), -1 = a NO bar (falling)
BARS = [
    # ---------- SOLI I : flute + guitar, YES/NO dialogue ----------
    bar(R["RUN"],  "Fm",  1, "unison",  ["flute", "guitar"], 0.62),
    bar(R["TAG"],  "Fm",  1, "unison",  ["flute", "guitar"], 0.66),
    bar(R["NO"],   "Em", -1, "unison",  ["flute", "guitar"], 0.60),
    bar(R["REST"], "Em", -1, "unison",  ["flute", "guitar"], 0.58),
    bar(R["RUN"],  "Fm",  1, "unison",  ["flute", "guitar"], 0.70),
    bar(R["SYNC"], "Fm",  1, "unison",  ["flute", "guitar"], 0.70),
    bar(R["NO"],   "Em", -1, "unison",  ["flute", "guitar"], 0.66),
    bar(R["TAG"],  "Em", -1, "unison",  ["flute", "guitar"], 0.72, True),
    bar(R["RUN"],  "Fm",  1, "octave",  ["flute", "guitar"], 0.78),
    bar(R["RUN"],  "Fm",  1, "octave",  ["flute", "guitar"], 0.80),
    bar(R["SYNC"], "Fm",  1, "octave",  ["flute", "guitar"], 0.80),
    bar(R["TAG"],  "Fm",  1, "octave",  ["flute", "guitar"], 0.84, True),
    bar(R["NO"],   "Em", -1, "octave",  ["flute", "guitar"], 0.78),
    bar(R["RUN"],  "Em", -1, "octave",  ["flute", "guitar"], 0.80),
    bar(R["RUN"],  "Em", -1, "octave",  ["flute", "guitar"], 0.84),
    bar(R["LONG"], "Fm",  1, "pad",     ["flute", "synth", "guitar"], 0.70, True),

    # ---------- SOLI II : synth lead, guitar comps ----------
    bar(R["RUN"],  "Bm",  1, "lead",    ["synth"], 0.72, True),
    bar(R["SYNC"], "Bm",  1, "lead",    ["synth"], 0.72),
    bar(R["NO"],   "Cm", -1, "lead",    ["synth"], 0.68),
    bar(R["TAG"],  "Cm", -1, "lead",    ["synth"], 0.74, True),
    bar(R["RUN"],  "Bm",  1, "lead",    ["synth"], 0.76),
    bar(R["RUN"],  "Bm",  1, "lead",    ["synth"], 0.76),
    bar(R["SYNC"], "Cm", -1, "lead",    ["synth"], 0.74),
    bar(R["TAG"],  "Cm", -1, "lead",    ["synth"], 0.78, True),
    bar(R["RUN"],  "Bm",  1, "lead2",   ["synth", "flute"], 0.82),
    bar(R["RUN"],  "Bm",  1, "lead2",   ["synth", "flute"], 0.84),
    bar(R["SYNC"], "Cm", -1, "lead2",   ["synth", "flute"], 0.84),
    bar(R["TAG"],  "Cm", -1, "lead2",   ["synth", "flute"], 0.86, True),
    bar(R["RUN"],  "Bm",  1, "unison",  ["flute", "synth", "guitar"], 0.88),
    bar(R["RUN"],  "Bm",  1, "unison",  ["flute", "synth", "guitar"], 0.90),
    bar(R["SYNC"], "Cm", -1, "unison",  ["flute", "synth", "guitar"], 0.90),
    bar(R["TAG"],  "Cm", -1, "unison",  ["flute", "synth", "guitar"], 0.92, True),

    # ---------- SOLI III : tutti parallel quartal ----------
    bar(R["RUN"],  "Fm",  1, "quartal", ["flute", "synth", "guitar"], 0.92, True),
    bar(R["RUN"],  "Fm",  1, "quartal", ["flute", "synth", "guitar"], 0.92),
    bar(R["RUN"],  "Em", -1, "quartal", ["flute", "synth", "guitar"], 0.92),
    bar(R["SYNC"], "Em", -1, "quartal", ["flute", "synth", "guitar"], 0.90, True),
    bar(R["SYNC"], "Bm",  1, "quartal", ["flute", "synth", "guitar"], 0.92),
    bar(R["RUN"],  "Bm",  1, "quartal", ["flute", "synth", "guitar"], 0.94),
    bar(R["RUN"],  "Cm", -1, "quartal", ["flute", "synth", "guitar"], 0.94),
    bar(R["TAG"],  "Cm", -1, "quartal", ["flute", "synth", "guitar"], 0.96, True),
    bar(R["RUN"],  "Fm",  1, "quartal", ["flute", "synth", "guitar"], 0.96),
    bar(R["RUN"],  "Em", -1, "quartal", ["flute", "synth", "guitar"], 0.96),
    bar(R["RUN"],  "Bm",  1, "quartal", ["flute", "synth", "guitar"], 0.98),
    bar(R["RUN"],  "Cm", -1, "quartal", ["flute", "synth", "guitar"], 0.98, True),
    bar(R["RUN"],  "Fm",  1, "quartal", ["flute", "synth", "guitar"], 1.00),
    bar(R["TAG"],  "Em", -1, "quartal", ["flute", "synth", "guitar"], 1.00),
    bar(R["RUN"],  "Bm",  1, "quartal", ["flute", "synth", "guitar"], 1.00, True),
    bar(R["LONG"], "Fm",  1, "pad",     ["flute", "synth", "guitar"], 1.00, True),
]

DRUM = {"kick": 36, "snare": 38, "hat": 42, "crash": 49}


# --------------------------------------------------------------------------
# build the events
# --------------------------------------------------------------------------
def emit_bar(b, d, notes, ev, world):
    """Turn one bar's lead notes into instrument events, plus comping / bass / drums."""
    base = b * SPB
    for n in notes:
        p, ln, st = n["p"], n["l"], base + n["s"]
        if d["mode"] == "unison":
            for inst in d["parts"]:
                lo, hi = RANGE[inst]
                ev.append({"inst": inst, "s": st, "l": ln,
                           "ps": [clamp_oct(p, lo, hi)], "v": d["dyn"]})
        elif d["mode"] == "octave":
            for inst in d["parts"]:
                lo, hi = RANGE[inst]
                off = 12 if inst == "flute" else 0
                ev.append({"inst": inst, "s": st, "l": ln,
                           "ps": [clamp_oct(p + off, lo, hi)], "v": d["dyn"]})
        elif d["mode"] in ("lead", "lead2"):
            lp = clamp_oct(p, *RANGE["synth"])
            ev.append({"inst": "synth", "s": st, "l": ln, "ps": [lp], "v": d["dyn"]})
            if d["mode"] == "lead2":
                ev.append({"inst": "flute", "s": st, "l": ln,
                           "ps": [clamp_oct(lp + 12, *RANGE["flute"])], "v": d["dyn"] * 0.8})
        elif d["mode"] == "quartal":
            top = clamp_oct(p, *RANGE["flute"])
            ev.append({"inst": "flute",  "s": st, "l": ln, "ps": [top], "v": d["dyn"]})
            ev.append({"inst": "synth",  "s": st, "l": ln,
                       "ps": [clamp_oct(top - 5, *RANGE["synth"])], "v": d["dyn"] * 0.9})
            ev.append({"inst": "guitar", "s": st, "l": ln,
                       "ps": [clamp_oct(top - 10, *RANGE["guitar"])], "v": d["dyn"] * 0.9})
        elif d["mode"] == "pad":
            r = clamp_oct(p, 60, 79)
            ev.append({"inst": "flute",  "s": st, "l": ln,
                       "ps": [clamp_oct(r + 7, *RANGE["flute"])], "v": d["dyn"] * 0.8})
            ev.append({"inst": "synth",  "s": st, "l": ln,
                       "ps": [clamp_oct(r + 2, *RANGE["synth"])], "v": d["dyn"] * 0.7})
            ev.append({"inst": "guitar", "s": st, "l": ln,
                       "ps": [clamp_oct(r - 3, *RANGE["guitar"])], "v": d["dyn"] * 0.7})

    # guitar quartal stabs under the synth-led bars
    if d["mode"] in ("lead", "lead2"):
        for off in (0, 6):
            cp = clamp_oct(world["root"], 45, 64)
            chord = [clamp_oct(cp + k, *RANGE["guitar"]) for k in (0, 5, 10, 15)]
            ev.append({"inst": "guitar", "s": base + off, "l": 5, "ps": chord, "v": 0.45})

    # bass: root then fifth, one per dotted quarter
    b0 = clamp_oct(world["bass"], *RANGE["bass"])
    ev.append({"inst": "bass", "s": base + 0, "l": 6, "ps": [b0], "v": 0.75})
    ev.append({"inst": "bass", "s": base + 6, "l": 6,
               "ps": [clamp_oct(b0 + 7, *RANGE["bass"])], "v": 0.65})

    # drums: 6/8 groove, intensity grows per soli
    lvl = 1 if b < 16 else (2 if b < 32 else 3)
    for k in range(0, SPB, 2):                       # hats on every eighth
        ev.append({"inst": "drums", "s": base + k, "l": 1, "ps": [DRUM["hat"]],
                   "v": 0.18 if lvl == 1 else (0.26 if lvl == 2 else 0.32)})
    ev.append({"inst": "drums", "s": base + 0, "l": 2, "ps": [DRUM["kick"]],
               "v": 0.5 if lvl == 1 else 0.8})
    if lvl >= 2:
        ev.append({"inst": "drums", "s": base + 6, "l": 2, "ps": [DRUM["snare"]], "v": 0.6})
    if lvl == 3:
        ev.append({"inst": "drums", "s": base + 9, "l": 1, "ps": [DRUM["snare"]], "v": 0.35})
    if d["hit"]:
        ev.append({"inst": "drums", "s": base + 0, "l": 2, "ps": [DRUM["crash"]], "v": 0.55})


def build_events(custom=None):
    """custom = {'yes': [...], 'no': [...], 'transpose': int} or None for the draft lines."""
    ev = []
    cur = WORLDS["Fm"]["root"]
    ptr = 0
    for b, d in enumerate(BARS):
        world = WORLDS[d["w"]]
        notes = []
        if custom:
            line = custom["yes"] if d["dir"] > 0 else custom["no"]
            tp = (world["root"] - WORLDS["Fm"]["root"]) + custom.get("transpose", 0)
            used, guard = 0, 0
            while used < SPB and guard < 400:
                guard += 1
                if ptr >= len(line):
                    ptr = 0
                n = line[ptr]
                ptr += 1
                ln = min(max(1, n["l"]), SPB - used)
                notes.append({"s": used, "l": ln, "p": n["p"] + tp})
                used += ln
        else:
            s = 0
            for length in d["r"]:
                if length > 0:
                    notes.append({"s": s, "l": length, "p": cur})
                    cur += d["dir"] * 5          # stacked fourths
                s += abs(length)
        emit_bar(b, d, notes, ev, world)
    return ev


# --------------------------------------------------------------------------
# MIDI import: read the user's own piano sketch
# --------------------------------------------------------------------------
def _read_vlq(data, pos):
    value = 0
    while True:
        byte = data[pos]
        pos += 1
        value = (value << 7) | (byte & 0x7F)
        if not byte & 0x80:
            return value, pos


def parse_midi(path):
    with open(path, "rb") as f:
        data = f.read()
    if len(data) < 14 or data[0:4] != b"MThd":
        raise ValueError("not a MIDI file: %s" % path)
    ntracks = struct.unpack(">H", data[10:12])[0]
    division = struct.unpack(">H", data[12:14])[0]
    tpq = 480 if division & 0x8000 else division
    pos = 14
    notes = []
    open_notes = {}

    for _ in range(ntracks):
        if pos + 8 > len(data):
            break
        if data[pos:pos + 4] != b"MTrk":
            pos += 8 + struct.unpack(">I", data[pos + 4:pos + 8])[0]
            continue
        tlen = struct.unpack(">I", data[pos + 4:pos + 8])[0]
        pos += 8
        end = min(pos + tlen, len(data))
        time, status = 0, 0

        while pos < end:
            delta, pos = _read_vlq(data, pos)
            time += delta
            if pos >= end:
                break
            byte = data[pos]
            if byte & 0x80:
                status = byte
                pos += 1
            hi, ch = status & 0xF0, status & 0x0F
            if status == 0xFF:                                 # meta event (0xFF & 0xF0 == 0xF0!)
                mtype = data[pos]
                pos += 1
                mlen, pos = _read_vlq(data, pos)
                pos += mlen
            elif hi in (0x90, 0x80):
                pitch = data[pos]
                vel = data[pos + 1] if pos + 1 < end else 0
                pos += 2
                key = (ch, pitch)
                if hi == 0x90 and vel > 0:
                    open_notes.setdefault(key, []).append(time)
                elif open_notes.get(key):
                    start = open_notes[key].pop(0)
                    notes.append({"p": pitch, "s": start, "e": time, "ch": ch})
            elif hi in (0xA0, 0xB0, 0xE0):
                pos += 2
            elif hi in (0xC0, 0xD0):
                pos += 1
            else:
                pos += 1
        pos = end

    return {"notes": notes, "tpq": tpq}


def monophonic(notes):
    """Keep one voice: drop drums, resolve overlaps, merge repeated pitches."""
    mel = [n for n in notes if n["ch"] != 9]
    if not mel:
        raise ValueError("no melodic notes found in that MIDI (drums only?)")
    mel.sort(key=lambda n: (n["s"], -n["p"]))
    out, i = [], 0
    while i < len(mel):
        start = mel[i]["s"]
        group = []
        while i < len(mel) and mel[i]["s"] == start:
            group.append(mel[i])
            i += 1
        group.sort(key=lambda n: -n["p"])
        pick = group[0]
        out.append({"p": pick["p"], "s": start, "e": pick["e"]})
    for k in range(len(out) - 1):
        if out[k]["e"] > out[k + 1]["s"]:
            out[k]["e"] = out[k + 1]["s"]
    out = [n for n in out if n["e"] > n["s"]]
    merged = []
    for n in out:
        if merged and merged[-1]["p"] == n["p"] and merged[-1]["e"] >= n["s"]:
            merged[-1]["e"] = max(merged[-1]["e"], n["e"])
        else:
            merged.append(dict(n))
    return merged


def quantise(mel):
    durs = sorted(n["e"] - n["s"] for n in mel if n["e"] > n["s"])
    if not durs:
        raise ValueError("could not work out the note lengths in that MIDI")
    unit = durs[int(len(durs) * 0.15)] or durs[0]
    unit = max(1, unit)
    return [{"p": n["p"], "l": max(1, int(round((n["e"] - n["s"]) / float(unit))))} for n in mel]


def derive(line, mode):
    pitches = [n["p"] for n in line]
    axis = int(round((min(pitches) + max(pitches)) / 2.0))
    if mode == "retro":
        return [dict(n) for n in reversed(line)]
    if mode == "down4":
        return [{"p": n["p"] - 5, "l": n["l"]} for n in line]
    if mode == "tritone":
        return [{"p": n["p"] + 6, "l": n["l"]} for n in line]
    if mode == "retroinv":
        return [{"p": 2 * axis - n["p"], "l": n["l"]} for n in reversed(line)]
    return [{"p": 2 * axis - n["p"], "l": n["l"]} for n in line]   # default: inv


# --------------------------------------------------------------------------
# MIDI export
# --------------------------------------------------------------------------
TPQ = 480
TICK = TPQ // 4                      # 120 ticks per 16th
CHANNEL = {"flute": 0, "synth": 1, "guitar": 2, "bass": 3, "drums": 9}
PROGRAM = {"flute": 73, "synth": 80, "guitar": 27, "bass": 33}


def vlq(n):
    n = max(0, int(n))
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.insert(0, (n & 0x7F) | 0x80)
        n >>= 7
    return bytes(out)


def _meta_track(bpm, name):
    uspq = int(round(40000000.0 / bpm))          # dotted-quarter bpm -> us per quarter
    data = b"\x00\xFF\x03" + vlq(len(name)) + name.encode("latin-1", "replace")
    data += b"\x00\xFF\x51\x03" + bytes([(uspq >> 16) & 255, (uspq >> 8) & 255, uspq & 255])
    data += b"\x00\xFF\x58\x04\x06\x03\x18\x08"  # 6/8
    data += b"\x00\xFF\x2F\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data


def _inst_track(name, evs, channel, program):
    data = b"\x00\xFF\x03" + vlq(len(name)) + name.encode("latin-1", "replace")
    if program is not None:
        data += b"\x00" + bytes([0xC0 | channel, program])
    items = []
    for e in evs:
        st = e["s"] * TICK
        en = (e["s"] + e["l"]) * TICK
        vel = max(1, min(127, int(round(110 * e["v"]))))
        for p in e["ps"]:
            p = max(0, min(127, p))
            items.append((st, 1, bytes([0x90 | channel, p, vel])))
            items.append((en, 0, bytes([0x80 | channel, p, 0])))
    items.sort(key=lambda x: (x[0], x[1]))
    last = 0
    for tick, _order, msg in items:
        data += vlq(tick - last) + msg
        last = tick
    data += b"\x00\xFF\x2F\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data


def write_midi(path, events, bpm, offset_bars=0):
    if offset_bars:
        shift = offset_bars * SPB
        events = [dict(e, s=e["s"] + shift) for e in events]
    tracks = [_meta_track(bpm, "Yes or No soli")]
    for inst in ("flute", "synth", "guitar", "bass", "drums"):
        evs = [e for e in events if e["inst"] == inst]
        tracks.append(_inst_track(inst.capitalize(), evs,
                                  CHANNEL[inst], PROGRAM.get(inst)))
    body = b"".join(tracks)
    header = b"MThd" + struct.pack(">I", 6) + struct.pack(">HHH", 1, len(tracks), TPQ)
    with open(path, "wb") as f:
        f.write(header + body)
    return path


# --------------------------------------------------------------------------
# MusicXML export
# --------------------------------------------------------------------------
DURS = [(12, "half", 1), (6, "quarter", 1), (4, "quarter", 0),
        (3, "eighth", 1), (2, "eighth", 0), (1, "16th", 0)]


def decompose(length):
    out, rem = [], length
    for d, t, dot in DURS:
        while rem >= d:
            out.append((d, t, dot))
            rem -= d
    if rem > 0:
        out.append((rem, "16th", 0))
    return out


def pitch_xml(p):
    nm = NAMES[p % 12]
    s = "<step>%s</step>" % nm[0]
    if len(nm) > 1:
        s += "<alter>1</alter>"
    return "<pitch>%s<octave>%d</octave></pitch>" % (s, p // 12 - 1)


DRUM_STEP = {36: ("F", 4), 38: ("C", 5), 42: ("G", 5), 49: ("A", 5)}
PARTS = [("P1", "Flute", "flute", "G"), ("P2", "Synth", "synth", "G"),
         ("P3", "Guitar", "guitar", "G"), ("P4", "Bass", "bass", "F"),
         ("P5", "Drums", "drums", "percussion")]


def write_musicxml(path, events, bpm):
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN" '
         '"http://www.musicxml.org/dtds/partwise.dtd">',
         '<score-partwise version="3.0">',
         "<work><work-title>Yes or No 6-8 - three soli</work-title></work>",
         "<part-list>"]
    for pid, pname, _i, _c in PARTS:
        x.append('<score-part id="%s"><part-name>%s</part-name></score-part>' % (pid, pname))
    x.append("</part-list>")

    for pid, pname, inst, clef in PARTS:
        x.append('<part id="%s">' % pid)
        for b in range(len(BARS)):
            x.append('<measure number="%d">' % (b + 1))
            if b == 0:
                x.append("<attributes><divisions>4</divisions><key><fifths>0</fifths></key>"
                         "<time><beats>6</beats><beat-type>8</beat-type></time>"
                         "<clef><sign>%s</sign>%s</clef></attributes>"
                         % (clef, "<line>4</line>" if clef == "F" else ""))
                x.append('<direction placement="above"><sound tempo="%d"/>'
                         "<metronome><beat-unit>quarter</beat-unit><beat-unit-dot/>"
                         "<per-minute>%d</per-minute></metronome></direction>"
                         % (int(round(bpm * 1.5)), bpm))
            base = b * SPB
            evs = [e for e in events if e["inst"] == inst and base <= e["s"] < base + SPB]
            evs.sort(key=lambda e: e["s"])
            pos = 0
            for e in evs:
                s = e["s"] - base
                if s > pos:
                    for d, t, dot in decompose(s - pos):
                        x.append("<note><rest/><duration>%d</duration><type>%s</type>%s</note>"
                                 % (d, t, "<dot/>" if dot else ""))
                pieces = decompose(e["l"])
                for i, (d, t, dot) in enumerate(pieces):
                    x.append("<note>")
                    if inst == "drums":
                        step, oct_ = DRUM_STEP.get(e["ps"][0], ("B", 4))
                        x.append("<unpitched><display-step>%s</display-step>"
                                 "<display-octave>%d</display-octave></unpitched>"
                                 % (step, oct_))
                    else:
                        x.append(pitch_xml(e["ps"][0]))
                    x.append("<duration>%d</duration>" % d)
                    if inst != "drums":
                        if i == 0 and len(pieces) > 1:
                            x.append('<tie type="start"/>')
                        if i > 0:
                            x.append('<tie type="stop"/>')
                    x.append("<type>%s</type>%s</note>" % (t, "<dot/>" if dot else ""))
                pos = max(pos, s + e["l"])
            if pos < SPB:
                for d, t, dot in decompose(SPB - pos):
                    x.append("<note><rest/><duration>%d</duration><type>%s</type>%s</note>"
                             % (d, t, "<dot/>" if dot else ""))
            x.append("</measure>")
        x.append("</part>")
    x.append("</score-partwise>")
    with open(path, "w", encoding="utf-8") as f:
        f.write("".join(x))
    return path


def note_list(events):
    lines = []
    for e in sorted(events, key=lambda e: e["s"]):
        if e["inst"] == "drums":
            continue
        lines.append("bar %d.%d\t%s\t%s\tlen %d"
                     % (e["s"] // SPB + 1, e["s"] % SPB + 1, e["inst"],
                        " ".join(note_name(p) for p in e["ps"]), e["l"]))
    return "\n".join(lines)


# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------
def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Generate the three consecutive soli for 'Yes or No' (6/8).",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bpm", type=int, default=92, help="dotted-quarter tempo (default 92)")
    ap.add_argument("--out", default=None, help="output MIDI path")
    ap.add_argument("--xml", default=None, help="also write MusicXML here")
    ap.add_argument("--notes", default=None, help="also write a text note list here")
    ap.add_argument("--midi-in", default=None, help="your own MIDI sketch to use as the YES line")
    ap.add_argument("--derive", default="inv",
                    choices=["inv", "retro", "down4", "retroinv", "tritone"],
                    help="how the NO line is made from YES (default inv)")
    ap.add_argument("--transpose", type=int, default=0,
                    help="transpose the imported line by N semitones")
    ap.add_argument("--offset-bars", type=int, default=0,
                    help="shift everything N bars later, for dropping into a project")
    ap.add_argument("--at-time", type=float, default=None,
                    help="print the start bar for this timecode (minutes) and exit")
    args = ap.parse_args(argv)

    bar_sec = 2 * (60.0 / args.bpm)          # 6/8 bar = two dotted quarters
    block_sec = bar_sec * len(BARS)

    if args.at_time is not None:
        start = int(round(args.at_time * 60 / bar_sec)) + 1
        print("At dotted-quarter %d bpm a bar is %.3f s." % (args.bpm, bar_sec))
        print("The %d-bar soli block lasts %.2f min." % (len(BARS), block_sec / 60.0))
        print("To hit %g:00 -> start the soli at bar %d (ends bar %d)."
              % (args.at_time, start, start + len(BARS) - 1))
        print("Then run:  python %s --bpm %d --offset-bars %d"
              % (os.path.basename(__file__), args.bpm, start - 1))
        return 0

    custom = None
    if args.midi_in:
        parsed = parse_midi(args.midi_in)
        mel = monophonic(parsed["notes"])
        line = quantise(mel)
        custom = {"yes": line, "no": derive(line, args.derive),
                  "transpose": args.transpose}
        lo = min(n["p"] for n in line)
        hi = max(n["p"] for n in line)
        print("Loaded %s: %d notes, range %s-%s, NO line = %s"
              % (args.midi_in, len(line), note_name(lo), note_name(hi), args.derive))

    events = build_events(custom)
    out = args.out or ("yes_or_no_soli_%d.mid" % args.bpm)
    write_midi(out, events, args.bpm, args.offset_bars)

    counts = {}
    for e in events:
        counts[e["inst"]] = counts.get(e["inst"], 0) + len(e["ps"])
    print("Wrote %s" % out)
    print("  %d bars, dotted-quarter %d bpm, %.1f s (%.2f min)"
          % (len(BARS), args.bpm, block_sec, block_sec / 60.0))
    print("  material: %s" % ("your MIDI (" + args.midi_in + ")" if custom
                              else "built-in quartal draft"))
    if args.offset_bars:
        print("  placed at bar %d of your project" % (args.offset_bars + 1))
    print("  notes: " + ", ".join("%s %d" % (k, counts[k])
                                  for k in ("flute", "synth", "guitar", "bass", "drums")
                                  if k in counts))
    print("  channels: flute 1 / synth 2 / guitar 3 / bass 4 / drums 10 (GM)")

    if args.xml:
        write_musicxml(args.xml, events, args.bpm)
        print("Wrote %s" % args.xml)
    if args.notes:
        with open(args.notes, "w", encoding="utf-8") as f:
            f.write(note_list(events))
        print("Wrote %s" % args.notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
