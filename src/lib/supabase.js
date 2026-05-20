import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'
export const STORE_NAME = 'ShopEase'
export const CURRENCY = 'Rs.'

export function formatPrice(amount) {
  return `${CURRENCY} ${Number(amount).toLocaleString('en-PK')}`
}

export function effectivePrice(product) {
  return product.sale_price ?? product.price
}

export function discountPct(product) {
  if (!product.sale_price) return 0
  return Math.round((1 - product.sale_price / product.price) * 100)
}
