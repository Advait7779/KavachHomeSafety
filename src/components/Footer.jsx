import { Link } from 'react-router-dom'
import { Phone, MapPin, InstagramLogo, FacebookLogo } from '@phosphor-icons/react'
import WhatsAppIcon from './WhatsAppIcon'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-kavach-dark border-t border-kavach-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand with clean logo (no border/box) */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="Kavach" className="h-11 w-11 rounded-lg object-cover" />
              <div>
                <h3 className="text-lg font-bold gradient-text">KAVACH</h3>
                <p className="text-[10px] text-kavach-gray tracking-widest uppercase font-medium">Safety Grills & Nets</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Protecting homes across Pune with high-tensile invisible safety grills and premium mosquito net solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-4 tracking-wider uppercase text-kavach-orange">Navigate</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'Services', path: '/services' },
                { name: 'Gallery', path: '/gallery' },
                { name: 'Contact', path: '/contact' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-kavach-orange transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-4 tracking-wider uppercase text-kavach-orange">Solutions</h4>
            <ul className="space-y-3">
              {['Invisible Safety Grills', 'Mosquito Net Systems', 'High-Rise Balcony Safety', 'Staircase Invisible Railings', 'Window Safety Wire'].map(
                (service) => (
                  <li key={service}>
                    <span className="text-sm text-slate-400">{service}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Direct Contact without background card */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-4 tracking-wider uppercase text-kavach-orange">Direct Contact</h4>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="tel:+917219700401"
                  className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-kavach-orange transition-colors group"
                >
                  <Phone size={16} weight="bold" className="text-kavach-orange flex-shrink-0" />
                  <span>+91 7219700401</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+917507040406"
                  className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-kavach-orange transition-colors group"
                >
                  <Phone size={16} weight="bold" className="text-kavach-orange flex-shrink-0" />
                  <span>+91 7507040406</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/917219700401"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-emerald-400 transition-colors group"
                >
                  <WhatsAppIcon size={18} />
                  <span>WhatsApp Us</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-400 pt-1 leading-relaxed">
                <MapPin size={16} weight="bold" className="text-kavach-orange flex-shrink-0 mt-0.5" />
                <span>Padmavati building, kale colony lane no 2, aalandi dighi road, charholi pune</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-kavach-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © {currentYear} Kavach Invisible Safety Grill & Mosquito Net. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="w-9 h-9 rounded-xl grey-inset flex items-center justify-center text-slate-400 hover:text-kavach-orange hover:border-kavach-orange/50 transition-all duration-300"
              aria-label="Instagram"
            >
              <InstagramLogo size={18} weight="bold" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-xl grey-inset flex items-center justify-center text-slate-400 hover:text-kavach-orange hover:border-kavach-orange/50 transition-all duration-300"
              aria-label="Facebook"
            >
              <FacebookLogo size={18} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
