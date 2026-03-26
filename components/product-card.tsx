'use client'

import { ShoppingCart, Star, MapPin, Package } from 'lucide-react'
import { formatNaira } from '@/lib/currency-utils'

interface ProductCardProps {
  id: string
  name: string
  price: number
  category: string
  merchant: {
    id: string
    business_name: string
    logo_url?: string
    location?: string
  }
  onClick?: () => void
}

export function ProductCard({
  id,
  name,
  price,
  category,
  merchant,
  onClick,
}: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Product Image Placeholder */}
      <div className="aspect-square bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center overflow-hidden relative">
        <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
          <Package className="w-12 h-12 opacity-50" />
          <span className="text-xs mt-2 text-center px-2">{category}</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-2xl font-bold text-foreground mt-2">
            {formatNaira(price)}
          </p>
        </div>

        {/* Merchant Info */}
        <div className="flex items-center gap-2 py-2 border-t border-border">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {merchant.business_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {merchant.business_name}
            </p>
            {merchant.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{merchant.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}

interface ProductGridProps {
  products: ProductCardProps[]
  onProductClick?: (productId: string) => void
  loading?: boolean
}

export function ProductGrid({
  products,
  onProductClick,
  loading,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl aspect-square animate-pulse"
            />
          ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onClick={() => onProductClick?.(product.id)}
        />
      ))}
    </div>
  )
}
