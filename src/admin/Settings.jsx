import { useState } from 'react'
import { CheckCircle, Eye, EyeSlash, LockKey } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { api } from './api'

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete, minLength }) {
  return <div>
    <label htmlFor={id} className="admin-label">{label}</label>
    <div className="relative mt-2">
      <input id={id} type={visible ? 'text' : 'password'} className="admin-input !pr-12" required minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={onToggle} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-kavach-orange focus-visible:outline-2 focus-visible:outline-kavach-orange">
        {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
}

export default function Settings({ email }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setMessage(''); setError('')
    try {
      await api('/api/admin/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
      setCurrentPassword('')
      setNewPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setMessage('Password updated. Other sessions have been signed out.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="max-w-2xl space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-kavach-orange">Account settings</p><p className="mt-1 text-sm text-slate-400">Manage access to the admin panel.</p></div>
    <section className="admin-card p-6">
      <div className="mb-6 flex items-center gap-3"><div className="grey-inset flex h-10 w-10 items-center justify-center rounded-xl text-kavach-orange"><LockKey size={21} weight="duotone" /></div><div><h2 className="text-lg font-bold">Change password</h2><p className="text-xs text-slate-400">Signed in as {email}</p></div></div>
      <form onSubmit={submit} className="space-y-4">
        <PasswordField id="current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} visible={showCurrentPassword} onToggle={() => setShowCurrentPassword((show) => !show)} autoComplete="current-password" />
        <PasswordField id="new-password" label="New password" value={newPassword} onChange={setNewPassword} visible={showNewPassword} onToggle={() => setShowNewPassword((show) => !show)} autoComplete="new-password" minLength={6} />
        {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
        {message && <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle size={17} />{message}</p>}
        <button className="btn-primary rounded-xl text-xs" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button>
      </form>
    </section>
    <div className="admin-card p-6"><h2 className="mb-2 font-bold">Business settings</h2><p className="mb-4 text-sm text-slate-400">Phone numbers, address, branding, and bill details are managed with the website content.</p><Link to="/admin/site" className="admin-secondary">Edit business details</Link></div>
  </div>
}
