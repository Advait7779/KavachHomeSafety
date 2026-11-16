import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { pool, transaction } from './db.js'

const cookieName = 'kh_admin'
const sessionHours = 12
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/api/admin',
}
const secureCookie = (req) => req.secure || req.get('x-forwarded-proto') === 'https'

export async function bootstrapAdmin() {
  const { rows } = await pool.query('SELECT count(*)::int AS count FROM admin_users')
  if (rows[0].count !== 0) return
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (12-72 UTF-8 bytes) before starting.')
  }
  const hash = await bcrypt.hash(password, 12)
  await pool.query('INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)', [email, hash])
  console.log(`Initial admin account created for ${email}`)
}

export async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const csrfToken = crypto.randomBytes(24).toString('hex')
  await pool.query('DELETE FROM admin_sessions WHERE expires_at <= now()')
  await pool.query(
    "INSERT INTO admin_sessions (token_hash, user_id, csrf_token, expires_at) VALUES ($1, $2, $3, now() + interval '12 hours')",
    [tokenHash, user.id, csrfToken],
  )
  res.cookie(cookieName, token, { ...cookieOptions, secure: secureCookie(req), maxAge: sessionHours * 60 * 60 * 1000 })
  res.json({ user: { id: user.id, email: user.email }, csrfToken })
}

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[cookieName]
    if (!token) return res.status(401).json({ error: 'Sign in required' })
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const { rows } = await pool.query(
      "SELECT u.id, u.email, s.csrf_token FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now() AND s.last_seen_at > now() - interval '2 hours'",
      [tokenHash],
    )
    if (!rows[0]) return res.status(401).json({ error: 'Session expired' })
    await pool.query("UPDATE admin_sessions SET last_seen_at = now() WHERE token_hash = $1 AND last_seen_at < now() - interval '5 minutes'", [tokenHash])
    req.admin = rows[0]
    req.sessionHash = tokenHash
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('x-csrf-token') !== rows[0].csrf_token) {
      return res.status(403).json({ error: 'Invalid session token' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

export async function logout(req, res) {
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [req.sessionHash])
  res.clearCookie(cookieName, { ...cookieOptions, secure: secureCookie(req) })
  res.status(204).end()
}

export async function changePassword(req, res) {
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  if (newPassword.length < 12 || Buffer.byteLength(newPassword) > 72) return res.status(400).json({ error: 'New password must have 12-72 UTF-8 bytes' })
  const hash = await bcrypt.hash(newPassword, 12)
  const changed = await transaction(async (db) => {
    const { rows } = await db.query('SELECT password_hash FROM admin_users WHERE id = $1 FOR UPDATE', [req.admin.id])
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return false
    await db.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, req.admin.id])
    await db.query('DELETE FROM admin_sessions WHERE user_id = $1 AND token_hash <> $2', [req.admin.id, req.sessionHash])
    await db.query('INSERT INTO admin_events (admin_user_id, action) VALUES ($1, $2)', [req.admin.id, 'password_changed'])
    return true
  })
  if (!changed) return res.status(400).json({ error: 'Current password is incorrect' })
  res.json({ changed: true })
}
