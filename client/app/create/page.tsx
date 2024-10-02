'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Calendar, Clock } from 'lucide-react'
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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState('12:00')
    const [planName, setPlanName] = useState('')
    const [selectedLocationPreference, setSelectedLocationPreference] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { email } = useAuth()
    const [displayLocations, setDisplayLocations] = useState<Location[]>([])
    const locationPreferences = ['Cafes', 'Parks', 'Restaurants', 'Malls', 'Cinemas', 'Bars']

    useEffect(() => {
        const fetchData = async () => {
            try {
                const friendsResponse = await fetch('/api/friends', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                    }),
                });
                if (!friendsResponse.ok) {
                    throw new Error('Failed to fetch friends')
                }
                const friendsData = await friendsResponse.json();
                console.log('friendsData: ', friendsData)

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

                console.log('locData: ', locData)

                
                setDisplayLocations(locData)
                setFriends(friendsData.friends);
                console.log('locdata2: ', displayLocations)
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        if (email) {
            fetchData();
            console.log('data: ', displayLocations)
        }
    }, [email]);

    useEffect(() => {
        console.log('displayLocations: ', displayLocations)
    }, [displayLocations])

    const handleFriendSelection = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const response = await fetch('/api/create-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planName,
                    selectedFriends,
                    selectedDate: selectedDate?.toISOString().split('T')[0],
                    selectedTime,
                    selectedLocationPreference,
                    creatorEmail: email,
                }),
            })
            if (!response.ok) {
                throw new Error('Failed to create plan')
            }
            const data = await response.json()
            console.log('Plan created:', data)
            // Reset form or navigate to a success page
            setPlanName('')
            setSelectedFriends([])
            setSelectedDate(new Date())
            setSelectedTime('12:00')
            setSelectedLocationPreference('')
            router.push('/events')

        } catch (error) {
            console.error('Error creating plan:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={[]} />
            <div className="custom-scrollbar relative min-h-[200vh] w-full bg-gray-950 text-white overflow-hidden">
                <div className="absolute inset-0 max-w-4xl mx-auto w-full overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-20 max-w-7xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8 pt-20 lg:pt-20"
                    >
                        <Card className="bg-gray-900 border-none">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold">
                                    <span className={cn(
                                        "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
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
                                                            <div>
                                                                <p className="font-semibold">{friend.username}</p>
                                                                <p className="text-sm text-gray-400">@{friend.username}</p>
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
                                                        value={selectedDate?.toISOString().split('T')[0]}
                                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                                        className="bg-gray-800 text-white border-gray-700"
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
                                                        onChange={(e) => setSelectedTime(e.target.value)}
                                                        className="bg-gray-800 text-white border-gray-700"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full relative overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
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
            </div>
        </>
    )
}