"use client"

import Image from "next/image"

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`relative rounded-lg overflow-hidden bg-white border border-border flex-shrink-0 ${compact ? 'w-9 h-9' : 'w-10 h-10'}`}>
        <Image
          src="/image.png"
          alt="BigCat Marketplace logo"
          fill
          className="object-contain"
          sizes="40px"
        />
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-foreground leading-none tracking-tight ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
          BigCat Marketplace
        </p>
      </div>
    </div>
  )
}

export function PoweredByMarquee() {
  const logos = [
    { src: '/SMEDAN_ido8Y4OzuL_0.png', alt: 'SMEDAN', className: 'h-5 w-auto' },
    { src: '/palmpay-seeklogo.png', alt: 'PalmPay', className: 'h-5 w-auto' },
    { src: '/image.png', alt: 'BigCat', className: 'h-5 w-auto' },
  ]

  return (
    <div className="absolute left-1/2 top-1/2 hidden md:block -translate-x-1/2 -translate-y-1/2 w-[320px] overflow-hidden pointer-events-none">
      <div className="flex items-center gap-6 whitespace-nowrap animate-[marquee_14s_linear_infinite]">
        {[...logos, ...logos].map((logo, index) => (
          <div key={`${logo.alt}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">powered by</span>
            <div className="h-7 px-2 rounded-full bg-background/80 border border-border flex items-center">
              <Image src={logo.src} alt={logo.alt} width={72} height={20} className={logo.className} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
