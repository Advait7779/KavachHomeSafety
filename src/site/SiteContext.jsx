import { createContext, useContext, useEffect, useState } from 'react'
import defaultContent from '../../shared/defaultContent.json'

const SiteContext = createContext(defaultContent)

export function SiteProvider({ children, initialContent }) {
  const [content, setContent] = useState(initialContent || defaultContent)
  useEffect(() => {
    let active = true
    fetch('/api/public/site', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Site content unavailable')))
      .then((data) => { if (active) setContent(data) })
      .catch(() => {})
    return () => { active = false }
  }, [])
  return <SiteContext.Provider value={content}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)
const indianNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
}
export const telHref = (phone) => `tel:+91${indianNumber(phone)}`
export const whatsappHref = (phone, text = '') => `https://wa.me/91${indianNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`
