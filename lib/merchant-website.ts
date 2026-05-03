export type WebsiteTheme = 'emerald' | 'midnight' | 'sunset'
export type WebsiteLayout = 'classic' | 'minimal' | 'bold'
export type WebsiteBannerTemplate = 'discount' | 'promo' | 'product'

export interface WebsiteBannerConfig {
  enabled: boolean
  template: WebsiteBannerTemplate
  badge: string
  headline: string
  subheadline: string
  ctaText: string
}

export const WEBSITE_THEMES: Array<{ id: WebsiteTheme; label: string }> = [
  { id: 'emerald', label: 'Emerald' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'sunset', label: 'Sunset' },
]

export const WEBSITE_LAYOUTS: Array<{ id: WebsiteLayout; label: string }> = [
  { id: 'classic', label: 'Classic' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold', label: 'Bold' },
]

export const WEBSITE_BANNER_TEMPLATES: Array<{
  id: WebsiteBannerTemplate
  label: string
  description: string
  defaults: Omit<WebsiteBannerConfig, 'enabled' | 'template'>
}> = [
  {
    id: 'discount',
    label: 'Discount Sale',
    description: 'Perfect for percentage or fixed-price deals.',
    defaults: {
      badge: 'Limited Offer',
      headline: 'Save big on selected items this week',
      subheadline: 'Highlight your best markdowns and give visitors a clear reason to shop now.',
      ctaText: 'Shop the deal',
    },
  },
  {
    id: 'promo',
    label: 'Store Promotion',
    description: 'Use this for seasonal campaigns or general announcements.',
    defaults: {
      badge: 'Now Live',
      headline: 'Fresh arrivals and special offers are here',
      subheadline: 'Turn your homepage into a campaign landing area with one focused message.',
      ctaText: 'See what is new',
    },
  },
  {
    id: 'product',
    label: 'Product Spotlight',
    description: 'Feature one hero product or bestseller on the mini website.',
    defaults: {
      badge: 'Featured Product',
      headline: 'This bestseller deserves the front row',
      subheadline: 'Lead with your strongest product story, price hook, or launch message.',
      ctaText: 'View featured item',
    },
  },
]

export function getWebsiteBannerTemplate(template?: WebsiteBannerTemplate | null) {
  return WEBSITE_BANNER_TEMPLATES.find((item) => item.id === template) || WEBSITE_BANNER_TEMPLATES[0]
}

export function getDefaultWebsiteBannerConfig(template: WebsiteBannerTemplate = 'discount'): WebsiteBannerConfig {
  const preset = getWebsiteBannerTemplate(template)
  return {
    enabled: false,
    template: preset.id,
    badge: preset.defaults.badge,
    headline: preset.defaults.headline,
    subheadline: preset.defaults.subheadline,
    ctaText: preset.defaults.ctaText,
  }
}

export function isWebsiteBannerTemplate(value: unknown): value is WebsiteBannerTemplate {
  return value === 'discount' || value === 'promo' || value === 'product'
}

export function normalizeWebsiteBannerConfig(value: unknown): WebsiteBannerConfig {
  if (!value || typeof value !== 'object') {
    return getDefaultWebsiteBannerConfig()
  }

  const candidate = value as Partial<WebsiteBannerConfig>
  const preset = getWebsiteBannerTemplate(isWebsiteBannerTemplate(candidate.template) ? candidate.template : 'discount')

  const badge = typeof candidate.badge === 'string' && candidate.badge.trim()
    ? candidate.badge.trim().slice(0, 40)
    : preset.defaults.badge

  const headline = typeof candidate.headline === 'string' && candidate.headline.trim()
    ? candidate.headline.trim().slice(0, 90)
    : preset.defaults.headline

  const subheadline = typeof candidate.subheadline === 'string' && candidate.subheadline.trim()
    ? candidate.subheadline.trim().slice(0, 180)
    : preset.defaults.subheadline

  const ctaText = typeof candidate.ctaText === 'string' && candidate.ctaText.trim()
    ? candidate.ctaText.trim().slice(0, 28)
    : preset.defaults.ctaText

  return {
    enabled: Boolean(candidate.enabled),
    template: preset.id,
    badge,
    headline,
    subheadline,
    ctaText,
  }
}

export function slugifyStoreName(value: string) {
  return (value || 'store')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'store'
}

export function extractMerchantIdFromSlug(slug: string) {
  const match = String(slug || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  return match?.[0] || ''
}

export function getMerchantMiniWebsitePath({
  merchantId,
  businessName,
}: {
  merchantId: string
  businessName?: string
  theme?: WebsiteTheme
  layout?: WebsiteLayout
}) {
  const slug = `${slugifyStoreName(businessName || 'store')}-${merchantId}`
  return `/store/${slug}`
}

export function getMerchantMiniWebsiteStorageKey(merchantId: string) {
  return `merchant-mini-website:${merchantId}`
}
