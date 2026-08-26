# Nishchay Photography

A static marketing website for a Canadian (Toronto / GTA) photography studio.
No frameworks, no npm, no build dependencies — plain HTML, CSS and vanilla JS,
assembled by a ~120-line Python script that only uses the standard library.

The site is deliberately dependency-free because a photography site is a
long-lived asset that a non-developer has to keep alive. There is nothing here
to `npm audit`, nothing to upgrade, and nothing that breaks in three years.

---

## Quick start

```bash
python3 build.py            # regenerate the HTML at the repo root
python3 -m http.server 8000 # preview at http://localhost:8000
```

That's the whole toolchain.

## Project layout

```
src/
  partials/
    base.html      Document shell: meta, Open Graph, fonts, studio JSON-LD
    header.html    Site header + primary navigation
    footer.html    Closing CTA, footer columns, legal strip
  pages/           One file per page, with a small front-matter block
assets/
  css/style.css    The entire design system (~500 lines, custom properties)
  js/main.js       Nav, scroll reveal, filters, lightbox, accordion, forms
  img/             Placeholder imagery — replace with real photographs
tools/
  make_placeholders.py   Regenerates the abstract SVG placeholders
build.py           The generator
```

**Edit `src/`, never the generated HTML at the root.** Root-level `.html` files
and `sitemap.xml` are build output and are overwritten on every build.

### Adding a page

Create `src/pages/your-page.html`:

```
title: Page title, under 60 characters
description: Meta description, roughly 120-155 characters
output: your-page/index.html
---
<section class="section">
  <div class="wrap">…</div>
</section>
```

Optional front-matter keys: `og_image`, `og_type`, `body_class`, `robots`.
Add the page to `SITEMAP_PRIORITY` in `build.py` if it should appear in
`sitemap.xml`. Navigation lives in `src/partials/header.html` and
`src/partials/footer.html`; the builder marks the matching link
`aria-current="page"` automatically.

---

## Replacing the placeholder photographs

Everything in `assets/img/` is an abstract SVG stand-in, not a photograph. To
swap in real work:

1. Export each image at roughly **2000px on the long edge**, sRGB, quality 80.
2. Convert to AVIF with a WebP fallback (`squoosh`, `sharp`, or ImageMagick).
3. Drop them in `assets/img/` and update the `src` and `alt` in `src/pages/`.
4. Rebuild.

For best Core Web Vitals, serve responsive sources rather than one large file:

```html
<picture>
  <source type="image/avif" srcset="/assets/img/wedding-01-800.avif 800w,
                                    /assets/img/wedding-01-1600.avif 1600w" sizes="(min-width: 900px) 33vw, 100vw">
  <source type="image/webp" srcset="/assets/img/wedding-01-800.webp 800w,
                                    /assets/img/wedding-01-1600.webp 1600w" sizes="(min-width: 900px) 33vw, 100vw">
  <img src="/assets/img/wedding-01-1600.jpg" alt="Descriptive alt text"
       width="1600" height="1067" loading="lazy" decoding="async">
</picture>
```

Rules the current markup already follows and that you should keep:

- The hero image uses `fetchpriority="high"` and **no** `loading="lazy"` — it is
  the Largest Contentful Paint element.
- Every other image uses `loading="lazy" decoding="async"`.
- Every image has explicit `width`/`height` so nothing shifts as it loads.
- Alt text describes the photograph, not the filename.

Regenerate the placeholders any time with `python3 tools/make_placeholders.py`.

---

## Connecting the enquiry form

The contact form is fully built and validated client-side, but it has **no
`action` attribute**, so it does not submit anywhere yet. Until you add one, it
tells the visitor so instead of silently discarding their enquiry.

Pick one and add it to the `<form>` in `src/pages/contact.html`:

| Option | How |
| --- | --- |
| **Netlify Forms** | Add `netlify` and `name="enquiry"` to the `<form>`; Netlify detects it at deploy time |
| **Formspree** | `action="https://formspree.io/f/XXXXXXX" method="POST"` |
| **Basin / Getform** | Same pattern — endpoint URL in `action` |
| **Your own handler** | Any endpoint accepting `POST` with `application/x-www-form-urlencoded` |

Then set the success redirect to `/thank-you/` (already built and `noindex`).

Already handled for you: required-field validation with inline messages, a
honeypot field named `company`, correct `autocomplete` attributes, and a
consent checkbox that references the privacy notice.

**Deliverability matters more than the form.** Configure SPF and DKIM on your
sending domain, and test that enquiries actually reach the inbox — a wedding
enquiry lost to a spam folder is a lost booking.

---

## Deploying

The output is plain static files. Any host works:

- **Netlify / Cloudflare Pages / Vercel** — connect the repo. No build command
  needed (the HTML is committed), or set `python3 build.py` as the build step
  and publish the repo root.
- **GitHub Pages** — serve from the default branch root. `404.html` is picked
  up automatically.
- **Any web host** — upload the repo root over FTP.

Pretty URLs (`/portfolio/`) rely on the host serving `index.html` from a
directory, which every host above does by default.

### Before you point a domain at it

1. Replace `SITE_URL` in `build.py` and the `https://www.nishchayphotography.ca`
   references in `src/partials/base.html` with your real domain, then rebuild.
2. Work through `CONTENT-CHECKLIST.md` — it lists every placeholder.
3. Enable HTTPS and force the www-or-not choice you made in `SITE_URL`.
4. Submit `sitemap.xml` to Google Search Console and Bing Webmaster Tools.
5. Create and verify a Google Business Profile — for a local studio it drives
   more enquiries than the website's own rankings do.

---

## What's built in

**Structure & SEO** — per-page titles, meta descriptions, canonicals, Open
Graph and Twitter cards; `PhotographyBusiness` JSON-LD with address, service
area and hours; `FAQPage`, `Service`, `BlogPosting`, `BreadcrumbList` and
`ContactPage` schema on the relevant pages; generated `sitemap.xml` and
`robots.txt`; client and thank-you pages set to `noindex`.

**Accessibility (WCAG 2.1 AA / AODA)** — skip link, visible focus rings,
semantic landmarks, one `h1` per page, keyboard-operable filters, lightbox and
accordion, `aria-current` on the active nav item, live regions for filter and
form status, `prefers-reduced-motion` support, and no horizontal scrolling from
320px up.

**Performance** — no framework, no runtime dependencies, ~25KB of CSS and JS
combined before compression, deferred script, non-blocking font loading with
real fallbacks, lazy-loaded imagery and explicit dimensions on every image.

**Resilience** — every feature degrades without JavaScript. Content, navigation
and FAQ answers all render for a visitor whose script fails to load; the
scroll-reveal, drawer and accordion styles are scoped behind a `.js` class on
`<html>` precisely so that a broken script never hides content.

---

## Known limitations

- **Images are placeholders.** The site will not look like a photography studio
  until real photographs replace them.
- **The form is not connected.** See above.
- **Legal pages are templates.** `/privacy/`, `/terms/` and `/accessibility/`
  are drafted against PIPEDA and the AODA but must be reviewed by a Canadian
  lawyer before launch.
- **Testimonials, statistics and press mentions are sample copy.** Replace them
  with real ones. Note that no `AggregateRating` schema is emitted anywhere —
  marking up review ratings you have not actually received is a Google
  structured-data violation. Add it only once you have genuine reviews.
- **Client galleries link to a placeholder Pixieset URL.** Point it at your real
  gallery host.
