'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Info } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import MapComponent from '@/components/function/map'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/authContext'
import ResultComponent from '@/components/function/Results'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Attendee {
    id: string;
    username: string;
    email: string;
    location: {
        latitude: number;
        longitude: number;
    };
    avatarUrl: string;
    isAttending: boolean;
    flexibility: number;
}

interface Location {
    name: string;
    types: string[];
    distance: number;
    place_id: string;
    coords: {
      lat: number;
      lng: number;
    };
    formatted_address: string;
    rating: number;
    user_ratings_total: number;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    formatted_phone_number?: string;
    website?: string;
    price_level?: number;
    photos?: {
      photo_reference: string;
      height: number;
      width: number;
    }[];
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

export default function EventPage() {
    const searchParams = useSearchParams()
    const eventId = searchParams.get('id')
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [eventDetails, setEventDetails] = useState<any>(null)
    const [userFlexibility, setUserFlexibility] = useState(5)
    const [userLocation, setUserLocation] = useState('')
    const [selectedPlaceType, setSelectedPlaceType] = useState('')
    const [searchResults, setSearchResults] = useState<Location[]>([])
    const { email } = useAuth()
    const [canSuggestPlaces, setCanSuggestPlaces] = useState(true)

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const response = await fetch(`/api/event/${eventId}`)
                if (!response.ok) throw new Error('Failed to fetch event data')
                const data = await response.json()
                console.log('recieved data', data.attendees)
                data.attendees.forEach((attendee: Attendee) => {
                    console.log('attendee', attendee.email, email, attendee.email === email)
                    if (attendee.email === email) {
                        setUserFlexibility(attendee.flexibility)
                    }
                });
                setEventDetails(data.eventDetails)
                setAttendees(data.attendees)
            } catch (error) {
                console.error('Error fetching event data:', error)
            }
        }
        fetchEventData()
    }, [eventId])

    useEffect(() => {
        console.log('Attendees:', attendees)
    }, [attendees])

    const handleFlexibilityChange = async (value: number[]) => {
        setUserFlexibility(value[0])
        try {
            await fetch(`/api/update-flexibility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, eventId, flexibility: value[0] }),
            })
        } catch (error) {
            console.error('Error updating flexibility:', error)
        }
    }

    const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserLocation(e.target.value)
        try {
            await fetch(`/api/update-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, eventId, location: e.target.value }),
            })
        } catch (error) {
            console.error('Error updating location:', error)
        }
    }

    const handleSearch = async () => {
        if (!selectedPlaceType) return;
        try {
            const response = await fetch(`/api/search-places`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ placeType: selectedPlaceType, eventId }),
                }
            )
            if (!response.ok) throw new Error('Failed to search places')
            const data = await response.json()
            setSearchResults(data.places)
        } catch (error) {
            console.error('Error searching places:', error)
        }
    }

    const placeTypes = [
        { value: "restaurant", label: "Restaurant" },
        { value: "bar", label: "Bar" },
        { value: "shopping_mall", label: "Shopping Mall" },
        { value: "park", label: "Park" },
        { value: "cafe", label: "Cafe" },
    ]

    const mapLocations = [
        ...attendees.map(a => ({ name: a.username, ...a.location, color: a.isAttending ? 'green' : 'red' })),
        ...searchResults.map(a => ({ name: a.name, latitude: a.coords.lat, longitude: a.coords.lng, color: 'blue' })),
    ]
    return (
        <>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={[]} />
            <div className="relative min-h-[90vh] pt-20 lg:pt-10 lg:max-h-[100vh] w-full bg-gray-950 text-white">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8"
                >
                    <Card className="bg-gray-900 border-none mb-6">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">
                                <span className={cn(
                                    "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                                    "animate-text-gradient"
                                )}>
                                    {eventDetails?.name || 'Event Details'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Attendee Map</h2>
                                    <div className='relative overflow-hidden rounded-lg shadow-lg h-64'>
                                        <MapComponent locations={mapLocations} />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-white">Attendees</h2>
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {attendees.map((attendee) => (
                                            <div key={attendee.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <Avatar>
                                                        <AvatarImage src={attendee.avatarUrl} alt={attendee.username} />
                                                        <AvatarFallback>{attendee.username[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{attendee.username}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {attendee.isAttending ? 'Attending' : 'Not attending'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    Flexibility: {attendee.flexibility} km
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-none mb-6">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Your Flexibility</CardTitle>
                            <p>Flexibility represents how far you're willing to travel from your preferred location.</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="flexibility" className="text-white">Select Flexibility (km)</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-4 h-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Flexibility represents how far you're willing to travel from your preferred location.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Slider
                                        id="flexibility"
                                        min={0}
                                        max={50}
                                        step={1}
                                        value={[userFlexibility]}
                                        onValueChange={handleFlexibilityChange}
                                        className="mt-2"
                                    />
                                    <div className="text-center mt-1 text-sm text-gray-400">{userFlexibility} km</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-none">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Search Places</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Select onValueChange={setSelectedPlaceType} value={selectedPlaceType}>
                                        <SelectTrigger className="bg-gray-800 text-white border-gray-700 flex-grow">
                                            <SelectValue placeholder="Select place type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {placeTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                                        <Search className="w-4 h-4 mr-2" />
                                        Search
                                    </Button>
                                </div>
                                {!canSuggestPlaces && (
                                    <p className="text-yellow-400 text-sm">
                                        Warning: Not all attendees' flexibilities overlap. We may not be able to suggest optimal places.
                                    </p>
                                )}
                                {searchResults.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                                        <ResultComponent eventId={eventId} searchResults={searchResults} userEmail={email} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                <BackgroundBeams className="opacity-100" />

            </div>
        </>
    )
}