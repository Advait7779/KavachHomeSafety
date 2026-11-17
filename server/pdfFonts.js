import { fileURLToPath } from 'node:url'

export const pdfFonts = { regular: 'JosefinSans', bold: 'JosefinSans-Bold' }

export function registerPdfFonts(doc) {
  doc.registerFont(pdfFonts.regular, fileURLToPath(new URL('./fonts/JosefinSans-Regular.ttf', import.meta.url)))
  doc.registerFont(pdfFonts.bold, fileURLToPath(new URL('./fonts/JosefinSans-Bold.ttf', import.meta.url)))
}
