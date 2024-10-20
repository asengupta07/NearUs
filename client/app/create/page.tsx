'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Calendar, Clock, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import MapComponent from '@/components/function/map'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import LoadingState from '@/components/LoadingState/LoadingState'
import { Notification } from '@/types'

interface DashboardData {
    notifications: Notification[]
}

interface Friend {
    id: string;
    username: string;
    email: string;
    location: {
        latitude: number;
        longitude: number;
    };
    avatarUrl: string;
}

interface Location {
    name: string;
    longitude: number;
    latitude: number;
}

const scrollbarStyles = `
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}
`;

export default function CreateNewPlan() {
    const router = useRouter()
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedFriends, setSelectedFriends] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedTime, setSelectedTime] = useState<string>(
        new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    )
    const [planName, setPlanName] = useState('')
    const [selectedLocationPreference, setSelectedLocationPreference] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { email } = useAuth()
    const [displayLocations, setDisplayLocations] = useState<Location[]>([])
    const locationPreferences = ['Cafes', 'Parks', 'Restaurants', 'Malls', 'Cinemas', 'Bars']
    const [pageLoading, setPageLoading] = useState(true)
    const [notifications, setNotifications] = useState<Notification[]>([])

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dashboardData: DashboardData = await response.json();
            console.log('Received dashboard data:', dashboardData);
            setNotifications(dashboardData.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };


    useEffect(() => {
        fetchNotifications()
        const fetchData = async () => {
            if (!email) {
                setPageLoading(false)
                return
            }

            try {
                const friendsResponse = await fetch(`/api/friends?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!friendsResponse.ok) {
                    throw new Error('Failed to fetch friends')
                }

                const friendsData = await friendsResponse.json();

                const locData = friendsData.friends.map((friend: Friend) => ({
                    name: friend.username,
                    longitude: friend.location.longitude,
                    latitude: friend.location.latitude,
                }));

                const myLocation = {
                    name: 'You',
                    longitude: friendsData.me.location.longitude,
                    latitude: friendsData.me.location.latitude
                }
                locData.push(myLocation)

                setDisplayLocations(locData)
                setFriends(friendsData.friends);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch friends data. Please try again.')
            } finally {
                setPageLoading(false)
            }
        };

        fetchData();
    }, [email]);

    const handleFriendSelection = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value
        if (newDate >= new Date().toISOString().split('T')[0]) {
            setSelectedDate(newDate)
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value
        const [hours, minutes] = newTime.split(':')
        const selectedDateTime = new Date(selectedDate)
        selectedDateTime.setHours(parseInt(hours), parseInt(minutes))

        if (selectedDateTime > new Date()) {
            setSelectedTime(newTime)
        }
    }

    useEffect(() => {
        // Ensure the initial time is valid when the date changes
        const now = new Date()
        const selectedDateTime = new Date(selectedDate + 'T' + selectedTime)

        if (selectedDateTime <= now) {
            const newTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
            setSelectedTime(newTime)
        }
    }, [selectedDate])

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!planName || !selectedFriends.length || !selectedDate || !selectedLocationPreference) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsLoading(true)

        try {
            // Create the plan
            const response = await fetch('/api/create-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planName,
                    selectedFriends,
                    selectedDate,
                    selectedTime,
                    selectedLocationPreference,
                    creatorEmail: email,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create plan')
            }

            const data = await response.json()

            // Send notifications sequentially
            for (const friendId of selectedFriends) {
                try {
                    const notificationResponse = await fetch('/api/notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            recipient: friendId,
                            type: 'EVENT_CREATED',
                            sender: email,
                            eventId: data.event._id,
                            message: `You've been invited to ${planName}!`,
                        }),
                    })

                    if (!notificationResponse.ok) {
                        const errorData = await notificationResponse.json()
                        console.error('Notification error:', errorData)
                        throw new Error(errorData.message || 'Failed to send notification')
                    }
                } catch (notifError) {
                    console.error(`Error sending notification to friend ${friendId}:`, notifError)
                    toast.error(`Failed to send notification to a friend. They may not receive an invite.`)
                }
            }

            toast.success('Plan created successfully!')

            // Reset form and redirect
            setPlanName('')
            setSelectedFriends([])
            setSelectedDate(new Date().toISOString().split('T')[0])
            setSelectedTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
            setSelectedLocationPreference('')
            router.push('/events')

        } catch (error) {
            console.error('Error creating plan:', error)
            toast.error('Failed to create plan. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (pageLoading) {
        return <LoadingState message="Preparing to create a new plan..." submessage="Loading your friends and preferences" />
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={notifications} />
            <div className="flex-grow overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-20 sm:pt-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-20 w-full p-4 sm:p-6 lg:p-8 flex justify-center"
                >
                    <Card className="bg-gradient-to-br flex-grow from-gray-800 to-gray-900 border-none shadow-lg max-w-4xl mx-20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">
                                <span className={cn(
                                    "bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                                    "animate-text-gradient"
                                )}>
                                    Create New Plan
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreatePlan} className="space-y-8">
                                <div>
                                    <Label htmlFor="plan-name" className="text-white">Plan Name</Label>
                                    <Input
                                        id="plan-name"
                                        placeholder="Enter plan name"
                                        className="mt-1 bg-gray-800 text-white border-gray-700"
                                        value={planName}
                                        onChange={(e) => setPlanName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Location Map</h2>
                                    <div className='relative overflow-hidden rounded-lg shadow-lg'>
                                        <div className='z-50 h-64 w-full'>
                                            <MapComponent locations={displayLocations} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Select Friends</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {friends.map((friend) => (
                                            <motion.div
                                                key={friend.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`friend-${friend.id}`}
                                                    checked={selectedFriends.includes(friend.id)}
                                                    onCheckedChange={() => handleFriendSelection(friend.id)}
                                                />
                                                <Label htmlFor={`friend-${friend.id}`} className="text-gray-300">
                                                    <div className="flex items-center space-x-4">
                                                        <Avatar>
                                                            <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                                                            <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="w-20">
                                                            <p className="font-semibold truncate sm:overflow-visible sm:text-clip">{friend.username}</p>
                                                            <p className="text-sm text-gray-400 truncate sm:overflow-visible sm:text-clip">@{friend.username}</p>
                                                        </div>

                                                    </div>
                                                </Label>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Location Preferences</h2>
                                    <Select
                                        value={selectedLocationPreference}
                                        onValueChange={setSelectedLocationPreference}
                                    >
                                        <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700">
                                            <SelectValue placeholder="Select location preferences" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-white border-gray-700">
                                            {locationPreferences.map(pref => (
                                                <SelectItem key={pref} value={pref.toLowerCase()}>{pref}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Set Date & Time</h2>
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <Label htmlFor="date" className="text-white">Date</Label>
                                            <div className="flex items-center mt-1">
                                                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={handleDateChange}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="bg-gray-800 text-white border-gray-700"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="time" className="text-white">Time</Label>
                                            <div className="flex items-center mt-1">
                                                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                                                <Input
                                                    id="time"
                                                    type="time"
                                                    value={selectedTime}
                                                    onChange={handleTimeChange}
                                                    className="bg-gray-800 text-white border-gray-700"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full relative overflow-hidden rounded-full p-[1px] focus:outline-none  focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                                    disabled={isLoading}
                                >
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                        {isLoading ? 'Creating Plan...' : 'Create Plan'} <Plus className="ml-2 h-5 w-5" />
                                    </span>
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
                <BackgroundBeams className="opacity-100" />
            </div>
            <Toaster />
        </>
    )
}