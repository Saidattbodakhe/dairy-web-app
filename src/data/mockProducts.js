// All product data below is fake/demo data for the frontend-only phase.
// Later this will be replaced by real data from a database.

// Real product photos (freely-licensed, no brand packaging) — see
// src/assets/CREDITS.md for source/author/license of each file. Each
// lives at src/assets/products/<name>.jpg — swap the file to change
// the photo later without touching this file or any page.
import cowMilkImage from '../assets/products/fresh-cow-milk.jpg'
import curdImage from '../assets/products/curd.jpg'
import paneerImage from '../assets/products/paneer.jpg'
import cowGheeImage from '../assets/products/ghee.jpg'
import butterImage from '../assets/products/butter.jpg'
import buttermilkImage from '../assets/products/buttermilk.jpg'
import lassiImage from '../assets/products/lassi.jpg'
// Buffalo milk/ghee don't have a suitable real photo available (no
// unbranded, accurately-representative one was found), so — same as
// fallback.svg — these two use simple in-house illustrations instead
// of reusing the cow milk/ghee photos.
import buffaloMilkImage from '../assets/products/buffalo-milk.svg'
import buffaloGheeImage from '../assets/products/buffalo-ghee.svg'
import fallbackImage from '../assets/products/fallback.svg'

export const fallbackProductImage = fallbackImage

export const mockProducts = [
  {
    id: '1',
    name: 'Cow Milk',
    slug: 'cow-milk',
    category: 'Milk',
    description:
      'Farm-fresh cow milk, collected daily from our own 12 cows and delivered straight to your doorstep every morning. Rich, creamy, and free from any additives.',
    shortDescription: 'Farm-fresh milk delivered daily.',
    image: cowMilkImage,
    isActive: true,
    variants: [
      { id: '1-1', name: '500 ml', quantityValue: 500, unit: 'ml', price: 30, stock: 40, isActive: true },
      { id: '1-2', name: '1 litre', quantityValue: 1, unit: 'litre', price: 58, stock: 35, isActive: true },
      { id: '1-3', name: '2 litres', quantityValue: 2, unit: 'litre', price: 112, stock: 20, isActive: true },
      { id: '1-4', name: '3 litres', quantityValue: 3, unit: 'litre', price: 165, stock: 10, isActive: true },
      { id: '1-5', name: '5 litres', quantityValue: 5, unit: 'litre', price: 270, stock: 5, isActive: true },
    ],
  },
  {
    id: '8',
    name: 'Buffalo Milk',
    slug: 'buffalo-milk',
    category: 'Milk',
    description:
      'Rich, creamy buffalo milk with a higher fat content than cow milk, giving it a naturally thicker, richer taste. Collected daily and delivered fresh.',
    shortDescription: 'Rich, creamy, higher-fat buffalo milk.',
    image: buffaloMilkImage,
    isActive: true,
    variants: [
      { id: '8-1', name: '500 ml', quantityValue: 500, unit: 'ml', price: 35, stock: 30, isActive: true },
      { id: '8-2', name: '1 litre', quantityValue: 1, unit: 'litre', price: 68, stock: 25, isActive: true },
      { id: '8-3', name: '2 litres', quantityValue: 2, unit: 'litre', price: 130, stock: 15, isActive: true },
      { id: '8-4', name: '3 litres', quantityValue: 3, unit: 'litre', price: 190, stock: 8, isActive: true },
      { id: '8-5', name: '5 litres', quantityValue: 5, unit: 'litre', price: 310, stock: 4, isActive: true },
    ],
  },
  {
    id: '2',
    name: 'Curd',
    slug: 'curd',
    category: 'Curd',
    description:
      'Thick, set curd made fresh every day from our own milk. Naturally fermented with no preservatives, perfect for meals or a cool snack.',
    shortDescription: 'Thick, fresh, naturally set curd.',
    image: curdImage,
    isActive: true,
    variants: [
      { id: '2-1', name: '500 g', quantityValue: 500, unit: 'g', price: 40, stock: 25, isActive: true },
      { id: '2-2', name: '1 kg', quantityValue: 1, unit: 'kg', price: 75, stock: 15, isActive: true },
    ],
  },
  {
    id: '3',
    name: 'Paneer',
    slug: 'paneer',
    category: 'Paneer',
    description:
      'Soft, fresh paneer made from pure cow milk. No preservatives, cut and packed fresh on the day of delivery.',
    shortDescription: 'Soft, fresh paneer, no preservatives.',
    image: paneerImage,
    isActive: true,
    variants: [
      { id: '3-1', name: '250 g', quantityValue: 250, unit: 'g', price: 90, stock: 18, isActive: true },
      { id: '3-2', name: '500 g', quantityValue: 500, unit: 'g', price: 170, stock: 12, isActive: true },
    ],
  },
  {
    id: '4',
    name: 'Cow Ghee',
    slug: 'cow-ghee',
    category: 'Ghee',
    description:
      'Traditional bilona-style cow ghee, slow-cooked in small batches from fresh cream for a rich aroma and taste.',
    shortDescription: 'Traditional slow-cooked cow ghee.',
    image: cowGheeImage,
    isActive: true,
    variants: [
      { id: '4-1', name: '250 ml', quantityValue: 250, unit: 'ml', price: 220, stock: 20, isActive: true },
      { id: '4-2', name: '500 ml', quantityValue: 500, unit: 'ml', price: 420, stock: 15, isActive: true },
      { id: '4-3', name: '1 litre', quantityValue: 1, unit: 'litre', price: 800, stock: 8, isActive: true },
    ],
  },
  {
    id: '9',
    name: 'Buffalo Ghee',
    slug: 'buffalo-ghee',
    category: 'Ghee',
    description:
      'Traditional bilona-style buffalo ghee, slow-cooked from fresh buffalo cream. Paler in colour than cow ghee, with a rich, dense texture.',
    shortDescription: 'Traditional slow-cooked buffalo ghee.',
    image: buffaloGheeImage,
    isActive: true,
    variants: [
      { id: '9-1', name: '250 ml', quantityValue: 250, unit: 'ml', price: 260, stock: 16, isActive: true },
      { id: '9-2', name: '500 ml', quantityValue: 500, unit: 'ml', price: 500, stock: 10, isActive: true },
      { id: '9-3', name: '1 litre', quantityValue: 1, unit: 'litre', price: 950, stock: 5, isActive: true },
    ],
  },
  {
    id: '5',
    name: 'Butter',
    slug: 'butter',
    category: 'Butter',
    description:
      'Creamy white butter churned fresh from cow milk, unsalted and rich in flavour.',
    shortDescription: 'Fresh, creamy, unsalted butter.',
    image: butterImage,
    isActive: true,
    variants: [
      { id: '5-1', name: '100 g', quantityValue: 100, unit: 'g', price: 55, stock: 22, isActive: true },
      { id: '5-2', name: '250 g', quantityValue: 250, unit: 'g', price: 130, stock: 14, isActive: true },
      { id: '5-3', name: '500 g', quantityValue: 500, unit: 'g', price: 250, stock: 6, isActive: true },
    ],
  },
  {
    id: '6',
    name: 'Buttermilk',
    slug: 'buttermilk',
    category: 'Buttermilk',
    description:
      'Light, refreshing spiced buttermilk (chaas) made fresh daily, perfect for a hot afternoon.',
    shortDescription: 'Light, refreshing spiced chaas.',
    image: buttermilkImage,
    isActive: true,
    variants: [
      { id: '6-1', name: '200 ml', quantityValue: 200, unit: 'ml', price: 15, stock: 30, isActive: true },
      { id: '6-2', name: '500 ml', quantityValue: 500, unit: 'ml', price: 32, stock: 20, isActive: true },
      { id: '6-3', name: '1 litre', quantityValue: 1, unit: 'litre', price: 58, stock: 10, isActive: true },
    ],
  },
  {
    id: '7',
    name: 'Lassi',
    slug: 'lassi',
    category: 'Lassi',
    description:
      'Sweet, thick lassi made from fresh curd, lightly sweetened and churned to a smooth finish.',
    shortDescription: 'Sweet, thick, creamy lassi.',
    image: lassiImage,
    isActive: true,
    variants: [
      { id: '7-1', name: '200 ml', quantityValue: 200, unit: 'ml', price: 25, stock: 24, isActive: true },
      { id: '7-2', name: '500 ml', quantityValue: 500, unit: 'ml', price: 55, stock: 16, isActive: true },
    ],
  },
]

// Shared "Popular" designation, reused by Home's Popular Products
// section and the Products page card badge — one source of truth
// instead of two pages each guessing which products are popular.
export const popularProductNames = ['Cow Milk', 'Curd', 'Paneer', 'Cow Ghee']

// Small helper other pages can reuse instead of writing this logic themselves.
export function getProductById(id) {
  return mockProducts.find((product) => product.id === id)
}

export function getProductByName(name) {
  return mockProducts.find((product) => product.name === name)
}

export function getStartingPrice(product) {
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  if (activeVariants.length === 0) return null
  return Math.min(...activeVariants.map((variant) => variant.price))
}

export function isProductInStock(product) {
  return product.variants.some((variant) => variant.isActive && variant.stock > 0)
}
