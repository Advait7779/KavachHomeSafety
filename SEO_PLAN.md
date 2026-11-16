# Kavach SEO implementation plan

This plan covers the public website. The technical changes that preserve the current public UI have been implemented. Keyword phrases below are proposed search intents, not claims about search volume or ranking. Confirm the production domain, service areas, business details, and factual claims before publishing new visible copy.

## Implementation status with the current UI preserved

- Done: server-rendered HTML for the four existing public pages, page-specific title and description, absolute canonical and social metadata, editable SEO fields in the admin panel, dynamic sitemap and robots response, admin/API `noindex`, real 404 responses, and LocalBusiness data based on the currently published contact details.
- Done: removed a duplicate font request, prioritized the existing hero image, and lazy-loaded below-the-fold service and gallery images. The images, page layout, visible wording, routes, and storefront navigation remain the same.
- Domain configured: `https://kavachinvisiblesaftygrill.com` is the canonical hostname supplied by the owner. Confirm the address and claims, then connect Search Console and the Business Profile after deployment.
- Deferred to respect the no-UI-change requirement: new service landing pages, changes to visible copy or navigation, replacing photos, and replacing the placeholder social links. Those items remain in the roadmap below for a later decision.

## Original audit before implementation

1. `index.html` has one title, description, and social preview for every route. It has no canonical URL. The Open Graph image paths are relative. The React pages load their visible content after the shared Vite HTML shell, and published content is fetched from `/api/public/site` in `src/site/SiteContext.jsx`. [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) explains why server-rendered or pre-rendered HTML is useful for users and crawlers.
2. The four public routes are `/`, `/services`, `/gallery`, and `/contact`. There are no dedicated pages for the four services in `shared/defaultContent.json`, so those service-specific searches all land on one general page.
3. There is no `robots.txt` or `sitemap.xml` in `public/`. Nginx currently sends `index.html` for unknown paths, so nonexistent URLs can return HTTP 200 instead of a real 404.
4. The image files in `public/images/` range from roughly 300 KB to 933 KB; the hero image is about 914 KB. `src/index.css` imports Josefin Sans while `index.html` also links to it. The gallery displays multiple full-size photos immediately.
5. The site has local contact information, but the address is a single free-text line. There is no LocalBusiness structured data or confirmed canonical domain. Social links in `src/components/Footer.jsx` point to `#`.
6. Before using existing copy as SEO evidence, verify the project photos, customer reviews, service-area claims, statistics, warranty, certification, and safety/compliance statements. Examples occur in `src/pages/Home.jsx`, `src/pages/Services.jsx`, `src/pages/Gallery.jsx`, and `shared/defaultContent.json`.

## Keyword and page map

Use one primary topic per page, with natural variations in the title, H1, opening copy, headings, image captions, and internal links. Google does not use the `meta keywords` tag, and repeated keyword stuffing is against its guidance; adding a long hidden keyword list is not part of this plan. [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

| URL | Primary intent and suggested phrases | Proposed title | Content to update |
| --- | --- | --- | --- |
| `/` | invisible safety grills Pune; mosquito nets Pune; balcony safety solutions Pune | Invisible Safety Grills & Mosquito Nets in Pune \| Kavach | Clear service summary, Pune service area, verified differentiators, direct links to each service, and a site survey CTA. |
| `/services` | safety grill and mosquito net installation Pune; home safety solutions Pune | Safety Grills & Mosquito Net Services in Pune \| Kavach | A short comparison of the four services with descriptive links to their own pages. |
| `/gallery` | invisible grill installation photos Pune; balcony safety grill projects | Safety Grill & Mosquito Net Projects in Pune \| Kavach | Real project captions with service type, area, and installation details where consent and facts are available. |
| `/contact` | safety grill site survey Pune; mosquito net installation enquiry Pune | Request a Free Site Survey in Pune \| Kavach | Exact address, service area, contact methods, what happens after enquiry, and the form. Keep “free” only if it is the actual policy. |
| Proposed `/services/invisible-grills` | invisible grills for balcony Pune; window invisible safety grills Pune | Invisible Safety Grills for Balconies & Windows in Pune \| Kavach | Product materials, suitable openings, installation process, maintenance, verified warranty, photos, and enquiry CTA. |
| Proposed `/services/mosquito-nets` | mosquito net for windows Pune; mosquito mesh installation Pune | Mosquito Net Systems for Windows & Doors in Pune \| Kavach | Mesh/frame choices, opening types, measurements, cleaning, project photos, and enquiry CTA. |
| Proposed `/services/balcony-safety` | child safety balcony grills Pune; balcony safety net or grill Pune | Child Safety Balcony Grills in Pune \| Kavach | Safety use cases, design options, installation details, photos, and carefully qualified safety language. |
| Proposed `/services/staircase-grills` | staircase wire railing Pune; invisible staircase grill Pune | Staircase Wire Railings in Pune \| Kavach | Configurations, materials, mounting options, project photos, and enquiry CTA. |

The proposed service pages need genuinely distinct, useful copy and images. Add neighborhood phrases such as Charholi, Dighi, Alandi Road, and PCMC only where Kavach actually serves customers and can provide specific evidence. Avoid thin location pages that repeat the same text with a place name changed.

## Work in priority order

### P0 — Make every public URL crawlable and identifiable

1. Choose one HTTPS production hostname. Redirect other host/protocol variants to it. Add an absolute, self-referencing canonical URL for each public page and keep internal links and sitemap URLs consistent. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
2. Give each public route its own HTML response containing its current published content, `<title>`, meta description, canonical, Open Graph/Twitter tags, and main H1. Because content can change in the admin panel, prefer server rendering through Express (with React hydration) or a publish-triggered HTML snapshot that updates immediately when content is published. Avoid a single static head for all routes. Keep authenticated admin pages client-side.
3. Add an SEO section to the admin content editor for page title, description, share image, and any service-page slug; validate unique slugs and preview the result. Extend the published content schema and render the same published values in the HTML response and the browser. Start from the page examples above, then refine using real query data. Google's title and snippet systems may choose different text, so titles and descriptions should accurately match visible copy. [Title links](https://developers.google.com/search/docs/appearance/title-link), [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
4. Add `public/robots.txt` and a sitemap of canonical public URLs; exclude `/admin`, API paths, draft previews, and bill PDFs from the sitemap. Return `X-Robots-Tag: noindex` for admin and private responses while keeping authentication in place. Use a real HTTP 404 for unknown public paths instead of the current SPA 200 fallback. Do not rely on a `robots.txt` disallow rule as the only way to keep admin URLs out of search. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

### P1 — Improve page copy and local business signals

5. Rewrite Home and Services copy around customer questions: what is installed, where it fits, material choices, measurement process, maintenance, and a clear next step. Use one descriptive H1 per page and logical H2/H3 sections. Link service summaries to the relevant service detail page using specific anchor text.
6. Create the four service pages in the keyword map. Add short FAQs only where the business has a factual answer; do not add FAQ markup solely to seek a special search appearance. Keep product claims, technical figures, and warranties backed by business documentation.
7. Confirm the official business name, formatted street address, postal code, phone, hours, and actual service area. Show them consistently on Contact and Footer and align them with the existing Google Business Profile. Verify/complete the profile, add current photos, and request genuine customer reviews. Google's local guidance emphasizes complete and accurate business information. [Google Business Profile guidance](https://support.google.com/business/answer/7091).
8. Add `LocalBusiness` JSON-LD using only verified details (name, structured `PostalAddress`, phone with country code, URL, logo, hours if known). Validate with Google's Rich Results Test. Do not add self-serving `Review` or `AggregateRating` markup to Kavach's own LocalBusiness page; those reviews are not eligible for Google star snippets. [LocalBusiness data](https://developers.google.com/search/docs/appearance/structured-data/local-business), [review rules](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
9. Replace the `#` social links with real profiles or remove them. Link the Contact page to the verified map/profile, and check that the address and map embed point to the same location.

### P2 — Improve image discovery and speed

10. Convert large photos to suitably compressed WebP/AVIF versions with responsive sizes. Keep the hero image high quality, give it priority loading, and lazy-load gallery/service images below the fold. Set explicit width/height or stable aspect ratios to avoid layout shifts. Use descriptive filenames and useful, factual alt text or captions, with no keyword repetition. [Google image guidance](https://developers.google.com/search/docs/appearance/google-images/).
11. Remove the duplicate Josefin Sans request and limit font weights if possible. Measure mobile pages before and after image/font changes; inspect JavaScript cost from the icon and motion bundles. Use Search Console field data and PageSpeed Insights to track LCP, INP, and CLS. Google's good-experience thresholds are LCP ≤ 2.5 s, INP < 200 ms, and CLS < 0.1. [Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

### P3 — Launch, measure, and iterate

12. Verify the chosen domain in Google Search Console, submit the sitemap, inspect each key URL, and confirm the rendered HTML contains the intended heading, copy, links, canonical, and metadata. Validate structured data and check indexing/404 reports. A sitemap helps discovery but does not guarantee indexing. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
13. Record a baseline of impressions, clicks, queries, average position, page indexing, mobile Core Web Vitals, and enquiry conversions. Revisit titles, copy, and internal links using actual Search Console queries after enough data accumulates. Track form completions, phone clicks, and WhatsApp clicks without exposing personal lead data in analytics.

## Files and systems expected to change

| Area | Likely update |
| --- | --- |
| `index.html`, `src/App.jsx`, `src/main.jsx`, `src/site/SiteContext.jsx` | Route-specific head data and server-rendered/hydrated public pages. |
| `server/app.js`, `nginx.conf`, deployment config | Public HTML routes, 404 responses, admin/private `noindex`, canonical host redirects, sitemap serving. |
| `shared/defaultContent.json`, `src/admin/SiteEditor.jsx` | Editable SEO fields and service page content in the existing draft/publish workflow. |
| `src/pages/Home.jsx`, `Services.jsx`, `Gallery.jsx`, `Contact.jsx`, `src/components/Footer.jsx` | Updated headings, copy, internal links, local details, image descriptions, and verified claims. |
| `public/robots.txt`, generated sitemap | Crawl directives and public canonical URL discovery. |
| `public/images/`, `src/index.css` | Responsive image variants, image loading, and font cleanup. |

## Acceptance checks

- Fetching each public URL without executing JavaScript returns the right page title, description, canonical, H1, visible core copy, and relevant links; published admin edits update that HTML.
- `/admin`, private API routes, and bill PDFs are absent from the sitemap and carry appropriate `noindex` handling; unknown public URLs return 404.
- The sitemap contains only working canonical public URLs, and Search Console can fetch it and inspect every key page.
- LocalBusiness markup matches visible verified business information, and no invented review ratings or unverified claims are published.
- Mobile performance and image size improve from a recorded baseline while the page design and enquiry flow remain usable.

## Details needed before final copy and launch

- Canonical production domain and whether `www` or the bare domain should be primary.
- Official business name, full postal address and PIN code, operating hours, Google Business Profile URL, and real social links.
- Confirmation of the actual service areas, original project photos/reviews, warranty terms, and technical/safety claims.

These details can be gathered while the technical P0 work is built; no speculative business claims need to be published.
