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
await bootstrapAdmin()
const port = Number(process.env.PORT || 4005)
const host = process.env.HOST || '0.0.0.0'
app.listen(port, host, () => console.log(`Kavach API listening on ${host}:${port}`))
