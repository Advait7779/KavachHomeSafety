import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Eye, Bug, ShieldCheck, Stairs, ArrowRight, Check, PhoneCall } from '@phosphor-icons/react'
import PageTransition from '../components/PageTransition'
import AnimatedSection from '../components/AnimatedSection'

const services = [
  {
    id: 'invisible-grills',
    icon: Eye,
    title: 'Invisible Safety Grilles',
    tagline: 'Modern Architectural Safety',
    image: '/images/invisible-grill-balcony.jpg',
    description:
      'Engineered with premium SS316 marine-grade tensile cables. Provides high security for high-rises and balconies without obstructing light, wind, or outside scenery.',
    features: [
      'SS316 Marine Grade Anti-Corrosive Cables',
      'Tensile Strength: 250+ kg Breaking Load',
      'Tension Spacing: 2 to 3 Inches',
      'Nylon Coated for Weather & UV Protection',
      'Zero Obstruction to Panoramic Skyline',
      '10-Year Warranty & Zero Maintenance',
    ],
  },
  {
    id: 'mosquito-nets',
    icon: Bug,
    title: 'Mosquito & Insect Mesh Systems',
    tagline: 'Pest-Free Ventilation',
    image: '/images/mosquito-net-window.jpg',
    description:
      'Custom-measured European standard mosquito net screens for windows, French doors, and balconies. Durable fiberglass and SS mesh engineered to keep all pests out.',
    features: [
      'High-Density Fiberglass & SS304 Mesh',
      'Heavy Duty Powder-Coated Aluminium Frames',
      'Sliding, Openable & Pleated Configurations',
      'High Airflow & Natural Sunlight Permeability',
      'Washable & Easy to Detach for Cleaning',
      'Smooth Precision Roller Bearings',
    ],
  },
  {
    id: 'balcony-safety',
    icon: ShieldCheck,
    title: 'High-Rise Balcony Child Safety',
    tagline: 'Complete Peace of Mind',
    image: '/images/child-safety-balcony.jpg',
    description:
      'Specialized vertical and horizontal invisible cable systems engineered for homes with toddlers, pets, and seniors. Meets high-rise building safety specifications.',
    features: [
      'Child-Proof Cable Gaps (< 3 Inches)',
      'Tamper-Proof Concealed Mounting Track',
      'No Sharp Edges or Dangerous Protrusions',
      'Compatible with Glass, MS & Brick Railings',
      'Fire Evacuation Safe with Wire Cutters',
      'Compliant with Society Architectural Guidelines',
    ],
  },
  {
    id: 'staircase-grills',
    icon: Stairs,
    title: 'Staircase & Duplex Cable Railings',
    tagline: 'Interior Luxury Protection',
    image: '/images/staircase-grill.jpg',
    description:
      'Minimalist invisible wire railings for modern villas, duplex apartments, and commercial lobbies. Replaces bulky vertical banisters with elegant stainless cables.',
    features: [
      'Minimalist Floor-to-Ceiling or Rail Cable Runs',
      'Matches Modern Wood, Marble & Concrete Steps',
      'Concealed Tensioners & Anchor Hardware',
      'Ideal for Open Stringer & Floating Stairs',
      'Prevents Accidental Fall Hazards Indoors',
      'Custom Finishes for Matching Interior Themes',
    ],
  },
]

export default function Services() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
              <span>Full Range Safety Solutions</span>
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl xs:text-4xl sm:text-6xl font-extrabold text-white mt-2 mb-4 tracking-tight break-words"
          >
            Specialized <span className="gradient-text">Safety Grills</span> & Nets
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Every home in Pune has unique dimensions and railing structures. We design, manufacture, and install tailored safety systems.
          </motion.p>
        </div>
      </section>

      {/* Services Detail List */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          {services.map((service, i) => (
            <AnimatedSection key={service.id}>
              <div
                id={service.id}
                className="grey-card rounded-3xl p-6 sm:p-10 border border-kavach-border hover:border-kavach-orange/30 transition-all duration-300"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
                    i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Image with Grey Inset Frame */}
                  <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="relative rounded-2xl overflow-hidden p-2 grey-inset border border-kavach-border group">
                      <div className="rounded-xl overflow-hidden aspect-[4/3] relative">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-kavach-dark/60 via-transparent to-transparent" />
                        <div className="absolute top-3.5 left-3.5">
                          <div className="w-11 h-11 rounded-xl bg-kavach-dark/80 backdrop-blur-md border border-kavach-border flex items-center justify-center text-kavach-orange shadow-md">
                            <service.icon size={24} weight="duotone" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <span className="inline-flex items-center gap-2 text-kavach-orange text-xs font-semibold tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
                      <span>{service.tagline}</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1.5 mb-3 text-white">
                      {service.title}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                      {service.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5 p-2.5 rounded-xl grey-inset border border-kavach-border/70">
                          <Check size={16} weight="bold" className="text-kavach-orange flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-row items-center gap-2 sm:gap-3.5">
                      <Link
                        to="/contact"
                        className="btn-primary inline-flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] xs:text-xs sm:text-sm font-semibold rounded-full shadow-md text-center !py-2.5 !px-3.5 sm:!py-3 sm:!px-6 whitespace-nowrap"
                      >
                        <span>Request Quote</span>
                        <ArrowRight size={14} weight="bold" />
                      </Link>
                      <a
                        href="tel:+917219700401"
                        className="px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-full grey-inset border border-kavach-border text-[11px] xs:text-xs sm:text-sm font-semibold text-slate-300 hover:text-white inline-flex items-center justify-center gap-1.5 sm:gap-2 text-center whitespace-nowrap"
                      >
                        <PhoneCall size={15} weight="bold" className="text-kavach-orange" />
                        <span>Instant Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Process in Dark Grey Inset Section */}
      <section className="section-padding bg-kavach-dark border-t border-kavach-border">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
              <span>Execution Workflow</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-2 text-white">
              Hassle-Free <span className="gradient-text">4-Step</span> Process
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mt-2 text-sm">
              From first phone call to complete installation within 24 to 48 hours.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: '01', title: 'Free Consultation', desc: 'Call us with rough measurements or request an on-site expert.' },
              { step: '02', title: 'Free Site Visit', desc: '100% free visit with physical samples. We inspect balcony edges, joints & spans.' },
              { step: '03', title: 'Transparent Quote', desc: 'Fixed square footage pricing with zero visit charges or hidden fees.' },
              { step: '04', title: 'Clean Installation', desc: 'Pneumatic tensioning and thorough stress test with 10-year warranty.' },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.1}>
                <div className="grey-card rounded-2xl p-6 h-full relative group hover:border-kavach-orange/40 transition-all border border-kavach-border">
                  <div className="text-3xl font-extrabold text-kavach-orange/30 group-hover:text-kavach-orange mb-3 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-base mb-2 text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Inset */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="grey-inset p-6 sm:p-12 rounded-3xl border border-kavach-border shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
                Have a Complex Balcony or Window?
              </h2>
              <p className="text-slate-300 mb-6 sm:mb-8 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                We specialize in curved balconies, double heights, and customized bracket fabrication. Contact our technical team today.
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
                  <span>Send Requirements</span>
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
