import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, PaperPlaneTilt, CheckCircle, PhoneCall, CaretDown, Check } from '@phosphor-icons/react'
import PageTransition from '../components/PageTransition'
import AnimatedSection from '../components/AnimatedSection'
import WhatsAppIcon from '../components/WhatsAppIcon'

const serviceOptions = [
  'Invisible Safety Grills (Balcony/Window)',
  'Mosquito Net Systems (Fiberglass/SS)',
  'Balcony Child Safety Combo',
  'Staircase & Duplex Wire Railings',
  'Full Home Combo (Grills + Nets)',
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    message: '',
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownError, setDropdownError] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.service) {
      setDropdownError(true)
      setDropdownOpen(true)
      return
    }
    setDropdownError(false)

    // Build WhatsApp message
    const text = `*New Kavach Website Inquiry*\nName: ${formData.name}\nPhone: ${formData.phone}\nService Required: ${formData.service}\nDetails: ${formData.message}`
    const encoded = encodeURIComponent(text)
    const waUrl = `https://wa.me/917219700401?text=${encoded}`
    const newTab = window.open(waUrl, '_blank')
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = waUrl
    }

    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4500)
  }

  return (
    <PageTransition>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
              <span>Pune Fast Response Team</span>
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl xs:text-4xl sm:text-6xl font-extrabold text-white mt-2 mb-4 tracking-tight break-words"
          >
            Request a Free <span className="gradient-text">Site Survey</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed"
          >
            Have our certified technician visit your balcony or window in Pune with physical cable and mesh samples. 100% free with zero visit charges.
          </motion.p>
        </div>
      </section>

      {/* Form + Map Section (Compact Width) */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reduced Width Enquiry Form */}
          <AnimatedSection className="lg:col-span-5 w-full max-w-[360px] sm:max-w-[380px] mx-auto lg:max-w-none">
            <div className="grey-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-kavach-border shadow-xl">
              <span className="inline-flex items-center gap-2 text-kavach-orange text-xs font-semibold tracking-widest uppercase mb-1">
                <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
                <span>Quick Quotation Form</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5">Send Project Details</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Submit this form to instantly initiate a conversation with our technical team on WhatsApp.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center grey-inset rounded-2xl border border-kavach-border"
                >
                  <CheckCircle size={48} weight="fill" className="text-emerald-400 mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">WhatsApp Chat Opened!</h3>
                  <p className="text-xs text-slate-300 max-w-xs">
                    If WhatsApp didn't open automatically, you can also call us directly at +91 7219700401.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Your Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl grey-inset border border-kavach-border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-kavach-orange/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl grey-inset border border-kavach-border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-kavach-orange/60 transition-colors"
                    />
                  </div>

                  <div ref={dropdownRef} className="relative">
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Service Type</label>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen)
                        setDropdownError(false)
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl grey-inset border text-xs sm:text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                        dropdownOpen
                          ? 'border-kavach-orange/80 ring-1 ring-kavach-orange/40'
                          : dropdownError
                          ? 'border-rose-500/80 ring-1 ring-rose-500/30'
                          : 'border-kavach-border hover:border-kavach-orange/50'
                      }`}
                    >
                      <span className={formData.service ? 'text-white font-medium' : 'text-slate-500'}>
                        {formData.service || 'Select required solution'}
                      </span>
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={`text-slate-400 transition-transform duration-200 ${
                          dropdownOpen ? 'rotate-180 text-kavach-orange' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl grey-card border border-kavach-border shadow-2xl py-1 overflow-hidden backdrop-blur-xl"
                        >
                          {serviceOptions.map((option) => {
                            const isSelected = formData.service === option
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, service: option })
                                  setDropdownOpen(false)
                                  setDropdownError(false)
                                }}
                                className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-kavach-orange/20 text-kavach-orange font-semibold'
                                    : 'text-slate-200 hover:bg-kavach-orange/10 hover:text-white'
                                }`}
                              >
                                <span>{option}</span>
                                {isSelected && (
                                  <Check size={14} weight="bold" className="text-kavach-orange flex-shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {dropdownError && !formData.service && (
                      <p className="text-[11px] text-rose-400 mt-1">Please select a service solution</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Approximate Size or Location (Optional)</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. 2 balconies in Charholi, approx 12x4 feet each..."
                      className="w-full px-3.5 py-2.5 rounded-xl grey-inset border border-kavach-border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-kavach-orange/60 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-lg !py-3 mt-1"
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                    <span>Send Inquiry on WhatsApp</span>
                  </button>
                </form>
              )}
            </div>
          </AnimatedSection>

          {/* Map + Direct Actions Column */}
          <AnimatedSection delay={0.15} className="lg:col-span-7 space-y-4 w-full max-w-lg mx-auto lg:max-w-none">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              <a
                href="tel:+917219700401"
                className="grey-card rounded-2xl p-3 sm:p-4 text-center border border-kavach-border hover:border-kavach-orange/50 transition-all group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grey-inset flex items-center justify-center mx-auto mb-2 text-kavach-orange group-hover:scale-110 transition-transform">
                  <PhoneCall size={18} weight="bold" />
                </div>
                <p className="text-xs font-bold text-white truncate">Call +91 7219700401</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Immediate reply</p>
              </a>

              <a
                href="https://wa.me/917219700401"
                target="_blank"
                rel="noopener noreferrer"
                className="grey-card rounded-2xl p-3 sm:p-4 text-center border border-kavach-border hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grey-inset flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <WhatsAppIcon size={22} />
                </div>
                <p className="text-xs font-bold text-white truncate">WhatsApp Chat</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Send photos/sizes</p>
              </a>
            </div>

            {/* Address Card */}
            <div className="grey-inset rounded-2xl p-3.5 sm:p-4 border border-kavach-border flex items-start gap-3">
              <MapPin size={20} weight="duotone" className="text-kavach-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Workshop & Office Location</p>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  Padmavati building, kale colony lane no 2, aalandi dighi road, charholi pune
                </p>
              </div>
            </div>

            {/* Map Frame */}
            <div className="grey-card rounded-2xl p-2 border border-kavach-border overflow-hidden h-[260px] shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3780.5!2d73.87!3d18.67!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDQwJzEyLjAiTiA3M8KwNTInMTIuMCJF!5e0!3m2!1sen!2sin!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kavach Pune Workshop Map"
                className="w-full h-full rounded-xl opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>
    </PageTransition>
  )
}
