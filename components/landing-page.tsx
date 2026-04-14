"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ShoppingBag,
  Brain,
  CreditCard,
  Building2,
  ArrowRight,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Package,
  ChevronRight,
  Smartphone,
} from "lucide-react"

const categories = [
  "Electronics", "Fashion", "Food & Drinks", "Health & Beauty",
  "Home & Garden", "Automobiles", "Books & Media", "Sports",
  "Baby & Kids", "Agriculture", "Services", "Artisans",
]

const stats = [
  { value: "50K+", label: "Active Merchants", icon: Users },
  { value: "200K+", label: "Products Listed", icon: Package },
  { value: "₦2B+", label: "Transactions Processed", icon: TrendingUp },
  { value: "4.8★", label: "Average Rating", icon: Star },
]

const features = [
  {
    icon: ShoppingBag,
    title: "Smart Marketplace",
    description: "AI-powered product discovery with intelligent search that understands what you really need.",
    gradient: "from-[#00A651] to-[#45c76c]",
    bg: "bg-[#06521c]/40",
    border: "border-[#0b772a]/50",
    glow: "shadow-[#06521c]/60",
  },
  {
    icon: Brain,
    title: "AI BizPilot",
    description: "Get business insights, real-time analytics, and personalised growth recommendations.",
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-950/50",
    border: "border-violet-800/40",
    glow: "shadow-violet-900/40",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Buyer-protection escrow powered by PalmPay — funds only released when you're satisfied.",
    gradient: "from-sky-500 to-blue-400",
    bg: "bg-sky-950/50",
    border: "border-sky-800/40",
    glow: "shadow-sky-900/40",
  },
  {
    icon: Building2,
    title: "Business Onboarding",
    description: "CAC registration, SMEDAN certification, and agent-assisted setup — all in one place.",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-950/50",
    border: "border-orange-800/40",
    glow: "shadow-orange-900/40",
  },
]

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in under 2 minutes as a buyer or merchant. No paperwork, no hassle.",
    color: "bg-[#00A651]",
    textColor: "text-[#45c76c]",
  },
  {
    number: "02",
    title: "Get Verified",
    description: "SMEDAN-backed onboarding grants you instant business credibility and trust badges.",
    color: "bg-violet-400",
    textColor: "text-violet-400",
  },
  {
    number: "03",
    title: "Start Trading",
    description: "List products, browse thousands of categories, and make secure transactions.",
    color: "bg-sky-400",
    textColor: "text-sky-400",
  },
  {
    number: "04",
    title: "Scale with AI",
    description: "Use AI BizPilot dashboards to optimise your store and grow revenue faster.",
    color: "bg-orange-400",
    textColor: "text-orange-400",
  },
]

const testimonials = [
  {
    name: "Amara Obi",
    role: "Fashion Merchant, Lagos",
    quote: "BigCat tripled my sales in 3 months. The AI recommendations are like having a business consultant 24/7.",
    rating: 5,
    avatar: "AO",
  },
  {
    name: "Chukwuemeka Nwosu",
    role: "Electronics Retailer, Abuja",
    quote: "The escrow payment system gives my customers confidence. Refund disputes are a thing of the past.",
    rating: 5,
    avatar: "CN",
  },
  {
    name: "Fatimah Bello",
    role: "Food Vendor, Kano",
    quote: "Getting my SMEDAN certification through BigCat took two days. What used to take weeks!",
    rating: 5,
    avatar: "FB",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#032c0e] font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#032c0e]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00A651] flex items-center justify-center shadow-lg shadow-black/30">
              <Image src="/image.png" alt="BigCat" width={22} height={22} className="object-contain brightness-0 invert" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">BigCat</span>
            <span className="hidden sm:block text-[10px] font-semibold text-[#45c76c] bg-[#00A651]/10 border border-[#00A651]/30 px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">
              Marketplace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="hidden sm:block text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 bg-[#00A651] hover:bg-[#17bd49] text-white text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-lg shadow-black/30"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-5">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#00A651]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#00A651]/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
              Nigeria&apos;s #1 Business Marketplace
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Buy. Sell.{" "}
            <span className="bg-gradient-to-r from-[#00A651] to-[#45c76c] bg-clip-text text-transparent">
              Grow.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              All in One
            </span>{" "}
            Place.
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A smart marketplace powered by AI, secured by PalmPay escrow, and backed by SMEDAN — built for every Nigerian business to thrive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="group inline-flex items-center gap-2 bg-[#00A651] hover:bg-[#17bd49] text-white text-base font-bold px-8 py-4 rounded-full shadow-2xl shadow-black/40 transition-all hover:-translate-y-0.5"
            >
              Start Selling Today
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white text-base font-semibold px-6 py-4 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Products
            </Link>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
              >
                <stat.icon className="w-3.5 h-3.5 text-[#45c76c] flex-shrink-0" />
                <span className="text-white font-bold text-sm">{stat.value}</span>
                <span className="text-gray-500 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY MARQUEE ── */}
      <section className="py-6 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex gap-3 animate-[marquee_25s_linear_infinite] whitespace-nowrap w-max">
          {[...categories, ...categories].map((cat, i) => (
            <Link
              key={i}
              href="/marketplace"
              className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-[#00A651]/15 border border-white/10 hover:border-[#00A651]/40 text-gray-300 hover:text-[#45c76c] text-sm font-medium px-4 py-2 rounded-full transition-all flex-shrink-0"
            >
              <ChevronRight className="w-3 h-3 opacity-50" /> {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* ── PARTNER TRUST BAR ── */}
      <section className="py-14 px-5 bg-[#032c0e]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#45c76c]/60 mb-8">
            Trusted & Backed By
          </p>
          <div className="flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
            {/* SMEDAN — transparent bg, white text shows on dark green */}
            <Image src="/SMEDAN_ido8Y4OzuL_0.png" alt="SMEDAN" width={130} height={52} className="object-contain opacity-90 hover:opacity-100 transition-opacity" />
            {/* PalmPay — white bg baked in, keep minimal white pill */}
            <div className="bg-white rounded-2xl px-4 py-2.5 shadow-md opacity-90 hover:opacity-100 transition-opacity">
              <Image src="/palmpay-seeklogo.png" alt="PalmPay" width={90} height={36} className="object-contain" />
            </div>
            {/* BigCat — black logo, invert to white */}
            <Image src="/image.png" alt="BigCat" width={72} height={36} className="object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#45c76c]">What We Offer</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4 leading-tight">
              One platform.<br />
              <span className="bg-gradient-to-r from-[#00A651] to-violet-400 bg-clip-text text-transparent">
                Infinite possibilities.
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Everything you need to buy, sell, scale, and succeed — built into a single smart marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} ${f.border} border rounded-3xl p-7 hover:shadow-2xl ${f.glow} transition-all hover:-translate-y-1 group`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} shadow-lg mb-5`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                <div className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r ${f.gradient} bg-clip-text text-transparent`}>
                  Learn more <ChevronRight className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Up &amp; running{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
                in minutes
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              From sign-up to your first sale — we&apos;ve made every step painless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="relative group">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
                )}
                <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-all hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center font-extrabold text-white text-lg shadow-lg mb-5`}>
                    {step.number}
                  </div>
                  <h3 className={`font-bold text-white mb-2 ${step.textColor}`}>{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-5 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Merchant Stories</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              Real people.{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Real growth.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/[0.04] border border-white/10 rounded-3xl p-7 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
              >
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00A651] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-28 px-5 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[400px] rounded-full bg-[#00A651]/20 blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00A651]/10 border border-[#00A651]/25 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3.5 h-3.5 text-[#45c76c]" />
            <span className="text-xs font-semibold text-[#72d38e] uppercase tracking-widest">
              Join 50,000+ merchants
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Your business deserves{" "}
            <span className="bg-gradient-to-r from-[#00A651] to-[#72d38e] bg-clip-text text-transparent">
              to be seen.
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Open your store today. It&apos;s free, fast, and backed by Nigeria&apos;s most trusted business network.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="group inline-flex items-center gap-2 bg-[#00A651] hover:bg-[#17bd49] text-white text-base font-bold px-10 py-4 rounded-full shadow-2xl shadow-black/40 transition-all hover:-translate-y-0.5"
            >
              Open My Store Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Or shop as a buyer
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00A651] flex items-center justify-center">
              <Image src="/image.png" alt="BigCat" width={18} height={18} className="object-contain brightness-0 invert" />
            </div>
            <span className="font-bold text-white text-sm">BigCat Marketplace</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Browse</Link>
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Sell</Link>
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Partners</Link>
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-3 py-1.5">
              <Image src="/palmpay-seeklogo.png" alt="PalmPay" width={60} height={22} className="object-contain" />
            </div>
            <Image src="/SMEDAN_ido8Y4OzuL_0.png" alt="SMEDAN" width={60} height={22} className="object-contain opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} BigCat Marketplace. All rights reserved.</p>
        </div>
      </footer>

      {/* Marquee animation */}
    </div>
  )
}
