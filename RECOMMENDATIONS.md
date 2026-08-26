# Photography studio websites: what to keep, what to skip

A functionality analysis behind the build in this repo.

## How this was researched — and its limits

This session's network proxy blocked direct fetches of individual studio
websites, so **I could not crawl the ten sites myself**. What follows is built
from search-engine result summaries of current studio-site roundups and
Canadian photographer directories, cross-referenced with well-established
conversion and technical guidance for image-heavy local-service sites.

Treat the feature *patterns* below as reliable and the per-site details as
second-hand. Everything in the recommendation tables is a judgement call you
should feel free to overrule with your own market knowledge.

**Sample set.** Two groups. Canadian studios surfaced repeatedly across
WeddingWire.ca, MyWed and regional "best of" lists — Purple Tree Photography,
Jennifer See Studios, 3B Photography, Rosetta Li Weddings, Origin Weddings and
Peter B Photography in Toronto; David & Sherry and Tomasz in Vancouver. Plus the
design-led international examples that dominate 2026 studio-site roundups
(Colorlib, MyCodelessWebsite, 10Web) and the platform patterns that Pixieset and
Pic-Time have effectively standardised across the industry.

---

## What nearly every serious studio site does

| Feature | How common | Why it survives |
| --- | --- | --- |
| Full-bleed hero image or video, minimal chrome | Universal | The photograph *is* the value proposition |
| Portfolio split by category, not one giant grid | Universal | Wedding clients and commercial clients want different proof |
| Immersive lightbox / gallery viewer | Universal | Large images are the product |
| Prominent, repeated enquiry CTA | Universal | Sits in the header, mid-page and footer |
| About page with a real face and voice | Near-universal | Weddings are a trust purchase before an aesthetic one |
| Testimonials as designed blocks, not a wall of text | Near-universal | The strongest single conversion element on these sites |
| Client gallery login (Pixieset / Pic-Time / ShootProof) | Near-universal | Delivery, proofing and print sales, all outsourced |
| A blog or journal | Very common | Where local SEO actually happens |
| Pricing, at least a starting figure | ~Half | The single biggest differentiator — see below |
| Sticky or scroll-aware navigation | Common | Long scrolling pages need an escape hatch |
| Print store attached to galleries | Common | Post-delivery revenue, near-zero effort |

## What separates the good ones from the rest

**1. Publishing a price.** The clearest split in the field. A visitor who can't
find any number assumes you're out of budget and leaves — and the enquiries you
do get are mostly unqualified. Studios that publish a starting figure trade a
smaller number of enquiries for a much higher proportion that convert. If you
take one thing from this document, take this one.

**2. Speed on mobile.** Photography sites are the worst offenders on the web for
page weight; images are roughly half of average page weight and the LCP element
on most pages. Google's own threshold is 3 seconds on mobile, and the majority
of visitors abandon past it. Every 4000px hero you don't resize costs you
enquiries you'll never know about.

**3. An enquiry form that qualifies.** The weak version collects name, email and
"message". The strong version also asks date, venue, guest count, service type
and budget range — so your first reply can contain real availability and a real
number instead of a request for more information. It shortens the cycle by a
full round trip.

**4. Depth of local content.** "Toronto wedding photographer" is won by studios
with venue guides, full real-wedding galleries and planning posts — not by
homepage keywords. This is the slowest lever and the most durable one.

**5. Restraint.** The best sites are almost aggressively plain: type, images,
whitespace. Parallax, cursor effects and page-transition libraries read as
dated fast and cost you the mobile performance that actually matters.

---

## Recommendations

### Tier 1 — build now (all of this is in the repo)

| Feature | Rationale |
| --- | --- |
| Full-bleed hero, category-filtered portfolio, keyboard-accessible lightbox | Table stakes; the product is the pictures |
| **Published pricing page with real CAD figures** | Highest-leverage change available to you |
| Qualifying enquiry form (date, venue, guest count, service, budget) | Converts a two-week email thread into one reply |
| Repeated CTAs — header, mid-page, footer | Visitors decide at unpredictable scroll depths |
| Testimonials, process steps and turnaround promises | Trust content, not decoration |
| About page with the team, insurance, and backup practice | Venues ask; couples care more than they admit |
| Journal with real galleries and venue guides | The local SEO engine |
| Client gallery entry point | Delivery, proofing and print sales |
| Structured data: `PhotographyBusiness`, `FAQPage`, `Service`, `BlogPosting` | How you get into AI answers and rich results |
| WCAG 2.1 AA accessibility | Legally relevant in Ontario; also just better |
| No-JS resilience, lazy loading, explicit image dimensions | Performance is a conversion feature here |

### Tier 2 — add once the site is live and earning

| Feature | When it's worth it |
| --- | --- |
| **Real-time availability / date checker** | Once you're turning away enquiries for booked dates |
| Online booking with deposit for *sessions* (not weddings) | Portrait and headshot work books well self-serve; weddings do not |
| CRM automation (HoneyBook, Dubsado, Studio Ninja) | Contracts, invoices and reminders; replaces the manual half of your pipeline |
| Venue-specific landing pages | One page per major venue you shoot; strong local search returns |
| French translation | Only if you actively pursue Quebec or federal work — and use a human translator |
| Short-form video / behind-the-scenes reel on the homepage | Real lift, real page-weight cost. Self-host, lazy-load, no autoplay with sound |
| Newsletter with a genuine lead magnet (timeline template, venue guide) | Long-cycle nurture for couples booking 18 months out |

### Tier 3 — deliberately skipped

| Feature | Why not |
| --- | --- |
| Cursor effects, parallax, page-transition libraries | Dates quickly, hurts mobile performance, adds nothing to the sale |
| Music autoplay | Universally disliked; an accessibility problem |
| Watermarks on portfolio images | Degrades the work you're being judged on; deters nobody serious |
| Full price lists for *commercial* work | Licensing makes it genuinely variable — quote per project |
| A public "packages" wizard or configurator | Over-engineering; a good form plus a human reply outperforms it |
| Live chat widget | You're shooting on weekends; an unanswered chat is worse than none |
| `AggregateRating` schema before you have real reviews | A structured-data violation, and a manual-action risk |
| A JavaScript framework | Nothing on this site needs one, and it becomes someone's maintenance problem |

---

## Canada-specific requirements

These are easy to miss and materially affect a Canadian studio site.

- **Prices in CAD, with HST stated.** Ontario studios should show prices
  exclusive of HST and say so; 13% on a $6,400 collection is not a rounding
  error and finding out late sours the booking.
- **AODA / WCAG 2.1 AA.** Ontario businesses have accessibility obligations,
  and federally regulated ones fall under the Accessible Canada Act. The site
  targets AA and ships an accessibility statement with a feedback route.
- **PIPEDA.** Meaningful consent for storing enquiry data, a stated retention
  period, and a route to access or delete it. The contact form has an explicit
  consent checkbox for exactly this reason.
- **Image-use consent handled separately from booking.** Permission to publish
  a client's photographs should be optional and refusable without any effect on
  price or coverage. That is both the right practice and the defensible one.
- **Bilingual only if you'll do it properly.** Machine-translated French reads
  badly to Quebec clients and costs more credibility than it buys. Budget for a
  human translator or stay unilingual.
- **Land acknowledgement.** Common on Canadian creative sites and included in
  the footer here — but a generic one is worse than none. Make it specific to
  where you actually work, or remove it.

---

## What this build covers, and what it doesn't

**Covered.** Every Tier 1 item above, across 13 pages: home, portfolio,
services and pricing, about, journal plus a sample post, contact, client
galleries, thank-you, 404, and privacy / terms / accessibility.

**Not covered, by design.** Live availability, self-serve booking, CRM
integration, newsletter delivery and analytics are all Tier 2 — they need
accounts and credentials that belong to the studio, not to this repository. The
form is built and validated but intentionally unconnected; see
`README.md → Connecting the form`.

**The gap that matters most.** Real photographs. Everything else on this list is
worth less than replacing the 32 placeholder images with actual work.
