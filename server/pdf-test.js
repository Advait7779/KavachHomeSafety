import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { streamBillPdf } from './pdf.js'
import { amountInWords, billExtraNotes, defaultEstimateTerms, mergeEstimate } from '../shared/estimate.js'

assert.equal(billExtraNotes(defaultEstimateTerms), '')
assert.equal(billExtraNotes('Thank you for choosing Kavach.'), '')
assert.equal(billExtraNotes('Customer requested morning installation.'), 'Customer requested morning installation.')
assert.equal(amountInWords(12000), 'Twelve Thousand Rupees Only')
assert.equal(amountInWords(12000.5), 'Twelve Thousand Rupees and Fifty Paise Only')
assert.equal('amountWords' in mergeEstimate({ amountWords: 'Outdated words' }), false)

async function render(items, notes = '') {
  const res = new PassThrough()
  const chunks = []
  const headers = {}
  res.setHeader = (name, value) => { headers[name.toLowerCase()] = value }
  const completed = new Promise((resolve, reject) => {
    res.on('data', (chunk) => chunks.push(chunk))
    res.on('end', () => resolve(Buffer.concat(chunks)))
    res.on('error', reject)
  })
  await streamBillPdf(res, {
    id: 1,
    bill_number: 'KH-TEST-00001',
    business: { name: 'Kavach', logo: '/logo.jpg', billTerms: '', paymentDetails: 'Bank transfer' },
    customer: { name: 'Test Customer', phone: '9876543210', address: 'Pune, Maharashtra' },
    subtotal: items.length * 100,
    discount: 0,
    tax_total: 0,
    total: items.length * 100,
    items,
    notes,
  })
  const pdf = await completed
  assert.equal(headers['content-type'], 'application/pdf')
  assert.ok(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')))
  return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length
}

const item = (index) => ({ description: `Safety grill installation item ${index}`, quantity: 1, unit: 'sq ft', unit_price: 100 })
assert.equal(await render([item(1)]), 1)
assert.ok(await render(Array.from({ length: 50 }, (_, index) => item(index + 1))) > 1)
assert.ok(await render([item(1)], 'Long payment terms. '.repeat(200)) > 1)
console.log('Bill PDF pagination checks passed')
