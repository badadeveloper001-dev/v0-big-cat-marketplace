"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Send,
  Mic,
  Phone,
  MoreVertical,
  Store,
  ShoppingCart,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react"

interface Message {
  id: string
  sender: "buyer" | "merchant"
  text: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  id: string
  vendorId: number
  vendorName: string
  vendorLocation: string
  vendorRating: number
  lastMessage: string
  timestamp: Date
  unread: number
  avatar: string
}

const mockConversations: Conversation[] = [
  {
    id: "conv1",
    vendorId: 1,
    vendorName: "StyleHaus",
    vendorLocation: "Lagos, NG",
    vendorRating: 4.9,
    lastMessage: "Your order will arrive tomorrow!",
    timestamp: new Date(Date.now() - 5 * 60000),
    unread: 2,
    avatar: "🛍️",
  },
  {
    id: "conv2",
    vendorId: 2,
    vendorName: "TechHub Pro",
    vendorLocation: "Abuja, NG",
    vendorRating: 4.7,
    lastMessage: "We have the latest iPhone 15 in stock",
    timestamp: new Date(Date.now() - 2 * 3600000),
    unread: 0,
    avatar: "💻",
  },
  {
    id: "conv3",
    vendorId: 3,
    vendorName: "HomeWorks",
    vendorLocation: "Ikeja, NG",
    vendorRating: 4.8,
    lastMessage: "Plumbing job completed successfully",
    timestamp: new Date(Date.now() - 24 * 3600000),
    unread: 0,
    avatar: "🏠",
  },
]

const mockMessages: { [key: string]: Message[] } = {
  conv1: [
    {
      id: "m1",
      sender: "merchant",
      text: "Hi! Thanks for your order. We're preparing it now.",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    {
      id: "m2",
      sender: "buyer",
      text: "Great! When will it ship?",
      timestamp: new Date(Date.now() - 3000000),
      read: true,
    },
    {
      id: "m3",
      sender: "merchant",
      text: "Your order will arrive tomorrow!",
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
    },
  ],
  conv2: [
    {
      id: "m1",
      sender: "buyer",
      text: "Do you have iPhone 15 Pro Max?",
      timestamp: new Date(Date.now() - 7200000),
      read: true,
    },
    {
      id: "m2",
      sender: "merchant",
      text: "We have the latest iPhone 15 in stock",
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: false,
    },
  ],
  conv3: [
    {
      id: "m1",
      sender: "buyer",
      text: "Can you fix my kitchen sink?",
      timestamp: new Date(Date.now() - 48 * 3600000),
      read: true,
    },
    {
      id: "m2",
      sender: "merchant",
      text: "Yes, we can! When are you available?",
      timestamp: new Date(Date.now() - 47 * 3600000),
      read: true,
    },
    {
      id: "m3",
      sender: "buyer",
      text: "Tomorrow at 10 AM works",
      timestamp: new Date(Date.now() - 25 * 3600000),
      read: true,
    },
    {
      id: "m4",
      sender: "merchant",
      text: "Perfect! See you then",
      timestamp: new Date(Date.now() - 24.5 * 3600000),
      read: true,
    },
    {
      id: "m5",
      sender: "merchant",
      text: "Plumbing job completed successfully",
      timestamp: new Date(Date.now() - 24 * 3600000),
      read: true,
    },
  ],
}

function ChatListScreen({
  onSelectConversation,
}: {
  onSelectConversation: (conv: Conversation) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-border">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl shadow-sm">
                {conv.avatar}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {conv.vendorName}
                  </h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(conv.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unread > 0 && (
                    <span className="ml-auto flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="border-t border-border bg-secondary/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 For your safety, keep all communication within the platform
        </p>
      </div>
    </div>
  )
}

function ChatConversationScreen({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>(
    mockMessages[conversation.id] || []
  )
  const [newMessage, setNewMessage] = useState("")
  const [showQuickActions, setShowQuickActions] = useState(true)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `m${Date.now()}`,
        sender: "buyer",
        text: newMessage,
        timestamp: new Date(),
        read: false,
      }
      setMessages([...messages, message])
      setNewMessage("")

      // Simulate merchant reply after a delay
      setTimeout(() => {
        const reply: Message = {
          id: `m${Date.now() + 1}`,
          sender: "merchant",
          text: "Thanks for your message! We'll get back to you soon.",
          timestamp: new Date(),
          read: false,
        }
        setMessages((prev) => [...prev, reply])
      }, 2000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h2 className="font-semibold text-foreground">
                {conversation.vendorName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {conversation.vendorLocation}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <Phone className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl ${
                msg.sender === "buyer"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-secondary text-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm break-words">{msg.text}</p>
              <div
                className={`flex items-center gap-1 mt-1 text-xs ${
                  msg.sender === "buyer"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                <span>{formatTime(msg.timestamp)}</span>
                {msg.sender === "buyer" && (
                  <div className="ml-1">
                    {msg.read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="border-t border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-sm font-medium text-foreground">
              <Store className="w-4 h-4" />
              View Store
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-primary hover:bg-primary/90 rounded-xl transition-colors text-sm font-medium text-primary-foreground">
              <ShoppingCart className="w-4 h-4" />
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 flex items-center gap-2 bg-input rounded-2xl px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSendMessage()
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
            />
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Mic className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="border-t border-border bg-secondary/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 For your safety, keep all communication within the platform
        </p>
      </div>
    </div>
  )
}

export function ChatInterface() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)

  if (selectedConversation) {
    return (
      <ChatConversationScreen
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    )
  }

  return <ChatListScreen onSelectConversation={setSelectedConversation} />
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
