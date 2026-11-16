import { useState } from 'react'
import { LockKey, CheckCircle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { api } from './api'

export default function Settings({ email }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setMessage(''); setError('')
    try {
      await api('/api/admin/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
      setCurrentPassword(''); setNewPassword(''); setMessage('Password updated. Other sessions have been signed out.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="space-y-5 max-w-2xl"><div><p className="text-kavach-orange text-xs font-semibold uppercase tracking-widest">Account settings</p><p className="text-sm text-slate-400 mt-1">Manage access to the admin panel.</p></div><section className="admin-card p-6"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl grey-inset text-kavach-orange flex items-center justify-center"><LockKey size={21} weight="duotone" /></div><div><h2 className="font-bold text-lg">Change password</h2><p className="text-xs text-slate-400">Signed in as {email}</p></div></div><form onSubmit={submit} className="space-y-4"><label className="admin-label">Current password<input type="password" className="admin-input mt-2" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" /></label><label className="admin-label">New password<input type="password" className="admin-input mt-2" required minLength={12} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /></label>{error && <p className="text-rose-400 text-sm" role="alert">{error}</p>}{message && <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={17} />{message}</p>}<button className="btn-primary rounded-xl text-xs" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button></form></section><div className="admin-card p-6"><h2 className="font-bold mb-2">Business settings</h2><p className="text-sm text-slate-400 mb-4">Phone numbers, address, branding, and bill details are managed with the website content.</p><Link to="/admin/site" className="admin-secondary">Edit business details</Link></div></div>
}
