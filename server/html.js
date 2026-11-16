import { readFile } from 'node:fs/promises'
import { publicRoutes, renderDocument, siteOrigin } from './seo.js'
import { pool } from './db.js'

let templatePromise
let rendererPromise

async function assets() {
  templatePromise ||= readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  rendererPromise ||= import('../dist-server/entry-server.js')
  return Promise.all([templatePromise, rendererPromise])
}

export async function servePublicPage(req, res) {
  const route = req.path !== '/' ? req.path.replace(/\/$/, '') : '/'
  if (!publicRoutes[route]) return false
  const origin = siteOrigin(req)
  const localPreview = ['localhost', '127.0.0.1'].includes(req.hostname)
  if (process.env.PUBLIC_SITE_URL && !localPreview && `${req.protocol}://${req.get('host')}` !== origin) {
    res.redirect(308, `${origin}${route}`)
    return true
  }
  const [{ rows }, [template, { render }]] = await Promise.all([
    pool.query('SELECT published FROM site_content WHERE id = 1'),
    assets(),
  ])
  const content = rows[0].published
  const html = renderDocument(template, route, content, origin, render(route, content))
  res.set('Cache-Control', 'public, max-age=0, must-revalidate')
  res.type('html').send(html)
  return true
}

export async function serveAdminPage(req, res) {
  const [template] = await assets()
  res.set('X-Robots-Tag', 'noindex, nofollow')
  res.set('Cache-Control', 'private, no-store')
  res.type('html').send(template.replace('</head>', '    <meta name="robots" content="noindex,nofollow" />\n  </head>'))
}
