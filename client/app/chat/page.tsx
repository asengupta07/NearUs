'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'next/navigation'
import LoadingState from '@/components/LoadingState/LoadingState'
import AblyWrapper from '@/components/providers/AblyProvider'
import ChatWindow from '@/components/chat/ChatWindow'
import Navbar from '@/components/function/Nav'
import { Search, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface UserData {
  id: string
  username: string
  email: string
  avatarUrl: string
  bio: string
  location: {
    latitude: number
    longitude: number
  }
}

interface ApiResponse {
  me: UserData
  friends: UserData[]
}

export default function ChatPage() {
  const { email, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [friends, setFriends] = useState<UserData[]>([])
  const [selectedFriend, setSelectedFriend] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    async function fetchUserData() {
      if (!email) return

      try {
        const response = await fetch(`/api/friends?email=${encodeURIComponent(email)}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()
        if (!data.me) {
          throw new Error('User data not found in the response')
        }
        setCurrentUser(data.me)
        setFriends(data.friends)
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && email) {
      fetchUserData()
    }
  }, [email, authLoading, isAuthenticated, router])

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFriendSelect = (friend: UserData) => {
    setSelectedFriend(friend)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingState message="Loading chat..." submessage="Preparing your conversations" />
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <Navbar notifications={[]} />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-center p-8 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-gray-300">{error}</p>
            <Button
              onClick={() => router.push('/auth')}
              className="mt-4 bg-red-500 hover:bg-red-600"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <Navbar notifications={[]} />
        <div className="flex items-center justify-center flex-grow">
          <div className="text-center p-8 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-gray-800">
            <h1 className="text-xl font-bold text-yellow-500 mb-4">Unable to load user data</h1>
            <p className="text-gray-300">Please try refreshing the page</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <Navbar notifications={[]} />
      <div className="flex flex-grow overflow-hidden pt-16">
        {/* Sidebar Toggle for Mobile */}
        <Button
          className="md:hidden fixed top-20 right-4 z-50 rounded-full w-12 h-12 bg-primary shadow-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Users className="h-5 w-5" />
        </Button>

        {/* Sidebar */}
        <div className={`
          fixed md:relative
          w-80 md:w-80 lg:w-96
          h-[92vh]
          bg-gray-900/95 backdrop-blur-lg
          border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          z-40 md:z-auto
        `}>
          <div className="p-4 h-full flex flex-col">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search friends..."
                className="pl-9 bg-gray-800/50 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Friends List */}
            <ScrollArea className="flex-grow">
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <Button
                    key={friend.id}
                    variant="ghost"
                    className={`w-full justify-start px-2 py-10 hover:bg-gray-800/50 transition-colors ${
                      selectedFriend?.id === friend.id ? 'bg-gray-800/50' : ''
                    }`}
                    onClick={() => handleFriendSelect(friend)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                      <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{friend.username}</span>
                      <span className="text-sm text-gray-400">{friend.bio || 'No status'}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Current User Profile */}
            <Separator className="my-4" />
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
                  <AvatarFallback>{currentUser.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{currentUser.username}</span>
                  <span className="text-sm text-gray-400">{currentUser.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
          <AblyWrapper>
            {selectedFriend ? (
              <ChatWindow 
                key={selectedFriend.id} 
                currentUserId={currentUser.id} 
                recipientId={selectedFriend.id} 
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 pt-20">
                  <Users className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-gray-400">Select a friend to start chatting</p>
                </div>
              </div>
            )}
          </AblyWrapper>
        </div>
      </div>
    </div>
  )
}