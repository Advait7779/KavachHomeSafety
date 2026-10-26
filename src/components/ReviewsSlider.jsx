import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, CaretLeft, CaretRight } from '@phosphor-icons/react'

const reviews = [
  {
    id: 1,
    name: 'Sachin Jagtap',
    location: 'Pride World City, Charholi',
    service: 'Invisible Grills (9th Floor)',
    date: '2 weeks ago',
    text: 'Got invisible grills for our 9th floor balcony in Charholi. The team came on time for measurement and finished the entire fitting next afternoon. Very neat work, cables are hardly visible from the living room.',
  },
  {
    id: 2,
    name: 'Snehal & Rohit Patil',
    location: 'Dighi, Pune',
    service: 'Child Safety Balcony Cables',
    date: '1 month ago',
    text: 'We have a 2 year old daughter so balcony safety was our biggest worry. Local fabricators quoted heavy iron grills which would ruin the society look. Kavach team suggested 2.5mm SS316 wire. Sturdy, clean and looks very modern.',
  },
  {
    id: 3,
    name: 'Aniket Kulkarni',
    location: 'Alandi Road, Pune',
    service: 'Invisible Grills + Mosquito Mesh',
    date: '3 weeks ago',
    text: 'Installed both mosquito net and balcony invisible grills together. Mesh sliding is super smooth, no mosquitoes even with windows wide open in the evening. Very reasonable package rate.',
  },
  {
    id: 4,
    name: 'Rajesh Nair',
    location: 'Moshi High-Street',
    service: '3 Balconies Package',
    date: '1 month ago',
    text: 'Prompt response on WhatsApp. The technicians were polite and cleaned up the drill dust after finishing work. Cables are tensioned tight with zero slack. Highly recommend them for high-rise flats in PCMC.',
  },
  {
    id: 5,
    name: 'Vikas Gaikwad',
    location: 'Dhanori, Pune',
    service: 'Balcony Wire Grills',
    date: '2 months ago',
    text: 'I was skeptical if thin wires can actually hold weight, but the technician demonstrated by pulling with full body force on the tensioned cables. Very solid fitting. Society committee had no objection.',
  },
  {
    id: 6,
    name: 'Pooja Mehta',
    location: 'Ravet, Pune',
    service: 'Mosquito Mesh Windows',
    date: '3 weeks ago',
    text: 'Quick 1-day work for 3 bedroom windows. Good quality powder-coated aluminium frame matching our window colour. Mesh is sturdy and does not bend. Rates are quite fair compared to others in market.',
  },
  {
    id: 7,
    name: 'Sandeep More',
    location: 'Wagholi, Pune',
    service: 'Dry Balcony Pigeon Protection',
    date: '2 weeks ago',
    text: 'Pigeon problem was terrible on our dry balcony. After installing Kavach safety wires, birds stopped entering completely and air flow is 100% unaffected. Cleaning balcony is finally peaceful.',
  },
  {
    id: 8,
    name: 'Mahesh Shinde',
    location: 'Tingre Nagar, Pune',
    service: 'Full Apartment Safety Grills',
    date: 'Last month',
    text: 'Decent and professional guys. Took proper measurements on Thursday, installed on Saturday morning. Zero vibration or rattling even during heavy monsoon winds. Very happy with the job.',
  },
]

export default function ReviewsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      let perPage = 3
      if (window.innerWidth < 640) {
        perPage = 1
      } else if (window.innerWidth < 1024) {
        perPage = 2
      }
      setCardsPerPage(perPage)
      setCurrentIndex((prev) => Math.min(prev, Math.max(0, reviews.length - perPage)))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, reviews.length - cardsPerPage)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 text-kavach-orange text-xs sm:text-sm font-semibold tracking-widest uppercase mb-1">
          <span className="w-1.5 h-1.5 bg-kavach-orange rounded-full flex-shrink-0" />
          <span>Customer Feedback</span>
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
          What Pune Homeowners <span className="gradient-text">Say</span>
        </h2>
      </div>

      {/* Slider Container with Non-Overlapping Flanking Arrows */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full grey-card border border-kavach-border hover:border-kavach-orange text-slate-200 hover:text-white flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-110 cursor-pointer group shadow-xl hover:shadow-kavach-orange/20"
          aria-label="Previous reviews"
        >
          <CaretLeft size={20} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Sliding Viewport */}
        <div className="flex-1 min-w-0 overflow-hidden py-2 touch-pan-y">
          <motion.div
            className="flex -mx-2 sm:-mx-2.5 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) handleNext()
              else if (info.offset.x > 40) handlePrev()
            }}
            animate={{
              x: `-${currentIndex * (100 / cardsPerPage)}%`,
            }}
            transition={{
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {reviews.map((item) => (
              <div
                key={item.id}
                className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-2.5 select-none"
              >
                <div className="grey-card rounded-2xl p-4 sm:p-6 border border-kavach-border hover:border-kavach-orange/40 transition-all duration-300 flex flex-col justify-between h-full shadow-lg group">
                  <div>
                    {/* Top rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex gap-1 text-kavach-orange">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} weight="fill" />
                        ))}
                      </div>
                    </div>

                    {/* Review Quote Text */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal mb-4 sm:mb-5">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Homeowner Info */}
                  <div className="pt-3 border-t border-kavach-border/70">
                    <p className="text-xs sm:text-sm font-bold text-white group-hover:text-kavach-orange transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-medium truncate">
                        {item.location}
                      </span>
                      <span className="text-[10px] text-kavach-orange/90 font-medium px-2 py-0.5 rounded-md grey-inset border border-kavach-border truncate max-w-[50%]">
                        {item.service}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full grey-card border border-kavach-border hover:border-kavach-orange text-slate-200 hover:text-white flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-110 cursor-pointer group shadow-xl hover:shadow-kavach-orange/20"
          aria-label="Next reviews"
        >
          <CaretRight size={20} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Pagination Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === idx
                ? 'w-6 sm:w-7 bg-kavach-orange'
                : 'w-2 bg-slate-700 hover:bg-slate-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
