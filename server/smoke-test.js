import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import defaultContent from '../shared/defaultContent.json' with { type: 'json' }

if (!process.env.TEST_DATABASE_URL || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.TEST_DATABASE_CONFIRM !== 'disposable') {
  throw new Error('Set TEST_DATABASE_URL, TEST_DATABASE_CONFIRM=disposable, ADMIN_EMAIL, and ADMIN_PASSWORD for the disposable integration-test database')
}
const testDatabase = new URL(process.env.TEST_DATABASE_URL).pathname.slice(1)
if (!/(?:_test|_smoke)$/.test(testDatabase) || process.env.NODE_ENV === 'production') {
  throw new Error('Integration tests require a dedicated *_test or *_smoke database outside production')
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const { pool, migrate } = await import('./db.js')
const { bootstrapAdmin } = await import('./auth.js')
const { default: app } = await import('./app.js')
await migrate()
await pool.query('TRUNCATE bill_events, bill_items, bills, lead_notes, leads, media_assets, site_revisions, site_content, admin_sessions, admin_events, admin_users RESTART IDENTITY CASCADE')
await pool.query('ALTER SEQUENCE bill_number_seq RESTART WITH 1')
await pool.query('INSERT INTO site_content (id, published, draft) VALUES (1, $1, $1) ON CONFLICT (id) DO NOTHING', [JSON.stringify(defaultContent)])
await bootstrapAdmin()

const server = await new Promise((resolve) => {
  const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
})
const base = `http://127.0.0.1:${server.address().port}`
const canonicalOrigin = process.env.PUBLIC_SITE_URL ? new URL(process.env.PUBLIC_SITE_URL).origin : base
let cookie = ''
let csrf = ''
async function request(url, options = {}) {
  const response = await fetch(base + url, { ...options, headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(csrf && options.method && options.method !== 'GET' ? { 'x-csrf-token': csrf } : {}), ...options.headers } })
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
  return { response, data }
}

try {
  let result = await request('/api/public/site')
  assert.equal(result.response.status, 200)
  assert.equal(result.data.business.name, 'Kavach')

  result = await request('/')
  assert.equal(result.response.status, 200)
  let html = await result.response.text()
  assert.match(html, /<title>Invisible Safety Grills &amp; Mosquito Nets in Pune \| Kavach<\/title>/)
  assert.ok(html.includes(`<link rel="canonical" href="${canonicalOrigin}/"`))
  assert.match(html, /application\/ld\+json/)
  assert.match(html, /<h1/)
  assert.match(html, /id="site-content" type="application\/json"/)
  assert.equal(result.response.headers.get('content-security-policy'), null)
  for (const route of ['/services', '/gallery', '/contact']) {
    result = await request(route)
    assert.equal(result.response.status, 200)
    html = await result.response.text()
    assert.ok(html.includes(`<link rel="canonical" href="${canonicalOrigin}${route}"`))
    if (route === '/contact') assert.match(html, /www\.google\.com\/maps\/embed/)
  }
  result = await request('/sitemap.xml')
  assert.ok((await result.response.text()).includes(`<loc>${canonicalOrigin}/contact</loc>`))
  result = await request('/robots.txt')
  assert.ok((await result.response.text()).includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`))
  result = await request('/admin')
  assert.match(result.response.headers.get('x-robots-tag'), /noindex/)
  result = await request('/not-a-page')
  assert.equal(result.response.status, 404)

  const submissionKey = crypto.randomUUID()
  const leadPayload = { submissionKey, name: 'Test Customer', phone: '9876543210', service: 'Invisible Safety Grilles', message: 'Balcony survey' }
  result = await request('/api/public/leads', { method: 'POST', body: JSON.stringify(leadPayload) })
  assert.equal(result.response.status, 201)
  const leadReference = result.data.reference
  result = await request('/api/public/leads', { method: 'POST', body: JSON.stringify(leadPayload) })
  assert.equal(result.data.reference, leadReference)

  result = await request('/api/admin/leads')
  assert.equal(result.response.status, 401)
  result = await request('/api/admin/auth/login', { method: 'POST', headers: { 'x-forwarded-proto': 'https' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) })
  assert.equal(result.response.status, 200)
  assert.match(result.response.headers.get('set-cookie'), /; Secure(?:;|$)/)
  assert.equal(result.response.headers.get('cache-control'), 'private, no-store')
  cookie = result.response.headers.get('set-cookie').split(';')[0]
  csrf = result.data.csrfToken

  result = await request('/api/admin/auth/change-password', { method: 'POST', headers: { 'x-csrf-token': '' }, body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'unused-password-123' }) })
  assert.equal(result.response.status, 403)
  const invalidImage = new FormData()
  invalidImage.set('file', new Blob(['<html>not an image</html>'], { type: 'image/jpeg' }), 'fake.jpg')
  result = await request('/api/admin/media', { method: 'POST', body: invalidImage })
  assert.equal(result.response.status, 400)

  result = await request('/api/admin/leads')
  assert.equal(result.response.status, 200)
  const lead = result.data.items.find((item) => `KH-${String(item.id).padStart(6, '0')}` === leadReference)
  assert.ok(lead)
  result = await request(`/api/admin/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'contacted' }) })
  assert.equal(result.data.status, 'contacted')
  result = await request(`/api/admin/leads/${lead.id}/notes`, { method: 'POST', body: JSON.stringify({ body: 'Called customer' }) })
  assert.equal(result.response.status, 201)

  result = await request('/api/admin/site')
  const content = result.data.draft
  content.home.eyebrow = 'Updated in integration test'
  content.seo.home.title = 'Invisible Grills and Mosquito Nets for Pune Homes | Kavach'
  result = await request('/api/admin/site/draft', { method: 'PUT', body: JSON.stringify(content) })
  assert.equal(result.response.status, 200)
  result = await request('/api/admin/site/publish', { method: 'POST' })
  assert.equal(result.response.status, 200)
  result = await request('/api/public/site')
  assert.equal(result.data.home.eyebrow, 'Updated in integration test')
  result = await request('/')
  html = await result.response.text()
  assert.match(html, /Updated in integration test/)
  assert.match(html, /Invisible Grills and Mosquito Nets for Pune Homes/)

  const billPayload = { leadId: Number(lead.id), customer: { name: lead.name, phone: lead.phone, address: 'Pune' }, issueDate: '2026-11-16', dueDate: '2026-11-30', notes: 'Temporary bill', discount: 100, items: [{ description: 'Safety grill installation', quantity: 2, unit: 'sq ft', unitPrice: 500 }] }
  result = await request('/api/admin/bills', { method: 'POST', body: JSON.stringify(billPayload) })
  assert.equal(result.response.status, 201)
  const billId = result.data.id
  assert.equal(Number(result.data.total), 900)
  assert.equal(Number(result.data.tax_total), 0)
  result = await request(`/api/admin/bills/${billId}/issue`, { method: 'POST' })
  assert.equal(result.response.status, 200)
  assert.match(result.data.bill_number, /^KH-\d{4}-\d{5}$/)
  result = await request(`/api/admin/bills/${billId}/pdf`)
  assert.equal(result.response.headers.get('content-type'), 'application/pdf')
  assert.ok((await result.response.arrayBuffer()).byteLength > 1000)
  result = await request(`/api/admin/bills/${billId}/paid`, { method: 'POST' })
  assert.equal(result.data.status, 'paid')
  result = await request('/api/admin/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'new-test-password-1234' }) })
  assert.equal(result.response.status, 200)
  const auditActions = (await pool.query('SELECT action FROM admin_events')).rows.map((row) => row.action)
  assert.ok(auditActions.includes('lead_status_contacted'))
  assert.ok(auditActions.includes('site_published'))
  assert.ok(auditActions.includes('password_changed'))
  console.log('Integration smoke test passed: lead, admin session, site publish, bill, PDF, payment, password change.')
} finally {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
}
