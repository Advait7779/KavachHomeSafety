import PDFDocument from 'pdfkit'
import { localPdfImage } from './pdf.js'
import { pdfFonts, registerPdfFonts } from './pdfFonts.js'
import { amountInWords, isPaymentTermLine, mergeEstimate } from '../shared/estimate.js'

const pageWidth = 595
const pageHeight = 842
const left = 44
const right = 551
const bottom = 782
const dark = '#1a1e27'
const orange = '#E8871E'
const line = '#d9dce2'
const onePageError = () => Object.assign(new Error('Estimate content is too long for one page. Shorten the items or text and try again.'), { status: 400 })

const amount = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const quantity = (value) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

function displayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

export async function streamEstimatePdf(res, bill) {
  const estimate = mergeEstimate(bill.estimate || {}, bill.business)
  const company = estimate.company
  const doc = new PDFDocument({ size: [pageWidth, pageHeight], margin: left, bufferPages: true })
  registerPdfFonts(doc)
  const logo = await localPdfImage(doc, company.logo, true)
  const estimateNumber = estimate.number || (bill.id ? `KAV-EST-${String(bill.id).padStart(4, '0')}` : 'Draft')
  const filename = estimateNumber.replace(/[^a-z0-9_-]/gi, '-')

  doc.rect(0, 0, pageWidth, 7).fill(orange)
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(18)
  const headingSize = Math.max(14, Math.min(18, (18 * 376) / doc.widthOfString(company.name)))
  doc.fontSize(headingSize)
  doc.text(company.name, left, 42, { width: 380 })
  let detailY = 42 + doc.heightOfString(company.name, { width: 380 }) + 7
  doc.fillColor(dark).font(pdfFonts.regular).fontSize(8.5)
  const companyLines = [company.address, company.website, company.iso && `ISO: ${company.iso}`, company.phone && `Phone: ${company.phone}`, company.email && `Email: ${company.email}`, company.gstin && `GSTIN: ${company.gstin}`, company.state && `State: ${company.state}`].filter(Boolean)
  for (const text of companyLines) {
    doc.text(text, left, detailY, { width: 380 })
    detailY += doc.heightOfString(text, { width: 380 }) + 3
  }
  if (logo) {
    doc.roundedRect(462, 38, 88, 88, 6).fill('#ffffff')
    doc.image(logo, 466, 42, { fit: [80, 80] })
  }

  const ruleY = Math.max(detailY + 8, 137)
  doc.moveTo(left, ruleY).lineTo(right, ruleY).strokeColor(orange).lineWidth(1.5).stroke()
  const titleY = ruleY + 13
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(17).text('ESTIMATE', left, titleY, { width: right - left, align: 'center' })
  const contactY = titleY + 38
  doc.fillColor(orange).font(pdfFonts.bold).fontSize(9).text('ESTIMATE FOR', left, contactY)
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(10).text(bill.customer.name || '', left, contactY + 18, { width: 270 })
  doc.font(pdfFonts.regular).fontSize(9)
  let customerY = contactY + 35
  for (const text of [bill.customer.phone && `Contact No.: ${bill.customer.phone}`, bill.customer.address].filter(Boolean)) {
    doc.text(text, left, customerY, { width: 270 })
    customerY += doc.heightOfString(text, { width: 270 }) + 4
  }
  doc.fillColor(orange).font(pdfFonts.bold).fontSize(9)
    .text(`Date: ${displayDate(bill.issue_date) || 'Draft'}`, 337, contactY, { width: 214, align: 'right' })
  let y = Math.max(customerY, contactY + 62) + 12
  const ensureSpace = (height) => { if (y + height > bottom) throw onePageError() }
  const tableHeader = () => {
    doc.rect(left, y, right - left, 28).fill(dark)
    doc.rect(left, y, right - left, 3).fill(orange)
    doc.fillColor('#ffffff').font(pdfFonts.bold).fontSize(8)
      .text('No.', 49, y + 10, { width: 18 })
      .text('Item name', 73, y + 10, { width: 180 })
      .text('Item code', 263, y + 10, { width: 62 })
      .text('Quantity', 330, y + 10, { width: 46, align: 'right' })
      .text('Unit', 381, y + 10, { width: 35 })
      .text('Price/unit', 420, y + 10, { width: 67, align: 'right' })
      .text('Amount', 491, y + 10, { width: 56, align: 'right' })
    y += 28
  }
  ensureSpace(28)
  tableHeader()
  for (const [index, item] of bill.items.entries()) {
    const description = String(item.description || '')
    const code = String(item.item_code || '')
    doc.font(pdfFonts.bold).fontSize(8.5)
    const rowHeight = Math.max(30, doc.heightOfString(description, { width: 180 }) + 12)
    ensureSpace(rowHeight + 105)
    doc.fillColor(dark).font(pdfFonts.regular).fontSize(8.5).text(String(index + 1), 49, y + 8, { width: 18 })
    doc.font(pdfFonts.bold).text(description, 73, y + 8, { width: 180 })
    doc.font(pdfFonts.regular).text(code, 263, y + 8, { width: 62 })
      .text(quantity(item.quantity), 330, y + 8, { width: 46, align: 'right' })
      .text(item.unit || '', 381, y + 8, { width: 35 })
      .text(amount(item.unit_price), 420, y + 8, { width: 67, align: 'right' })
      .text(amount(Number(item.quantity) * Number(item.unit_price)), 491, y + 8, { width: 56, align: 'right' })
    y += rowHeight
    doc.moveTo(left, y).lineTo(right, y).strokeColor(line).lineWidth(0.7).stroke()
  }

  ensureSpace(105)
  const totalQuantity = bill.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(9)
    .text('Total quantity', 73, y + 8, { width: 180 })
    .text(quantity(totalQuantity), 330, y + 8, { width: 46, align: 'right' })
  doc.moveTo(left, y + 28).lineTo(right, y + 28).strokeColor(dark).lineWidth(1).stroke()
  y += 40
  const summaryY = y
  const wordsText = amountInWords(bill.total)
  doc.fillColor(dark).font(pdfFonts.bold).fontSize(9).text('Estimate Amount In Words', left, summaryY, { width:250 })
  doc.font(pdfFonts.regular).fontSize(9).text(wordsText, left, summaryY + 16, { width: 245 })
  const wordsHeight = doc.heightOfString(wordsText, { width: 245 }) + 16
  let amountY = summaryY
  const summaryRow = (label, value, emphasized = false) => {
    doc.font(emphasized ? pdfFonts.bold : pdfFonts.regular).fontSize(emphasized ? 10 : 9).fillColor(dark)
      .text(label, 345, amountY, { width: 100 })
      .text(amount(value), 450, amountY, { width: 101, align: 'right' })
    doc.moveTo(345, amountY + 17).lineTo(right, amountY + 17).strokeColor(line).lineWidth(0.6).stroke()
    amountY += 23
  }
  summaryRow('Total', bill.total, true)
  y = Math.max(summaryY + wordsHeight, amountY) + 16

  const textSection = (label, value) => {
    const text = String(value || '').trim()
    if (!text) return
    const width = right - left
    const lines = label === 'Terms and conditions' ? text.split(/\r?\n/) : null
    doc.font(pdfFonts.regular).fontSize(9)
    const contentHeight = lines
      ? lines.reduce((height, line) => {
        const payment = isPaymentTermLine(line)
        doc.font(payment ? pdfFonts.bold : pdfFonts.regular).fontSize(9)
        return height + (payment ? 9 : 0) + doc.heightOfString(line || ' ', { width })
      }, 0)
      : doc.heightOfString(text, { width })
    const height = contentHeight + 27
    ensureSpace(height)
    doc.fillColor(dark).font(pdfFonts.bold).fontSize(9).text(label, left, y)
    if (lines) {
      let lineY = y + 15
      for (const line of lines) {
        const payment = isPaymentTermLine(line)
        if (payment) lineY += 9
        doc.font(payment ? pdfFonts.bold : pdfFonts.regular).fontSize(9).text(line || ' ', left, lineY, { width })
        lineY += doc.heightOfString(line || ' ', { width })
      }
    } else doc.font(pdfFonts.regular).fontSize(9).text(text, left, y + 15, { width })
    y += height
  }
  textSection('Description', estimate.description || bill.notes)
  textSection('Payment', estimate.paymentTerms)
  textSection('Terms and conditions', estimate.terms)

  if (doc.bufferedPageRange().count !== 1 || y > bottom) throw onePageError()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`)
  doc.pipe(res)
  doc.end()
}
