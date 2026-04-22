const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || ""

export type MarketplaceProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  category?: string | null
  merchant_profiles?: {
    business_name?: string | null
  } | null
}

type ProductsResponse = {
  success?: boolean
  error?: string
  data?: MarketplaceProduct[]
}

function normalizeBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL. Add it to mobile-app/.env.")
  }

  return API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
}

export async function fetchMarketplaceProducts(search = ""): Promise<MarketplaceProduct[]> {
  const base = normalizeBaseUrl()
  const url = new URL(`${base}/api/products`)

  if (search.trim()) {
    url.searchParams.set("search", search.trim())
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Products request failed: ${response.status}`)
  }

  const body = (await response.json()) as ProductsResponse
  if (!body.success) {
    throw new Error(body.error || "Products API returned an error")
  }

  return Array.isArray(body.data)
    ? body.data.map((item) => ({
        ...item,
        id: String(item.id),
        price: Number(item.price || 0),
      }))
    : []
}
