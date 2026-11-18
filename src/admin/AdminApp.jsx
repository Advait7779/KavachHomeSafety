import { useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { SquaresFour, UsersThree, PaintBrush, Receipt, FileText, GearSix, SignOut, List, X, ArrowSquareOut, Eye, EyeSlash } from '@phosphor-icons/react'
import { api, setCsrfToken } from './api'
import Dashboard from './Dashboard'
import Leads from './Leads'
import SiteEditor from './SiteEditor'
import Bills from './BillsAndEstimates'
import Settings from './Settings'
import { useSite } from '../site/SiteContext'

const navigation = [
  { path: '/admin', label: 'Dashboard', icon: SquaresFour },
  { path: '/admin/leads', label: 'Leads', icon: UsersThree },
  { path: '/admin/site', label: 'Site content', icon: PaintBrush },
  { path: '/admin/estimates', label: 'Estimates', icon: FileText },
  { path: '/admin/bills', label: 'Bills', icon: Receipt },
  { path: '/admin/settings', label: 'Settings', icon: GearSix },
]

function SignOutDialog({ onCancel, onConfirm, busy }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={messageId} onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-kavach-border bg-kavach-card p-0 font-sans text-white shadow-2xl backdrop:bg-black/75">
    <div className="flex items-start gap-3 border-b border-kavach-border px-5 py-5 sm:px-6">
      <span className="rounded-xl bg-kavach-orange/10 p-2 text-kavach-orange"><SignOut size={21} /></span>
      <div><h2 id={titleId} className="text-lg font-bold">Sign out?</h2><p id={messageId} className="mt-2 text-sm leading-6 text-slate-300">You’ll need to sign in again to access the admin panel.</p></div>
    </div>
    <div className="flex justify-end gap-2 px-5 py-4 sm:px-6">
      <button type="button" onClick={onCancel} disabled={busy} autoFocus className="admin-secondary">Stay signed in</button>
      <button type="button" onClick={onConfirm} disabled={busy} className="btn-primary inline-flex items-center gap-2 rounded-lg text-xs"><SignOut size={16} />{busy ? 'Signing out...' : 'Sign out'}</button>
    </div>
  </dialog>
}

function Login({ onLogin, business }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setCsrfToken(result.csrfToken)
      onLogin(result.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return <div className="min-h-screen bg-kavach-black text-white flex items-center justify-center px-4">
    <div className="admin-card w-full max-w-md p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-8"><img src={business.logo} alt={business.name} className="w-12 h-12 rounded-xl object-cover" /><div><p className="gradient-text text-xl font-extrabold">{business.name}</p><p className="text-xs text-slate-400 uppercase tracking-widest">Admin panel</p></div></div>
      <h1 className="text-3xl font-bold mb-2">Welcome back</h1><p className="text-sm text-slate-400 mb-7">Sign in to manage enquiries, your site and bills.</p>
      <form onSubmit={submit} className="space-y-5">
        <label className="admin-label">Email<input className="admin-input mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <div><label className="admin-label" htmlFor="admin-password">Password</label><div className="relative mt-2"><input id="admin-password" className="admin-input !pr-12" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-kavach-orange focus-visible:outline-2 focus-visible:outline-kavach-orange">{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button></div></div>
        {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
        <button className="btn-primary w-full rounded-xl" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <Link to="/" className="text-xs text-slate-400 hover:text-kavach-orange inline-flex mt-7">← Back to website</Link>
    </div>
  </div>
}

export default function AdminApp() {
  const { business } = useSite()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api('/api/admin/auth/me').then((result) => { setCsrfToken(result.csrfToken); setUser(result.user) }).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => setMenuOpen(false), [location.pathname])

  async function logout() {
    setSigningOut(true)
    try { await api('/api/admin/auth/logout', { method: 'POST' }) } catch { /* session may already be expired */ }
    setCsrfToken('')
    setUser(null)
    setConfirmSignOut(false)
    setSigningOut(false)
    navigate('/admin')
  }

  if (loading) return <div className="min-h-screen bg-kavach-black text-kavach-orange flex items-center justify-center">Loading admin panel...</div>
  if (!user) return <Login onLogin={setUser} business={business} />

  const current = navigation.find((item) => item.path === location.pathname)?.label || (location.pathname.startsWith('/admin/bills/') ? 'Bills' : location.pathname.startsWith('/admin/estimates/') ? 'Estimates' : 'Admin')
  return <div className="min-h-screen bg-kavach-black text-white flex">
    {menuOpen && <button className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-dvh w-64 overflow-y-auto bg-kavach-dark border-r border-kavach-border flex flex-col transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between border-b border-kavach-border"><Link to="/admin" className="flex items-center gap-3"><img src={business.logo} alt="" className="w-10 h-10 rounded-lg object-cover" /><div><p className="gradient-text text-lg font-bold">{business.name}</p><p className="text-[10px] uppercase tracking-widest text-slate-400">Admin panel</p></div></Link><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <nav className="p-4 space-y-1 flex-1" aria-label="Admin navigation">
        {navigation.map(({ path, label, icon: Icon }) => <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path + '/')) ? 'bg-kavach-orange/15 text-kavach-orange border border-kavach-orange/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={19} weight="duotone" />{label}</Link>)}
      </nav>
      <div className="p-4 border-t border-kavach-border space-y-2"><Link to="/" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white"><ArrowSquareOut size={18} /> View website</Link><button onClick={() => setConfirmSignOut(true)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white w-full"><SignOut size={18} /> Sign out</button><p className="text-[10px] text-slate-500 px-4 truncate">{user.email}</p></div>
    </aside>
    <div className="flex-1 min-w-0"><header className="h-16 sm:h-20 px-4 sm:px-8 border-b border-kavach-border flex items-center justify-between bg-kavach-dark/60"><div className="flex items-center gap-3"><button className="lg:hidden p-2 rounded-lg grey-inset" onClick={() => setMenuOpen(true)} aria-label="Open menu"><List size={20} /></button><h1 className="text-xl sm:text-2xl font-bold">{current}</h1></div><span className="hidden sm:block text-xs text-slate-400">Kavach management</span></header>
      <main className="p-4 sm:p-8 max-w-[1400px] mx-auto"><Routes><Route path="/admin" element={<Dashboard />} /><Route path="/admin/leads" element={<Leads />} /><Route path="/admin/site" element={<SiteEditor />} /><Route path="/admin/estimates" element={<Bills kind="estimate" />} /><Route path="/admin/estimates/:id" element={<Bills kind="estimate" />} /><Route path="/admin/bills" element={<Bills kind="bill" />} /><Route path="/admin/bills/:id" element={<Bills kind="bill" />} /><Route path="/admin/settings" element={<Settings email={user.email} />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></main>
    </div>
    {confirmSignOut && <SignOutDialog onCancel={() => setConfirmSignOut(false)} onConfirm={logout} busy={signingOut} />}
  </div>
}
