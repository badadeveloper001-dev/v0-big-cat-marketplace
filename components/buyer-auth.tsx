"use client"

import { useState } from "react"
import { useRole } from "@/lib/role-context"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Phone, Chrome, Apple } from "lucide-react"

export function BuyerAuth({ onBack }: { onBack: () => void }) {
  const { setRole } = useRole()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Set role to buyer to proceed to buyer dashboard
    setRole("buyer")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-md shadow-primary/30">
              <span className="text-primary-foreground font-bold text-xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-balance">
              {isSignUp ? "Create Buyer Account" : "Buyer Sign In"}
            </h1>
            <p className="text-muted-foreground mt-2 text-pretty">
              {isSignUp ? "Join BigCat as a buyer" : "Sign in to your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 mt-6"
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 py-3 bg-card border border-border rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <Chrome className="w-5 h-5" />
              <span className="text-sm font-medium text-foreground">Google</span>
            </button>
            <button className="flex-1 py-3 bg-card border border-border rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <Apple className="w-5 h-5" />
              <span className="text-sm font-medium text-foreground">Apple</span>
            </button>
          </div>

          {/* Toggle between Sign In and Sign Up */}
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>
    </div>
  )
}
