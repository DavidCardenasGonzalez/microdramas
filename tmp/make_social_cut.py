import re
import subprocess
from pathlib import Path

FFMPEG = r"C:\ComfyUI\.venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ROOT = Path(r"C:\Users\AMD RYZEN\OneDrive\Documentos\ChatGPT\microdramas\productions\la-novia-del-vampiro")
INPUTS = [
    ROOT / "media/higgsfield/EP001-REBUILD-C01-v1.mp4",
    ROOT / "media/higgsfield/EP001-REBUILD-C02-v1.mp4",
    ROOT / "media/higgsfield/EP001-REBUILD-C03-v3.mp4",
]
OUTPUT = ROOT / "review-drafts/EP001-REBUILD-C01-C03-social-preview-v1.mp4"
SPEED = 1.10


def detect(path):
    proc = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path), "-vn", "-af",
         "silencedetect=noise=-38dB:d=0.35", "-f", "null", "NUL"],
        capture_output=True, text=True, check=False,
    )
    log = proc.stderr
    dm = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", log)
    if not dm:
        raise RuntimeError(f"Could not read duration for {path.name}: {log[-1000:]}")
    duration = int(dm.group(1)) * 3600 + int(dm.group(2)) * 60 + float(dm.group(3))
    silences, start = [], None
    for line in log.splitlines():
        sm = re.search(r"silence_start:\s*([0-9.]+)", line)
        em = re.search(r"silence_end:\s*([0-9.]+)", line)
        if sm:
            start = float(sm.group(1))
        elif em and start is not None:
            silences.append((start, float(em.group(1))))
            start = None
    if start is not None:
        silences.append((start, duration))

    merged = []
    for s, e in silences:
        if merged and s - merged[-1][1] <= 0.08:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))

    cuts = []
    for s, e in merged:
        if e - s < 1.5:
            continue
        if s < 0.05:
            cuts.append((s, max(s, e - 0.35)))
        elif duration - e < 0.10 and path.name == "EP001-REBUILD-C03-v3.mp4":
            # Keep a short beat after Lucian's line and a brief piece of Eleanor's
            # final reaction; remove the long dead hold around and after it.
            cuts.append((min(e, s + 0.45), 20.0))
            cuts.append((21.65, e))
        elif duration - e < 0.10:
            cuts.append((min(e, s + 0.45), e))
        else:
            cuts.append((min(e, s + 0.35), max(s, e - 0.35)))

    ranges, cursor = [], 0.0
    for s, e in cuts:
        if s > cursor + 0.015:
            ranges.append((cursor, s))
        cursor = max(cursor, e)
    if duration > cursor + 0.015:
        ranges.append((cursor, duration))
    if not ranges:
        ranges = [(0.0, duration)]
    return duration, merged, cuts, ranges


all_ranges = []
for idx, path in enumerate(INPUTS):
    dur, silences, cuts, ranges = detect(path)
    all_ranges.extend((idx, a, b) for a, b in ranges)
    saved = sum(e - s for s, e in cuts)
    print(f"{path.name}: {dur:.2f}s; trimmed {saved:.2f}s; kept {dur-saved:.2f}s before speed; cuts={len(cuts)}")

args = [FFMPEG, "-y"]
for p in INPUTS:
    args += ["-i", str(p)]
filters, concat_inputs = [], []
for n, (src, start, end) in enumerate(all_ranges):
    filters.append(f"[{src}:v]trim=start={start:.4f}:end={end:.4f},setpts=(PTS-STARTPTS)/{SPEED},setsar=1[v{n}]")
    filters.append(f"[{src}:a]atrim=start={start:.4f}:end={end:.4f},asetpts=PTS-STARTPTS,atempo={SPEED}[a{n}]")
    concat_inputs.append(f"[v{n}][a{n}]")
filters.append("".join(concat_inputs) + f"concat=n={len(all_ranges)}:v=1:a=1[v][a]")
args += ["-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "20", "-preset", "fast", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(OUTPUT)]
subprocess.run(args, check=True)
print(f"OUTPUT={OUTPUT}")
