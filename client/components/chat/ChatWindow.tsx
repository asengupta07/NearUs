'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChannel } from "@ably-labs/react-hooks"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/authContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar, Loader2, Send, ArrowLeft, MapPin, Users, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  sender: string
  recipient: string
  content: string
  timestamp: string
}

interface User {
  id: string
  username: string
  avatarUrl?: string
}

interface Friend {
  username: string
  avatarUrl: string
}

interface EventData {
  id: string
  title: string
  location: string
  date: string
  friends: Friend[]
}

interface EventsData {
  upcomingEvents: EventData[]
  pastEvents: EventData[]
}

export default function EnhancedChatPage({ currentUserId, recipientId }: { currentUserId: string; recipientId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [recipient, setRecipient] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventsData | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { getToken, logout, isAuthenticated, email } = useAuth()
  
  const channelName = `chat:${[currentUserId, recipientId].sort().join('-')}`
  
  const [channel] = useChannel(channelName, (message) => {
    const messageData = message.data as Message
    setMessages(prev => [...prev, messageData])
    scrollToBottom()
  })
  const fetchEvents = async () => {
    setIsLoadingEvents(true)
    try {
      const token = getToken()
      if (!token) {
        logout()
        return
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email, // Assuming currentUserId is the email
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  // Add useEffect to fetch events
  useEffect(() => {
    fetchEvents()
  }, [])

  // Add function to format event details for sharing
  const formatEventDetails = (event: EventData) => {
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `📅 Event: ${event.title}\n📍 Location: ${event.location}\n📆 Date: ${formattedDate}\n👥 Attending: ${event.friends.map(f => f.username).join(', ')}`
  }

  // Add function to share event
  const shareEvent = async (event: EventData) => {
    const eventDetails = formatEventDetails(event)
    setInput(eventDetails)
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    
    fetchMessages()
    fetchRecipient()
  }, [isAuthenticated, router])

  const fetchRecipient = async () => {
    try {
      const token = getToken()
      if (!token) {
        logout()
        return
      }
  
      const response = await fetch(`/api/users/${recipientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
  
      if (!response.ok) {
        throw new Error('Failed to fetch recipient details')
      }
  
      const userData = await response.json()
      setRecipient(userData)
    } catch (error) {
      console.error('Error fetching recipient:', error)
      setError('Failed to load recipient details. Please try again.')
    }
  }

  const fetchMessages = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const token = getToken()
      if (!token) {
        logout()
        return
      }

      const response = await fetch(`/api/chat?recipientId=${recipientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          return
        }
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channel || !input.trim()) return

    try {
      const token = getToken()
      if (!token) {
        logout()
        return
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          content: input.trim()
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          return
        }
        throw new Error('Failed to send message')
      }

      const newMessage = await response.json()
      await channel.publish('message', newMessage)
      setInput('')
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black">
        <div className="p-8 rounded-lg backdrop-blur-lg bg-black/30 shadow-xl border border-purple-500/10">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black">
        <div className="p-6 rounded-lg backdrop-blur-lg bg-black/30 shadow-xl border border-red-500/20">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[89vh] bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="backdrop-blur-lg bg-black/30 border-b border-purple-500/20 p-4 shadow-lg relative z-10">
        <div className="flex items-center max-w-3xl mx-auto">
          
          {recipient && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center group"
            >
              <Avatar className="h-12 w-12 mr-3 transition-transform duration-300 group-hover:scale-110">
                <AvatarImage 
                  src={recipient.avatarUrl} 
                  alt={recipient.username} 
                  className="ring-2 ring-purple-500/50 ring-offset-2 ring-offset-gray-900" 
                />
                <AvatarFallback className="bg-purple-500/20 text-purple-200">
                  {recipient.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-white/90">{recipient.username}</span>
                {/* <span className="text-xs text-purple-400 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Online
                </span> */}
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-grow overflow-y-auto p-4 pt-6 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === currentUserId ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div
                  className={`
                    max-w-[70%] p-4 rounded-2xl shadow-lg backdrop-blur-sm
                    ${message.sender === currentUserId 
                      ? 'bg-purple-500/20 text-white mr-2 rounded-tr-sm' 
                      : 'bg-gray-800/40 text-white ml-2 rounded-tl-sm'}
                    transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl
                  `}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="backdrop-blur-lg bg-black/30 border-t border-purple-500/20 p-4 relative z-10">
        <form onSubmit={sendMessage} className="flex items-center max-w-3xl mx-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button"
                className="mr-3 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-xl
                         transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <Calendar className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-gray-900 border border-purple-500/20">
              <div className="flex flex-col p-2">
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    {events?.upcomingEvents && events.upcomingEvents.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-purple-300 px-2 py-1">
                          Upcoming Events
                        </h3>
                        {events.upcomingEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => shareEvent(event)}
                            className="w-full text-left p-2 hover:bg-purple-500/10 rounded-lg
                                     transition-colors duration-200 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{event.title}</span>
                              <span className="text-xs text-purple-300">
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Users className="w-3 h-3 mr-1" />
                              {event.friends.length} attending
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 p-2">No upcoming events</p>
                    )}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow mr-3 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-xl 
                     focus:ring-2 focus:ring-purple-500/30 focus:border-transparent transition-all duration-300
                     hover:bg-gray-800/70"
          />
          <Button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-xl px-6 py-2
                     transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20
                     disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
          </Button>
        </form>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        /* Gradient Animation */
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.4);
        }

        /* Message hover effects */
        .message-bubble {
          transition: all 0.3s ease;
        }
        .message-bubble:hover {
          transform: scale(1.02);
        }

        /* Custom focus styles */
        input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
        }

        /* Glassmorphism effects */
        .glass {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  )
}