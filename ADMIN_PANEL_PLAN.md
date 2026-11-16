# Kavach admin panel implementation plan

## Baseline before implementation

- The site is a Vite/React single-page app with Home, Services, Gallery, and Contact pages. There is no backend, database, or admin route yet.
- The Contact form currently gathers name, phone, service, and an optional message, then opens a prefilled WhatsApp chat. Nothing is stored, so an enquiry cannot appear in a dashboard today.
- Services, gallery entries, reviews, images, contact numbers, address, and most page copy are defined directly in React components. The production Docker image serves only static files through Nginx.

## Target architecture

```text
Visitor / Admin browser
        |
        v
Nginx: React app and /api reverse proxy
        |
        v
Node.js + Express API ---- PostgreSQL
        |
        +---- persistent image storage
```

- Keep the existing React storefront and add protected `/admin/*` routes with a separate admin layout. Public navigation, footer, and floating contact buttons should not wrap admin pages.
- Add an Express app in `server/`, using `/api` routes, request validation, centralized error handling, database migrations, and environment-based configuration.
- Use PostgreSQL for leads, admin accounts, editable site content, and bills. Store uploaded image files outside the database; retain their paths and metadata in PostgreSQL.
- In development, proxy `/api` from Vite to Express. In production, route `/api` from Nginx to the Express service and serve the built React app as today. Provision PostgreSQL and persistent media storage with backups.

## Admin navigation and features

| Screen | Initial scope |
| --- | --- |
| Dashboard | Counts of new/open/closed leads, recent enquiries, bills issued and outstanding; links to the relevant records. |
| Leads | Search and filter by date, service, and status; view the full enquiry; add internal notes; update status (`new`, `contacted`, `survey_scheduled`, `quoted`, `won`, `lost`); call or open WhatsApp; create a bill from a lead. |
| Site content | Edit business name, phone/WhatsApp numbers, address, map URL, hero text/image, home sections and stats, service cards and details, gallery items, reviews, and call-to-action text. Preview changes before publishing. |
| Media | Upload and replace logo, hero, service, and gallery images, with file type/size checks and alt text. |
| Bills | Create a draft from a lead or manually, add customer details and line items, preview, issue, download/print a PDF, mark paid, and void an issued bill. |
| Settings | Business details used on bills, default bill terms, admin password change, and basic branding controls such as the existing orange accent. |

Site editing should use structured fields rather than arbitrary HTML. Seed those fields from the current site so the initial migration preserves the visible content. Public pages read published content through `/api/public/site`; the admin edits a draft and publishes it explicitly. Keep a last-published revision for rollback. Content loaded from the API should have a sensible loading/error state, and the published copy should be cacheable with invalidation after publishing.

## Enquiry-to-lead flow

1. Keep the existing form fields and add clear submitting, success, and error states.
2. On submit, validate on both client and server, then `POST /api/public/leads`. The API inserts a lead with source `website`, status `new`, and a creation timestamp, and returns a lead reference.
3. Show success only after the insert succeeds. Offer a separate **Continue on WhatsApp** link using the submitted details. A failed or blocked WhatsApp open must not affect the saved lead.
4. If saving fails, retain entered values and offer retry; do not claim the enquiry was received. Use a submission idempotency key to prevent accidental duplicates, plus rate limiting and a honeypot to reduce spam.
5. The Leads screen fetches records from PostgreSQL, shows the newest first, and updates its count/list after refresh or a new submission. An initial polling interval is sufficient; real-time push can follow if needed.

## PostgreSQL tables

| Table | Important fields |
| --- | --- |
| `admin_users` | `id`, `email` unique, `password_hash`, `role`, `created_at`, `last_login_at` |
| `leads` | `id`, `reference` unique, `name`, `phone`, `service`, `message`, `source`, `status`, `created_at`, `updated_at` |
| `lead_notes` | `id`, `lead_id`, `admin_user_id`, `body`, `created_at` |
| `site_revisions` | `id`, `content` JSONB, `status` (`draft`/`published`), `created_by`, `created_at`, `published_at` |
| `media_assets` | `id`, `storage_key`, `mime_type`, `alt_text`, `created_at` |
| `bills` | `id`, `bill_number` unique when issued, `lead_id` nullable, `status`, customer and business snapshots, currency, subtotal, discount, tax, total, issue/due dates, terms, `created_at` |
| `bill_items` | `id`, `bill_id`, `description`, `quantity`, `unit`, `unit_price`, `tax_rate`, `sort_order`, calculated line totals |
| `bill_events` | `id`, `bill_id`, `admin_user_id`, `action`, `created_at` |

Use integer minor currency units or exact decimal values for money and calculate totals on the server. Add indexes for lead date/status and bill number/status. Apply schema changes through migrations, not manual production edits.

## Temporary bill template

Create one replaceable HTML/CSS template rendered to an A4 PDF. It should show the Kavach logo and business details, bill number, issue/due dates, customer details, line items, subtotal, optional discount and tax, grand total in INR, payment status, and notes/terms. Allow the admin to enter applicable tax details and rates; do not assume every bill is a GST invoice. Keep bill data and layout separate so the original template can replace this design later without migrating bill records.

Drafts may be edited and deleted. Issuing a bill assigns the next unique number and freezes the customer, business, item, and total snapshot. Corrections to an issued bill should use a void-and-reissue flow, with an event history. PDF generation must reproduce the issued snapshot even if site settings change later. Do not expose PDFs publicly without authentication or an intentional share mechanism.

## Suggested API surface

| Route | Purpose |
| --- | --- |
| `POST /api/public/leads` | Save the website enquiry. |
| `GET /api/public/site` | Return published site content. |
| `POST /api/admin/auth/login`, `POST /logout`, `GET /me` | Admin session management. |
| `GET /api/admin/dashboard` | Summary counts and recent activity. |
| `GET /api/admin/leads`, `GET /:id`, `PATCH /:id`, `POST /:id/notes` | Lead workflow. |
| `GET /api/admin/site`, `PUT /draft`, `POST /publish`, `POST /rollback` | Site editing and publishing. |
| `POST /api/admin/media`, `DELETE /:id` | Managed uploads. |
| `GET /api/admin/bills`, `POST /`, `GET /:id`, `PATCH /:id`, `POST /:id/issue`, `POST /:id/void`, `POST /:id/paid`, `GET /:id/pdf` | Bill workflow. |

All `/api/admin/*` routes except login require authentication. Use a password hash, HTTP-only secure session cookie, CSRF protection for cookie-authenticated writes, login throttling, input validation, and server-side authorization. Keep secrets and database credentials in environment variables.

## Implementation order

1. **Foundation:** Add Express, PostgreSQL connection and migrations, local development configuration, API proxy, health check, and admin login/session handling.
2. **Lead capture:** Implement `POST /api/public/leads`, wire the Contact form, then build Dashboard and Leads screens with status changes, notes, search, and filters.
3. **Site customization:** Seed current content, replace hardcoded public content with published API data, then build content forms, image management, preview, publish, and rollback.
4. **Billing:** Add bill tables and calculations, draft editor, bill list/detail, issue/paid/void actions, and the temporary printable PDF template.
5. **Deployment and verification:** Update container/service configuration, run migrations, configure persistent storage and backups, then verify the live enquiry, editing, and PDF flows end to end.

## Acceptance checks

- A valid website enquiry appears in **Admin → Leads** with all submitted fields and a timestamp; a failed API request leaves the form available for retry.
- Admin login protects all lead, content, media, and bill endpoints; a visitor cannot fetch private records or PDFs.
- Publishing a site edit changes the intended public section, while preview and draft edits do not. Contact links throughout the site use the saved business numbers.
- An admin can create a draft bill from a lead, add line items, verify server-calculated totals, issue a numbered PDF, and mark it paid or void. A later site-content edit does not alter that issued PDF.
- The production frontend reaches the Express API, migrations run against PostgreSQL, uploaded media survives a redeploy, and issued PDFs can be regenerated from stored snapshots.

## Decisions to confirm before implementation

- Business identity and fields required on the final bill, including any GSTIN, tax rules, payment details, and numbering format.
- Who needs admin access: one owner account initially, or multiple staff accounts with distinct roles.
- Hosting choice for PostgreSQL and persistent image storage. The current Docker setup contains only the static site.

The temporary template and the one-owner account can be built with configurable defaults while those details are pending.
