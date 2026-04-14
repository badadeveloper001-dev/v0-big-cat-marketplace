"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, Brain, CreditCard, Building2, ArrowRight, CheckCircle2 } from "lucide-react"

const features = [
  {
    icon: ShoppingBag,
    title: "Smart Marketplace",
    description: "Buy and sell easily with intelligent search and AI-powered product discovery.",
    color: "bg-green-50",
    iconColor: "text-green-600",
    border: "border-green-100",
  },
  {
    icon: Brain,
    title: "AI BizPilot",
    description: "Get business insights, sales analytics, and growth recommendations — all in one place.",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    border: "border-purple-100",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Powered by PalmPay's trusted wallet system for fast, safe, and seamless transactions.",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    border: "border-purple-100",
  },
  {
    icon: Building2,
    title: "Business Onboarding",
    description: "Get CAC registration and SMEDAN certification support through verified agents.",
    color: "bg-green-50",
    iconColor: "text-green-600",
    border: "border-green-100",
  },
]

const steps = [
  { number: "01", title: "Sign Up", description: "Create your free account as a buyer or merchant in minutes." },
  { number: "02", title: "Get Verified", description: "Go through SMEDAN-supported onboarding for business credibility." },
  { number: "03", title: "Start Trading", description: "Browse the marketplace, list products, and start buying or selling." },
  { number: "04", title: "Grow with AI", description: "Use AI BizPilot to track performance and scale your business." },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/image.png"
              alt="BigCat"
              width={36}
              height={36}
              className="object-contain mix-blend-multiply"
            />
            <span className="font-bold text-gray-900 text-lg">BigCat</span>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/40 to-purple-50/30 pt-20 pb-28 px-6">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-100/50 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Nigeria&apos;s Business Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Empowering Businesses.{" "}
            <span className="text-green-600">Connecting</span>{" "}
            <span className="text-purple-600">Markets.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A smart marketplace powered by AI, seamless payments, and business onboarding support — built to help every Nigerian business thrive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-8 py-4 rounded-full shadow-lg shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-0.5"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base font-medium px-6 py-4 rounded-full border border-gray-200 hover:border-gray-300 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* BRANDING STRIP */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          {/* Primary: SMEDAN — dark background so white logo text is visible */}
          <div className="inline-flex items-center justify-center bg-gray-900 rounded-2xl px-6 py-3 mb-5 shadow-md">
            <Image
              src="/SMEDAN_ido8Y4OzuL_0.png"
              alt="SMEDAN logo"
              width={160}
              height={70}
              className="object-contain"
            />
          </div>

          {/* Secondary partners */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Powered By</p>
          <div className="flex items-center justify-center gap-6 flex-wrap mb-6">
            <Image
              src="/palmpay-seeklogo.png"
              alt="PalmPay logo"
              width={90}
              height={70}
              className="object-contain mix-blend-multiply dark:mix-blend-screen"
            />
            <Image
              src="/image.png"
              alt="BigCat logo"
              width={80}
              height={70}
              className="object-contain mix-blend-multiply dark:mix-blend-screen"
            />
          </div>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Powered by <strong className="text-gray-800">BigCat</strong>, in official partnership with{" "}
            <strong className="text-green-700">SMEDAN</strong>, and supported by{" "}
            <strong className="text-purple-700">PalmPay</strong>.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything your business needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              One platform for buying, selling, payments, and growth — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`${f.color} ${f.border} border rounded-2xl p-7 hover:shadow-md transition-shadow`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get started in minutes. From sign-up to your first sale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-5">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                      i % 2 === 0
                        ? "bg-green-600 text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {step.number}
                  </div>
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className={`w-4 h-4 ${i % 2 === 0 ? "text-green-500" : "text-purple-500"}`} />
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join thousands of merchants and buyers on Nigeria&apos;s smartest marketplace.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-base font-semibold px-10 py-4 rounded-full shadow-lg shadow-green-900/30 transition-all hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-8 px-6 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-6 mb-4 flex-wrap">
          <Image src="/image.png" alt="BigCat" width={28} height={28} className="object-contain mix-blend-screen opacity-60" />
          <Image src="/palmpay-seeklogo.png" alt="PalmPay" width={70} height={24} className="object-contain mix-blend-screen opacity-60" />
          <div className="bg-white/10 rounded-lg px-3 py-1">
            <Image src="/SMEDAN_ido8Y4OzuL_0.png" alt="SMEDAN" width={80} height={28} className="object-contain" />
          </div>
        </div>
        <p>© {new Date().getFullYear()} BigCat Marketplace. All rights reserved.</p>
      </footer>
    </div>
  )
}
