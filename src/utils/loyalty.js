import { getOrders } from './orders'

// Simple demo loyalty concept — "Fresh Points" earned on delivered
// orders. Deliberately not a real engine: points are derived on the
// fly from real order data, nothing extra is stored.
const POINTS_PER_RUPEE_DIVISOR = 10 // 1 point per ₹10 spent
export const REWARD_THRESHOLD = 500 // points needed for a reward
export const REWARD_VALUE = 50 // ₹ off at the threshold

export function getLoyaltySummary() {
  const deliveredOrders = getOrders().filter((order) => order.status === 'Delivered')
  const totalPoints = deliveredOrders.reduce(
    (sum, order) => sum + Math.floor(order.grandTotal / POINTS_PER_RUPEE_DIVISOR),
    0
  )
  const recentPoints =
    deliveredOrders.length > 0 ? Math.floor(deliveredOrders[0].grandTotal / POINTS_PER_RUPEE_DIVISOR) : 0
  const pointsIntoCurrentCycle = totalPoints % REWARD_THRESHOLD
  const pointsToNextReward = REWARD_THRESHOLD - pointsIntoCurrentCycle

  return {
    totalPoints,
    recentPoints,
    pointsToNextReward,
    rewardValue: REWARD_VALUE,
    threshold: REWARD_THRESHOLD,
  }
}
