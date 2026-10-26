import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MagnifyingGlassPlus, MapPin } from '@phosphor-icons/react'
import PageTransition from '../components/PageTransition'

const galleryItems = [
  {
    src: '/images/invisible-grill-balcony.jpg',
    title: 'High-Rise Balcony Invisible Grills',
    category: 'Invisible Grills',
    location: 'Charholi, Pune',
  },
  {
    src: '/images/gallery-modern-villa-balcony.jpg',
    title: 'Villa Glass Balcony Invisible Grills',
    category: 'Invisible Grills',
    location: 'Baner, Pune',
  },
  {
    src: '/images/child-safety-balcony.jpg',
    title: 'High-Elevation Child Play Safety Barrier',
    category: 'Balcony Safety',
    location: 'Hinjewadi, Pune',
  },
  {
    src: '/images/gallery-window-invisible-grill.jpg',
    title: 'Architectural Window Safety Grills',
    category: 'Window Safety',
    location: 'Dhanori, Pune',
  },
  {
    src: '/images/gallery-highrise-balcony-grill.jpg',
    title: 'Floor-to-Ceiling High-Rise Grills',
    category: 'Invisible Grills',
    location: 'Skyline High-Rise, Pune',
  },
  {
    src: '/images/gallery-night-balcony-grill.jpg',
    title: 'Night View Balcony Safety Grills',
    category: 'Balcony Safety',
    location: 'Wakad, Pune',
  },
]

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null)

  return (
    <PageTransition>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-14 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
              <span>Portfolio & Installations</span>
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-3xl xs:text-4xl sm:text-6xl font-extrabold text-white mt-2 mb-4 tracking-tight break-words"
          >
            Verified Pune <span className="gradient-text">Installations</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed"
          >
            Explore actual project captures showing our thin-tensile wire grills, child safety barriers, and custom mosquito mesh systems.
          </motion.p>
        </div>
      </section>

      {/* Gallery Grid - Show All At Once */}
      <section className="px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.src}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <div className="grey-card p-2 sm:p-2.5 rounded-2xl border border-kavach-border hover:border-kavach-orange/40 transition-all duration-300 shadow-lg">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-kavach-dark/85 via-kavach-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Zoom Indicator */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 rounded-lg bg-kavach-dark/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-kavach-orange">
                        <MagnifyingGlassPlus size={18} weight="bold" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-[10px] uppercase font-bold text-kavach-orange tracking-wider bg-kavach-dark/90 px-2 py-0.5 rounded border border-kavach-border inline-block mb-1.5">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin size={13} weight="fill" className="text-kavach-orange" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="px-2 pt-3 pb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">{item.title}</p>
                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-md grey-inset border border-kavach-border whitespace-nowrap">
                      {item.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-[#101318]/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="relative max-w-4xl w-full grey-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-kavach-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full grey-inset border border-kavach-border text-slate-300 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-black/40">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="w-full object-contain max-h-[60vh] sm:max-h-[75vh] mx-auto rounded-xl sm:rounded-2xl"
                />
              </div>

              <div className="pt-3 sm:pt-4 pb-1 sm:pb-2 px-1 sm:px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">{selectedImage.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} weight="fill" className="text-kavach-orange" />
                    <span>{selectedImage.location}</span>
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full grey-inset border border-kavach-border text-kavach-orange w-fit">
                  {selectedImage.category}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
