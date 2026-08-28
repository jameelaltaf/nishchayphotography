# Pre-launch content checklist

Everything below is placeholder content that ships with the build. Work through
it before pointing a domain at the site. Grep targets are given where useful.

## 1. Studio identity

- [x] **Studio name** — now "Nish Impressions Studio" throughout, taken from the
      logo in the shared Drive folder. `nishchayphotography.ca` is kept as the
      domain and email host.
- [x] **Logo** — the real vector logo is in `assets/brand/`, used in the header,
      the footer and the favicon.
- [~] **Photographs** — 7 slots now hold real studio work (the hero, the wide
      feature, the social card, all three family/newborn slots and one journal
      header), taken from the Drive folder and resized for web. 26 abstract
      placeholders remain. The Drive connector used here caps out between 4 MB
      and 9.8 MB per file and the remaining originals are 10-32 MB, so run
      `tools/fetch_from_drive.py` locally to pull the rest.
- [ ] **Hero video** — the hero is video-ready. Encode a short, silent,
      web-sized MP4, drop it in `assets/video/`, and set `data-hero-src` on the
      `<video>` in `src/pages/index.html`. While that attribute is empty no
      request is made and the still crossfade runs instead.
- [ ] **Captions on placeholder images** — the remaining `.svg` slots still
      carry invented venue names (Distillery District, Casa Loma, Muskoka).
      Replace those as each real photograph goes in.

- [ ] **Domain** — `nishchayphotography.ca` appears in `build.py` (`SITE_URL`),
      `src/partials/base.html`, `robots.txt` and the JSON-LD blocks in
      `src/pages/`. Replace everywhere, then rebuild.
      `grep -rn "nishchayphotography.ca" src/ build.py robots.txt`
- [ ] **Phone** — `(416) 555-0142` is a reserved fictional number. Replace it
      in `src/partials/footer.html`, `src/pages/about.html`,
      `src/pages/contact.html`, `src/pages/accessibility.html` and the
      `telephone` field in `src/partials/base.html`.
- [ ] **Email** — `hello@nishchayphotography.ca`
- [ ] **Address** — "Liberty Village, Toronto, ON" and postal code `M6K 3P6` in
      `src/partials/base.html`. If your studio has a public street address, use
      it; if you work by appointment only, keep it neighbourhood-level.
- [ ] **Geo coordinates** — the `latitude`/`longitude` in `base.html` currently
      point at Liberty Village.
- [ ] **Social links** — Instagram, Pinterest and Vimeo handles in
      `src/partials/footer.html` and the `sameAs` array in `base.html`.
- [ ] **Opening hours** — `openingHoursSpecification` in `base.html`.

## 2. Business facts

- [ ] **Service area** — the `areaServed` list in `base.html` names Toronto,
      Mississauga, Brampton, Hamilton and Niagara-on-the-Lake.
- [ ] **Founding year and volume** — "since 2015", "320+ weddings", "11 years"
      and "roughly forty weddings a year" appear on the homepage and About page.
- [ ] **Team** — Nishchay, Amrita and Ben are invented. Replace names, roles,
      bios and portraits in `src/pages/about.html`.
- [ ] **Insurance** — the site claims $2M commercial general liability. Confirm
      your actual coverage before publishing that.
- [ ] **Languages** — About claims English, Hindi and Punjabi on the day.

## 3. Pricing and terms

Every figure in `src/pages/services.html` is illustrative. Confirm all of them:

- [ ] Wedding collections: $4,200 / $6,400 / $9,800 CAD
- [ ] Session pricing: engagement $650, portrait $450, family $520,
      commercial day rate $1,850
- [ ] Add-on pricing (extra hours, second shooter, albums, slideshow, travel)
- [ ] Retainer percentage (30%) and balance-due window (14 days)
- [ ] Turnaround promises — **48-hour sneak peeks and six-week galleries are
      contractual claims on this site.** Only publish what you can hold to.
- [ ] Included travel radius (60 km of downtown Toronto)
- [ ] HST treatment — the site states prices exclude HST at 13%. Correct for
      Ontario; change it if you are registered elsewhere or not yet registered.
- [ ] Gallery hosting periods (12 months / 3 years) stated on
      `src/pages/client-galleries.html` and in the FAQ
- [ ] The `AggregateOffer` price range in the `services.html` JSON-LD must match
      your published collections.

## 4. Testimonials, press and social proof

- [ ] **All three testimonials are written samples.** Replace with real,
      attributable quotes and get written permission to publish names.
- [ ] **The press row** (Wedluxe, Elegant Wedding, Junebug, Toronto Life) on the
      homepage is aspirational. Remove any publication that has not actually
      featured you — claiming otherwise is a real reputational risk.
- [ ] Once you have genuine reviews, consider adding `AggregateRating` schema.
      It is deliberately absent right now; do not add it before the reviews
      exist.

## 5. Photography

- [ ] Replace all 32 files in `assets/img/` with real work (see README).
      `tools/fetch_photos.py` can pull stand-ins from Pexels to preview the
      layout, but stock photography must not remain on a live portfolio -
      prospective clients judge the studio by what is on this page.
- [ ] Rewrite every `alt` attribute to describe the actual photograph.
- [ ] Update the figure captions, which currently name venues you may not have
      shot at (Distillery District, Casa Loma, Evergreen Brick Works, Muskoka,
      Prince Edward County, Scarborough Bluffs, Rouge Valley).
- [ ] Replace `assets/img/og-cover.svg` with a real 1200×630 social share image.
- [ ] Replace `assets/img/favicon.svg` with the studio's mark.

## 6. Journal

- [ ] The February elopement post at
      `src/pages/journal-elopement.html` is fiction. Replace it with a real
      wedding, or delete the page and its links from `src/pages/journal.html`
      and `src/pages/index.html`.
- [ ] Five journal cards are marked "Coming soon" and link nowhere. Either write
      those posts or remove the cards.

## 7. Integrations

- [ ] **Enquiry form** — add an `action` endpoint (README → Connecting the form)
      and set the success redirect to `/thank-you/`.
- [ ] **Client galleries** — `https://nishchayphotography.pixieset.com/` in
      `src/pages/client-galleries.html` is a placeholder. Point it at your real
      Pixieset / Pic-Time / ShootProof account.
- [ ] **Newsletter** — the "Join the list" link and the newsletter checkbox on
      the contact form currently go nowhere. Wire them to your email platform,
      or remove them.
- [ ] **Analytics** — nothing is installed. If you add any, the privacy notice
      already describes anonymised analytics; keep the two consistent.
- [ ] **WhatsApp number** — the floating WhatsApp button and the assistant's
      hand-off links both point at `wa.me/14165550142`, which is the fictional
      placeholder number. Replace it in `src/partials/widgets.html` (two links)
      and in `assets/js/main.js` (the `WHATSAPP` constant).
- [ ] **Assistant answers** — the studio assistant repeats the pricing,
      turnaround and travel figures published on the services page. If you
      change any of those numbers, update the `TOPICS` object in
      `assets/js/main.js` to match, or the two will disagree.

## 8. Legal

- [ ] Have a Canadian lawyer review `/privacy/`, `/terms/` and
      `/accessibility/`. They are drafted against PIPEDA and the AODA in good
      faith but they are templates, not legal advice.
- [ ] Confirm the retention periods in the privacy notice match what you
      actually do (2 years for enquiries, 7 years for financial records).
- [ ] Confirm the land acknowledgement in the footer is appropriate and accurate
      for where you actually work, or remove it. A generic one is worse than
      none.

## 9. Final pass

- [ ] `python3 build.py` and preview every page
- [ ] Test the enquiry form end to end, including that the email arrives
- [ ] Run Lighthouse on the homepage and the portfolio page
- [ ] Submit `sitemap.xml` to Google Search Console and Bing Webmaster Tools
- [ ] Set up and verify a Google Business Profile
