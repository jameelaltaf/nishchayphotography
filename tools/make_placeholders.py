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

# Warm, film-inspired palettes: (background a, background b, blob colours...)
PALETTES = {
    "goldenhour": ("#3a2418", "#c98f52", ["#f2c48b", "#8c4a24", "#ffe2bb", "#5b2d15"]),
    "ivory":      ("#efe6d8", "#cdbba3", ["#ffffff", "#b39b7c", "#e8dcc8", "#8d7454"]),
    "evergreen":  ("#16231d", "#3f5c4b", ["#8fae99", "#20342a", "#cfe0d4", "#0d1713"]),
    "dusk":       ("#241d2e", "#6a5a7d", ["#b7a5c8", "#33263f", "#e3d7ee", "#150f1c"]),
    "linen":      ("#e6ded2", "#c3b5a1", ["#fdfbf7", "#a08d74", "#dccfbb", "#7d6a52"]),
    "ember":      ("#2b1512", "#a4472f", ["#e59a72", "#6d2a1c", "#ffd6b8", "#3d1a13"]),
    "slate":      ("#1b1e22", "#4d565f", ["#9aa5b0", "#272c32", "#d5dbe1", "#101317"]),
    "blush":      ("#f0dfd8", "#d4a898", ["#ffffff", "#b07f6d", "#f7e9e3", "#8a5f50"]),
}

# name -> (width, height, palette, grain)
SPECS = [
    # Home hero / feature imagery
    ("hero-01",       2400, 1350, "goldenhour"),
    ("hero-02",       2400, 1350, "evergreen"),
    ("hero-03",       2400, 1350, "dusk"),
    ("feature-wide",  2000, 1000, "linen"),
    # Portfolio - weddings
    ("wedding-01", 1600, 1067, "goldenhour"),
    ("wedding-02", 1067, 1600, "ivory"),
    ("wedding-03", 1600, 1067, "evergreen"),
    ("wedding-04", 1067, 1600, "blush"),
    ("wedding-05", 1600, 1067, "dusk"),
    ("wedding-06", 1200, 1200, "linen"),
    # Portfolio - engagements / couples
    ("engagement-01", 1600, 1067, "ember"),
    ("engagement-02", 1067, 1600, "goldenhour"),
    ("engagement-03", 1200, 1200, "evergreen"),
    # Portfolio - portraits
    ("portrait-01", 1067, 1600, "slate"),
    ("portrait-02", 1067, 1600, "ivory"),
    ("portrait-03", 1200, 1200, "blush"),
    ("portrait-04", 1600, 1067, "linen"),
    # Portfolio - family / newborn
    ("family-01", 1600, 1067, "linen"),
    ("family-02", 1067, 1600, "blush"),
    ("family-03", 1200, 1200, "goldenhour"),
    # Portfolio - commercial / brand
    ("commercial-01", 1600, 1067, "slate"),
    ("commercial-02", 1200, 1200, "dusk"),
    ("commercial-03", 1067, 1600, "ember"),
    # About / team
    ("about-01", 1200, 1500, "ivory"),
    ("about-02", 1600, 1067, "evergreen"),
    ("team-01",  1000, 1250, "linen"),
    ("team-02",  1000, 1250, "slate"),
    ("team-03",  1000, 1250, "blush"),
    # Journal
    ("journal-01", 1600, 1000, "goldenhour"),
    ("journal-02", 1600, 1000, "dusk"),
    ("journal-03", 1600, 1000, "evergreen"),
    # Social share card
    ("og-cover", 1200, 630, "goldenhour"),
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
