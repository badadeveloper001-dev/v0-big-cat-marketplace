"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Languages, Loader2, Mic, Send, Volume2 } from "lucide-react"

type AssistantMode = "buyer" | "merchant"
type AssistantLanguage = "auto" | "en" | "pcm" | "yo" | "ig" | "ha"

type AssistantMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  products?: Array<{ id: string; name: string; price: number; vendor_name: string }>
  vendors?: Array<{ id: string; name: string; category: string; location: string }>
}

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor
    SpeechRecognition?: SpeechRecognitionCtor
  }
}

const LANG_OPTIONS: Array<{ value: AssistantLanguage; label: string; locale: string }> = [
  { value: "auto", label: "Auto (Detect)", locale: "en-NG" },
  { value: "en", label: "English", locale: "en-NG" },
  { value: "pcm", label: "Nigerian Pidgin", locale: "en-NG" },
  { value: "yo", label: "Yoruba", locale: "yo-NG" },
  { value: "ig", label: "Igbo", locale: "ig-NG" },
  { value: "ha", label: "Hausa", locale: "ha-NG" },
]

const BUYER_SUGGESTIONS = [
  "Find affordable phones in Lagos",
  "Show me trusted tailors near me",
  "Compare prices for cooking gas",
]

const MERCHANT_SUGGESTIONS = [
  "Suggest products I should promote this week",
  "How can I increase repeat buyers?",
  "Write a short promo in Pidgin",
]

function getGreeting(mode: AssistantMode, language: AssistantLanguage) {
  if (language === "yo") {
    return mode === "merchant"
      ? "E kaabo. Emi ni BigCat AI. Mo le ran o lowo pelu tita, ipolowo, ati isakoso itaja re."
      : "E kaabo. Emi ni BigCat AI. Mo le ran o lowo lati wa ọja ati onisowo to ba ye o."
  }

  if (language === "ig") {
    return mode === "merchant"
      ? "Nnoo. Abum BigCat AI. A ga m enyere gi na ire ahia, mgbasa ozi, na nlekota ulo ahia gi."
      : "Nnoo. Abum BigCat AI. A ga m enyere gi ichota ngwaahịa na ndi na-ere ahia di mma."
  }

  if (language === "ha") {
    return mode === "merchant"
      ? "Sannu. Ni BigCat AI. Zan taimaka maka tallace-tallace, talla, da kula da shagon ka."
      : "Sannu. Ni BigCat AI. Zan taimaka maka neman kaya da dillalai masu kyau kusa da kai."
  }

  if (language === "pcm") {
    return mode === "merchant"
      ? "Welcome. I be BigCat AI. I fit help you grow sales, run better promo, and manage your store well."
      : "Welcome. I be BigCat AI. I fit help you find better products and trusted vendors fast fast."
  }

  return mode === "merchant"
    ? "Welcome. I am BigCat AI. I can help you grow sales, improve offers, and manage your store operations."
    : "Welcome. I am BigCat AI. I can help you find products, compare prices, and discover trusted vendors."
}

function safeLocale(value: AssistantLanguage) {
  return LANG_OPTIONS.find((item) => item.value === value)?.locale || "en-NG"
}

export function NigeriaAiAssistant({
  assistantMode,
  className,
}: {
  assistantMode: AssistantMode
  className?: string
}) {
  const [language, setLanguage] = useState<AssistantLanguage>("auto")
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: getGreeting(assistantMode, "auto"),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [voiceHint, setVoiceHint] = useState("")
  const [voiceHintShown, setVoiceHintShown] = useState(false)
  const [voiceCaptureHint, setVoiceCaptureHint] = useState("")
  const [recording, setRecording] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [replyLanguage, setReplyLanguage] = useState<AssistantLanguage>("en")
  const [autoSpeak, setAutoSpeak] = useState(true)
  const listRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const suggestions = useMemo(
    () => (assistantMode === "merchant" ? MERCHANT_SUGGESTIONS : BUYER_SUGGESTIONS),
    [assistantMode],
  )

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: getGreeting(assistantMode, language),
      },
    ])
    setError("")
  }, [assistantMode, language])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const sendPrompt = async (prompt: string) => {
    const message = prompt.trim()
    if (!message || loading) return

    setError("")
    setLoading(true)

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          language,
          assistantMode,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || "Assistant failed to respond")
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-fallback-${Date.now()}`,
            role: "assistant",
            text: "I could not process that right now. Please try again.",
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: String(result.reply || "I am here to help."),
            products: Array.isArray(result?.data?.products) ? result.data.products.slice(0, 4) : [],
            vendors: Array.isArray(result?.data?.vendors) ? result.data.vendors.slice(0, 4) : [],
        },
      ])

      const nextReplyLanguage = String(result?.replyLanguage || "en") as AssistantLanguage
      setReplyLanguage(nextReplyLanguage)

      if (autoSpeak) {
        speakText(String(result.reply || "I am here to help."), nextReplyLanguage)
      }
    } catch {
      setError("Network issue. Please try again.")
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "I could not connect right now. Please try again shortly.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const startRecognition = (locales: string[], attempt = 0) => {
    if (typeof window === "undefined") return

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setError("Voice input is not supported in this browser. Please type your message.")
      return
    }

    const recognition = new Ctor()
    const currentLocale = locales[Math.min(attempt, locales.length - 1)] || "en-NG"
    let finalTranscript = ""
    let liveTranscript = ""
    let hadError = false

  recognition.lang = currentLocale
    recognition.interimResults = true
    recognition.continuous = false

    setVoiceCaptureHint(`Listening (${currentLocale})... speak now.`)

    recognition.onresult = (event: any) => {
      let interimTranscript = ""

      for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
        const transcript = String(event.results?.[i]?.[0]?.transcript || "")
        if (!transcript) continue
        if (event.results?.[i]?.isFinal) {
          finalTranscript += `${transcript} `
        } else {
          interimTranscript += transcript
        }
      }

      const merged = `${finalTranscript} ${interimTranscript}`.trim()
      if (merged) {
        liveTranscript = merged
        setInput(merged)
      }
    }

    recognition.onerror = (event: any) => {
      hadError = true
      const errorType = String(event?.error || "")

      if (errorType === "not-allowed" || errorType === "service-not-allowed") {
        setError("Microphone access is blocked. Please allow microphone permission in your browser settings.")
        setRecording(false)
        return
      }

      const canRetry = attempt < locales.length - 1
      if (canRetry) {
        if (!voiceCaptureHint) {
          setVoiceCaptureHint("Trying a fallback voice-capture profile for your device...")
        }
        startRecognition(locales, attempt + 1)
        return
      }

      setError("I could not capture your voice clearly. Please try again in a quiet place or type your message.")
      setRecording(false)
    }

    recognition.onend = () => {
      setRecording(false)

      if (hadError) return

      const captured = liveTranscript.trim() || finalTranscript.trim()
      if (captured) {
        setVoiceCaptureHint("Voice captured successfully.")
        sendPrompt(captured)
        return
      }

      const canRetryLocale = attempt < locales.length - 1
      if (canRetryLocale) {
        setVoiceCaptureHint("I did not catch that clearly. Retrying with another voice profile...")
        startRecognition(locales, attempt + 1)
        return
      }

      setError("I did not catch any speech. Please tap the mic again and speak clearly.")
    }

    recognitionRef.current = recognition
    setRecording(true)
    recognition.start()
  }

  const ensureMicrophoneAccess = async () => {
    if (typeof window === "undefined") return false
    if (!navigator?.mediaDevices?.getUserMedia) return true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch {
      setError("Microphone permission is required. Please allow microphone access in browser settings.")
      return false
    }
  }

  const toggleVoiceInput = async () => {
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop()
      setRecording(false)
      return
    }

    const hasPermission = await ensureMicrophoneAccess()
    if (!hasPermission) return

    setVoiceCaptureHint("")
    setError("")
    const preferredLocale = safeLocale(language)
    const fallbacks = [preferredLocale, "en-NG", "en-US"]
    const uniqueLocales = Array.from(new Set(fallbacks.filter(Boolean)))
    startRecognition(uniqueLocales, 0)
  }

  const pickBestVoice = () => {
    if (voices.length === 0) return null

    const effectiveLanguage = language === "auto" ? replyLanguage : language
    const locale = safeLocale(effectiveLanguage)
    const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
    if (exact) return exact

    const prefix = locale.split("-")[0].toLowerCase()
    const sameLanguage = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix))
    if (sameLanguage) return sameLanguage

    const ngEnglish = voices.find((voice) => voice.lang.toLowerCase() === "en-ng")
    if (ngEnglish) return ngEnglish

    return voices[0]
  }

  const speakText = (text: string, languageOverride?: AssistantLanguage) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError("Speech playback is not supported in this browser.")
      return
    }

    if (!text.trim()) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const effectiveLanguage = languageOverride || (language === "auto" ? replyLanguage : language)
    const voice = pickBestVoice()

    utterance.lang = voice?.lang || safeLocale(effectiveLanguage)
    if (voice) utterance.voice = voice
    utterance.rate = 0.95
    utterance.pitch = 1

    if (!voice || (effectiveLanguage !== "en" && !utterance.lang.toLowerCase().startsWith(effectiveLanguage))) {
      if (!voiceHintShown) {
        setVoiceHint("Using closest available voice on this device. For perfect native pronunciation, install additional system voices.")
        setVoiceHintShown(true)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  const speakLatestReply = () => {
    const latestAssistant = [...messages].reverse().find((item) => item.role === "assistant")
    if (!latestAssistant) return
    speakText(latestAssistant.text)
  }

  return (
    <div className={`flex h-full flex-col ${className || ""}`}>
      <div className="border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">BigCat Native AI</h2>
            <p className="text-xs text-muted-foreground">
              Multilingual assistant with Nigerian language support
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak((prev) => !prev)}
              type="button"
              className={`h-7 rounded-md border px-2 text-[10px] ${autoSpeak ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
              title="Toggle auto voice replies"
            >
              {autoSpeak ? "Auto Voice On" : "Auto Voice Off"}
            </button>
            <span className="text-[10px] text-muted-foreground">
              Reply language: {language === "auto" ? replyLanguage.toUpperCase() : language.toUpperCase()}
            </span>
            <Languages className="w-4 h-4 text-muted-foreground" />
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as AssistantLanguage)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              {LANG_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-background">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {message.text}

              {message.role === "assistant" && (message.products?.length || message.vendors?.length) ? (
                <div className="mt-2 space-y-2">
                  {message.products?.length ? (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">Found products</p>
                      <div className="space-y-1">
                        {message.products.map((product) => (
                          <div key={product.id} className="rounded-lg bg-secondary/60 px-2 py-1 text-xs">
                            <span className="font-semibold text-foreground">{product.name}</span>
                            <span className="text-muted-foreground"> - NGN {Number(product.price || 0).toLocaleString()} - {product.vendor_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {message.vendors?.length ? (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">Found vendors</p>
                      <div className="space-y-1">
                        {message.vendors.map((vendor) => (
                          <div key={vendor.id} className="rounded-lg bg-secondary/60 px-2 py-1 text-xs">
                            <span className="font-semibold text-foreground">{vendor.name}</span>
                            <span className="text-muted-foreground"> - {vendor.category} - {vendor.location}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
          </div>
        ))}

        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-4 py-3 bg-card">
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => sendPrompt(item)}
              disabled={loading}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:bg-secondary disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>

        {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
        {voiceHint ? <p className="mb-2 text-xs text-muted-foreground">{voiceHint}</p> : null}
        {voiceCaptureHint ? <p className="mb-2 text-xs text-muted-foreground">{voiceCaptureHint}</p> : null}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoiceInput}
            type="button"
            className={`h-10 w-10 rounded-full border border-border flex items-center justify-center ${
              recording ? "bg-destructive/10 text-destructive" : "bg-background text-foreground"
            }`}
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={speakLatestReply}
            type="button"
            className="h-10 w-10 rounded-full border border-border bg-background text-foreground flex items-center justify-center"
            aria-label="Speak latest reply"
            title="Speak latest reply"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                sendPrompt(input)
              }
            }}
            placeholder={assistantMode === "merchant" ? "Ask for business ideas, promos, pricing help..." : "Ask for products, vendors, prices..."}
            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={() => sendPrompt(input)}
            type="button"
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-60"
            aria-label="Send message"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
