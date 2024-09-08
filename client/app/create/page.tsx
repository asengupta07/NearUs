'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Calendar, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import MapComponent from '@/components/function/map'

const friends = [
    { id: 1, name: 'Alice Johnson' },
    { id: 2, name: 'Bob Smith' },
    { id: 3, name: 'Charlie Brown' },
    { id: 4, name: 'Diana Prince' },
]

const locationPreferences = ['Cafes', 'Parks', 'Restaurants', 'Bars', 'Museums']

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
    const [selectedFriends, setSelectedFriends] = useState<number[]>([])
    const [flexibility, setFlexibility] = useState(50)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState('12:00')


    const locations = [
        { name: "Rajesh", longitude: 88.3639, latitude: 22.5726 },
        { name: "Priya", longitude: 88.3742, latitude: 22.5855 },
        { name: "Vikram", longitude: 88.3476, latitude: 22.5637 },
        { name: "Anita", longitude: 88.3961, latitude: 22.5763 },
        { name: "Rohit", longitude: 88.4182, latitude: 22.5924 },
        { name: "Suman", longitude: 88.3378, latitude: 22.5322 },
        { name: "Deepika", longitude: 88.3940, latitude: 22.5512 },
        { name: "Ajay", longitude: 88.3293, latitude: 22.6010 },
        { name: "Kavita", longitude: 88.3779, latitude: 22.5489 },
        { name: "Rina", longitude: 88.4085, latitude: 22.5741 },
    ];

    const handleFriendSelection = (friendId: number) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically send the data to your backend
        console.log('Creating plan with:', { selectedFriends, flexibility, selectedDate, selectedTime })
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={[]} />
            <div className="custom-scrollbar relative min-h-[200vh] w-full bg-gray-950 text-white overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto">
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
                                        <Input id="plan-name" placeholder="Enter plan name" className="mt-1 bg-gray-800 text-white border-gray-700" />
                                    </div>
                                    <div>

                                        <h2 className="text-xl font-semibold mb-2 text-white">Location Map</h2>
                                        <div className='relative overflow-hidden rounded-lg shadow-lg'>
                                            <div className='z-50 h-64 w-full'>
                                                <MapComponent locations={locations} />
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
                                                        <Avatar className="inline-block mr-2">
                                                            <AvatarFallback>{friend.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        {friend.name}
                                                    </Label>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold mb-2 text-white">Travel Flexibility</h2>
                                        <Slider
                                            value={[flexibility]}
                                            onValueChange={(values) => setFlexibility(values[0])}
                                            max={100}
                                            step={1}
                                            className="bg-gray-800"
                                        />
                                        <p className="text-sm text-gray-400 mt-1">Flexibility: {flexibility}%</p>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold mb-2 text-white">Location Preferences</h2>
                                        <Select>
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

                                    <Button type="submit" className="w-full relative overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                            Create Plan <Plus className="ml-2 h-5 w-5" />
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