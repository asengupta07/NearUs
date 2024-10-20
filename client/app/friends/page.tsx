'use client'

import { useState, useEffect } from 'react'
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
import { toast } from 'react-hot-toast'
import { Notification } from '@/types'
import LoadingState from '@/components/LoadingState/LoadingState'
import FriendProfileModal from '@/components/function/FriendProfileModal'

interface User {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    bio: string;
}

interface Friend {
    username: string;
    avatarUrl?: string;
}

type DashboardData = {
    upcomingEvents: Event[];
    pastEvents: Event[];
    friends: (Friend | string)[];
    notifications: Notification[];
}

interface UserWithRequestStatus extends User {
    requestStatus: 'none' | 'sent' | 'pending' | 'friends';
}

interface PendingRequest {
    id: string;
    sender: User;
}

export default function AddFriends() {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<UserWithRequestStatus[]>([])
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [friends, setFriends] = useState<User[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { email } = useAuth()
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (email) {
            fetchInitialData();
        }
    }, [email]);

    const fetchInitialData = async () => {
        try {
            await Promise.all([
                fetchFriends(),
                fetchPendingRequests(),
                fetchNotifications()
            ])
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications?userId=${email}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const notificationData = await response.json();
            setNotifications(notificationData);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const updateNotification = async (notificationId: string, action: 'markAsRead' | 'delete') => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notificationIds: [notificationId],
                    action: action
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update notification');
            }

            // Refresh notifications after update
            fetchNotifications();
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to accept friend request');
            }

            const data = await response.json();
            console.log('Friend request accepted:', data);
            setPendingRequests(prev => prev.filter(request => request.id !== requestId));

            // Create new notification for accepted request
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: email,
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    sender: requestId,
                    message: 'Friend request accepted'
                }),
            });

            fetchFriends();
            fetchNotifications();

            // Update the notification related to this friend request
            const relatedNotification = notifications.find(n =>
                n.type === 'NEW_FRIEND_REQUEST' &&
                n.sender?.id === requestId
            );
            if (relatedNotification) {
                updateNotification(relatedNotification.id, 'markAsRead');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            toast.error('Failed to accept friend request. Please try again.');
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

            setPendingRequests(prev => prev.filter(request => request.id !== requestId));

            // Create new notification for rejected request
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: email,
                    type: 'FRIEND_REQUEST_REJECTED',
                    sender: requestId,
                    message: 'Friend request rejected'
                }),
            });

            // Update the notification related to this friend request
            const relatedNotification = notifications.find(n =>
                n.type === 'NEW_FRIEND_REQUEST' &&
                n.sender?.id === requestId
            );
            if (relatedNotification) {
                updateNotification(relatedNotification.id, 'delete');
            }
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            toast.error('Failed to reject friend request. Please try again.');
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await fetch(`/api/friends?email=${email}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Failed to fetch friends');
            const data = await response.json();

            if (!data.friends || !Array.isArray(data.friends)) {
                console.error("Unexpected data structure:", data);
                return;
            }

            const mappedFriends = data.friends.map((friend: any) => ({
                id: friend.id || friend._id,
                username: friend.username,
                avatarUrl: friend.avatarUrl,
                bio: friend.bio
            }));

            setFriends(mappedFriends);
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
                body: JSON.stringify({
                    query: searchQuery,
                    currentUserEmail: email
                }),
            })
            if (!response.ok) throw new Error('Search failed')
            const data = await response.json()

            // Check if each user is already a friend
            const usersWithRequestStatus: UserWithRequestStatus[] = data.map((user: User) => {
                const isFriend = friends.some(friend => friend.id === user.id);
                return {
                    ...user,
                    requestStatus: isFriend ? 'friends' : 'none',
                    bio: user.bio || ''
                };
            });

            setSearchResults(usersWithRequestStatus)
        } catch (error) {
            console.error('Error searching users:', error)
            toast.error('Failed to search for users. Please try again.')
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
            fetchNotifications();
            toast.success('All friend requests accepted successfully!');
        } catch (error) {
            console.error('Error accepting all friend requests:', error);
            toast.error('Failed to accept all friend requests. Please try again.');
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
            setPendingRequests([]);
            fetchNotifications();
            toast.success('All friend requests rejected successfully!');
        } catch (error) {
            console.error('Error rejecting all friend requests:', error);
            toast.error('Failed to reject all friend requests. Please try again.');
        }
    };

    const handleSendRequest = async (userId: string) => {
        const userToUpdate = searchResults.find(user => user.id === userId);
        if (!userToUpdate) return;

        // Check if already friends
        if (userToUpdate.requestStatus === 'friends') {
            toast('You are already friends with this user!', {
                icon: '👥',
                duration: 4000,
            });
            return;
        }

        if (userToUpdate.requestStatus !== 'none') {
            toast('Friend request already sent or pending.', {
                icon: '🔔',
                duration: 4000,
            });
            return;
        }

        try {
            const response = await fetch('/api/friend-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderEmail: email,
                    receiverId: userId
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || 'Friend request sent successfully!');
                setSearchResults(prev => prev.map(user =>
                    user.id === userId ? { ...user, requestStatus: 'sent' } : user
                ));
                fetchNotifications();
            } else if (response.status === 409) {
                toast(data.message || 'Friend request already exists', {
                    icon: '🔔',
                    duration: 4000,
                });
                setSearchResults(prev => prev.map(user =>
                    user.id === userId ? { ...user, requestStatus: 'pending' } : user
                ));
            } else {
                throw new Error(data.message || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request. Please try again.');
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

            // Create new notification for removed friend
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: email,
                    type: 'FRIEND_REMOVED',
                    sender: friendId,
                    message: 'Friend removed'
                }),
            });

            toast.success('Friend removed successfully');
            fetchNotifications();
        } catch (error) {
            console.error('Error removing friend:', error);
            toast.error('Failed to remove friend. Please try again.');
        }
    };

    if (isLoading) {
        return <LoadingState message="Loading your friends..." submessage="Preparing your friend list and requests" />
    }

    return (
        <>
            <Navbar notifications={notifications} />
            <div className="relative min-h-screen pt-20 sm:pt-12 w-full overflow-hidden bg-transparent text-white">
                <div className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                            <span className={cn(
                                "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent",
                                "animate-text-gradient"
                            )}>
                                Expand Your Circle
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base text-gray-400">Discover new friends and create amazing experiences together!</p>
                    </header>

                    <Card className="bg-gray-900 border-none mb-8">
                        <CardHeader>
                            <CardTitle className="text-white text-lg sm:text-xl">Search for Friends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    type="text"
                                    placeholder="Search by username"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-grow  bg-gray-800 text-white  border-gray-700"
                                />
                                <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
                                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Search
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div>
                                <Card className="bg-gray-900  border-none mb-8">
                                    <CardHeader>
                                        <CardTitle className="text-white text-lg sm:text-xl">Search Results</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {searchResults.map((user) => (
                                                <motion.li
                                                    key={user.id}
                                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-800 p-4 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                                            <AvatarFallback>{user.username}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{user.username}</p>
                                                            <p className="text-sm text-gray-400">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                    {user.requestStatus === 'friends' ? (
                                                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                                            <UserCheck className="h-4 w-4 text-green-500" />
                                                            <span className="text-green-500">Already Friends</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleSendRequest(user.id)}
                                                            disabled={user.requestStatus !== 'none'}
                                                            variant={user.requestStatus !== 'none' ? "secondary" : "default"}
                                                            className="mt-2 sm:mt-0"
                                                        >
                                                            {user.requestStatus === 'none' ? (
                                                                <>
                                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                                    Add Friend
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Requested
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
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
                            className="text-center p-4 sm:p-8"
                        >
                            <p className="text-2xl mb-4">🔍</p>
                            <h2 className="text-xl font-semibold mb-2">No results found</h2>
                            <p className="text-sm sm:text-base text-gray-400">Try a different search term or invite your friends to join!</p>
                        </motion.div>
                    )}

                    {pendingRequests.length > 0 && (
                        <Card className="bg-gray-900 border-none mb-8">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <CardTitle className="text-white text-lg sm:text-xl mb-2 sm:mb-0">Pending Requests</CardTitle>
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
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-800 p-4 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                                <Avatar>
                                                    <AvatarImage src={request.sender.avatarUrl} alt={request.sender.name} />
                                                    <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{request.sender.name}</p>
                                                    <p className="text-sm text-gray-400">@{request.sender.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 mt-2 sm:mt-0">
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
                            <CardTitle className="text-white text-lg sm:text-xl">Your Friends</CardTitle>
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
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                            onClick={() => {
                                                console.log('AddFriends - Clicking friend:', friend);
                                                console.log('AddFriends - Friend data:', {
                                                    id: friend.id,
                                                    username: friend.username,
                                                    bio: friend.bio,
                                                    avatarUrl: friend.avatarUrl
                                                });
                                                setSelectedFriend(friend);
                                                setIsProfileModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                                <Avatar>
                                                    <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                                                    <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{friend.username}</p>
                                                    <p className="text-sm text-gray-400">@{friend.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFriend(friend.id);
                                                    }}
                                                >
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
                                    className="text-center p-4 sm:p-8"
                                >
                                    <p className="text-2xl mb-4">👥</p>
                                    <h2 className="text-xl font-semibold mb-2">No friends yet</h2>
                                    <p className="text-sm sm:text-base text-gray-400">Start adding friends to see them here!</p>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    <FriendProfileModal
                        isOpen={isProfileModalOpen}
                        onClose={() => {
                            setIsProfileModalOpen(false);
                            setSelectedFriend(null);
                        }}
                        friend={selectedFriend}
                    />

                    <Card className="bg-gray-900 border-none mt-auto">
                        <CardContent className="p-4 sm:p-6">
                            <p className="text-center text-sm sm:text-base text-gray-400">
                                Can&apos;t find who you&apos;re looking for?{' '}
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