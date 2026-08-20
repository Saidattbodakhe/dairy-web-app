// Demo order reviews, stored in localStorage keyed by order number.
// One review per order (not per product) — kept simple on purpose.
const REVIEWS_STORAGE_KEY = 'dairy_order_reviews'

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
}

export function getReviewForOrder(orderNumber) {
  return loadReviews()[orderNumber] ?? null
}

export function submitReview(orderNumber, rating, reviewText) {
  const reviews = loadReviews()
  const review = { rating, reviewText, createdAt: new Date().toISOString() }
  reviews[orderNumber] = review
  saveReviews(reviews)
  return review
}
