import { motion } from 'framer-motion'

export default function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/917219700401?text=Hi%2C%20I%27m%20interested%20in%20your%20safety%20grill%20services"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl shadow-black/50 transition-all border border-white/20 group active:scale-90"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 220 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Chat with us on WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 sm:w-8 sm:h-8 fill-white drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16.002 2C8.28 2 2 8.28 2 16c0 2.54.675 4.92 1.853 6.98L2 30l7.247-1.802A13.935 13.935 0 0 0 16.002 30C23.72 30 30 23.72 30 16s-6.28-14-13.998-14zm0 25.64c-2.22 0-4.32-.6-6.14-1.65l-.44-.25-4.56 1.13 1.2-4.44-.28-.45a11.58 11.58 0 0 1-1.78-6.19c0-6.42 5.22-11.64 11.64-11.64s11.64 5.22 11.64 11.64-5.22 11.64-11.64 11.64zm6.38-8.73c-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.18-.78.18s-.9 1.14-1.1 1.38c-.2.23-.4.26-.75.09a9.44 9.44 0 0 1-2.78-1.72 10.42 10.42 0 0 1-1.93-2.4c-.2-.35-.02-.54.15-.71.16-.16.35-.4.53-.61.17-.2.23-.35.35-.58.12-.23.06-.44-.03-.61-.09-.18-.78-1.89-1.08-2.58-.29-.68-.58-.58-.78-.59h-.67c-.23 0-.61.09-.93.44s-1.22 1.19-1.22 2.91c0 1.72 1.25 3.38 1.43 3.61.17.23 2.46 3.76 5.96 5.27.83.36 1.48.58 1.99.74.84.27 1.6.23 2.2.14.67-.1 2.07-.84 2.36-1.66.29-.81.29-1.51.2-1.66-.08-.14-.31-.23-.66-.4z" />
      </svg>
    </motion.a>
  )
}
