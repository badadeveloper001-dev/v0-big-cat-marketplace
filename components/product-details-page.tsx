'use client'

import { useState, useEffect } from 'react'
import { getProductById } from '@/lib/product-actions'
import { ArrowLeft, ShoppingCart, MapPin, Package, Loader2, AlertCircle, Truck } from 'lucide-react'

interface ProductDetailsPageProps {
  productId: string
  onBack?: () => void
}

export function ProductDetailsPage({ productId, onBack }: ProductDetailsPageProps) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    setLoading(true)
    const result = await getProductById(productId)
    if (result.success) {
      setProduct(result.data)
    } else {
      setError(result.error || 'Failed to load product')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Product not found'}</p>
        </div>
      </div>
    )
  }

  const merchant = product.merchant_profiles || {}

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-secondary to-secondary/50 rounded-xl flex items-center justify-center">
          <Package className="w-24 h-24 text-muted-foreground opacity-50" />
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs px-2 py-1 bg-secondary rounded-full text-foreground">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-foreground mt-4">{product.name}</h1>
            </div>
          </div>

          <p className="text-2xl font-bold text-foreground">${parseFloat(product.price).toFixed(2)}</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">About this product</h2>
          <p className="text-foreground leading-relaxed text-sm">{product.description}</p>
        </div>

        {/* Product Details */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Details</h2>
          
          {product.weight && (
            <div className="flex items-center gap-3 text-sm">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">Weight: {product.weight}kg</span>
            </div>
          )}

          {product.status === 'active' && (
            <div className="flex items-center gap-3 text-sm text-primary">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>In Stock</span>
            </div>
          )}

          {product.status === 'pending_weight_verification' && (
            <div className="flex items-center gap-3 text-sm text-chart-4">
              <AlertCircle className="w-4 h-4" />
              <span>Pending weight verification</span>
            </div>
          )}
        </div>

        {/* Delivery Estimation */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Estimated Delivery</h3>
          </div>
          <p className="text-sm text-foreground">
            Delivery time will be calculated based on your location and the item weight.
          </p>
        </div>

        {/* Merchant Info */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Seller Information</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {merchant.business_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{merchant.business_name}</p>
              {merchant.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{merchant.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Quantity</label>
          <div className="flex items-center gap-3 bg-secondary rounded-lg p-3 w-fit">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center bg-card rounded hover:bg-border transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-card rounded hover:bg-border transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
          <button className="w-full py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold">
            Buy Now
          </button>
        </div>
      </main>
    </div>
  )
}
