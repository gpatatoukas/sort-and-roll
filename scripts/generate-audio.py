"""Original Sort and Roll audio. Python stdlib synthesis + ffmpeg MP3 encoding.
Run from the project root. No downloaded recordings, samples or licensed tracks.
"""
from pathlib import Path
import array
import math
import random
import subprocess
import tempfile
import wave

RATE = 24000
TAU = math.tau
DEST = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
DEST.mkdir(parents=True, exist_ok=True)

def write(path, channels, peak=.7):
    maximum = max(abs(x) for channel in channels for x in channel) or 1
    scale = peak / maximum
    pcm = array.array('h', (round(max(-1, min(1, channel[i] * scale)) * 32767) for i in range(len(channels[0])) for channel in channels))
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(len(channels)); f.setsampwidth(2); f.setframerate(RATE); f.writeframes(pcm.tobytes())

def add(bufs, start, duration, sample, gain=1, pan=0, wrap=False):
    offset = round(start * RATE)
    for i in range(round(duration * RATE)):
        index = offset + i
        if wrap: index %= len(bufs[0])
        if index >= len(bufs[0]): break
        v = sample(i / RATE) * gain
        if len(bufs) == 1: bufs[0][index] += v
        else:
            bufs[0][index] += v * math.sqrt((1 - pan) / 2)
            bufs[1][index] += v * math.sqrt((1 + pan) / 2)

def note(freq, decay=1.5):
    def sample(t):
        attack = 1 - math.exp(-t / .009)
        return attack * (math.sin(TAU * freq * t) * math.exp(-t / decay) + .18 * math.sin(TAU * freq * 2 * t) * math.exp(-t / (decay * .35)) + .045 * math.sin(TAU * freq * 3.98 * t) * math.exp(-t / .09))
    return sample

def hz(midi): return 440 * 2 ** ((midi - 69) / 12)

# Tideglass: 64 beats at 72 BPM; a circular, stereo felt-key/pad arrangement.
beat = 60 / 72
length = 64 * beat
music = [array.array('f', [0]) * round(RATE * length) for _ in range(2)]
chords = [[50, 57, 61, 64, 69], [43, 50, 54, 57, 62], [47, 54, 57, 62, 66], [45, 52, 57, 59, 64]]
for bar in range(8):
    chord = chords[bar % 4]
    for voice, midi in enumerate(chord):
        freq = hz(midi)
        def pad(t, freq=freq):
            env = math.sin(math.pi * t / (10 * beat)) ** 2
            return env * (math.sin(TAU * freq * t) + .25 * math.sin(TAU * freq * 1.002 * t))
        add(music, bar * 8 * beat, 10 * beat, pad, .06, (voice - 2) * .24, True)
    for j, step in enumerate([0, 1.5, 3.5, 5, 6.5]):
        midi = chord[[2, 4, 3, 1, 4][j]] + 12
        add(music, (bar * 8 + step) * beat, 4.5, note(hz(midi), 1.35), .18 if j == 0 else .12, (-1 if j % 2 else 1) * .35, True)
# Quiet, sparse melody; rests allow space for the pouring effects.
for start, midi in [(4, 74), (7, 73), (12, 69), (15, 66), (20, 74), (23, 78), (28, 76), (31, 73), (36, 74), (39, 81), (44, 78), (47, 74), (52, 73), (55, 69), (60, 71), (63, 69)]:
    add(music, start * beat, 4, note(hz(midi), 1.9), .105, .12, True)
# Circular room reflections keep the loop tail continuous.
for channel in music:
    dry = channel[:]
    for delay, gain in [(round(RATE * .19), .16), (round(RATE * .41), .09)]:
        for i, value in enumerate(dry): channel[(i + delay) % len(channel)] += value * gain
with tempfile.TemporaryDirectory() as tmp:
    wav = Path(tmp) / 'tideglass.wav'
    write(wav, music, .65)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '112k', str(DEST / 'tideglass.mp3')], check=True)

def effect(name, duration, build, peak=.55):
    buffers = [array.array('f', [0]) * round(RATE * duration)]
    build(buffers)
    write(DEST / f'{name}.wav', buffers, peak)

effect('select', .16, lambda b: add(b, 0, .16, lambda t: math.sin(TAU * (950 * t - 1700 * t * t)) * (1 - math.exp(-t / .002)) * math.exp(-t / .026)))
effect('settle', .25, lambda b: add(b, 0, .25, note(hz(81), .07), .6))
effect('invalid', .15, lambda b: add(b, 0, .15, lambda t: math.sin(TAU * 190 * t) * (1 - math.exp(-t / .003)) * math.exp(-t / .026)), .35)
def pouring(b):
    rng = random.Random(24018)
    low = 0
    noise = []
    for i in range(round(.3 * RATE)):
        low = .88 * low + .12 * rng.uniform(-1, 1)
        noise.append(low)
    add(b, 0, .3, lambda t: noise[min(len(noise)-1, int(t * RATE))] * math.sin(math.pi * t / .3) ** 2, .5)
    for j in range(8):
        freq = rng.uniform(420, 1400)
        add(b, .01 + j * .029, .07, lambda t, f=freq: math.sin(TAU * (f * t + 700 * t*t)) * (1-math.exp(-t/.002)) * math.exp(-t/.012), .2)
effect('pour', .35, pouring, .45)
def bell(b, notes, spacing):
    for i, midi in enumerate(notes): add(b, i * spacing, .7, note(hz(midi), .19), .6 if i == 0 else .45)
effect('bottle', .95, lambda b: bell(b, [76, 81], .12))
effect('win', 1.6, lambda b: bell(b, [74, 78, 81, 86], .16), .65)
effect('tool', .65, lambda b: bell(b, [81, 78, 86], .08), .45)
print('Generated Tideglass and seven original sound effects.')
