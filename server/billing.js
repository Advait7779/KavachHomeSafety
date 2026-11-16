export function calculateBill(items, discount = 0) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(Number(item.quantity) * Number(item.unitPrice) * 100), 0)
  const discountCents = Math.round(Number(discount) * 100)
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    taxTotal: 0,
    total: (subtotalCents - discountCents) / 100,
  }
}
