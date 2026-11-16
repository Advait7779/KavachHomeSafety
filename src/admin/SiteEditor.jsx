import { useEffect, useState } from 'react'
import { ArrowClockwise, CheckCircle, CloudArrowUp, Eye, Plus, Trash } from '@phosphor-icons/react'
import { api } from './api'

const tabs = [
  { id: 'business', label: 'Business' },
  { id: 'services', label: 'Services' },
  { id: 'gallery', label: 'Gallery' },
]
const clone = (value) => structuredClone(value)

function Field({ label, value, onChange, type = 'text', rows }) {
  return <label className="admin-label">{label}{rows ? <textarea className="admin-input mt-2" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /> : <input className="admin-input mt-2" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}</label>
}

function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function upload(file) {
    if (!file) return
    setBusy(true); setError('')
    const data = new FormData()
    data.append('file', file)
    try { const result = await api('/api/admin/media', { method: 'POST', body: data }); onChange(result.url) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="space-y-2"><Field label={label} value={value} onChange={onChange} /><div className="flex items-center gap-3">{value && <img src={value} alt="Selected" className="w-20 h-14 rounded-lg object-cover border border-kavach-border" />}<label className="admin-secondary cursor-pointer"><CloudArrowUp size={16} /> {busy ? 'Uploading...' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label></div>{error && <p className="text-xs text-rose-400">{error}</p>}</div>
}

export default function SiteEditor() {
  const [draft, setDraft] = useState(null)
  const [savedDraft, setSavedDraft] = useState(null)
  const [tab, setTab] = useState('business')
  const [preview, setPreview] = useState(false)
  const [revisions, setRevisions] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    api('/api/admin/site').then((data) => { setDraft(clone(data.draft)); setSavedDraft(clone(data.draft)) }).catch((err) => setError(err.message))
    api('/api/admin/site/revisions').then(setRevisions).catch(() => {})
  }
  useEffect(load, [])
  function update(section, key, value) {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }))
  }
  function updateArray(section, index, key, value) {
    setDraft((current) => {
      const next = clone(current)
      next[section][index][key] = value
      return next
    })
  }
  function addItem(section, item) { setDraft((current) => ({ ...current, [section]: [...current[section], item] })) }
  function removeItem(section, index) { setDraft((current) => ({ ...current, [section]: current[section].filter((_, i) => i !== index) })) }
  async function save(publish = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      await api('/api/admin/site/draft', { method: 'PUT', body: JSON.stringify(draft) })
      setSavedDraft(clone(draft))
      if (publish) {
        await api('/api/admin/site/publish', { method: 'POST' })
        setMessage('Changes published to the website.')
        api('/api/admin/site/revisions').then(setRevisions).catch(() => {})
      } else setMessage('Draft saved. Visitors still see the published version.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function rollback(id) {
    if (!window.confirm('Restore this published version?')) return
    setBusy(true); setError('')
    try { await api('/api/admin/site/rollback', { method: 'POST', body: JSON.stringify({ revisionId: id }) }); load(); setMessage('Published version restored.') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (!draft) return <p className="text-slate-400">{error || 'Loading site content...'}</p>
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft)
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between items-start gap-4"><div><p className="text-kavach-orange uppercase tracking-widest text-xs font-semibold">Website customization</p><p className="text-sm text-slate-400 mt-1">Edit content in the same structure used by the live site.</p></div><div className="flex flex-wrap gap-2"><button className="admin-secondary" onClick={() => setPreview((value) => !value)}><Eye size={16} /> {preview ? 'Hide preview' : 'Preview'}</button><button className="admin-secondary" disabled={busy || !dirty} onClick={() => save(false)}>Save draft</button><button className="btn-primary rounded-xl text-xs" disabled={busy} onClick={() => save(true)}>{busy ? 'Working...' : 'Publish changes'}</button></div></div>
    {message && <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={18} />{message}</p>}{error && <p className="text-rose-400 text-sm" role="alert">{error}</p>}
    {preview && <div className="admin-card overflow-hidden"><div className="px-5 py-3 border-b border-kavach-border text-xs text-kavach-orange font-semibold">Draft preview</div><div className="grid md:grid-cols-[1fr_1.2fr] gap-6 p-5"><img src={draft.home.heroImage} alt="Hero preview" className="w-full aspect-video object-cover rounded-xl" /><div><img src={draft.business.logo} alt="Logo preview" className="w-12 h-12 object-cover rounded-lg mb-3" /><p className="text-kavach-orange text-xs uppercase tracking-widest">{draft.home.eyebrow}</p><h2 className="text-2xl font-extrabold mt-2">{draft.home.titleLine1} <span className="gradient-text">{draft.home.titleHighlight}</span> {draft.home.titleLine2}</h2><p className="text-sm text-slate-300 mt-3">{draft.home.description}</p><p className="text-xs text-slate-400 mt-4">{draft.business.phone} · {draft.business.address}</p></div></div></div>}
    <div className="grid lg:grid-cols-[190px_1fr] gap-5"><div className="admin-card p-2 h-fit flex lg:flex-col gap-1 overflow-x-auto">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`px-4 py-3 rounded-xl text-xs sm:text-sm text-left whitespace-nowrap ${tab === item.id ? 'bg-kavach-orange/15 text-kavach-orange font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{item.label}</button>)}</div>
      <div className="admin-card p-5 sm:p-7 space-y-6">
        {tab === 'business' && <><h2 className="text-xl font-bold">Business details</h2><div className="grid md:grid-cols-2 gap-5">{[['name','Business name'],['tagline','Tagline'],['phone','Primary phone'],['secondaryPhone','Secondary phone'],['whatsapp','WhatsApp number'],['gstin','GSTIN (optional)']].map(([key,label]) => <Field key={key} label={label} value={draft.business[key]} onChange={(value) => update('business',key,value)} />)}</div><Field label="Address" rows={3} value={draft.business.address} onChange={(value) => update('business','address',value)} /><ImageField label="Logo path" value={draft.business.logo} onChange={(value) => update('business','logo',value)} /><div className="grid md:grid-cols-2 gap-5"><Field label="Payment details on bills" rows={3} value={draft.business.paymentDetails} onChange={(value) => update('business','paymentDetails',value)} /><Field label="Default bill terms" rows={3} value={draft.business.billTerms} onChange={(value) => update('business','billTerms',value)} /></div></>}
        {tab === 'services' && <><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Services</h2><button className="admin-secondary" onClick={() => addItem('services',{ id: `service-${Date.now()}`, title: 'New service', tagline: '', image: '', description: '', features: [] })}><Plus size={16} /> Add</button></div>{draft.services.map((item,index) => <div className="grey-inset rounded-xl p-4 sm:p-5 space-y-4" key={item.id}><div className="flex justify-between"><h3 className="font-bold">{item.title}</h3><button className="text-rose-400" onClick={() => removeItem('services',index)} aria-label="Remove service"><Trash size={18} /></button></div><div className="grid md:grid-cols-2 gap-4"><Field label="Title" value={item.title} onChange={(v) => updateArray('services',index,'title',v)} /><Field label="Tagline" value={item.tagline} onChange={(v) => updateArray('services',index,'tagline',v)} /></div><Field label="Description" rows={3} value={item.description} onChange={(v) => updateArray('services',index,'description',v)} /><ImageField label="Image path" value={item.image} onChange={(v) => updateArray('services',index,'image',v)} /><Field label="Features (one per line)" rows={5} value={item.features.join('\n')} onChange={(v) => updateArray('services',index,'features',v.split('\n').filter(Boolean))} /></div>)}</>}
        {tab === 'gallery' && <><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Gallery</h2><button className="admin-secondary" onClick={() => addItem('gallery',{ src: '', title: 'New project', category: '', location: '' })}><Plus size={16} /> Add</button></div><div className="grid xl:grid-cols-2 gap-4">{draft.gallery.map((item,index) => <div className="grey-inset rounded-xl p-4 space-y-4" key={index}><div className="flex justify-between"><strong>{item.title}</strong><button className="text-rose-400" onClick={() => removeItem('gallery',index)} aria-label="Remove gallery item"><Trash size={18} /></button></div><ImageField label="Image path" value={item.src} onChange={(v) => updateArray('gallery',index,'src',v)} /><Field label="Title" value={item.title} onChange={(v) => updateArray('gallery',index,'title',v)} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Category" value={item.category} onChange={(v) => updateArray('gallery',index,'category',v)} /><Field label="Location" value={item.location} onChange={(v) => updateArray('gallery',index,'location',v)} /></div></div>)}</div></>}
      </div>
    </div>
    <details className="admin-card p-5"><summary className="cursor-pointer font-semibold text-sm flex items-center gap-2"><ArrowClockwise size={16} /> Published versions</summary><div className="mt-4 space-y-2">{revisions.length ? revisions.map((revision) => <div key={revision.id} className="flex items-center justify-between gap-3 grey-inset p-3 rounded-lg text-xs"><span>{new Date(revision.published_at).toLocaleString('en-IN')}</span><button onClick={() => rollback(revision.id)} disabled={busy} className="text-kavach-orange font-semibold">Restore</button></div>) : <p className="text-slate-400 text-xs">No previous versions yet.</p>}</div></details>
  </div>
}
