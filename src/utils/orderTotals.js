// Simple demo delivery-fee rule for the frontend phase:
// free delivery once the order subtotal reaches the threshold, a flat
// fee otherwise. Real business rules will come from the backend later.
export const FREE_DELIVERY_THRESHOLD = 500
export const STANDARD_DELIVERY_CHARGE = 30

export function calculateDeliveryCharge(subtotal) {
  if (subtotal <= 0) return 0
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_CHARGE
}

export function calculateGrandTotal(subtotal, discount = 0) {
  return subtotal + calculateDeliveryCharge(subtotal) - discount
}
