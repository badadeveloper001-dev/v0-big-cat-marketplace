"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function LandingPage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const online = navigator.onLine
    setIsOnline(online)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Always show animation for 5 seconds, then redirect if online.
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false)
    }, 5000)
    return () => clearTimeout(splashTimer)
  }, [])

  useEffect(() => {
    if (!showSplash && isOnline) {
      router.push("/marketplace")
    }
  }, [showSplash, isOnline, router])

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 overflow-hidden relative">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Animated logo */}
        <div
          className="animate-fade-in-scale"
          style={{
            animation: "fadeInScale 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <Image
            src="/image.png"
            alt="BigCat Marketplace"
            width={120}
            height={120}
            priority
            className="drop-shadow-lg"
          />
        </div>

        {/* Logo text */}
        <h1
          className="text-4xl font-black text-black tracking-tight animate-fade-in"
          style={{
            animation: "fadeIn 1.5s ease-out 0.3s both",
          }}
        >
          BigCat
        </h1>

        {/* Status text */}
        <div className="text-center mt-8">
          {isOnline ? (
            <div
              className="animate-fade-in"
              style={{
                animation: "fadeIn 1s ease-out 1s both",
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
              </div>
              <p className="text-xs text-gray-500">Loading marketplace...</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
              </div>
              <p className="text-xs text-gray-500">Waiting for connection...</p>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isOnline && (
          <div
            className="mt-8 flex gap-1 animate-fade-in"
            style={{
              animation: "fadeIn 1s ease-out 1.5s both",
            }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
