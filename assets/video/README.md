# Hero video

Drop a web-encoded MP4 here and point `data-hero-src` at it in
`src/pages/index.html`, then rebuild.

Encode it small — this loads on every homepage visit:

```bash
ffmpeg -i source.mov -t 12 -an \
  -vf "scale=1920:-2,fps=25" \
  -c:v libx264 -crf 26 -preset slow -movflags +faststart \
  hero.mp4
```

- **Silent** (`-an`): browsers block autoplay with sound, and the hero is muted.
- **Short** (`-t 12`): it loops, so a long clip only costs bandwidth.
- **Under ~4 MB**: above that the stills are the better experience on mobile.
- `+faststart` puts the index first so playback can begin while downloading.

The `<video>` keeps `hero-01.jpg` as its poster, and if the file is missing or
autoplay is refused the still crossfade carries on — nothing breaks.
