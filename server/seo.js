import defaultContent from '../shared/defaultContent.json' with { type: 'json' }

export const publicRoutes = {
  '/': 'home',
  '/services': 'services',
  '/gallery': 'gallery',
  '/contact': 'contact',
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

const safeJson = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029')

export function siteOrigin(req) {
  const configured = process.env.PUBLIC_SITE_URL?.trim()
  if (configured) {
    const url = new URL(configured)
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('PUBLIC_SITE_URL must use HTTP or HTTPS')
    return url.origin
  }
  return `${req.protocol}://${req.get('host')}`
}

function fullUrl(origin, value) {
  try { return new URL(value, origin).href } catch { return new URL('/', origin).href }
}

function localBusiness(content, origin) {
  const business = content.business
  const digits = String(business.phone || '').replace(/\D/g, '')
  const number = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${origin}/#business`,
    name: business.name,
    url: `${origin}/`,
    telephone: `+91${number}`,
    logo: fullUrl(origin, business.logo),
    image: fullUrl(origin, content.home.heroImage),
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Pune',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
  }
}

export function seoHead(route, content, origin) {
  const page = content.seo?.[publicRoutes[route]] || defaultContent.seo[publicRoutes[route]]
  const canonical = `${origin}${route}`
  const image = fullUrl(origin, page.image)
  const fields = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ]
  if (route === '/' || route === '/contact') {
    fields.push(`<script type="application/ld+json">${safeJson(localBusiness(content, origin))}</script>`)
  }
  return fields.join('\n    ')
}

export function renderDocument(template, route, content, origin, body) {
  const withoutGenericHead = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/gi, '')
  const withHead = withoutGenericHead.replace('</head>', `    ${seoHead(route, content, origin)}\n  </head>`)
  return withHead.replace('<div id="root"></div>', `<div id="root">${body}</div>\n    <script id="site-content" type="application/json">${safeJson(content)}</script>`)
}
