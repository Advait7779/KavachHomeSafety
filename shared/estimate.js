export function fullCompanyName(business = {}) {
  const name = String(business.name || 'Kavach').trim()
  if (/invisible safety grill/i.test(name)) return name
  if (name.toLowerCase() === 'kavach') return 'Kavach Invisible Safety Grill & Mosquito Net'
  return [name, business.tagline].filter(Boolean).join(' ')
}

export const defaultEstimateTerms = [
  'SS wire rope',
  'SS wire rope grade: SS316',
  'Distance between two ropes: 2 inch',
  'Screw: SS304 (3 inch, 8 mm)',
  'Stiffener/Plus: SS304',
  'Wire life: 30 years',
  'Installation warranty: 8 years',
  'Aluminium track weight: 1.9 kg',
  'Payment: 80% in advance, 20% after completing the work.',
].join('\n')

export const isPaymentTermLine = (line) => /^\s*Payment\s*:/i.test(String(line))

export function billExtraNotes(notes = '', business = {}) {
  const text = String(notes || business.billTerms || '').trim()
  if (/^SS wire rope\b/i.test(text) || /^KAVACH\s*-\s*Invisible Safety Grill\b/i.test(text) || /^Thank you for choosing Kavach\.?$/i.test(text)) return ''
  return text
}

export function estimateDefaults(business = {}) {
  return {
    type: 'estimate',
    number: '',
    company: {
      name: fullCompanyName(business),
      address: business.address || '',
      website: 'kavachinvisiblesaftygrill.com',
      iso: '',
      phone: business.phone || '',
      email: '',
      gstin: business.gstin || '',
      state: 'Maharashtra',
      logo: business.logo || '/logo.jpg',
    },
    description: '',
    paymentTerms: '',
    terms: defaultEstimateTerms,
    amountWords: '',
  }
}

export function mergeEstimate(estimate = {}, business = {}) {
  const defaults = estimateDefaults(business)
  const { bank: _bank, signatory: _signatory, ...visibleEstimate } = estimate
  return {
    ...defaults,
    ...visibleEstimate,
    company: { ...defaults.company, ...estimate.company },
  }
}

const small = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function words(value) {
  if (value < 20) return small[value]
  if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${words(value % 10)}` : ''}`
  if (value < 1000) return `${words(Math.floor(value / 100))} Hundred${value % 100 ? ` ${words(value % 100)}` : ''}`
  if (value < 100000) return `${words(Math.floor(value / 1000))} Thousand${value % 1000 ? ` ${words(value % 1000)}` : ''}`
  if (value < 10000000) return `${words(Math.floor(value / 100000))} Lakh${value % 100000 ? ` ${words(value % 100000)}` : ''}`
  return `${words(Math.floor(value / 10000000))} Crore${value % 10000000 ? ` ${words(value % 10000000)}` : ''}`
}

export function amountInWords(value) {
  const paiseTotal = Math.round(Number(value || 0) * 100)
  const rupees = Math.floor(paiseTotal / 100)
  const paise = paiseTotal % 100
  return `${words(rupees)} Rupees${paise ? ` and ${words(paise)} Paise` : ''} Only`
}
