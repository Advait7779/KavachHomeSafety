import { motion } from 'framer-motion'
import { PhoneCall } from '@phosphor-icons/react'

export default function CallButton() {
  return (
    <motion.a
      href="tel:+917219700401"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-kavach-orange to-kavach-amber text-slate-950 rounded-full shadow-2xl shadow-black/50 transition-all border border-amber-300/40 group active:scale-90"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 220 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Call Kavach directly"
    >
      <PhoneCall size={22} weight="fill" className="drop-shadow-sm group-hover:scale-110 transition-transform sm:hidden" />
      <PhoneCall size={26} weight="fill" className="drop-shadow-sm group-hover:scale-110 transition-transform hidden sm:block" />
    </motion.a>
  )
}
