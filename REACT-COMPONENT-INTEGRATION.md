# Integrating the supplied React components

Answering the integration briefs for `3d-carousel.tsx` and
`3d-gallery-photography.tsx` against this repository. Section 1 applies to
both; the answer has not changed between them.

## 1. Does the codebase support it? No.

| Requirement | Status here |
| --- | --- |
| shadcn project structure | Absent — no `components.json`, no `components/` directory |
| Tailwind CSS | Absent — one hand-written stylesheet, `assets/css/style.css` |
| TypeScript | Absent — no `tsconfig.json`, no `.ts`/`.tsx` files |
| React | Absent — no `package.json`, no node_modules, no bundler |
| framer-motion | Absent |
| three, @react-three/fiber, @react-three/drei | Absent |

This is a static site: HTML, one CSS file, one vanilla JS file, assembled by a
stdlib-only Python script. There is no npm install step and nothing to build.

**Default path for components: there isn't one.** No component directory exists
in any form, because the site has no component system.

## 2. Why `/components/ui` matters (if you do migrate)

It is not cosmetic. The shadcn CLI writes every component it generates to the
path recorded in `components.json` under `aliases.ui`, which defaults to
`@/components/ui`. Three things break if the folder is somewhere else:

- **The CLI writes to the wrong place.** `npx shadcn@latest add button` drops
  files at the configured alias. A mismatch scatters components across the tree.
- **Imports stop resolving.** Every shadcn component and every snippet you paste
  from the ecosystem imports siblings as `@/components/ui/<name>`. The demo file
  in your brief does exactly this: `import { ThreeDPhotoCarousel } from
  "@/components/ui/3d-carousel"`. That alias must map to a real directory via
  `tsconfig.json` `paths` and `components.json`.
- **Updates get lost.** Re-running `add` for an upgraded component overwrites by
  path. Non-standard locations leave stale duplicates behind.

The convention also separates *primitives* (`components/ui/`) from *composed
features* (`components/`), which is what keeps a shadcn codebase navigable.

## 3. Setting the project up from scratch

The site would need to become a React app first. Fastest correct route:

```bash
# 1. Next.js with TypeScript and Tailwind already wired
npx create-next-app@latest nishchay-web
#    -> TypeScript: Yes
#    -> Tailwind CSS: Yes
#    -> App Router: Yes
#    -> import alias: Yes, keep the default @/*

cd nishchay-web

# 2. shadcn — creates components.json and components/ui, and writes the
#    CSS variables and tailwind config the components expect
npx shadcn@latest init

# 3. The component's only runtime dependency
npm install framer-motion                       # for 3d-carousel
npm install three @react-three/fiber @react-three/drei   # for 3d-gallery-photography
```

Then create `components/ui/3d-carousel.tsx` and paste the component in.

If you are adding to an *existing* React project instead, the pieces are:

```bash
npm install -D typescript @types/react @types/node   # if not already TS
npm install -D tailwindcss @tailwindcss/postcss postcss
npx shadcn@latest init
npm install framer-motion
```

## 4. Things to fix in the component before shipping it

Reviewed as given — these are real, not stylistic:

- **`bg-mauve-dark-2` is not a stock Tailwind class.** It comes from Radix
  Colors. Without `@radix-ui/colors` wired into your Tailwind theme the class
  silently resolves to nothing and the backdrop renders transparent.
- **Images are random placeholders.** `https://picsum.photos/200/300?<keyword>`
  serves unrelated stock photos, and the keyword list is city/architecture
  terms. These need replacing with real gallery images.
- **`layoutId={`img-container-${activeImg}`}`** on the overlay has no matching
  source element, so that shared-layout transition never pairs.
- **`console.log("Cards loaded:", cards)`** is left in a `useEffect`.
- **Conflicting rotation.** The wrapper sets both `transform` (from
  `useTransform`) and `rotateY: rotation` on the same element; framer-motion
  will fight itself over the transform property.
- **`handleClick` prop is typed `(imgUrl, index) => void`** but implemented as
  `(imgUrl) => void`. Assignable, so it compiles, but the index is unused.
- **No `prefers-reduced-motion` handling.** Continuous 3D rotation with blur is
  exactly what that media query exists to suppress.
- **Drag-only, so keyboard users cannot rotate it.** That fails WCAG 2.1
  Success Criterion 2.1.1 (Keyboard). This site currently targets AA.
- **`memo()` without a `displayName`** will trip `react/display-name` under the
  default Next.js ESLint config.

## 5. What was built instead

A 3D carousel in the existing stack — CSS 3D transforms plus vanilla JS, in
`assets/js/main.js` and `assets/css/style.css`. Same effect, no dependencies,
and it addresses the gaps above:

- Pointer drag with inertia, plus prev/next buttons and arrow-key stepping
- Focusable ring with a live region announcing position and caption
- `prefers-reduced-motion` disables drift and inertia; stepping still works
- Faces dim by their angle from the front as a depth cue
- Only animates while on screen (IntersectionObserver) and while not hovered
- Falls back to a horizontally scrollable row with no JavaScript
- Selecting a frame opens the existing shared lightbox

## 4b. Review of `3d-gallery-photography.tsx`

WebGL rather than CSS, so the review is separate:

- **The wheel handler calls `preventDefault()`, trapping page scroll.** Once the
  canvas is under the cursor the visitor cannot scroll past the gallery. It also
  binds to `document.querySelector('canvas')` — the *first* canvas on the page,
  not necessarily this one.
- **Arrow keys are bound to `document`.** They are hijacked page-wide, which
  breaks ordinary keyboard scrolling everywhere on the page, not just here.
- **`setScrollVelocity` is called inside `useFrame`.** A state setter every
  frame forces a React re-render every frame. That is also the only reason the
  planes appear to move at all: `useFrame` mutates `planesData.current` but
  never writes to the meshes, so positions only update because the whole
  component re-renders. Velocity belongs in a ref, and positions should be
  written to `mesh.position` directly.
- **`useTexture` suspends, and the demo has no `<Suspense>` boundary**, so it
  throws on first render.
- **`speed`, `zSpacing`, `visibleCount` and `falloff` are accepted but never
  forwarded** from the default export to `GalleryScene`. Every prop the demo
  passes is silently ignored.
- **`textureSize()` is GLSL ES 3.00.** It fails to compile on a WebGL1 context,
  and the WebGL check in the component only tests for `webgl`, not `webgl2`.
- **The camera sits at `z = 0` inside the plane field**, so roughly half the
  planes are behind it and still processed each frame.
- **No `prefers-reduced-motion` handling**; autoplay always runs.
- `const worldZ` is declared and unused inside `useFrame`.

## 5. What was built instead

### Depth gallery (portfolio page)

An infinite corridor of photographs in CSS 3D — perspective does the scaling,
and depth drives opacity, blur and brightness so frames resolve as they
approach. Categories for weddings, newborn & family, portraits and brand, with
short sets repeated so the corridor stays full.

It differs from the component above where that component is wrong:

- **Page scroll is never hijacked.** Motion comes from drift, drag, buttons and
  arrow keys, and arrow keys are bound to the stage, not to `document`.
- **Drift pauses on hover and focus**, otherwise frames are a moving target and
  cannot reliably be clicked.
- Positions are written straight to the elements in one rAF loop; there is no
  per-frame re-render.
- Runs only while on screen, and blur is quantised so the filter is not rebuilt
  every frame.
- Static under `prefers-reduced-motion`.
- The source list stays in the DOM as an ordinary grid, so the section works
  with no JavaScript.
- Selecting a frame opens the shared lightbox.

The one thing genuinely lost is the cloth/flag vertex shader. That needs WebGL,
and it is a subtle ripple most visitors would never notice.

### Other 3D effects, same approach

The rest of the depth work follows the patterns a component registry like
21st.dev packages up, written against this stack instead:

| Effect | Where | Notes |
| --- | --- | --- |
| Pointer tilt | Service, journal and package cards | Max 5&deg;; pointer-only, one update per frame |
| Entry lift in 3D | Cards and figures | `rotateX` unfolds to flat as the block enters |
| Hero parallax | Homepage hero | Pointer offset plus scroll, stops once off screen |

Entry lift, hover and tilt are composed through CSS custom properties inside a
**single** `transform`. Declaring them as separate rules is the usual way these
effects break: three declarations fight over one property and the tilt cancels
the scroll animation. All three are disabled under `prefers-reduced-motion`,
and tilt is additionally gated on `(hover: hover) and (pointer: fine)` so it
never runs on touch.

**If you want the React version instead**, section 3 is the path — but it means
rebuilding 13 pages, adding a build step and a dependency tree to a site whose
main virtue right now is that it has neither. Worth doing only if you want the
whole site to become a React app for other reasons.
