let csrfToken = ''

export function setCsrfToken(value) {
  csrfToken = value || ''
}

export async function api(url, options = {}) {
  const headers = { ...options.headers }
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) headers['x-csrf-token'] = csrfToken
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`)
  return data
}

export async function apiBlob(url, options = {}) {
  const headers = { ...options.headers }
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) headers['x-csrf-token'] = csrfToken
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || `Request failed (${response.status})`)
  }
  return response.blob()
}
