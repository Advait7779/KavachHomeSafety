import PDFDocument from 'pdfkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pdfFonts, registerPdfFonts } from './pdfFonts.js'

const money = (value) => `Rs. ${Number(value).toFixed(2)}`
const assetDir = fileURLToPath(new URL('../dist/', import.meta.url))
const defaultLogo = fileURLToPath(new URL('../dist/logo.jpg', import.meta.url))

function logoPath(value) {
  if (typeof value !== 'string' || !/^\/(?:uploads\/)?[\w./-]+\.(?:jpe?g|png)$/i.test(value)) return null
  const uploaded = value.startsWith('/uploads/')
  const root = uploaded ? path.resolve(process.env.UPLOAD_DIR || './uploads') : assetDir
  const filename = path.resolve(root, value.slice(uploaded ? '/uploads/'.length : 1))
  const relative = path.relative(root, filename)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? filename : null
}

export async function localPdfImage(doc, source, fallbackLogo = false) {
  for (const filename of new Set([logoPath(source), fallbackLogo ? defaultLogo : null])) {
    if (!filename) continue
    try { return doc.openImage(await readFile(filename)) } catch { /* use the next available logo */ }
  }
  return null
}

export async function streamBillPdf(res, bill) {
  const doc = new PDFDocument({ size: [595, 780], margin: 48, bufferPages: true })
  registerPdfFonts(doc)
  const logo = await localPdfImage(doc, bill.business.logo, true)
  const dark = '#1a1e27'
  const orange = '#E8871E'
  const pageBottom = 730
  doc.rect(0, 0, 595, 108).fill(dark)
  if (logo) {
    doc.roundedRect(44, 14, 80, 80, 7).fill('#000000')
    doc.image(logo, 48, 18, { fit: [72, 72] })
  }
  const businessName = bill.business.name || 'Kavach'
  const fullName = /invisible safety grill/i.test(businessName)
    ? businessName
    : `${businessName} Invisible Safety Grill & Mosquito Net`
  doc.fillColor(orange).font(pdfFonts.bold).fontSize(17).text(fullName, 136, 29, { width: 285 })
  doc.fillColor('#ffffff').font(pdfFonts.regular).fontSize(9).text('BILL / INVOICE', 400, 45, { align: 'right' })

  doc.fillColor(orange).font(pdfFonts.bold).fontSize(9).text('BILL TO', 48, 130)
  let customerY = 148
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(12).text(bill.customer.name || '', 48, customerY, { width: 499 })
  customerY = doc.y + 6
  doc.font(pdfFonts.regular).fontSize(9)
  if (bill.customer.phone) {
    doc.text(bill.customer.phone, 48, customerY, { width: 499 })
    customerY = doc.y + 5
  }
  if (bill.customer.address) {
    doc.text(bill.customer.address, 48, customerY, { width: 490 })
    customerY = doc.y + 5
  }

  const tableHeader = (at) => {
    doc.rect(48, at, 499, 25).fill(dark)
    doc.fillColor('#ffffff').font(pdfFonts.bold).fontSize(9)
      .text('Description', 56, at + 8).text('Qty', 326, at + 8).text('Rate', 380, at + 8).text('Amount', 467, at + 8)
    return at + 34
  }
  let y = Math.max(225, customerY + 17)
  if (y > pageBottom - 70) { doc.addPage(); y = 50 }
  y = tableHeader(y)
  for (const item of bill.items) {
    const amount = Number(item.quantity) * Number(item.unit_price)
    doc.font(pdfFonts.regular).fontSize(9)
    const rowHeight = Math.max(26,
      doc.heightOfString(item.description, { width: 252 }) + 10,
      doc.heightOfString(`${item.quantity} ${item.unit}`, { width: 54 }) + 10)
    if (rowHeight > pageBottom - 100) throw Object.assign(new Error('Bill item is too long for a PDF page'), { status: 400 })
    if (y + rowHeight > pageBottom) { doc.addPage(); y = tableHeader(50) }
    doc.fillColor(dark).font(pdfFonts.regular).fontSize(9)
      .text(item.description, 56, y, { width: 252 })
      .text(`${item.quantity} ${item.unit}`, 322, y, { width: 54 })
      .text(money(item.unit_price), 378, y, { width: 76 })
      .text(money(amount), 464, y, { width: 82, align: 'right' })
    y += rowHeight
    doc.moveTo(48, y - 5).lineTo(547, y - 5).strokeColor('#eeeeee').stroke()
  }
  y += 15
  const totalsHeight = 20 + (Number(bill.discount) ? 20 : 0) + (Number(bill.tax_total) ? 20 : 0) + 27
  if (y + totalsHeight > pageBottom) { doc.addPage(); y = 50 }
  const totalRow = (label, value, bold = false) => {
    doc.font(bold ? pdfFonts.bold : pdfFonts.regular).fontSize(bold ? 12 : 9)
      .text(label, 335, y).text(money(value), 445, y, { width: 102, align: 'right' })
    y += bold ? 27 : 20
  }
  totalRow('Subtotal', bill.subtotal)
  if (Number(bill.discount)) totalRow('Discount', `-${bill.discount}`)
  if (Number(bill.tax_total)) totalRow('Tax', bill.tax_total)
  totalRow('Total', bill.total, true)
  let footerY = Math.max(y + 24, doc.bufferedPageRange().count === 1 ? 550 : y + 24)
  if (footerY > pageBottom) { doc.addPage(); footerY = 50 }
  const terms = bill.notes || bill.business.billTerms || ''
  doc.font(pdfFonts.regular).fontSize(9).fillColor('#555555')
  if (terms) {
    let termsY = footerY
    for (const line of terms.split(/\r?\n/)) {
      doc.font(/^Thank you for choosing Kavach\.?$/i.test(line.trim()) ? pdfFonts.bold : pdfFonts.regular)
        .text(line || ' ', 48, termsY, { width: 490 })
      termsY = doc.y
    }
  }
  let paymentY = terms ? doc.y + 12 : footerY
  if (paymentY > pageBottom) { doc.addPage(); paymentY = 50 }
  if (bill.business.paymentDetails) doc.font(pdfFonts.regular).text(`Payment details: ${bill.business.paymentDetails}`, 48, paymentY, { width: 490 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${bill.bill_number || `draft-${bill.id}`}.pdf"`)
  doc.pipe(res)
  doc.end()
}
