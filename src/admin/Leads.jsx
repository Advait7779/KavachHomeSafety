import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, PhoneCall, WhatsappLogo, Receipt, ArrowClockwise } from '@phosphor-icons/react'
import { api } from './api'
import { telHref, whatsappHref } from '../site/SiteContext'
import AdminSelect from './AdminSelect'

const statuses = ['new', 'contacted', 'survey_scheduled', 'quoted', 'won', 'lost']
const statusOptions = statuses.map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const filterStatusOptions = [{ value: '', label: 'All statuses' }, ...statusOptions]
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Leads() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [data, setData] = useState({ items: [], total: 0, pages: 0 })
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)
  const selectedId = params.get('selected')

  useEffect(() => {
    api(`/api/admin/leads?status=${encodeURIComponent(status)}&search=${encodeURIComponent(params.get('search') || '')}&page=${page}`)
      .then(setData).catch((err) => setError(err.message))
  }, [status, page, params, refresh])
  useEffect(() => {
    if (!selectedId) { setSelected(null); return }
    api(`/api/admin/leads/${selectedId}`).then(setSelected).catch((err) => setError(err.message))
  }, [selectedId, refresh])

  function updateParams(updates) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(updates)) value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }
  async function changeStatus(value) {
    try { await api(`/api/admin/leads/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: value }) }); setRefresh((n) => n + 1) } catch (err) { setError(err.message) }
  }
  async function addNote(event) {
    event.preventDefault()
    try { await api(`/api/admin/leads/${selected.id}/notes`, { method: 'POST', body: JSON.stringify({ body: note }) }); setNote(''); setRefresh((n) => n + 1) } catch (err) { setError(err.message) }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-kavach-orange uppercase tracking-widest text-xs font-semibold">Customer enquiries</p><p className="text-sm text-slate-400 mt-1">{data.total} leads in your pipeline</p></div><button onClick={() => setRefresh((n) => n + 1)} className="admin-secondary"><ArrowClockwise size={16} /> Refresh</button></div>
    <div className="admin-card p-4 flex flex-col sm:flex-row gap-3"><form onSubmit={(e) => { e.preventDefault(); updateParams({ search, page: '' }) }} className="flex flex-1 gap-2"><input className="admin-input" placeholder="Search name, phone or service" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="admin-secondary" aria-label="Search"><MagnifyingGlass size={18} /></button></form><AdminSelect ariaLabel="Filter leads by status" className="sm:w-52" value={status} options={filterStatusOptions} onChange={(value) => updateParams({ status: value, page: '' })} /></div>
    {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
    <div className="grid xl:grid-cols-[1.3fr_1fr] gap-5 items-start"><div className="admin-card overflow-hidden"><div className="hidden sm:grid grid-cols-[1.1fr_1fr_0.7fr_0.6fr] gap-3 px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 border-b border-kavach-border"><span>Customer</span><span>Service</span><span>Status</span><span>Date</span></div>{data.items.length ? data.items.map((lead) => <button key={lead.id} onClick={() => updateParams({ selected: lead.id })} className={`w-full text-left px-5 py-4 border-b border-kavach-border/60 last:border-0 hover:bg-white/5 grid sm:grid-cols-[1.1fr_1fr_0.7fr_0.6fr] gap-2 sm:gap-3 items-center ${selectedId === String(lead.id) ? 'bg-kavach-orange/10' : ''}`}><span><strong className="block text-sm truncate">{lead.name}</strong><small className="text-slate-400">{lead.phone}</small></span><span className="text-xs text-slate-300 truncate">{lead.service}</span><span className="text-xs text-kavach-orange capitalize">{lead.status.replaceAll('_', ' ')}</span><span className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString('en-IN')}</span></button>) : <p className="p-8 text-sm text-slate-400">No leads match these filters.</p>}</div>
      <section className="admin-card p-5 sm:p-6 xl:sticky xl:top-5">{selected ? <div className="space-y-5"><div><p className="text-xs text-kavach-orange font-semibold">KH-{String(selected.id).padStart(6, '0')}</p><h2 className="text-2xl font-bold mt-1">{selected.name}</h2><p className="text-xs text-slate-400 mt-1">Submitted {formatDate(selected.created_at)}</p></div><div className="flex flex-wrap gap-2"><a className="admin-secondary" href={telHref(selected.phone)}><PhoneCall size={16} /> Call</a><a className="admin-secondary" href={whatsappHref(selected.phone)} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={16} /> WhatsApp</a><Link className="admin-secondary" to={`/admin/bills?lead=${selected.id}`}><Receipt size={16} /> Create bill</Link></div><div className="grey-inset rounded-xl p-4 text-sm space-y-2"><p><span className="text-slate-400">Phone:</span> {selected.phone}</p><p><span className="text-slate-400">Service:</span> {selected.service}</p><p><span className="text-slate-400">Details:</span> {selected.message || 'No additional details'}</p></div><AdminSelect label="Lead status" value={selected.status} options={statusOptions} onChange={changeStatus} /><div className="border-t border-kavach-border pt-5"><h3 className="font-bold mb-3">Internal notes</h3><form onSubmit={addNote} className="space-y-2"><textarea className="admin-input" rows={3} placeholder="Add a follow-up note" value={note} onChange={(e) => setNote(e.target.value)} required /><button className="btn-primary rounded-lg text-xs">Add note</button></form><div className="space-y-2 mt-5 max-h-56 overflow-y-auto">{selected.notes?.map((item) => <div className="grey-inset rounded-lg p-3" key={item.id}><p className="text-sm">{item.body}</p><p className="text-[11px] text-slate-500 mt-2">{item.author} · {formatDate(item.created_at)}</p></div>)}{!selected.notes?.length && <p className="text-xs text-slate-500">No notes yet.</p>}</div></div></div> : <p className="text-sm text-slate-400">Select a lead to view the enquiry, update its status, and add notes.</p>}</section></div>
    {data.pages > 1 && <div className="flex items-center justify-end gap-3"><button className="admin-secondary" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>Previous</button><span className="text-xs text-slate-400">Page {page} of {data.pages}</span><button className="admin-secondary" disabled={page >= data.pages} onClick={() => updateParams({ page: String(page + 1) })}>Next</button></div>}
  </div>
}
