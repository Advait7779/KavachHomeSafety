import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Eye, Bug, ArrowRight, CheckCircle, PhoneCall } from '@phosphor-icons/react'
import PageTransition from '../components/PageTransition'
import AnimatedSection from '../components/AnimatedSection'
import useCountUp from '../hooks/useCountUp'
import ReviewsSlider from '../components/ReviewsSlider'

const services = [
  {
    icon: Eye,
    title: 'Invisible Safety Grills',
    desc: 'High-tensile SS316 marine-grade steel cables offering uncompromising security while maintaining 99% clear panoramic views.',
  },
  {
    icon: Bug,
    title: 'Precision Mosquito Nets',
    desc: 'Sleek fiberglass and aluminium framed mesh installations designed to block all pests while maximizing fresh airflow.',
  },
  {
    icon: ShieldCheck,
    title: 'Balcony & Child Safety',
    desc: 'Engineered high-rise safety systems with tight spacing specifically designed for the safety of children and pets.',
  },
]

const stats = [
  { value: 500, suffix: '+', label: 'Homes Protected' },
  { value: 6, suffix: '+', label: 'Years Experience' },
  { value: 100, suffix: '%', label: 'Customer Satisfaction' },
]

function StatCard({ value, suffix, label }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-3xl sm:text-5xl font-extrabold gradient-text tracking-tight">
        {count}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 uppercase tracking-wider">{label}</div>
    </div>
  )
}

export default function Home() {
  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with refined slate overlays (not pitch black) */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-building.jpg"
            alt="Modern building with safety grills"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#13161c]/80 via-[#13161c]/60 to-[#13161c]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#13161c]/75 via-[#13161c]/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 sm:mb-6">
                <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
                <span>Premier Invisible Grills & Nets • Pune</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.15] mb-5 sm:mb-6 text-white tracking-tight break-words"
            >
              Invisible Safety.
              <br />
              <span className="gradient-text">Uncompromised</span> Views.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="text-sm sm:text-lg text-slate-300 max-w-xl mb-6 sm:mb-8 leading-relaxed font-normal"
            >
              Engineered with 316 marine-grade stainless steel cables and high-precision mosquito meshes. Designed for modern Pune high-rises and villas.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-row items-center gap-2 sm:gap-3.5"
            >
              <Link
                to="/contact"
                className="btn-primary inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full shadow-md !py-2 !px-3.5 sm:!py-2.5 sm:!px-5 text-[11px] xs:text-xs sm:text-sm font-semibold tracking-wide text-center whitespace-nowrap"
              >
                <span>Book Free Site Inspection</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                to="/services"
                className="btn-outline inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full !py-2 !px-3.5 sm:!py-2.5 sm:!px-5 text-[11px] xs:text-xs sm:text-sm font-semibold tracking-wide text-center whitespace-nowrap"
              >
                <span>Explore Solutions</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar with Dark Grey Inset Container */}
      <section className="relative z-10 -mt-8 sm:-mt-12 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="grey-inset rounded-3xl p-4 sm:p-6 border border-kavach-border/80 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-kavach-border/70">
                {stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Services Preview with Dark Grey Cards */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
              <span>Specialized Solutions</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-2 text-white">
              Safety Systems That Blend <span className="gradient-text">Seamlessly</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3 text-sm sm:text-base">
              Say goodbye to traditional heavy iron grills. Modern architecture deserves subtle, high-tensile security.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 0.12}>
                <div className="grey-card rounded-2xl p-7 h-full flex flex-col justify-between group hover:border-kavach-orange/40 hover:-translate-y-1.5 transition-all duration-300">
                  <div>
                    <div className="w-14 h-14 rounded-2xl grey-inset flex items-center justify-center mb-6 border border-kavach-border group-hover:border-kavach-orange/40 group-hover:scale-105 transition-all">
                      <service.icon size={28} weight="duotone" className="text-kavach-orange" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-kavach-orange transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                      {service.desc}
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-kavach-border/60">
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-kavach-orange hover:gap-3 transition-all"
                    >
                      <span>Learn Specifications</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full grey-inset text-sm font-semibold text-slate-200 hover:text-white hover:border-kavach-orange/40 transition-all border border-kavach-border"
            >
              <span>View All 4 Safety Configurations</span>
              <ArrowRight size={16} weight="bold" className="text-kavach-orange" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Feature Highlight with Inset Panel */}
      <section className="section-padding bg-kavach-dark border-y border-kavach-border/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="relative rounded-3xl overflow-hidden p-2.5 grey-inset border border-kavach-border">
                <div className="rounded-2xl overflow-hidden aspect-[4/3] relative">
                  <img
                    src="/images/invisible-grill-balcony.jpg"
                    alt="Invisible grill installation on balcony"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kavach-dark/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-card border border-white/10">
                    <p className="text-xs text-kavach-orange font-semibold uppercase tracking-wider">Installed at Pune High-Rise</p>
                    <p className="text-sm text-white font-medium">SS316 2.5mm Marine Cables with Concealed Tracks</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
                <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
                <span>Why Pune Chooses Kavach</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6 text-white leading-tight">
                Engineering Integrity in Every <span className="gradient-text">Millimeter</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  'SS316 Marine Grade Anti-Rust Cables',
                  'Withstands up to 250+ kg Cable Tension',
                  'Virtually Invisible from 8 Feet Away',
                  'Child & Pet Safety Spacing (< 3 inches)',
                  'Concealed High-Grade Aluminium Track',
                  'Compliant with High-Rise Fire Regulations',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3 p-3 rounded-xl grey-inset border border-kavach-border">
                    <CheckCircle size={18} weight="fill" className="text-kavach-orange flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

               <div className="mt-8 flex flex-row items-center gap-2 sm:gap-3.5">
                <Link
                  to="/contact"
                  className="btn-primary inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full shadow-lg text-center !py-2.5 !px-3.5 sm:!py-3 sm:!px-6 text-[11px] xs:text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                   <span>Book Free Measurement</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <a
                  href="tel:+917219700401"
                  className="px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-full grey-inset border border-kavach-border text-[11px] xs:text-xs sm:text-sm font-semibold text-slate-300 hover:text-white inline-flex items-center justify-center gap-1.5 sm:gap-2 text-center whitespace-nowrap"
                >
                  <PhoneCall size={15} weight="bold" className="text-kavach-orange" />
                  <span>+91 7219700401</span>
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Customer Reviews Slider */}
      <section className="section-padding overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <ReviewsSlider />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Inset Panel */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="relative rounded-3xl overflow-hidden p-6 sm:p-12 lg:p-14 grey-inset border border-kavach-border text-center shadow-xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-kavach-orange/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-kavach-amber/10 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 sm:mb-4">
                Ready to Secure Your Pune Home?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-6 sm:mb-8 text-xs sm:text-base leading-relaxed">
                Our technicians are based locally in Charholi & Alandi Dighi Road. Request an obligation-free measurement visit today.
              </p>
              <div className="flex flex-row justify-center items-center gap-2 sm:gap-3.5">
                <a
                  href="tel:+917219700401"
                  className="btn-primary rounded-full inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-center !py-2.5 !px-3.5 sm:!py-3 sm:!px-6 text-[11px] xs:text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  <PhoneCall size={15} weight="bold" />
                  <span>Call +91 7219700401</span>
                </a>
                <Link
                  to="/contact"
                  className="btn-outline rounded-full inline-flex items-center justify-center gap-1.5 sm:gap-2 text-center !py-2.5 !px-3.5 sm:!py-3 sm:!px-6 text-[11px] xs:text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  <span><span className="hidden xs:inline">Send </span>WhatsApp Inquiry</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </PageTransition>
  )
}
