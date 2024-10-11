'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChannel } from "@ably-labs/react-hooks"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/authContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, ArrowLeft } from 'lucide-react'
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

export default function EnhancedChatPage({ currentUserId, recipientId }: { currentUserId: string; recipientId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [recipient, setRecipient] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { getToken, logout, isAuthenticated } = useAuth()
  
  const channelName = `chat:${[currentUserId, recipientId].sort().join('-')}`
  
  const [channel] = useChannel(channelName, (message) => {
    const messageData = message.data as Message
    setMessages(prev => [...prev, messageData])
    scrollToBottom()
  })

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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/friends')} className="mr-2 text-gray-300 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {recipient && (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-2 ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900">
                <AvatarImage src={recipient.avatarUrl} alt={recipient.username} className="glow-effect" />
                <AvatarFallback>{recipient.username[0]}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-white">{recipient.username}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 pt-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-3xl mx-auto">
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
                  className={`max-w-[70%] p-3 rounded-2xl shadow-lg bg-gray-800 text-white glow-effect-teal`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-transparent p-4">
        <form onSubmit={sendMessage} className="flex items-center max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow mr-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
          <Button type="submit" disabled={!input.trim()} className="bg-gray-700 hover:bg-gray-600 text-white glow-effect-teal">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>

      <style jsx global>{`
        .glow-effect {
          box-shadow: 0 0 15px 5px rgba(138, 43, 226, 0.7);
        }
        .glow-effect-teal {
          box-shadow: 0 0 15px 5px rgba(64, 224, 208, 0.3);
        }
      `}</style>
    </div>
  )
}