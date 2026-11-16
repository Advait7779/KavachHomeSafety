import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { SquaresFour, UsersThree, PaintBrush, Receipt, GearSix, SignOut, List, X, ArrowSquareOut } from '@phosphor-icons/react'
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
  { path: '/admin/bills', label: 'Estimates & Bills', icon: Receipt },
  { path: '/admin/settings', label: 'Settings', icon: GearSix },
]

function Login({ onLogin, business }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        <label className="admin-label">Password<input className="admin-input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
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
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api('/api/admin/auth/me').then((result) => { setCsrfToken(result.csrfToken); setUser(result.user) }).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => setMenuOpen(false), [location.pathname])

  async function logout() {
    try { await api('/api/admin/auth/logout', { method: 'POST' }) } catch { /* session may already be expired */ }
    setCsrfToken('')
    setUser(null)
    navigate('/admin')
  }

  if (loading) return <div className="min-h-screen bg-kavach-black text-kavach-orange flex items-center justify-center">Loading admin panel...</div>
  if (!user) return <Login onLogin={setUser} business={business} />

  const current = navigation.find((item) => item.path === location.pathname)?.label || (location.pathname.startsWith('/admin/bills') ? 'Bills' : 'Admin')
  return <div className="min-h-screen bg-kavach-black text-white flex">
    {menuOpen && <button className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-dvh w-64 overflow-y-auto bg-kavach-dark border-r border-kavach-border flex flex-col transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between border-b border-kavach-border"><Link to="/admin" className="flex items-center gap-3"><img src={business.logo} alt="" className="w-10 h-10 rounded-lg object-cover" /><div><p className="gradient-text text-lg font-bold">{business.name}</p><p className="text-[10px] uppercase tracking-widest text-slate-400">Admin panel</p></div></Link><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <nav className="p-4 space-y-1 flex-1" aria-label="Admin navigation">
        {navigation.map(({ path, label, icon: Icon }) => <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${location.pathname === path || (path === '/admin/bills' && location.pathname.startsWith(path + '/')) ? 'bg-kavach-orange/15 text-kavach-orange border border-kavach-orange/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={19} weight="duotone" />{label}</Link>)}
      </nav>
      <div className="p-4 border-t border-kavach-border space-y-2"><Link to="/" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white"><ArrowSquareOut size={18} /> View website</Link><button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white w-full"><SignOut size={18} /> Sign out</button><p className="text-[10px] text-slate-500 px-4 truncate">{user.email}</p></div>
    </aside>
    <div className="flex-1 min-w-0"><header className="h-16 sm:h-20 px-4 sm:px-8 border-b border-kavach-border flex items-center justify-between bg-kavach-dark/60"><div className="flex items-center gap-3"><button className="lg:hidden p-2 rounded-lg grey-inset" onClick={() => setMenuOpen(true)} aria-label="Open menu"><List size={20} /></button><h1 className="text-xl sm:text-2xl font-bold">{current}</h1></div><span className="hidden sm:block text-xs text-slate-400">Kavach management</span></header>
      <main className="p-4 sm:p-8 max-w-[1400px] mx-auto"><Routes><Route path="/admin" element={<Dashboard />} /><Route path="/admin/leads" element={<Leads />} /><Route path="/admin/site" element={<SiteEditor />} /><Route path="/admin/bills" element={<Bills />} /><Route path="/admin/bills/:id" element={<Bills />} /><Route path="/admin/settings" element={<Settings email={user.email} />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></main>
    </div>
  </div>
}
