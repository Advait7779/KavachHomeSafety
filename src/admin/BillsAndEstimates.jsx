import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle, CloudArrowUp, Eye, FilePdf, Plus, Prohibit, Trash, X } from '@phosphor-icons/react'
import { amountInWords, estimateDefaults, fullCompanyName, isPaymentTermLine, mergeEstimate } from '../../shared/estimate.js'
import { useSite } from '../site/SiteContext'
import { api, apiBlob } from './api'
import AdminSelect from './AdminSelect'

const blankItem = () => ({ description: '', itemCode: '', quantity: 1, unit: 'sq ft', unitPrice: 0 })
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const statusLabel = (status) => status === 'void' ? 'Cancelled' : status

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm, busy = false, error = '', icon: Icon = Trash }) {
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
      <span className="rounded-xl bg-kavach-orange/10 p-2 text-kavach-orange"><Icon size={21} /></span>
      <div><h2 id={titleId} className="text-lg font-bold">{title}</h2><p id={messageId} className="mt-2 text-sm leading-6 text-slate-300">{message}</p></div>
    </div>
    {error && <p className="mx-5 mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 sm:mx-6" role="alert">{error}</p>}
    <div className="flex justify-end gap-2 px-5 py-4 sm:px-6">
      <button type="button" onClick={onCancel} disabled={busy} autoFocus className="admin-secondary">Keep document</button>
      <button type="button" onClick={onConfirm} disabled={busy} className="btn-primary inline-flex items-center gap-2 rounded-lg text-xs"><Icon size={16} />{busy ? 'Working...' : confirmLabel}</button>
    </div>
  </dialog>
}

function blankForm(business, type = 'estimate') {
  return {
    leadId: null,
    customer: { name: '', phone: '', address: '' },
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    notes: '',
    estimate: { ...estimateDefaults(business), type },
    discount: 0,
    items: [blankItem()],
  }
}

function toForm(bill) {
  if (bill.draft_data) {
    const draft = bill.draft_data
    const estimate = mergeEstimate(draft.estimate || bill.estimate || {}, bill.business)
    estimate.type = draft.estimate?.type || bill.estimate?.type || 'invoice'
    estimate.number = bill.estimate?.number || estimate.number
    return {
      leadId: draft.leadId ?? bill.lead_id,
      customer: draft.customer,
      issueDate: draft.issueDate || '',
      dueDate: draft.dueDate || '',
      notes: draft.notes || '',
      estimate,
      discount: draft.discount,
      items: draft.items.length ? draft.items : [blankItem()],
    }
  }
  const estimate = mergeEstimate(bill.estimate || {}, bill.business)
  estimate.type = bill.estimate?.type || 'invoice'
  return {
    leadId: bill.lead_id,
    customer: bill.customer,
    issueDate: bill.issue_date?.slice(0, 10) || '',
    dueDate: bill.due_date?.slice(0, 10) || '',
    notes: bill.notes || '',
    estimate,
    discount: Number(bill.discount),
    items: bill.items.map((item) => ({
      description: item.description,
      itemCode: item.item_code || '',
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unit_price),
    })),
  }
}

function Field({ label, value, onChange, disabled, rows, type = 'text', required, placeholder }) {
  return <label className="admin-label min-w-0">{label}
    {rows ? <textarea className="admin-input mt-1" rows={rows} value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} placeholder={placeholder} />
      : <input className="admin-input mt-1" type={type} step={type === 'number' ? 'any' : undefined} value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} placeholder={placeholder} />}
  </label>
}

function ImageField({ label, value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  async function upload(file) {
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    setUploading(true); setError('')
    try {
      const result = await api('/api/admin/media', { method: 'POST', body: data })
      onChange(result.url)
    } catch (err) { setError(err.message) } finally { setUploading(false) }
  }
  return <div className="space-y-2"><Field label={label} value={value} onChange={onChange} disabled={disabled} placeholder="/uploads/image.jpg" />
    <div className="flex items-center gap-3">{value && <img src={value} alt="Selected company logo" className="h-12 w-12 rounded-lg object-contain border border-kavach-border" />}
      {!disabled && <label className="admin-secondary cursor-pointer"><CloudArrowUp size={16} /> {uploading ? 'Uploading...' : 'Upload JPG/PNG'}<input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label>}
    </div>{error && <p className="text-xs text-rose-400">{error}</p>}</div>
}

function ItemCard({ item, index, onChange, onRemove, locked, canRemove }) {
  return <div className="grey-inset space-y-3 rounded-xl p-3">
    <div className="flex items-center justify-between"><strong className="text-sm text-kavach-orange">Item {index + 1}</strong>{canRemove && !locked && <button type="button" className="p-2 text-rose-400" onClick={onRemove} aria-label={`Remove item ${index + 1}`}><Trash size={17} /></button>}</div>
    <Field label="Item name" value={item.description} onChange={(value) => onChange('description', value)} disabled={locked} required />
    <div className="grid grid-cols-2 gap-3"><Field label="Code (optional)" value={item.itemCode} onChange={(value) => onChange('itemCode', value)} disabled={locked} /><Field label="Quantity" type="number" value={item.quantity} onChange={(value) => onChange('quantity', value)} disabled={locked} required /></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Unit" value={item.unit} onChange={(value) => onChange('unit', value)} disabled={locked} required /><Field label="Price / unit (₹)" type="number" value={item.unitPrice} onChange={(value) => onChange('unitPrice', value)} disabled={locked} required /></div>
    <p className="text-right text-xs text-slate-400">Amount <strong className="ml-2 text-white">{money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</strong></p>
  </div>
}

function EstimateTextSection({ label, value }) {
  return <section>
    <h3 className="font-bold">{label}</h3>
    {label === 'Terms and conditions'
      ? <div className="mt-1">{String(value).split(/\r?\n/).map((line, index) => <p key={index} className={`whitespace-pre-wrap ${isPaymentTermLine(line) ? 'mt-3 font-bold' : ''}`}>{line || '\u00a0'}</p>)}</div>
      : <p className="mt-1 whitespace-pre-wrap">{value}</p>}
  </section>
}

function DocumentPreview({ form, totals, business }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const resize = () => {
      const styles = window.getComputedStyle(container)
      const availableWidth = container.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
      setScale(Math.min(1, Math.max(0.3, availableWidth / 760)))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    return () => observer.disconnect()
  }, [])
  const estimateMode = form.estimate.type === 'estimate'
  const company = form.estimate.company
  const name = estimateMode ? company.name : fullCompanyName(business)
  const logo = estimateMode ? company.logo : business.logo
  const totalQuantity = form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  return <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-slate-200 p-3 sm:p-6">
    <article className="mx-auto min-h-[860px] w-[760px] bg-white text-[#1a1e27] shadow-xl" style={{ zoom: scale }}>
      {estimateMode ? <div className="border-t-[7px] border-[#E8871E] px-8 pt-8"><div className="flex justify-between gap-6 border-b-2 border-[#E8871E] pb-5"><div className="space-y-1"><h2 className="text-xl font-bold">{name}</h2>{[company.address, company.website, company.iso && `ISO: ${company.iso}`, company.phone && `Phone: ${company.phone}`, company.email && `Email: ${company.email}`, company.gstin && `GSTIN: ${company.gstin}`, company.state && `State: ${company.state}`].filter(Boolean).map((line) => <p key={line} className="text-xs">{line}</p>)}</div>{logo && <img src={logo} alt="Company logo" className="h-20 w-20 shrink-0 object-contain" />}</div><h2 className="my-5 text-center text-xl font-extrabold">ESTIMATE</h2><div className="mb-6 grid grid-cols-2 gap-5 text-xs"><div><h3 className="mb-2 font-bold text-[#E8871E]">ESTIMATE FOR</h3><p className="font-bold">{form.customer.name || 'Customer name'}</p>{form.customer.phone && <p>Contact No.: {form.customer.phone}</p>}{form.customer.address && <p>{form.customer.address}</p>}</div><div className="text-right font-bold text-[#E8871E]">Date: {form.issueDate || 'Draft'}</div></div></div>
        : <><div className="flex items-center justify-between gap-5 bg-[#1a1e27] px-8 py-5 text-[#E8871E]">{logo && <img src={logo} alt="Company logo" className="h-16 w-16 shrink-0 object-contain" />}<h2 className="flex-1 text-lg font-bold">{name}</h2><span className="text-xs font-bold text-white">BILL / INVOICE</span></div><div className="px-8 pt-6 text-xs"><h3 className="mb-2 font-bold text-[#E8871E]">BILL TO</h3><p className="font-bold">{form.customer.name || 'Customer name'}</p>{form.customer.phone && <p>{form.customer.phone}</p>}{form.customer.address && <p>{form.customer.address}</p>}</div></>}
      <div className="px-8 pb-8"><table className="mt-5 w-full table-fixed text-xs"><thead><tr className="bg-[#1a1e27] text-white"><th className="w-[43%] px-2 py-2 text-left">{estimateMode ? 'Item name' : 'Description'}</th>{estimateMode && <th className="w-[13%] px-2 py-2 text-left">Code</th>}<th className="w-[14%] px-2 py-2 text-right">Qty</th><th className="w-[15%] px-2 py-2 text-right">Rate</th><th className="px-2 py-2 text-right">Amount</th></tr></thead><tbody>{form.items.map((item, index) => <tr key={index} className="border-b border-slate-200"><td className="px-2 py-3 font-semibold">{item.description || 'Item description'}</td>{estimateMode && <td className="px-2 py-3">{item.itemCode}</td>}<td className="px-2 py-3 text-right">{Number(item.quantity || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {item.unit}</td><td className="px-2 py-3 text-right">{money(item.unitPrice)}</td><td className="px-2 py-3 text-right">{money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td></tr>)}</tbody></table>
        {estimateMode && <p className="border-b border-slate-500 px-2 py-2 text-xs font-bold">Total quantity: {totalQuantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>}
        <div className="mt-5 grid grid-cols-2 gap-6 text-xs"><div>{estimateMode && <><h3 className="font-bold">Estimate Amount In Words</h3><p className="mt-2">{form.estimate.amountWords || amountInWords(totals.total)}</p></>}</div><div className="space-y-2">{!estimateMode && <p className="flex justify-between border-b pb-1"><span>Subtotal</span><span>{money(totals.subtotal)}</span></p>}{!estimateMode && Number(form.discount) > 0 && <p className="flex justify-between border-b pb-1"><span>Discount</span><span>-{money(form.discount)}</span></p>}<p className="flex justify-between border-b pb-1 font-bold"><span>Total</span><span>{money(totals.total)}</span></p></div></div>
        <div className="mt-6 space-y-4 text-xs">{estimateMode ? [['Description', form.estimate.description], ['Payment', form.estimate.paymentTerms], ['Terms and conditions', form.estimate.terms]].filter(([, value]) => value).map(([label, value]) => <EstimateTextSection key={label} label={label} value={value} />) : <>{(form.notes || business.billTerms) && <p className="whitespace-pre-wrap">{form.notes || business.billTerms}</p>}{business.paymentDetails && <p className="whitespace-pre-wrap">Payment details: {business.paymentDetails}</p>}</>}</div>
      </div>
    </article>
  </div>
}

function DocumentEditor({ id, leadId, newType }) {
  const navigate = useNavigate()
  const { business } = useSite()
  const [form, setForm] = useState(() => blankForm(business, newType))
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [tab, setTab] = useState('customize')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [compactItems, setCompactItems] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    const update = () => setCompactItems(query.matches)
    query.addEventListener('change', update)
    update()
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let active = true
    if (id) {
      setLoading(true)
      api(`/api/admin/bills/${id}`).then((data) => { if (active) { setBill(data); setForm(toForm(data)) } }).catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    } else if (leadId) {
      api(`/api/admin/leads/${leadId}`).then((lead) => { if (active) setForm((current) => ({ ...current, leadId: Number(leadId), customer: { name: lead.name, phone: lead.phone, address: '' }, items: [{ ...blankItem(), description: lead.service }] })) }).catch((err) => { if (active) setError(err.message) })
    } else setForm(blankForm(business, newType))
    return () => { active = false }
  }, [id, leadId, newType])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => { if (event.key === 'Escape' && !confirmCancel) navigate('/admin/bills') }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKeyDown) }
  }, [navigate, confirmCancel])

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
    return { subtotal, total: subtotal - Number(form.discount || 0) }
  }, [form])
  const estimateMode = form.estimate.type === 'estimate'
  const locked = Boolean(bill && bill.status !== 'draft')
  const dirty = Boolean(bill?.status === 'draft' && JSON.stringify(form) !== JSON.stringify(toForm(bill)))
  const title = estimateMode ? (form.estimate.number || (id ? `Estimate #${id}` : 'New estimate')) : (bill?.bill_number || (id ? `Draft #${id}` : 'New bill'))

  function payload() { return { ...form, issueDate: form.issueDate || null, dueDate: estimateMode ? null : form.dueDate || null } }
  function setCustomer(key, value) { setForm((current) => ({ ...current, customer: { ...current.customer, [key]: value } })) }
  function setEstimate(key, value) { setForm((current) => ({ ...current, estimate: { ...current.estimate, [key]: value } })) }
  function setCompany(key, value) { setForm((current) => ({ ...current, estimate: { ...current.estimate, company: { ...current.estimate.company, [key]: value } } })) }
  function setItem(index, key, value) { setForm((current) => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, [key]: value } : item) })) }

  async function save(event) {
    event.preventDefault()
    const saveProgress = event.nativeEvent.submitter?.dataset.saveProgress === 'true'
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api(id ? `/api/admin/bills/${id}` : '/api/admin/bills', { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ ...payload(), saveProgress }) })
      setBill(result); setForm(toForm(result)); setMessage('Draft saved.')
      if (saveProgress) navigate('/admin/bills', { state: { draftSaved: true } })
      else if (!id) navigate(`/admin/bills/${result.id}`, { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function preview() {
    setBusy(true); setError('')
    try {
      const previewData = payload()
      previewData.customer = { ...previewData.customer, name: previewData.customer.name.trim() || 'Customer name' }
      previewData.items = previewData.items.map((item) => ({ ...item, description: item.description.trim() || 'Item description', quantity: Number(item.quantity) > 0 ? item.quantity : 1, unit: item.unit.trim() || 'sq ft' }))
      const blob = locked && id
        ? await apiBlob(`/api/admin/bills/${id}/pdf`)
        : await apiBlob('/api/admin/bills/preview', { method: 'POST', body: JSON.stringify(previewData) })
      setPreviewUrl(URL.createObjectURL(blob))
      setTab('preview')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function action(name) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api(`/api/admin/bills/${id}/${name}`, { method: 'POST' })
      setBill(result)
      setMessage(name === 'issue' ? `Issued ${estimateMode ? result.estimate?.number : result.bill_number}` : name === 'void' ? 'Document cancelled.' : 'Marked paid.')
      if (name === 'void') setConfirmCancel(false)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 sm:p-5" role="presentation">
    <div className="absolute inset-0" onClick={() => navigate('/admin/bills')} aria-hidden="true" />
    <section className="document-editor relative flex h-[min(96vh,1020px)] w-full max-w-[1000px] min-h-0 flex-col overflow-hidden rounded-2xl border border-kavach-border bg-kavach-dark shadow-2xl" role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-kavach-border px-4 py-3 sm:px-6">
        <div className="min-w-0"><h2 className="truncate text-lg font-bold sm:text-xl">{title}</h2><p className="text-xs text-slate-400 capitalize">{statusLabel(bill?.status || 'Draft')} · {estimateMode ? 'Estimate' : 'Bill'} · Kavach</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setTab('customize')} aria-pressed={tab === 'customize'} className={`document-tab${tab === 'customize' ? ' document-tab--active' : ''}`}>Customize</button><button type="button" onClick={preview} disabled={busy} aria-pressed={tab === 'preview'} className={`document-tab${tab === 'preview' ? ' document-tab--active' : ''}`}><Eye size={15} /> Preview</button><button type="button" onClick={() => navigate('/admin/bills')} className="admin-secondary !p-2" aria-label="Close document editor"><X size={18} /></button></div>
      </header>
      {message && <p className="mx-4 mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 sm:mx-6">{message}</p>}
      {error && <p className="mx-4 mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 sm:mx-6" role="alert">{error}</p>}
      {loading ? <div className="flex-1 p-6 text-slate-400">Loading document...</div> : id && !bill ? <div className="flex-1 p-6 text-rose-400">{error || 'Document not found'}</div> : <>
        <div className={tab === 'customize' ? 'min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6' : 'hidden'}>
          <form id="document-form" onSubmit={save} className="space-y-3">
            <section className="border-b border-kavach-border/70 px-1 pb-4"><h3 className="mb-3 font-bold">Document details</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><AdminSelect label="Document type" value={form.estimate.type} disabled={locked} options={[{ value: 'estimate', label: 'Estimate' }, { value: 'invoice', label: 'Bill / invoice' }]} onChange={(value) => setEstimate('type', value)} />{estimateMode && <Field label="Estimate number" value={form.estimate.number} onChange={(value) => setEstimate('number', value)} disabled={locked} placeholder="Assigned on save" />}<Field label={estimateMode ? 'Estimate date' : 'Issue date'} type="date" value={form.issueDate} onChange={(value) => setForm((current) => ({ ...current, issueDate: value }))} disabled={locked} />{!estimateMode && <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))} disabled={locked} />}</div></section>
            <section className="border-b border-kavach-border/70 px-1 pb-4"><h3 className="mb-3 font-bold">{estimateMode ? 'Estimate for' : 'Customer details'}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.4fr]"><Field label="Customer name" value={form.customer.name} onChange={(value) => setCustomer('name', value)} disabled={locked} required /><Field label="Contact number" value={form.customer.phone} onChange={(value) => setCustomer('phone', value)} disabled={locked} /><Field label="Customer address" value={form.customer.address} onChange={(value) => setCustomer('address', value)} disabled={locked} /></div></section>
            <section className="border-b border-kavach-border/70 px-1 pb-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold">{estimateMode ? 'Estimate items' : 'Bill items'}</h3>{!locked && <button type="button" className="admin-secondary" onClick={() => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))}><Plus size={15} /> Add item</button>}</div>{compactItems ? <div className="space-y-3">{form.items.map((item, index) => <ItemCard key={index} item={item} index={index} onChange={(key, value) => setItem(index, key, value)} onRemove={() => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))} locked={locked} canRemove={form.items.length > 1} />)}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[870px] table-fixed text-left text-xs"><colgroup><col className="w-[31%]" /><col className="w-[14%]" /><col className="w-[11%]" /><col className="w-[11%]" /><col className="w-[13%]" /><col className="w-[14%]" /><col className="w-[6%]" /></colgroup><thead><tr className="border-b border-kavach-border text-slate-400"><th className="pb-2 font-semibold">Item name</th><th className="pb-2 font-semibold">Code</th><th className="pb-2 font-semibold">Quantity</th><th className="pb-2 font-semibold">Unit</th><th className="pb-2 font-semibold">Price / unit</th><th className="pb-2 text-right font-semibold">Amount</th><th /></tr></thead><tbody>{form.items.map((item, index) => <tr key={index} className="border-b border-kavach-border/60 last:border-0"><td className="py-2 pr-2"><input aria-label={`Item ${index + 1} name`} className="admin-input !px-2 !py-2" value={item.description} onChange={(event) => setItem(index, 'description', event.target.value)} disabled={locked} required /></td><td className="py-2 pr-2"><input aria-label={`Item ${index + 1} code`} className="admin-input !px-2 !py-2" value={item.itemCode} onChange={(event) => setItem(index, 'itemCode', event.target.value)} disabled={locked} /></td><td className="py-2 pr-2"><input aria-label={`Item ${index + 1} quantity`} className="admin-input !px-2 !py-2" type="number" step="any" min="0.01" value={item.quantity} onChange={(event) => setItem(index, 'quantity', event.target.value)} disabled={locked} required /></td><td className="py-2 pr-2"><input aria-label={`Item ${index + 1} unit`} className="admin-input !px-2 !py-2" value={item.unit} onChange={(event) => setItem(index, 'unit', event.target.value)} disabled={locked} required /></td><td className="py-2 pr-2"><input aria-label={`Item ${index + 1} price per unit`} className="admin-input !px-2 !py-2" type="number" step="any" min="0" value={item.unitPrice} onChange={(event) => setItem(index, 'unitPrice', event.target.value)} disabled={locked} required /></td><td className="py-2 text-right font-semibold">{money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td><td className="py-2 text-right">{!locked && form.items.length > 1 && <button type="button" className="p-2 text-rose-400" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))} aria-label={`Remove item ${index + 1}`}><Trash size={16} /></button>}</td></tr>)}</tbody></table></div>}</section>
            <section className="border-b border-kavach-border/70 px-1 pb-4"><h3 className="mb-3 font-bold">{estimateMode ? 'Estimate text' : 'Bill notes'}</h3>{estimateMode ? <div className="grid gap-3 md:grid-cols-2"><Field label="Amount in words (optional override)" value={form.estimate.amountWords} onChange={(value) => setEstimate('amountWords', value)} disabled={locked} placeholder="Generated automatically if blank" /><Field label="Description" value={form.estimate.description} onChange={(value) => setEstimate('description', value)} disabled={locked} /><Field label="Payment terms" rows={2} value={form.estimate.paymentTerms} onChange={(value) => setEstimate('paymentTerms', value)} disabled={locked} /><Field label="Terms and conditions" rows={2} value={form.estimate.terms} onChange={(value) => setEstimate('terms', value)} disabled={locked} /></div> : <Field label="Notes / terms" rows={2} value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} disabled={locked} />}</section>
            {estimateMode && <details className="border-b border-kavach-border/70 px-1 pb-4"><summary className="cursor-pointer font-bold">Company details <span className="ml-2 text-xs font-normal text-slate-400">Kavach defaults · expand to edit</span></summary><div className="mt-4 space-y-3"><div className="grid gap-3 md:grid-cols-2"><Field label="Company name" value={form.estimate.company.name} onChange={(value) => setCompany('name', value)} disabled={locked} required /><Field label="Address" value={form.estimate.company.address} onChange={(value) => setCompany('address', value)} disabled={locked} /></div><div className="grid gap-3 md:grid-cols-3">{[['website', 'Website'], ['iso', 'ISO / certification'], ['phone', 'Phone'], ['email', 'Email'], ['gstin', 'GSTIN'], ['state', 'State']].map(([key, label]) => <Field key={key} label={label} value={form.estimate.company[key]} onChange={(value) => setCompany(key, value)} disabled={locked} />)}</div><ImageField label="Company logo" value={form.estimate.company.logo} onChange={(value) => setCompany('logo', value)} disabled={locked} /></div></details>}
          </form>
        </div>
        {tab === 'preview' && <div className="flex min-h-0 flex-1 flex-col bg-[#222731]"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-kavach-border px-4 py-2 text-xs sm:px-6"><span className="text-slate-300">Preview of the current fields</span><div className="flex gap-3"><a className="font-semibold text-kavach-orange" href={previewUrl} target="_blank" rel="noopener noreferrer">Open PDF</a><a className="font-semibold text-kavach-orange" href={previewUrl} download={`${estimateMode ? 'estimate' : 'bill'}-preview.pdf`}>Download PDF</a></div></div><DocumentPreview form={form} totals={totals} business={business} /></div>}
        {tab === 'customize' && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-kavach-border bg-kavach-dark px-4 py-3 sm:px-6"><div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">{!estimateMode && <span className="text-slate-400">Subtotal <strong className="ml-1 text-white">{money(totals.subtotal)}</strong></span>}<label className="flex items-center gap-2 text-slate-400">Discount <input aria-label="Discount in rupees" className="admin-input !w-24 !px-2 !py-1" type="number" min="0" step="any" value={form.discount} onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))} disabled={locked} /></label><strong className="text-sm text-kavach-orange">Total {money(totals.total)}</strong></div><div className="flex flex-wrap items-center gap-2">{id && !bill?.draft_data && <a className="admin-secondary" href={`/api/admin/bills/${id}/pdf`} target="_blank" rel="noopener noreferrer"><FilePdf size={15} /> Saved PDF</a>}{bill?.status === 'draft' && <button type="button" onClick={() => action('issue')} disabled={busy || dirty || Boolean(bill?.draft_data)} title={bill?.draft_data ? 'Complete and save the draft before issuing' : dirty ? 'Save the draft before issuing' : ''} className="admin-secondary">Issue {estimateMode ? 'estimate' : 'bill'}</button>}{bill?.status === 'issued' && <><button type="button" onClick={() => action('paid')} disabled={busy} className="admin-secondary"><CheckCircle size={15} /> Mark paid</button><button type="button" onClick={() => { setError(''); setConfirmCancel(true) }} disabled={busy} className="admin-secondary text-rose-400"><Prohibit size={15} /> Cancel {estimateMode ? 'estimate' : 'bill'}</button></>}{!locked && <button type="submit" form="document-form" formNoValidate data-save-progress="true" disabled={busy} className="admin-secondary">Save for later</button>}{!locked && <button type="submit" form="document-form" disabled={busy} className="btn-primary rounded-lg text-xs">{busy ? 'Working...' : id ? 'Save draft' : `Create ${estimateMode ? 'estimate' : 'bill'} draft`}</button>}</div></footer>}
      </>}
    </section>
    {confirmCancel && <ConfirmDialog
      title={`Cancel this ${estimateMode ? 'estimate' : 'bill'}?`}
      message="It will stay in your records as Cancelled. This cannot be undone."
      confirmLabel={`Cancel ${estimateMode ? 'estimate' : 'bill'}`}
      icon={Prohibit}
      busy={busy}
      error={error}
      onCancel={() => setConfirmCancel(false)}
      onConfirm={() => action('void')}
    />}
  </div>
}

export default function BillsAndEstimates() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const newType = params.get('new') === 'invoice' ? 'invoice' : 'estimate'
  const leadId = params.get('lead')
  const [documents, setDocuments] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api('/api/admin/bills').then((data) => { if (active) setDocuments(data) }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [id, leadId, newType])
  async function deleteDocument() {
    if (!pendingDelete) return
    const document = pendingDelete
    setDeletingId(document.id)
    setError('')
    setDeleteError('')
    try {
      await api(`/api/admin/bills/${document.id}`, { method: 'DELETE' })
      setDocuments((current) => current?.filter((item) => item.id !== document.id) ?? current)
      setPendingDelete(null)
      if (String(id) === String(document.id)) navigate('/admin/bills')
    } catch (err) { setDeleteError(err.message) } finally { setDeletingId(null) }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-kavach-orange text-xs font-semibold uppercase tracking-widest">Documents</p>
          <p className="text-sm text-slate-400 mt-1">Create estimates and manage customer bills.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/bills?new=estimate" className="btn-primary rounded-xl text-xs inline-flex items-center gap-2"><Plus size={16} /> New estimate</Link>
          <Link to="/admin/bills?new=invoice" className="admin-secondary"><Plus size={16} /> New bill</Link>
        </div>
      </div>
      {error && <p className="text-rose-400 text-sm" role="alert">{error}</p>}
      {location.state?.draftSaved && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" role="status">Draft saved. Open it from this list whenever you are ready to continue.</p>}
      <div className="admin-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_4rem] items-center py-3 text-[11px] text-slate-500 uppercase tracking-widest border-b border-kavach-border">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.6fr] gap-3 px-5">
            <span>Document</span><span>Customer</span><span>Type</span><span>Status</span><span className="text-right">Total</span>
          </div>
          <span className="text-center">Action</span>
        </div>
        {documents?.length ? documents.map((document) => {
          const isEstimate = document.estimate?.type === 'estimate'
          const kind = isEstimate ? 'estimate' : 'bill'
          const number = isEstimate ? (document.estimate.number || `Estimate #${document.id}`) : (document.bill_number || `Draft #${document.id}`)
          return <div key={document.id} className="grid grid-cols-[minmax(0,1fr)_4rem] items-center border-b border-kavach-border/60 last:border-0 hover:bg-white/5">
            <Link to={`/admin/bills/${document.id}`} className="grid min-w-0 gap-2 px-5 py-4 text-sm sm:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.6fr] sm:gap-3">
              <strong className="truncate">{number}</strong>
              <span className="truncate text-slate-300">{document.customer?.name || 'Customer not added'}</span>
              <span className="text-slate-400 capitalize">{isEstimate ? 'Estimate' : 'Bill'}</span>
              <span className="text-kavach-orange capitalize">{statusLabel(document.status)}</span>
              <strong className="sm:text-right">{money(document.total)}</strong>
            </Link>
            <button type="button" onClick={() => { setDeleteError(''); setPendingDelete(document) }} disabled={deletingId === document.id} aria-label={`Delete ${kind} ${number}`} title={`Delete ${kind}`} className="mx-auto rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50">
              <Trash size={18} />
            </button>
          </div>
        }) : <p className="p-8 text-sm text-slate-400">{documents ? 'No documents yet. Create an estimate to get started.' : 'Loading documents...'}</p>}
      </div>
      {pendingDelete && <ConfirmDialog
        title={`Delete ${pendingDelete.estimate?.type === 'estimate' ? (pendingDelete.estimate.number || `estimate #${pendingDelete.id}`) : (pendingDelete.bill_number || `bill #${pendingDelete.id}`)}?`}
        message="It will disappear from this list and cannot be opened here afterward."
        confirmLabel={`Delete ${pendingDelete.estimate?.type === 'estimate' ? 'estimate' : 'bill'}`}
        busy={deletingId === pendingDelete.id}
        error={deleteError}
        onCancel={() => setPendingDelete(null)}
        onConfirm={deleteDocument}
      />}
      {(id || leadId || params.has('new')) && <DocumentEditor id={id} leadId={leadId} newType={newType} />}
    </div>
  )
}
