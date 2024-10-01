'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, UserCheck, Loader2, UserMinus, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Link from 'next/link'
import Navbar from '@/components/function/Nav'
import { useAuth } from '@/contexts/authContext'

interface User {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
}
interface PendingRequest {
    id: string;
    sender: User;
}

export default function AddFriends() {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [friends, setFriends] = useState<User[]>([])
    const { email } = useAuth()

    useEffect(() => {
        if (email) {
            fetchFriends()
            fetchPendingRequests()
        }
    }, [email])

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const response = await fetch('/api/friend-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    requestId,
                    action: 'accept'
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to accept friend request');
            }
            setPendingRequests(prev => prev.filter(request => request.id !== requestId));
            fetchFriends();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const response = await fetch('/api/friend-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    requestId,
                    action: 'reject'
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to reject friend request');
            }
            // Remove the rejected request from the pending list
            setPendingRequests(prev => prev.filter(request => request.id !== requestId));
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            // You might want to show an error message to the user here
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!response.ok) throw new Error('Failed to fetch friends');
            const data = await response.json();
            setFriends(data.friends);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSearching(true)
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            })
            if (!response.ok) throw new Error('Search failed')
            const data = await response.json()
            setSearchResults(data)
        } catch (error) {
            console.error('Error searching users:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch(`/api/friend-requests?email=${email}`);
            if (!response.ok) {
                throw new Error('Failed to fetch pending requests');
            }
            const data = await response.json();
            setPendingRequests(data);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            // You might want to show an error message to the user here
        }
    };

    const handleAcceptAllRequests = async () => {
        try {
            const response = await fetch('/api/friend-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    action: 'acceptAll'
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to accept all friend requests');
            }
            setPendingRequests([]);     
            fetchFriends();       
        } catch (error) {
            console.error('Error accepting all friend requests:', error);
            // You might want to show an error message to the user here
        }
    };

    const handleRejectAllRequests = async () => {
        try {
            const response = await fetch('/api/friend-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    action: 'rejectAll'
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to reject all friend requests');
            }
            // Clear all pending requests
            setPendingRequests([]);
        } catch (error) {
            console.error('Error rejecting all friend requests:', error);
            // You might want to show an error message to the user here
        }
    };


    const handleSendRequest = async (userId: string) => {
        try {
            const response = await fetch('/api/send-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    senderEmail: email,
                    receiverId: userId 
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send friend request');
            }
            setPendingRequests(prev => [...prev, { id: userId, sender: { id: userId, name: '', username: '', avatarUrl: '' } }]);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        try {
            const response = await fetch('/api/remove-friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userEmail: email,
                    friendId: friendId 
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove friend');
            }
            setFriends(prev => prev.filter(friend => friend.id !== friendId));
        } catch (error) {
            console.error('Error removing friend:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <>
            <Navbar notifications={[]} />
            <div className="relative min-h-screen pt-8 w-full overflow-hidden bg-gray-950 text-white">
                <div className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className={cn(
                                "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent",
                                "animate-text-gradient"
                            )}>
                                Expand Your Circle
                            </span>
                        </h1>
                        <p className="text-gray-400">Discover new friends and create amazing experiences together!</p>
                    </header>

                    <Card className="bg-gray-900 border-none mb-8">
                        <CardHeader>
                            <CardTitle className="text-white">Search for Friends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Search by username"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-grow bg-gray-800 text-white border-gray-700"
                                />
                                <Button type="submit" disabled={isSearching}>
                                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Search
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="bg-gray-900 border-none mb-8">
                                    <CardHeader>
                                        <CardTitle className="text-white">Search Results</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {searchResults.map((user) => (
                                                <motion.li
                                                    key={user.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex items-center justify-between bg-gray-800 p-4 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                                            <AvatarFallback>{user.username}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{user.username}</p>
                                                            <p className="text-sm text-gray-400">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleSendRequest(user.id)}
                                                        disabled={pendingRequests.some(request => request.sender.id === user.id)}
                                                        variant={pendingRequests.some(request => request.sender.id === user.id) ? "secondary" : "default"}
                                                    >
                                                        {pendingRequests.some(request => request.sender.id === user.id) ? (
                                                            <>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Requested
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="mr-2 h-4 w-4" />
                                                                Add Friend
                                                            </>
                                                        )}
                                                    </Button>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {searchResults.length === 0 && !isSearching && searchQuery && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center p-8"
                        >
                            <p className="text-2xl mb-4">🔍</p>
                            <h2 className="text-xl font-semibold mb-2">No results found</h2>
                            <p className="text-gray-400">Try a different search term or invite your friends to join!</p>
                        </motion.div>
                    )}
                    
                    {pendingRequests.length > 0 && (
                        <Card className="bg-gray-900 border-none mb-8">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-white">Pending Requests</CardTitle>
                                <div className="flex space-x-2">
                                    <Button onClick={handleAcceptAllRequests} variant="outline" size="sm">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Accept All
                                    </Button>
                                    <Button onClick={handleRejectAllRequests} variant="outline" size="sm">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {pendingRequests.map((request) => (
                                        <motion.li
                                            key={request.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center justify-between bg-gray-800 p-4 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    <AvatarImage src={request.sender.avatarUrl} alt={request.sender.name} />
                                                    <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{request.sender.name}</p>
                                                    <p className="text-sm text-gray-400">@{request.sender.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Accept
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleRejectRequest(request.id)}>
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-gray-900 border-none mb-8">
                        <CardHeader>
                            <CardTitle className="text-white">Your Friends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {friends.length > 0 ? (
                                <ul className="space-y-4">
                                    {friends.map((friend) => (
                                        <motion.li
                                            key={friend.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center justify-between bg-gray-800 p-4 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                                                    <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{friend.username}</p>
                                                    <p className="text-sm text-gray-400">@{friend.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Message
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleRemoveFriend(friend.id)}>
                                                    <UserMinus className="mr-2 h-4 w-4" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center p-8"
                                >
                                    <p className="text-2xl mb-4">👥</p>
                                    <h2 className="text-xl font-semibold mb-2">No friends yet</h2>
                                    <p className="text-gray-400">Start adding friends to see them here!</p>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-none mt-auto">
                        <CardContent className="p-6">
                            <p className="text-center text-gray-400">
                                Can't find who you're looking for?{' '}
                                <Link href="/invite" className="text-purple-400 hover:underline">
                                    Invite your friends
                                </Link>{' '}
                                to join the fun!
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <BackgroundBeams className="opacity-100" />
            </div>
        </>
    )
}