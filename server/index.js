import defaultContent from '../shared/defaultContent.json' with { type: 'json' }
import { pool, migrate } from './db.js'
import { bootstrapAdmin } from './auth.js'
import app from './app.js'

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error('Set DATABASE_URL or PostgreSQL PG* environment variables')
}
await migrate()
await pool.query('INSERT INTO site_content (id, published, draft) VALUES (1, $1, $1) ON CONFLICT (id) DO NOTHING', [JSON.stringify(defaultContent)])
await pool.query("UPDATE site_content SET published = jsonb_set(published, '{seo}', $1::jsonb) WHERE NOT (published ? 'seo')", [JSON.stringify(defaultContent.seo)])
await pool.query("UPDATE site_content SET draft = jsonb_set(draft, '{seo}', $1::jsonb) WHERE NOT (draft ? 'seo')", [JSON.stringify(defaultContent.seo)])

const oldAddress = 'Padmavati building, kale colony lane no 2, aalandi dighi road, charholi pune'
const newAddress = defaultContent.business.address
const oldPrimaryPhone = '7219700401'
const newPrimaryPhone = defaultContent.business.phone
const oldMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3780.5!2d73.87!3d18.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDQwJzEyLjAiTiA3M8KwNTInMTIuMCJF!5e0!3m2!1sen!2sin!4v1'
const newMapUrl = defaultContent.contact.mapUrl
await pool.query(
  `UPDATE site_content SET
    published = jsonb_set(published, '{business,address}', to_jsonb($2::text)),
    updated_at = now()
   WHERE id = 1 AND published->'business'->>'address' = $1`,
  [oldAddress, newAddress],
)
await pool.query(
  `UPDATE site_content SET
    draft = jsonb_set(draft, '{business,address}', to_jsonb($2::text)),
    updated_at = now()
   WHERE id = 1 AND draft->'business'->>'address' = $1`,
  [oldAddress, newAddress],
)
await pool.query(
  `UPDATE site_content SET
    published = jsonb_set(jsonb_set(published, '{business,phone}', to_jsonb($2::text)), '{business,secondaryPhone}', to_jsonb($1::text)),
    updated_at = now()
   WHERE id = 1 AND published->'business'->>'phone' = $1 AND published->'business'->>'secondaryPhone' = $2`,
  [oldPrimaryPhone, newPrimaryPhone],
)
await pool.query(
  `UPDATE site_content SET
    draft = jsonb_set(jsonb_set(draft, '{business,phone}', to_jsonb($2::text)), '{business,secondaryPhone}', to_jsonb($1::text)),
    updated_at = now()
   WHERE id = 1 AND draft->'business'->>'phone' = $1 AND draft->'business'->>'secondaryPhone' = $2`,
  [oldPrimaryPhone, newPrimaryPhone],
)
await pool.query(
  `UPDATE site_content SET
    published = jsonb_set(published, '{contact,mapUrl}', to_jsonb($2::text)),
    updated_at = now()
   WHERE id = 1 AND published->'contact'->>'mapUrl' = $1`,
  [oldMapUrl, newMapUrl],
)
await pool.query(
  `UPDATE site_content SET
    draft = jsonb_set(draft, '{contact,mapUrl}', to_jsonb($2::text)),
    updated_at = now()
   WHERE id = 1 AND draft->'contact'->>'mapUrl' = $1`,
  [oldMapUrl, newMapUrl],
)
await pool.query(
  `UPDATE estimates SET
    business = jsonb_set(business, '{address}', to_jsonb($2::text))
   WHERE business->>'address' = $1`,
  [oldAddress, newAddress],
)
await pool.query(
  `UPDATE estimates SET
    business = jsonb_set(jsonb_set(business, '{phone}', to_jsonb($2::text)), '{secondaryPhone}', to_jsonb($1::text))
   WHERE business->>'phone' = $1 AND business->>'secondaryPhone' = $2`,
  [oldPrimaryPhone, newPrimaryPhone],
)
await pool.query(
  `UPDATE estimates SET
    estimate = jsonb_set(estimate, '{company,address}', to_jsonb($2::text))
   WHERE estimate->'company'->>'address' = $1`,
  [oldAddress, newAddress],
)
await pool.query(
  `UPDATE estimates SET
    estimate = jsonb_set(estimate, '{company,phone}', to_jsonb($2::text))
   WHERE estimate->'company'->>'phone' = $1`,
  [oldPrimaryPhone, newPrimaryPhone],
)
await pool.query(
  `UPDATE estimates SET
    draft_data = jsonb_set(draft_data, '{estimate,company,address}', to_jsonb($2::text))
   WHERE draft_data IS NOT NULL AND draft_data->'estimate'->'company'->>'address' = $1`,
  [oldAddress, newAddress],
)
await pool.query(
  `UPDATE estimates SET
    draft_data = jsonb_set(draft_data, '{estimate,company,phone}', to_jsonb($2::text))
   WHERE draft_data IS NOT NULL AND draft_data->'estimate'->'company'->>'phone' = $1`,
  [oldPrimaryPhone, newPrimaryPhone],
)

await bootstrapAdmin()
const port = Number(process.env.PORT || 6002)
const host = process.env.HOST || '0.0.0.0'
app.listen(port, host, () => console.log(`Kavach API listening on ${host}:${port}`))
