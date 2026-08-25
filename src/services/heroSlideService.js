import { supabase } from '../lib/supabaseClient'

const SLIDE_SELECT = 'id, title, description, image_url, cta_text, cta_type, cta_route, product_id, is_active, display_order'

function mapSlideRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    ctaText: row.cta_text,
    ctaType: row.cta_type,
    ctaRoute: row.cta_route,
    productId: row.product_id,
    isActive: row.is_active,
    displayOrder: row.display_order,
  }
}

// Used by HeroCarousel — RLS restricts this to active slides for
// anonymous/customer sessions automatically.
export async function fetchActiveHeroSlides() {
  const { data, error } = await supabase
    .from('home_hero_slides')
    .select(SLIDE_SELECT)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapSlideRow)
}

// Used by AdminHomePage — an authenticated admin session's RLS policy
// additionally allows reading inactive slides.
export async function fetchAllHeroSlides() {
  const { data, error } = await supabase
    .from('home_hero_slides')
    .select(SLIDE_SELECT)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapSlideRow)
}

function toRow(slideData) {
  return {
    title: slideData.title,
    description: slideData.description,
    image_url: slideData.imageUrl,
    cta_text: slideData.ctaText,
    cta_type: slideData.ctaType,
    cta_route: slideData.ctaType === 'route' ? slideData.ctaRoute : null,
    product_id: slideData.ctaType === 'product' ? slideData.productId : null,
    is_active: slideData.isActive,
    display_order: slideData.displayOrder,
  }
}

export async function createHeroSlide(slideData) {
  const { data, error } = await supabase
    .from('home_hero_slides')
    .insert(toRow(slideData))
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateHeroSlide(slideId, slideData) {
  const { error } = await supabase
    .from('home_hero_slides')
    .update({ ...toRow(slideData), updated_at: new Date().toISOString() })
    .eq('id', slideId)
  if (error) throw error
}

export async function setHeroSlideActive(slideId, isActive) {
  const { error } = await supabase
    .from('home_hero_slides')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', slideId)
  if (error) throw error
}

export async function uploadHeroSlideImage(slideId, file) {
  const path = `heroes/${slideId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
