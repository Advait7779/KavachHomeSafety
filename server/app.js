import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import crypto from 'node:crypto'
import { mkdir, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import defaultContent from '../shared/defaultContent.json' with { type: 'json' }
import { pool, transaction } from './db.js'
import { login, logout, requireAdmin, changePassword } from './auth.js'
import { calculateBill } from './billing.js'
import { streamBillPdf } from './pdf.js'
import { streamEstimatePdf } from './estimatePdf.js'
import { publicRoutes, siteOrigin } from './seo.js'
import { servePublicPage, serveAdminPage } from './html.js'

const app = express()
app.set('trust proxy', 1)
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads')
await mkdir(uploadDir, { recursive: true })

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ['https://www.google.com'],
      objectSrc: ["'none'"],
    },
  } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(uploadDir, { immutable: true, maxAge: '1y' }))
app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url)), { index: false }))
app.use('/api', (_req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next() })
app.use('/api/admin', (_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next() })
app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
}))

const leadInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{10,20}$/),
  service: z.string().trim().min(2).max(160),
  message: z.string().trim().max(2000).default(''),
  submissionKey: z.uuid(),
  website: z.string().max(0).optional(),
})
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false })
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false })
const uploadLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false })

app.get('/api/public/site', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT published, updated_at FROM site_content WHERE id = 1')
  res.set('Cache-Control', 'public, max-age=60')
  res.json(rows[0]?.published || defaultContent)
}))

app.post('/api/public/leads', leadLimiter, asyncRoute(async (req, res) => {
  const data = leadInput.parse(req.body)
  const { rows } = await pool.query(
    `INSERT INTO leads (submission_key, name, phone, service, message)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (submission_key) DO UPDATE SET submission_key = EXCLUDED.submission_key
     RETURNING id, created_at`,
    [data.submissionKey, data.name, data.phone, data.service, data.message],
  )
  res.status(201).json({ reference: `KH-${String(rows[0].id).padStart(6, '0')}`, createdAt: rows[0].created_at })
}))

app.post('/api/admin/auth/login', loginLimiter, asyncRoute(login))
app.use('/api/admin', requireAdmin)
app.get('/api/admin/auth/me', (req, res) => res.json({ user: { id: req.admin.id, email: req.admin.email }, csrfToken: req.admin.csrf_token }))
app.post('/api/admin/auth/logout', asyncRoute(logout))
app.post('/api/admin/auth/change-password', asyncRoute(changePassword))

app.get('/api/admin/dashboard', asyncRoute(async (_req, res) => {
  const [leads, recent, bills] = await Promise.all([
    pool.query(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status = 'new')::int AS new,
      count(*) FILTER (WHERE status IN ('contacted','survey_scheduled','quoted'))::int AS active,
      count(*) FILTER (WHERE status = 'won')::int AS won FROM leads`),
    pool.query('SELECT id, name, phone, service, status, created_at FROM leads ORDER BY created_at DESC LIMIT 6'),
    pool.query(`SELECT count(*) FILTER (WHERE status = 'issued' AND coalesce(estimate->>'type', 'invoice') = 'invoice')::int AS outstanding,
      count(*) FILTER (WHERE status = 'paid' AND coalesce(estimate->>'type', 'invoice') = 'invoice')::int AS paid,
      coalesce(sum(total) FILTER (WHERE status = 'issued' AND coalesce(estimate->>'type', 'invoice') = 'invoice'), 0) AS outstanding_total FROM bills WHERE deleted_at IS NULL`),
  ])
  res.json({ leads: leads.rows[0], recent: recent.rows, bills: bills.rows[0] })
}))

const leadStatus = z.enum(['new', 'contacted', 'survey_scheduled', 'quoted', 'won', 'lost'])
app.get('/api/admin/leads', asyncRoute(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = 20
  const status = req.query.status && leadStatus.safeParse(req.query.status).success ? req.query.status : null
  const search = String(req.query.search || '').trim().slice(0, 100)
  const values = [status, `%${search}%`, limit, (page - 1) * limit]
  const where = `WHERE ($1::text IS NULL OR status = $1) AND ($2 = '%%' OR name ILIKE $2 OR phone ILIKE $2 OR service ILIKE $2)`
  const [items, count] = await Promise.all([
    pool.query(`SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $3 OFFSET $4`, values),
    pool.query(`SELECT count(*)::int AS total FROM leads ${where}`, values.slice(0, 2)),
  ])
  res.json({ items: items.rows, total: count.rows[0].total, page, pages: Math.ceil(count.rows[0].total / limit) })
}))
app.get('/api/admin/leads/:id', asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Lead not found' })
  const notes = await pool.query('SELECT n.*, u.email AS author FROM lead_notes n JOIN admin_users u ON u.id = n.admin_user_id WHERE lead_id = $1 ORDER BY n.created_at DESC', [req.params.id])
  res.json({ ...rows[0], notes: notes.rows })
}))
app.patch('/api/admin/leads/:id', asyncRoute(async (req, res) => {
  const status = leadStatus.parse(req.body?.status)
  const lead = await transaction(async (db) => {
    const { rows } = await db.query('UPDATE leads SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, req.params.id])
    if (!rows[0]) return null
    await db.query('INSERT INTO admin_events (admin_user_id, action, record_id) VALUES ($1, $2, $3)', [req.admin.id, `lead_status_${status}`, String(rows[0].id)])
    return rows[0]
  })
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  res.json(lead)
}))
app.post('/api/admin/leads/:id/notes', asyncRoute(async (req, res) => {
  const body = z.string().trim().min(1).max(2000).parse(req.body?.body)
  const { rows } = await pool.query('INSERT INTO lead_notes (lead_id, admin_user_id, body) VALUES ($1, $2, $3) RETURNING *', [req.params.id, req.admin.id, body])
  res.status(201).json(rows[0])
}))

app.get('/api/admin/site', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT draft, published, updated_at FROM site_content WHERE id = 1')
  res.json(rows[0])
}))
const siteContentInput = z.object({
  business: z.object({ name: z.string().min(1), tagline: z.string(), phone: z.string().min(10), secondaryPhone: z.string(), whatsapp: z.string().min(10), address: z.string(), logo: z.string().min(1), gstin: z.string(), paymentDetails: z.string(), billTerms: z.string() }),
  home: z.object({ eyebrow: z.string(), titleLine1: z.string(), titleHighlight: z.string(), titleLine2: z.string(), description: z.string(), heroImage: z.string().min(1), ctaTitle: z.string(), ctaDescription: z.string(), stats: z.array(z.object({ value: z.coerce.number(), suffix: z.string(), label: z.string() })).max(6) }),
  contact: z.object({ heading: z.string(), intro: z.string(), formIntro: z.string(), mapUrl: z.url().refine((value) => value.startsWith('https://www.google.com/maps/embed?')), enquiryOptions: z.array(z.string().min(1)).min(1).max(30) }),
  services: z.array(z.object({ id: z.string(), title: z.string(), tagline: z.string(), image: z.string().min(1), description: z.string(), features: z.array(z.string()) })).max(30),
  gallery: z.array(z.object({ src: z.string().min(1), title: z.string(), category: z.string(), location: z.string() })).max(100),
  reviews: z.array(z.object({ id: z.number(), name: z.string(), location: z.string(), service: z.string(), date: z.string(), text: z.string() })).max(100),
  seo: z.object(Object.fromEntries(['home', 'services', 'gallery', 'contact'].map((route) => [route, z.object({
    title: z.string().trim().min(15).max(100),
    description: z.string().trim().min(50).max(250),
    image: z.string().trim().min(1).max(500),
  })]))),
})
app.put('/api/admin/site/draft', asyncRoute(async (req, res) => {
  const content = siteContentInput.parse(req.body)
  await pool.query('UPDATE site_content SET draft = $1, updated_at = now() WHERE id = 1', [JSON.stringify(content)])
  res.json({ saved: true })
}))
app.post('/api/admin/site/publish', asyncRoute(async (req, res) => {
  await transaction(async (db) => {
    const { rows } = await db.query('SELECT draft FROM site_content WHERE id = 1 FOR UPDATE')
    await db.query('UPDATE site_content SET published = $1, updated_at = now() WHERE id = 1', [rows[0].draft])
    await db.query('INSERT INTO site_revisions (content, published_by) VALUES ($1, $2)', [rows[0].draft, req.admin.id])
    await db.query('INSERT INTO admin_events (admin_user_id, action, record_id) VALUES ($1, $2, $3)', [req.admin.id, 'site_published', '1'])
  })
  res.json({ published: true })
}))
app.post('/api/admin/site/rollback', asyncRoute(async (req, res) => {
  const revisionId = z.coerce.number().int().positive().parse(req.body?.revisionId)
  const restored = await transaction(async (db) => {
    const { rows } = await db.query('SELECT content FROM site_revisions WHERE id = $1', [revisionId])
    if (!rows[0]) return false
    await db.query('UPDATE site_content SET draft = $1, published = $1, updated_at = now() WHERE id = 1', [rows[0].content])
    await db.query('INSERT INTO admin_events (admin_user_id, action, record_id) VALUES ($1, $2, $3)', [req.admin.id, 'site_rolled_back', String(revisionId)])
    return true
  })
  if (!restored) return res.status(404).json({ error: 'Revision not found' })
  res.json({ restored: true })
}))
app.get('/api/admin/site/revisions', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, published_at FROM site_revisions ORDER BY published_at DESC LIMIT 20')
  res.json(rows)
}))

const uploader = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[file.mimetype] || '.bin'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
})
app.get('/api/admin/media', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 100')
  res.json(rows)
}))
app.post('/api/admin/media', uploadLimiter, uploader.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG, or WebP image under 5 MB' })
  const header = (await readFile(req.file.path)).subarray(0, 16)
  const valid = req.file.mimetype === 'image/jpeg' && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    || req.file.mimetype === 'image/png' && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || req.file.mimetype === 'image/webp' && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'
  if (!valid) {
    await unlink(req.file.path)
    return res.status(400).json({ error: 'File content does not match the selected image type' })
  }
  const url = `/uploads/${req.file.filename}`
  try {
    const { rows } = await pool.query('INSERT INTO media_assets (storage_key, original_name, mime_type, alt_text) VALUES ($1, $2, $3, $4) RETURNING *', [url, req.file.originalname, req.file.mimetype, String(req.body.altText || '').slice(0, 200)])
    res.status(201).json({ ...rows[0], url })
  } catch (error) {
    await unlink(req.file.path)
    throw error
  }
}))

const estimateText = (max = 2000) => z.string().trim().max(max).default('')
const estimateInput = z.object({
  type: z.enum(['estimate', 'invoice']),
  number: estimateText(80),
  company: z.object({
    name: z.string().trim().min(1).max(160),
    address: estimateText(500),
    website: estimateText(160),
    iso: estimateText(100),
    phone: estimateText(60),
    email: estimateText(160),
    gstin: estimateText(60),
    state: estimateText(100),
    logo: estimateText(500),
  }).optional(),
  description: estimateText(),
  paymentTerms: estimateText(),
  terms: estimateText(),
  amountWords: estimateText(500),
})

const billInput = z.object({
  leadId: z.coerce.number().int().positive().nullable().optional(),
  customer: z.object({ name: z.string().trim().min(2).max(160), phone: z.string().trim().max(60).default(''), address: z.string().trim().max(500).default('') }),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(2000).default(''),
  estimate: estimateInput.optional(),
  discount: z.coerce.number().min(0).max(100000000).default(0),
  items: z.array(z.object({ description: z.string().trim().min(1).max(500), itemCode: estimateText(80), quantity: z.coerce.number().positive().max(100000), unit: z.string().trim().min(1).max(30), unitPrice: z.coerce.number().min(0).max(100000000) })).min(1).max(50),
}).transform((data) => ({ ...data, dueDate: data.estimate?.type === 'estimate' ? null : data.dueDate }))

const draftNumber = (max) => z.union([z.number().finite(), z.string().trim().max(32)])
  .refine((value) => String(value).trim() === '' || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max))
const draftEstimateInput = estimateInput.safeExtend({
  company: estimateInput.shape.company.unwrap().safeExtend({ name: estimateText(160) }).optional(),
})
const draftInput = z.object({
  leadId: z.coerce.number().int().positive().nullable().optional(),
  customer: z.object({ name: estimateText(160), phone: estimateText(60), address: estimateText(500) }),
  issueDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  dueDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  notes: estimateText(),
  estimate: draftEstimateInput.optional(),
  discount: draftNumber(100000000),
  items: z.array(z.object({
    description: estimateText(500), itemCode: estimateText(80), quantity: draftNumber(100000),
    unit: estimateText(30), unitPrice: draftNumber(100000000),
  })).max(50),
}).transform((data) => ({ ...data, dueDate: data.estimate?.type === 'estimate' ? null : data.dueDate }))

function savedDocumentInput(body) {
  const saveProgress = body?.saveProgress === true
  const data = (saveProgress ? draftInput : billInput).parse(body)
  const items = saveProgress ? data.items.map((item) => ({
    ...item, quantity: Number(item.quantity) || 0, unitPrice: Number(item.unitPrice) || 0,
  })) : data.items
  const totals = calculateBill(items, Number(data.discount) || 0)
  return { data, items, totals: saveProgress ? { ...totals, total: Math.max(0, totals.total) } : totals, saveProgress }
}

const documentStore = {
  bill: { table: 'bills', items: 'bill_items', events: 'bill_events', foreignKey: 'bill_id', type: 'invoice' },
  estimate: { table: 'estimates', items: 'estimate_items', events: 'estimate_events', foreignKey: 'estimate_id', type: 'estimate' },
}

async function getDocument(kind, id, db = pool) {
  const store = documentStore[kind]
  const convertedJoin = kind === 'estimate'
    ? 'LEFT JOIN bills converted ON converted.source_estimate_id = d.id AND converted.deleted_at IS NULL'
    : ''
  const convertedColumn = kind === 'estimate' ? 'converted.id' : 'NULL::bigint'
  const { rows } = await db.query(`SELECT d.*, ${convertedColumn} AS converted_bill_id FROM ${store.table} d
    ${convertedJoin} WHERE d.id = $1 AND d.deleted_at IS NULL`, [id])
  if (!rows[0]) return null
  const items = await db.query(`SELECT * FROM ${store.items} WHERE ${store.foreignKey} = $1 ORDER BY sort_order`, [id])
  return { ...rows[0], items: items.rows }
}

async function writeItems(db, kind, documentId, items) {
  const store = documentStore[kind]
  await db.query(`DELETE FROM ${store.items} WHERE ${store.foreignKey} = $1`, [documentId])
  for (const [index, item] of items.entries()) {
    await db.query(`INSERT INTO ${store.items} (${store.foreignKey}, description, item_code, quantity, unit, unit_price, tax_rate, sort_order) VALUES ($1,$2,$3,$4,$5,$6,0,$7)`, [documentId, item.description, item.itemCode, item.quantity, item.unit, item.unitPrice, index])
  }
}

for (const kind of ['estimate', 'bill']) {
  const store = documentStore[kind]
  const label = kind === 'estimate' ? 'Estimate' : 'Bill'
  const base = kind === 'estimate' ? '/api/admin/estimates' : '/api/admin/bills'

  app.get(base, asyncRoute(async (_req, res) => {
    const convertedJoin = kind === 'estimate'
      ? 'LEFT JOIN bills converted ON converted.source_estimate_id = d.id AND converted.deleted_at IS NULL'
      : ''
    const convertedColumn = kind === 'estimate' ? 'converted.id' : 'NULL::bigint'
    const { rows } = await pool.query(`SELECT d.id, ${kind === 'bill' ? 'd.bill_number' : 'NULL::text AS bill_number'},
      ${kind === 'bill' ? 'd.source_estimate_id' : 'NULL::bigint AS source_estimate_id'}, ${convertedColumn} AS converted_bill_id,
      (d.draft_data IS NOT NULL) AS has_unfinished_fields, d.status, d.customer, d.estimate,
      d.issue_date, d.due_date, d.total, d.created_at FROM ${store.table} d ${convertedJoin}
      WHERE d.deleted_at IS NULL ORDER BY d.created_at DESC LIMIT 100`)
    res.json(rows)
  }))

  app.post(`${base}/preview`, asyncRoute(async (req, res) => {
    const data = billInput.parse(req.body)
    if (data.estimate?.type && data.estimate.type !== store.type) return res.status(400).json({ error: `Use the ${label.toLowerCase()} section for this document` })
    const totals = calculateBill(data.items, data.discount)
    if (totals.total < 0) return res.status(400).json({ error: 'Discount exceeds the document amount' })
    const { rows } = await pool.query('SELECT published FROM site_content WHERE id = 1')
    const document = {
      id: 0, bill_number: null, business: rows[0].published.business,
      estimate: { ...data.estimate, type: store.type }, customer: data.customer,
      issue_date: data.issueDate, due_date: kind === 'estimate' ? null : data.dueDate,
      notes: data.notes, subtotal: totals.subtotal, discount: totals.discount,
      tax_total: totals.taxTotal, total: totals.total,
      items: data.items.map((item) => ({ description: item.description, item_code: item.itemCode, quantity: item.quantity, unit: item.unit, unit_price: item.unitPrice, tax_rate: 0 })),
    }
    if (kind === 'estimate') await streamEstimatePdf(res, document)
    else await streamBillPdf(res, document)
  }))

  app.post(base, asyncRoute(async (req, res) => {
    const { data, items, totals, saveProgress } = savedDocumentInput(req.body)
    if (data.estimate?.type && data.estimate.type !== store.type) return res.status(400).json({ error: `Use the ${label.toLowerCase()} section for this document` })
    if (!saveProgress && totals.total < 0) return res.status(400).json({ error: 'Discount exceeds the document amount' })
    data.estimate = { ...data.estimate, type: store.type }
    const document = await transaction(async (db) => {
      const site = await db.query('SELECT published FROM site_content WHERE id = 1')
      const business = site.rows[0].published.business
      const { rows } = await db.query(
        `INSERT INTO ${store.table} (lead_id, customer, business, estimate, draft_data, issue_date, due_date, notes, subtotal, discount, tax_total, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [data.leadId || null, data.customer, business, data.estimate, saveProgress ? data : null, data.issueDate || null,
          kind === 'estimate' ? null : data.dueDate || null, data.notes, totals.subtotal, totals.discount, totals.taxTotal, totals.total],
      )
      if (kind === 'estimate' && !data.estimate.number) {
        data.estimate.number = `KAV-EST-${data.issueDate?.slice(0, 4) || new Date().getFullYear()}-${String(rows[0].id).padStart(4, '0')}`
        await db.query('UPDATE estimates SET estimate = $1 WHERE id = $2', [data.estimate, rows[0].id])
      }
      await writeItems(db, kind, rows[0].id, items)
      await db.query(`INSERT INTO ${store.events} (${store.foreignKey}, admin_user_id, action) VALUES ($1,$2,$3)`, [rows[0].id, req.admin.id, 'created'])
      return getDocument(kind, rows[0].id, db)
    })
    res.status(201).json(document)
  }))

  app.get(`${base}/:id`, asyncRoute(async (req, res) => {
    const document = await getDocument(kind, req.params.id)
    if (!document) return res.status(404).json({ error: `${label} not found` })
    res.json(document)
  }))

  app.patch(`${base}/:id`, asyncRoute(async (req, res) => {
    const { data, items, totals, saveProgress } = savedDocumentInput(req.body)
    if (data.estimate?.type && data.estimate.type !== store.type) return res.status(400).json({ error: `Use the ${label.toLowerCase()} section for this document` })
    if (!saveProgress && totals.total < 0) return res.status(400).json({ error: 'Discount exceeds the document amount' })
    data.estimate = { ...data.estimate, type: store.type }
    const document = await transaction(async (db) => {
      const existing = await db.query(`SELECT status, estimate FROM ${store.table} WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [req.params.id])
      if (!existing.rows[0]) return null
      if (existing.rows[0].status !== 'draft') return 'locked'
      if (kind === 'estimate' && !data.estimate.number) data.estimate.number = existing.rows[0].estimate?.number || ''
      await db.query(`UPDATE ${store.table} SET lead_id=$1, customer=$2, estimate=$3, draft_data=$4, issue_date=$5, due_date=$6, notes=$7,
        subtotal=$8, discount=$9, tax_total=$10, total=$11, updated_at=now() WHERE id=$12`,
        [data.leadId || null, data.customer, data.estimate, saveProgress ? data : null, data.issueDate || null,
          kind === 'estimate' ? null : data.dueDate || null, data.notes, totals.subtotal, totals.discount, totals.taxTotal, totals.total, req.params.id])
      await writeItems(db, kind, req.params.id, items)
      return getDocument(kind, req.params.id, db)
    })
    if (!document) return res.status(404).json({ error: `${label} not found` })
    if (document === 'locked') return res.status(409).json({ error: `Only draft ${kind}s can be edited` })
    res.json(document)
  }))

  app.post(`${base}/:id/issue`, asyncRoute(async (req, res) => {
    const result = await transaction(async (db) => {
      const existing = await db.query(`SELECT status, draft_data FROM ${store.table} WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [req.params.id])
      if (!existing.rows[0]) return 'missing'
      if (existing.rows[0].status !== 'draft') return 'locked'
      if (existing.rows[0].draft_data) return 'incomplete'
      if (kind === 'bill') {
        const sequence = await db.query("SELECT nextval('bill_number_seq') AS value")
        const year = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date())
        const number = `KH-${year}-${String(sequence.rows[0].value).padStart(5, '0')}`
        await db.query("UPDATE bills SET status='issued', bill_number=$1, issue_date=coalesce(issue_date, (now() AT TIME ZONE 'Asia/Kolkata')::date), updated_at=now() WHERE id=$2", [number, req.params.id])
      } else {
        await db.query("UPDATE estimates SET status='issued', issue_date=coalesce(issue_date, (now() AT TIME ZONE 'Asia/Kolkata')::date), updated_at=now() WHERE id=$1", [req.params.id])
      }
      await db.query(`INSERT INTO ${store.events} (${store.foreignKey}, admin_user_id, action) VALUES ($1,$2,$3)`, [req.params.id, req.admin.id, 'issued'])
      return getDocument(kind, req.params.id, db)
    })
    if (result === 'missing') return res.status(404).json({ error: `${label} not found` })
    if (result === 'locked') return res.status(409).json({ error: `${label} is already issued` })
    if (result === 'incomplete') return res.status(409).json({ error: 'Complete and save this draft before issuing it' })
    res.json(result)
  }))

  for (const action of kind === 'bill' ? ['paid', 'void'] : ['void']) {
    app.post(`${base}/:id/${action}`, asyncRoute(async (req, res) => {
      const { rows } = await pool.query(`UPDATE ${store.table} SET status=$1, updated_at=now() WHERE id=$2 AND status='issued' AND deleted_at IS NULL RETURNING *`, [action, req.params.id])
      if (!rows[0]) return res.status(409).json({ error: `Only issued ${kind}s can change status` })
      await pool.query(`INSERT INTO ${store.events} (${store.foreignKey}, admin_user_id, action) VALUES ($1,$2,$3)`, [req.params.id, req.admin.id, action])
      res.json(rows[0])
    }))
  }

  app.delete(`${base}/:id`, asyncRoute(async (req, res) => {
    const deleted = await transaction(async (db) => {
      const { rows } = await db.query(`UPDATE ${store.table} SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.id])
      if (!rows[0]) return false
      await db.query(`INSERT INTO ${store.events} (${store.foreignKey}, admin_user_id, action) VALUES ($1, $2, $3)`, [req.params.id, req.admin.id, 'deleted'])
      await db.query('INSERT INTO admin_events (admin_user_id, action, record_id) VALUES ($1, $2, $3)', [req.admin.id, `${kind}_deleted`, String(req.params.id)])
      return true
    })
    if (!deleted) return res.status(404).json({ error: `${label} not found` })
    res.status(204).end()
  }))

  app.get(`${base}/:id/pdf`, asyncRoute(async (req, res) => {
    const document = await getDocument(kind, req.params.id)
    if (!document) return res.status(404).json({ error: `${label} not found` })
    if (document.draft_data) return res.status(409).json({ error: 'Complete and save this draft before downloading its PDF' })
    if (kind === 'estimate') await streamEstimatePdf(res, document)
    else await streamBillPdf(res, document)
  }))
}

app.post('/api/admin/estimates/:id/convert', asyncRoute(async (req, res) => {
  const result = await transaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM estimates WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [req.params.id])
    const source = rows[0]
    if (!source) return { error: 'Estimate not found', status: 404 }
    if (source.status === 'void') return { error: 'Cancelled estimates cannot be converted', status: 409 }
    if (source.draft_data) return { error: 'Complete and save the estimate before converting it', status: 409 }
    const existing = await db.query('SELECT id FROM bills WHERE source_estimate_id = $1 AND deleted_at IS NULL', [source.id])
    if (existing.rows[0]) return { bill: await getDocument('bill', existing.rows[0].id, db), created: false }
    const site = await db.query('SELECT published FROM site_content WHERE id = 1')
    const business = site.rows[0].published.business
    const converted = await db.query(`INSERT INTO bills
      (source_estimate_id, lead_id, customer, business, estimate, issue_date, notes, subtotal, discount, tax_total, total)
      VALUES ($1, $2, $3, $4, $5, (now() AT TIME ZONE 'Asia/Kolkata')::date, '', $6, $7, 0, $8) RETURNING id`,
      [source.id, source.lead_id, source.customer, business, { type: 'invoice' }, source.subtotal, source.discount, source.total])
    const billId = converted.rows[0].id
    await db.query(`INSERT INTO bill_items (bill_id, description, item_code, quantity, unit, unit_price, tax_rate, sort_order)
      SELECT $1, description, item_code, quantity, unit, unit_price, 0, sort_order FROM estimate_items WHERE estimate_id = $2 ORDER BY sort_order`,
      [billId, source.id])
    await db.query('INSERT INTO bill_events (bill_id, admin_user_id, action) VALUES ($1, $2, $3)', [billId, req.admin.id, 'converted_from_estimate'])
    await db.query('INSERT INTO admin_events (admin_user_id, action, record_id) VALUES ($1, $2, $3)', [req.admin.id, 'estimate_converted', String(source.id)])
    return { bill: await getDocument('bill', billId, db), created: true }
  })
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.status(result.created ? 201 : 200).json(result.bill)
}))

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`)
})
app.get('/sitemap.xml', (req, res) => {
  const origin = siteOrigin(req)
  const urls = Object.keys(publicRoutes).map((route) => `  <url><loc>${origin}${route}</loc></url>`).join('\n')
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`)
})
app.get(/^\/admin(?:\/.*)?$/, asyncRoute(serveAdminPage))
app.get(/.*/, asyncRoute(async (req, res) => {
  if (await servePublicPage(req, res)) return
  res.status(404).type('text/plain').send('Page not found')
}))

app.use((error, _req, res, _next) => {
  if (error.status === 400) return res.status(400).json({ error: error.message })
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'Please check the form fields', details: error.issues })
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.message })
  if (error.code === '23503' || error.code === '22P02') return res.status(400).json({ error: 'Invalid record reference' })
  console.error(error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

export default app
