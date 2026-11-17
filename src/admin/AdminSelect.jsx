import { useEffect, useId, useRef, useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

export default function AdminSelect({ label, ariaLabel, value, options, onChange, disabled = false, className = '', buttonClassName = '' }) {
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const listId = useId()
  const labelId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  function show(index = selectedIndex) {
    if (disabled) return
    setActiveIndex(Math.max(0, index))
    setOpen(true)
  }

  function choose(index) {
    onChange(options[index].value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (disabled) return
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      if (open) setActiveIndex((index) => (index + direction + options.length) % options.length)
      else show((Math.max(0, selectedIndex) + direction + options.length) % options.length)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      show(event.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else show()
      return
    }
    if (event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key)) {
      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()))
      if (match >= 0) show(match)
    }
  }

  return <div ref={rootRef} className={`relative ${className}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    {label && <label id={labelId} htmlFor={`${listId}-button`} className="admin-label">{label}</label>}
    <button
      id={`${listId}-button`}
      ref={buttonRef}
      type="button"
      role="combobox"
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? labelId : undefined}
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
      disabled={disabled}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={handleKeyDown}
      className={`admin-input flex min-h-11 items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${label ? 'mt-1' : ''} ${buttonClassName}`}
    >
      <span className="truncate capitalize">{selected?.label || 'Select an option'}</span>
      <CaretDown size={16} className={`shrink-0 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={listId} role="listbox" aria-labelledby={label ? labelId : undefined} aria-label={label ? undefined : ariaLabel} className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-kavach-border bg-kavach-card p-1 shadow-2xl">
      {options.map((option, index) => <div
        key={option.value}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={option.value === value}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(index)}
        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm capitalize ${activeIndex === index ? 'bg-kavach-orange/15 text-kavach-orange' : 'text-slate-200 hover:bg-white/5'}`}
      >
        <span>{option.label}</span>
        {option.value === value && <Check size={16} className="shrink-0 text-kavach-orange" />}
      </div>)}
    </div>}
  </div>
}
