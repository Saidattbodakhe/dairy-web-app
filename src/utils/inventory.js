// Mock milk position for the Inventory page. Bump subscriptionDemand
// or oneTimeOrderDemand above production to see the shortfall warning
// trigger — that's what calculateMilkAvailability() below checks for.
export const milkPositionMock = {
  production: 100,
  subscriptionDemand: 60,
  oneTimeOrderDemand: 25,
  wastage: 2,
}

export const LOW_STOCK_THRESHOLD = 15

export function calculateMilkAvailability({ production, subscriptionDemand, oneTimeOrderDemand, wastage }) {
  const totalDemand = subscriptionDemand + oneTimeOrderDemand + wastage
  const isShortfall = totalDemand > production
  return {
    totalDemand,
    available: production - totalDemand,
    isShortfall,
    shortfallAmount: isShortfall ? totalDemand - production : 0,
  }
}
