import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { List, X, PhoneCall, ArrowRight } from '@phosphor-icons/react'
import WhatsAppIcon from './WhatsAppIcon'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Contact', path: '/contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-kavach-dark/95 backdrop-blur-xl border-b border-kavach-border/80 shadow-lg shadow-black/25'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo without box/border */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <img
                src="/logo.jpg"
                alt="Kavach Logo"
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div>
                <h1 className="text-base sm:text-lg font-bold gradient-text leading-tight tracking-wide">KAVACH</h1>
                <p className="text-[9px] sm:text-[10px] text-kavach-gray font-medium tracking-widest uppercase">Safety Grills & Nets</p>
              </div>
            </Link>

            {/* Desktop Nav - Clean links with NO background pill */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-1 text-sm font-semibold tracking-wide transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-kavach-orange'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{link.name}</span>
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-kavach-orange to-kavach-amber rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="tel:+917219700401"
                className="btn-primary text-sm !py-2 !px-5 rounded-full inline-flex items-center gap-2"
              >
                <PhoneCall size={16} weight="bold" />
                <span>Call Now</span>
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-kavach-card border border-kavach-border text-white/80 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <List size={22} weight="bold" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Slide-Over Drawer from Right */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm md:hidden"
            />

            {/* Off-Canvas Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[82%] max-w-[320px] h-full bg-[#171b23] border-l border-kavach-border shadow-2xl flex flex-col justify-between p-6 overflow-y-auto md:hidden"
            >
              <div>
                {/* Drawer Header with Close Button */}
                <div className="flex items-center justify-between pb-6 border-b border-kavach-border/80">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.jpg"
                      alt="Kavach Logo"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold gradient-text leading-tight">KAVACH</p>
                      <p className="text-[9px] text-kavach-gray tracking-wider uppercase font-medium">Safety Grills & Nets</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl grey-inset border border-kavach-border text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="py-6 space-y-1.5">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-kavach-orange/15 text-kavach-orange border border-kavach-orange/30'
                            : 'text-slate-200 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{link.name}</span>
                        {isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-kavach-orange" />
                        ) : (
                          <ArrowRight size={14} weight="bold" className="text-slate-500" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-6 border-t border-kavach-border/80 space-y-3">
                <a
                  href="tel:+917219700401"
                  className="btn-primary text-xs sm:text-sm w-full text-center rounded-xl flex items-center justify-center gap-2 py-3 shadow-lg font-bold"
                >
                  <PhoneCall size={16} weight="bold" />
                  <span>Call +91 7219700401</span>
                </a>

                <a
                  href="https://wa.me/917219700401"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl grey-card border border-kavach-border hover:border-emerald-500/50 text-white flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all"
                >
                  <WhatsAppIcon size={18} />
                  <span>Chat on WhatsApp</span>
                </a>

                <p className="text-[10px] text-slate-500 text-center pt-1">
                  Charholi • Dighi • Alandi Road, Pune
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
