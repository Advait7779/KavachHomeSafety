import { useEffect, useId, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowClockwise, MagnifyingGlass, PencilSimple, PhoneCall, Receipt, Trash, WhatsappLogo, X } from '@phosphor-icons/react'
import { api } from './api'
import { telHref, whatsappHref } from '../site/SiteContext'
import AdminSelect from './AdminSelect'

const statuses = ['new', 'contacted', 'survey_scheduled', 'quoted', 'won', 'lost']
const statusOptions = statuses.map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const filterStatusOptions = [{ value: '', label: 'All statuses' }, ...statusOptions]
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function LeadDialog({ title, description, icon: Icon, onClose, busy, children }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-kavach-border bg-kavach-card p-0 font-sans text-white shadow-2xl backdrop:bg-black/75">
    <div className="flex items-start gap-3 border-b border-kavach-border px-5 py-5 sm:px-6">
      <span className="rounded-xl bg-kavach-orange/10 p-2 text-kavach-orange"><Icon size={21} /></span>
      <div className="min-w-0 flex-1"><h2 id={titleId} className="text-lg font-bold">{title}</h2><p id={descriptionId} className="mt-1 text-sm text-slate-300">{description}</p></div>
      <button type="button" onClick={onClose} disabled={busy} aria-label="Close dialog" className="rounded-lg p-1 text-slate-400 hover:text-white"><X size={19} /></button>
    </div>
    {children}
  </dialog>
}

function LeadEditor({ lead, onClose, onSaved }) {
  const [draft, setDraft] = useState({ name: lead.name, phone: lead.phone, service: lead.service, message: lead.message || '' })
  const [notes, setNotes] = useState(lead.notes || [])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [noteBusy, setNoteBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify(draft) })
      onSaved('Enquiry updated.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function addNote(event) {
    event.preventDefault()
    setNoteBusy(true); setError('')
    try {
      await api(`/api/admin/leads/${lead.id}/notes`, { method: 'POST', body: JSON.stringify({ body: note }) })
      const latest = await api(`/api/admin/leads/${lead.id}`)
      setNotes(latest.notes)
      setNote('')
    } catch (err) { setError(err.message) } finally { setNoteBusy(false) }
  }

  function field(key, label, options = {}) {
    return <label className="admin-label">{label}<input className="admin-input mt-1" value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} required minLength={options.minLength} maxLength={options.maxLength} inputMode={options.inputMode} /></label>
  }

  return <LeadDialog title={`Edit enquiry · KH-${String(lead.id).padStart(6, '0')}`} description={`Submitted ${formatDate(lead.created_at)}`} icon={PencilSimple} onClose={onClose} busy={busy || noteBusy}>
    <div className="space-y-5 px-5 py-5 sm:px-6">
      <div className="flex flex-wrap gap-2"><a className="admin-secondary" href={telHref(lead.phone)}><PhoneCall size={16} /> Call</a><a className="admin-secondary" href={whatsappHref(lead.phone)} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={16} /> WhatsApp</a><Link className="admin-secondary" to={`/admin/bills?lead=${lead.id}`}><Receipt size={16} /> Create bill</Link></div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">{field('name', 'Customer name', { minLength: 2, maxLength: 120 })}{field('phone', 'Phone number', { minLength: 10, maxLength: 20, inputMode: 'tel' })}</div>
        {field('service', 'Service', { minLength: 2, maxLength: 160 })}
        <label className="admin-label">Enquiry details<textarea className="admin-input mt-1" rows={3} maxLength={2000} value={draft.message} onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))} /></label>
        {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="admin-secondary" onClick={onClose} disabled={busy || noteBusy}>Close</button><button type="submit" className="btn-primary rounded-lg text-xs" disabled={busy || noteBusy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
      <details className="border-t border-kavach-border pt-4"><summary className="cursor-pointer text-sm font-bold">Internal notes ({notes.length})</summary><div className="mt-4 space-y-3"><form onSubmit={addNote} className="space-y-2"><textarea className="admin-input" rows={2} placeholder="Add a follow-up note" value={note} onChange={(event) => setNote(event.target.value)} required maxLength={2000} /><button type="submit" className="admin-secondary" disabled={noteBusy || busy}>{noteBusy ? 'Adding...' : 'Add note'}</button></form>{notes.length ? notes.map((item) => <div className="grey-inset rounded-lg p-3" key={item.id}><p className="whitespace-pre-wrap text-sm">{item.body}</p><p className="mt-2 text-xs text-slate-500">{item.author} · {formatDate(item.created_at)}</p></div>) : <p className="text-xs text-slate-400">No notes yet.</p>}</div></details>
    </div>
  </LeadDialog>
}

function DeleteLeadDialog({ lead, onClose, onDelete, busy, error }) {
  return <LeadDialog title={`Delete enquiry for ${lead.name}?`} description="It will be removed from Leads. Any linked estimates and bills will remain available." icon={Trash} onClose={onClose} busy={busy}>
    <div className="px-5 py-4 sm:px-6">{error && <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="admin-secondary" onClick={onClose} disabled={busy} autoFocus>Keep enquiry</button><button type="button" className="btn-primary inline-flex items-center gap-2 rounded-lg text-xs" onClick={onDelete} disabled={busy}><Trash size={16} />{busy ? 'Deleting...' : 'Delete enquiry'}</button></div></div>
  </LeadDialog>
}

export default function Leads() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [data, setData] = useState({ items: [], total: 0, pages: 0 })
  const [selected, setSelected] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [message, setMessage] = useState('')
  const [refresh, setRefresh] = useState(0)
  const status = params.get('status') || ''
  const querySearch = params.get('search') || ''
  const page = Number(params.get('page') || 1)
  const selectedId = params.get('selected')

  useEffect(() => {
    let active = true
    api(`/api/admin/leads?status=${encodeURIComponent(status)}&search=${encodeURIComponent(querySearch)}&page=${page}`)
      .then((result) => { if (active) { setData(result); setError('') } })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [status, querySearch, page, refresh])

  useEffect(() => {
    if (!selectedId) { setSelected(null); return }
    let active = true
    setSelected(null)
    api(`/api/admin/leads/${selectedId}`).then((lead) => { if (active) setSelected(lead) }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [selectedId])

  function updateParams(updates) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(updates)) value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }

  async function changeStatus(lead, value) {
    setUpdatingStatusId(lead.id); setError(''); setMessage('')
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ status: value }) })
      setRefresh((count) => count + 1)
    } catch (err) { setError(err.message) } finally { setUpdatingStatusId(null) }
  }

  async function deleteLead() {
    if (!pendingDelete) return
    setDeleting(true); setDeleteError('')
    try {
      await api(`/api/admin/leads/${pendingDelete.id}`, { method: 'DELETE' })
      if (selectedId === String(pendingDelete.id)) updateParams({ selected: '' })
      setPendingDelete(null)
      setMessage('Enquiry deleted.')
      setRefresh((count) => count + 1)
    } catch (err) { setDeleteError(err.message) } finally { setDeleting(false) }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-kavach-orange uppercase tracking-widest text-xs font-semibold">Customer enquiries</p><p className="text-sm text-slate-400 mt-1">{data.total} leads in your pipeline</p></div><button type="button" onClick={() => setRefresh((count) => count + 1)} className="admin-secondary"><ArrowClockwise size={16} /> Refresh</button></div>
    <div className="admin-card flex flex-col gap-3 p-4 sm:flex-row"><form onSubmit={(event) => { event.preventDefault(); updateParams({ search, page: '', selected: '' }) }} className="flex flex-1 gap-2"><input className="admin-input" aria-label="Search leads" placeholder="Search name, phone or service" value={search} onChange={(event) => setSearch(event.target.value)} /><button className="admin-secondary" aria-label="Search"><MagnifyingGlass size={18} /></button></form><AdminSelect ariaLabel="Filter leads by status" className="sm:w-52" value={status} options={filterStatusOptions} onChange={(value) => updateParams({ status: value, page: '', selected: '' })} /></div>
    {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
    {message && <p className="text-sm text-emerald-400" role="status">{message}</p>}
    <div className="admin-card">
      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(10rem,0.85fr)_minmax(6rem,0.6fr)_5.5rem] items-center gap-4 border-b border-kavach-border px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 xl:grid"><span>Customer</span><span>Service</span><span>Status</span><span>Date</span><span className="text-center">Action</span></div>
      {data.items.length ? data.items.map((lead) => <div key={lead.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-kavach-border/60 px-5 py-4 last:border-0 hover:bg-white/5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(10rem,0.85fr)_minmax(6rem,0.6fr)_5.5rem] xl:gap-4">
        <div className="col-span-2 min-w-0 xl:col-span-1"><strong className="block truncate text-sm">{lead.name}</strong><a href={telHref(lead.phone)} className="text-xs text-slate-400 hover:text-kavach-orange">{lead.phone}</a></div>
        <span className="col-span-2 min-w-0 truncate text-xs text-slate-300 xl:col-span-1" title={lead.service}>{lead.service}</span>
        <AdminSelect ariaLabel={`Status for ${lead.name}`} className="col-span-2 min-w-0 xl:col-span-1" buttonClassName="!min-h-9 !px-2 !py-1.5 text-xs" value={lead.status} options={statusOptions} disabled={updatingStatusId === lead.id} onChange={(value) => changeStatus(lead, value)} />
        <span className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
        <div className="flex items-center justify-end gap-1"><button type="button" onClick={() => updateParams({ selected: String(lead.id) })} aria-label={`Edit enquiry for ${lead.name}`} title="Edit enquiry" className="rounded-lg p-2 text-kavach-orange hover:bg-kavach-orange/10"><PencilSimple size={18} /></button><button type="button" onClick={() => { setDeleteError(''); setPendingDelete(lead) }} aria-label={`Delete enquiry for ${lead.name}`} title="Delete enquiry" className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash size={18} /></button></div>
      </div>) : <p className="p-8 text-sm text-slate-400">No leads match these filters.</p>}
    </div>
    {data.pages > 1 && <div className="flex items-center justify-end gap-3"><button type="button" className="admin-secondary" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1), selected: '' })}>Previous</button><span className="text-xs text-slate-400">Page {page} of {data.pages}</span><button type="button" className="admin-secondary" disabled={page >= data.pages} onClick={() => updateParams({ page: String(page + 1), selected: '' })}>Next</button></div>}
    {selected && <LeadEditor key={selected.id} lead={selected} onClose={() => updateParams({ selected: '' })} onSaved={(text) => { setMessage(text); updateParams({ selected: '' }); setRefresh((count) => count + 1) }} />}
    {pendingDelete && <DeleteLeadDialog lead={pendingDelete} onClose={() => setPendingDelete(null)} onDelete={deleteLead} busy={deleting} error={deleteError} />}
  </div>
}
