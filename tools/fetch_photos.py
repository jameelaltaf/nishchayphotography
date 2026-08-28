#!/usr/bin/env python3
"""Replace the placeholder art with real photographs from Pexels.

This sandbox cannot reach the internet, so run this on your own machine.
It downloads a categorised set of high-resolution images into assets/img/,
repoints every reference from .svg to .jpg, and writes a credits file.

    1. Get a free API key at https://www.pexels.com/api/
    2. python3 tools/fetch_photos.py --key YOUR_KEY
    3. python3 build.py

Standard library only - no pip install required.

    --key      Pexels API key (or set the PEXELS_API_KEY env var)
    --dry-run  Show what would be downloaded, write nothing
    --only     Comma-separated filenames to refresh, e.g. hero-01,wedding-02
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
API = "https://api.pexels.com/v1/search"

# filename -> (search query, orientation). Queries are deliberately specific:
# "wedding" alone returns rings and cake, not photographs of a day.
PLAN = {
    "hero-01":       ("wedding couple golden hour outdoor", "landscape"),
    "hero-02":       ("outdoor wedding ceremony forest", "landscape"),
    "hero-03":       ("wedding reception evening lights", "landscape"),
    "feature-wide":  ("bride and groom walking", "landscape"),

    "wedding-01":    ("wedding ceremony aisle guests", "landscape"),
    "wedding-02":    ("bride getting ready window light", "portrait"),
    "wedding-03":    ("wedding reception dancing", "landscape"),
    "wedding-04":    ("bridal party laughing", "portrait"),
    "wedding-05":    ("bride and groom blue hour", "landscape"),
    "wedding-06":    ("mehndi henna hands bride", "square"),

    "engagement-01": ("engaged couple embracing outdoors", "landscape"),
    "engagement-02": ("couple walking forest trail", "portrait"),
    "engagement-03": ("couple field countryside", "square"),

    "portrait-01":   ("studio portrait dramatic lighting", "portrait"),
    "portrait-02":   ("graduation portrait young woman", "portrait"),
    "portrait-03":   ("maternity portrait pregnant woman", "square"),
    "portrait-04":   ("professional headshot neutral background", "landscape"),

    "family-01":     ("family outdoors park autumn", "landscape"),
    "family-02":     ("mother and child at home", "portrait"),
    "family-03":     ("newborn baby sleeping", "square"),

    "commercial-01": ("product still life studio", "landscape"),
    "commercial-02": ("business team headshots office", "square"),
    "commercial-03": ("restaurant interior warm", "portrait"),

    "about-01":      ("photographer holding camera", "portrait"),
    "about-02":      ("photographer working on location", "landscape"),
    "team-01":       ("portrait man photographer", "portrait"),
    "team-02":       ("portrait woman photographer", "portrait"),
    "team-03":       ("portrait person smiling studio", "portrait"),

    "journal-01":    ("winter lake shoreline", "landscape"),
    "journal-02":    ("heritage venue interior evening", "landscape"),
    "journal-03":    ("green countryside overcast", "landscape"),

    "og-cover":      ("wedding couple silhouette sunset", "landscape"),
}


def search(key, query, orientation):
    """Return the first usable photo for a query, or None."""
    # Pexels has no 'square' orientation; ask for portrait and crop in CSS.
    api_orientation = "portrait" if orientation == "square" else orientation
    params = urllib.parse.urlencode({
        "query": query,
        "orientation": api_orientation,
        "per_page": 1,
        "size": "large",
    })
    req = urllib.request.Request(API + "?" + params, headers={"Authorization": key})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            sys.exit("Pexels rejected the API key (401). Check --key.")
        if e.code == 429:
            sys.exit("Pexels rate limit hit (429). Wait an hour and re-run with --only.")
        raise
    photos = data.get("photos") or []
    return photos[0] if photos else None


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "nishchay-site/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as fh:
        fh.write(r.read())


def repoint_references(names):
    """Point the site at .jpg for every image actually downloaded."""
    changed = 0
    targets = []
    for base, _, files in os.walk(os.path.join(ROOT, "src")):
        targets += [os.path.join(base, f) for f in files if f.endswith(".html")]

    for path in targets:
        with open(path, encoding="utf-8") as fh:
            text = original = fh.read()
        for name in names:
            text = text.replace("/assets/img/%s.svg" % name, "/assets/img/%s.jpg" % name)
        if text != original:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(text)
            changed += 1
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=os.environ.get("PEXELS_API_KEY"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", default="")
    args = ap.parse_args()

    if not args.key and not args.dry_run:
        sys.exit("Need a Pexels API key: --key KEY, or set PEXELS_API_KEY.\n"
                 "Get one free at https://www.pexels.com/api/")

    wanted = [n.strip() for n in args.only.split(",") if n.strip()] or list(PLAN)
    unknown = [n for n in wanted if n not in PLAN]
    if unknown:
        sys.exit("Unknown image name(s): %s" % ", ".join(unknown))

    credits, done, failed = [], 0, []

    for name in wanted:
        query, orientation = PLAN[name]
        if args.dry_run:
            print("  would fetch  %-16s <- %s (%s)" % (name, query, orientation))
            continue

        photo = search(args.key, query, orientation)
        if not photo:
            print("  NO RESULT    %-16s (%s)" % (name, query))
            failed.append(name)
            continue

        url = photo["src"].get("large2x") or photo["src"]["large"]
        path = os.path.join(IMG, name + ".jpg")
        try:
            download(url, path)
        except Exception as exc:
            print("  FAILED       %-16s %s" % (name, exc))
            failed.append(name)
            continue

        size = os.path.getsize(path) // 1024
        print("  downloaded   %-16s %4d KB  by %s" % (name, size, photo["photographer"]))
        credits.append((name, photo["photographer"], photo["url"]))
        done += 1

    if args.dry_run:
        print("\n%d images planned. Re-run without --dry-run." % len(wanted))
        return

    if credits:
        names = [c[0] for c in credits]
        touched = repoint_references(names)
        with open(os.path.join(ROOT, "PHOTO-CREDITS.md"), "w", encoding="utf-8") as fh:
            fh.write("# Photo credits\n\n")
            fh.write("Placeholder photography from Pexels, free to use under the\n")
            fh.write("[Pexels licence](https://www.pexels.com/license/). Replace these\n")
            fh.write("with the studio's own work before launch.\n\n")
            for name, who, link in sorted(credits):
                fh.write("- `%s.jpg` — %s ([Pexels](%s))\n" % (name, who, link))
        print("\n%d downloaded, %d source files repointed to .jpg" % (done, touched))
        print("Wrote PHOTO-CREDITS.md")

    if failed:
        print("\nFailed: %s" % ", ".join(failed))
        print("Re-run just those with:  --only %s" % ",".join(failed))

    print("\nNext:  python3 build.py  &&  python3 -m http.server 8000")


if __name__ == "__main__":
    main()
