"use client"

import Image from "next/image"

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
        <Image
          src="/image.png"
          alt="BigCat Marketplace logo"
          fill
          className="object-contain"
          sizes="32px"
        />
      </div>
      <div className="min-w-0">
        <p className={`font-semibold text-foreground leading-none ${compact ? 'text-sm' : 'text-base'}`}>
          BigCat Marketplace
        </p>
      </div>
    </div>
  )
}
