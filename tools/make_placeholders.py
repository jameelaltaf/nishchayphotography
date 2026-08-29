#!/usr/bin/env python3
"""Generate lightweight SVG placeholder images for the studio site.

These stand in for real photography until the studio's own images are
dropped into assets/img/. Each file is an abstract, film-toned gradient
that reads correctly in a gallery grid without pretending to be a photo.

Usage:  python3 tools/make_placeholders.py
"""

import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")

# Greyscale ramps, ordered dark to light: (background a, background b, blobs...)
PALETTES = {
    "onyx":     ("#0a0a0a", "#3d3d3d", ["#6b6b6b", "#161616", "#8f8f8f", "#000000"]),
    "graphite": ("#161616", "#4e4e4e", ["#7d7d7d", "#232323", "#a0a0a0", "#0a0a0a"]),
    "slate":    ("#1f1f1f", "#5c5c5c", ["#8a8a8a", "#2d2d2d", "#adadad", "#111111"]),
    "ash":      ("#2e2e2e", "#737373", ["#9c9c9c", "#3d3d3d", "#c0c0c0", "#1c1c1c"]),
    "smoke":    ("#454545", "#8c8c8c", ["#b0b0b0", "#565656", "#d2d2d2", "#2e2e2e"]),
    "silver":   ("#5e5e5e", "#a3a3a3", ["#c4c4c4", "#6f6f6f", "#e0e0e0", "#454545"]),
    "pearl":    ("#767676", "#b8b8b8", ["#d8d8d8", "#888888", "#efefef", "#5c5c5c"]),
    "paper":    ("#8a8a8a", "#c9c9c9", ["#e6e6e6", "#9c9c9c", "#f7f7f7", "#6f6f6f"]),
}

# name -> (width, height, palette, grain)
SPECS = [
    # Home hero / feature imagery
    ("hero-01",       2400, 1350, "graphite"),
    ("hero-02",       2400, 1350, "slate"),
    ("hero-03",       2400, 1350, "onyx"),
    ("feature-wide",  2000, 1000, "paper"),
    # Portfolio - weddings
    ("wedding-01", 1600, 1067, "graphite"),
    ("wedding-02", 1067, 1600, "pearl"),
    ("wedding-03", 1600, 1067, "slate"),
    ("wedding-04", 1067, 1600, "silver"),
    ("wedding-05", 1600, 1067, "onyx"),
    ("wedding-06", 1200, 1200, "paper"),
    # Portfolio - engagements / couples
    ("engagement-01", 1600, 1067, "ash"),
    ("engagement-02", 1067, 1600, "graphite"),
    ("engagement-03", 1200, 1200, "slate"),
    # Portfolio - portraits
    ("portrait-01", 1067, 1600, "smoke"),
    ("portrait-02", 1067, 1600, "pearl"),
    ("portrait-03", 1200, 1200, "silver"),
    ("portrait-04", 1600, 1067, "paper"),
    # Portfolio - family / newborn
    ("family-01", 1600, 1067, "paper"),
    ("family-02", 1067, 1600, "silver"),
    ("family-03", 1200, 1200, "graphite"),
    # Portfolio - commercial / brand
    ("commercial-01", 1600, 1067, "smoke"),
    ("commercial-02", 1200, 1200, "onyx"),
    ("commercial-03", 1067, 1600, "ash"),
    # About / team
    ("about-01", 1200, 1500, "pearl"),
    ("about-02", 1600, 1067, "slate"),
    ("team-01",  1000, 1250, "paper"),
    ("team-02",  1000, 1250, "smoke"),
    ("team-03",  1000, 1250, "silver"),
    # Journal
    ("journal-01", 1600, 1000, "graphite"),
    ("journal-02", 1600, 1000, "onyx"),
    ("journal-03", 1600, 1000, "slate"),
    # Social share card
    ("og-cover", 1200, 630, "graphite"),
]


def blob(rng, w, h, colour):
    cx = rng.uniform(-0.15, 1.15) * w
    cy = rng.uniform(-0.15, 1.15) * h
    r = rng.uniform(0.25, 0.62) * max(w, h)
    ry = r * rng.uniform(0.55, 1.0)
    rot = rng.uniform(0, 180)
    op = rng.uniform(0.35, 0.72)
    return (
        f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{r:.0f}" ry="{ry:.0f}" '
        f'transform="rotate({rot:.0f} {cx:.0f} {cy:.0f})" fill="{colour}" '
        f'opacity="{op:.2f}"/>'
    )


def build(name, w, h, palette_name):
    rng = random.Random(name)          # deterministic: same file every run
    top, bottom, blobs = PALETTES[palette_name]
    angle = rng.uniform(0, 360)
    x1 = 50 + 50 * math.cos(math.radians(angle))
    y1 = 50 + 50 * math.sin(math.radians(angle))
    x2 = 100 - x1
    y2 = 100 - y1

    shapes = "".join(blob(rng, w, h, c) for c in rng.sample(blobs, 3))

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="{x1:.1f}%" y1="{y1:.1f}%" x2="{x2:.1f}%" y2="{y2:.1f}%">
      <stop offset="0%" stop-color="{top}"/>
      <stop offset="100%" stop-color="{bottom}"/>
    </linearGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="{max(w, h) * 0.075:.0f}"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <radialGradient id="vig" cx="50%" cy="50%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.42"/>
    </radialGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  <g filter="url(#soft)">{shapes}</g>
  <rect width="{w}" height="{h}" filter="url(#grain)" opacity="0.10" style="mix-blend-mode:overlay"/>
  <rect width="{w}" height="{h}" fill="url(#vig)"/>
</svg>
'''


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, w, h, palette in SPECS:
        path = os.path.join(OUT, name + ".svg")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(name, w, h, palette))
    print(f"Wrote {len(SPECS)} placeholder images to {OUT}")


if __name__ == "__main__":
    main()
