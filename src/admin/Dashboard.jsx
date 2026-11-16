import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Receipt, TrendUp, UsersThree } from '@phosphor-icons/react'
import { api } from './api'

const date = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/api/admin/dashboard').then(setData).catch((err) => setError(err.message)) }, [])
  if (error) return <div className="admin-card p-6 text-rose-400">{error}</div>
  if (!data) return <p className="text-slate-400">Loading dashboard...</p>
  const cards = [
    { label: 'Total leads', value: data.leads.total, icon: UsersThree, to: '/admin/leads' },
    { label: 'New enquiries', value: data.leads.new, icon: Clock, to: '/admin/leads?status=new' },
    { label: 'Active leads', value: data.leads.active, icon: TrendUp, to: '/admin/leads' },
    { label: 'Outstanding bills', value: data.bills.outstanding, icon: Receipt, to: '/admin/bills' },
  ]
  return <div className="space-y-7">
    <div><p className="text-kavach-orange uppercase tracking-widest text-xs font-semibold mb-2">Overview</p><h2 className="text-2xl sm:text-3xl font-bold">Good to see you</h2><p className="text-sm text-slate-400 mt-2">Your enquiries and billing activity in one place.</p></div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">{cards.map(({ label, value, icon: Icon, to }) => <Link key={label} to={to} className="admin-card p-4 sm:p-6 hover:border-kavach-orange/50 transition-colors"><div className="w-10 h-10 rounded-xl grey-inset flex items-center justify-center text-kavach-orange mb-5"><Icon size={22} weight="duotone" /></div><p className="text-3xl sm:text-4xl font-bold">{value}</p><p className="text-xs sm:text-sm text-slate-400 mt-1">{label}</p></Link>)}</div>
    <div className="grid lg:grid-cols-[2fr_1fr] gap-5"><section className="admin-card overflow-hidden"><div className="p-5 sm:p-6 border-b border-kavach-border flex items-center justify-between"><h3 className="font-bold text-lg">Recent enquiries</h3><Link to="/admin/leads" className="text-kavach-orange text-xs font-semibold flex items-center gap-1">View all <ArrowRight size={14} /></Link></div>{data.recent.length ? <div className="divide-y divide-kavach-border">{data.recent.map((lead) => <Link to={`/admin/leads?selected=${lead.id}`} key={lead.id} className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-white/5"><div className="min-w-0"><p className="font-semibold truncate">{lead.name}</p><p className="text-xs text-slate-400 truncate">{lead.service} · {lead.phone}</p></div><div className="text-right shrink-0"><p className="text-xs text-kavach-orange capitalize">{lead.status.replaceAll('_', ' ')}</p><p className="text-[11px] text-slate-500 mt-1">{date(lead.created_at)}</p></div></Link>)}</div> : <p className="p-6 text-sm text-slate-400">No enquiries yet. New website forms will appear here.</p>}</section>
      <section className="admin-card p-5 sm:p-6"><h3 className="font-bold text-lg mb-5">Billing snapshot</h3><div className="space-y-4"><div className="grey-inset rounded-xl p-4"><p className="text-sm text-slate-400">Amount outstanding</p><p className="text-2xl font-bold mt-1">₹{Number(data.bills.outstanding_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div><div className="flex justify-between text-sm border-b border-kavach-border pb-3"><span className="text-slate-400">Paid bills</span><strong>{data.bills.paid}</strong></div><Link to="/admin/bills" className="btn-primary rounded-xl inline-flex items-center gap-2 text-xs">Manage bills <ArrowRight size={15} /></Link></div></section></div>
  </div>
}
