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
import {
    ChevronUp,
    ChevronDown,
    Clock,
    Phone,
    Globe,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { AnimatePresence } from 'framer-motion'
import { Notification, Event, Message } from '@/types'

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

interface Vote {
    vote: 'up' | 'down';
    user: string;
}

interface SuggestedSpot extends Location {
    _id: string;
    votes: Vote[];
    suggested_by: {
        username: string;
        email: string;
    };
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
    const [eventDetails, setEventDetails] = useState<Event | null>(null)
    const [userFlexibility, setUserFlexibility] = useState(5)
    const [userLocation, setUserLocation] = useState('')
    const [selectedPlaceType, setSelectedPlaceType] = useState('')
    const [searchResults, setSearchResults] = useState<Location[]>([])
    const { email } = useAuth()
    const [canSuggestPlaces, setCanSuggestPlaces] = useState(true)
    const [suggestedSpots, setSuggestedSpots] = useState<SuggestedSpot[]>([])
    const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({})
    const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({})
    const [searchError, setSearchError] = useState<string | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notificationError, setNotificationError] = useState<string | null>(null)

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications?userId=${email}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Notifications endpoint not found. This might be expected if the feature is not implemented yet.');
                    setNotifications([]);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setNotifications(data as Notification[]);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotificationError('Failed to fetch notifications. Please try again later.');
        }
    };

    const fetchEventData = async () => {
        try {
            const response = await fetch(`/api/event/${eventId}`)
            if (!response.ok) throw new Error('Failed to fetch event data')
            const data = await response.json()
            setEventDetails({
                id: data.eventDetails.id,
                title: data.eventDetails.title,
                location: data.eventDetails.location,
                date: data.eventDetails.date,
                friends: data.eventDetails.friends
            } as Event)
            setAttendees(data.attendees as Attendee[])
        } catch (error) {
            console.error('Error fetching event data:', error)
        }
    }

    const fetchSuggestedSpots = async () => {
        try {
            const response = await fetch(`/api/suggested-places?eventId=${eventId}`,
                { method: 'POST' }
            )
            if (!response.ok) throw new Error('Failed to fetch suggested spots')
            const data = await response.json()
            setSuggestedSpots(data.suggestedSpots)
        } catch (error) {
            console.error('Error fetching suggested spots:', error)
        }
    }

    useEffect(() => {
        if (email) {
            fetchNotifications()
        }
    }, [email])

    useEffect(() => {
        if (eventId) {
            fetchEventData()
        }
    }, [eventId])

    useEffect(() => {
        fetchSuggestedSpots()
    }, [eventId])

    const toggleCard = (placeId: string) => {
        setExpandedCards(prev => ({ ...prev, [placeId]: !prev[placeId] }))
    }

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))
    }

    const renderPriceLevel = (priceLevel: number) => {
        return Array(4).fill(0).map((_, i) => (
            <span key={i} className={`text-lg ${i < priceLevel ? 'text-green-500' : 'text-gray-400'}`}>$</span>
        ))
    }

    const handleVote = async (spotId: string, voteType: string) => {
        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, spotId, voteType, userEmail: email }),
            });
            if (!response.ok) throw new Error('Failed to submit vote');
            const data = await response.json();

            // Update your state with the returned updatedSpot
            setSuggestedSpots(prev =>
                prev.map(spot => spot._id === spotId ? data.updatedSpot : spot)
            );
        } catch (error) {
            console.error('Error submitting vote:', error);
        }
    };

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const response = await fetch(`/api/event/${eventId}`)
                if (!response.ok) throw new Error('Failed to fetch event data')
                const data = await response.json()
                setEventDetails(data.eventDetails as Event)
                setAttendees(data.attendees as Attendee[])
            } catch (error) {
                console.error('Error fetching event data:', error)
            }
        }
        fetchEventData()
    }, [eventId, userFlexibility])

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

    // const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setUserLocation(e.target.value)
    //     try {
    //         await fetch(`/api/update-location`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ email, eventId, location: e.target.value }),
    //         })
    //     } catch (error) {
    //         console.error('Error updating location:', error)
    //     }
    // }

    const handleSearch = async () => {
        if (!selectedPlaceType) return;
        setSearchError(null);
        try {
            const response = await fetch(`/api/search-places`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ placeType: selectedPlaceType, eventId }),
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to search places');
            }
            setSearchResults(data.places);
        } catch (error) {
            console.error('Error searching places:', error);
            setSearchError(error instanceof Error ? error.message : 'An error occurred while searching places');
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
        ...attendees.filter(a => a.isAttending).map(a => ({
            name: a.username,
            latitude: a.location.latitude,
            longitude: a.location.longitude,
            color: 'green'
        })),
        ...searchResults.map(a => ({
            name: a.name,
            latitude: a.coords.lat,
            longitude: a.coords.lng,
            color: 'blue'
        })),
    ]

    return (
        <>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={notifications} />
            {notificationError && (
                <div className="bg-red-500 text-white p-2 text-center">
                    {notificationError}
                </div>
            )}
            <div className="relative min-h-[90vh] pt-20 sm:pt-12 lg:max-h-[100vh] w-full bg-gray-950 text-white">
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
                                    {eventDetails?.title || 'Event Details'}
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
                            <p>Flexibility represents how far you are willing to travel from your preferred location.</p>
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
                                                    <p>Flexibility represents how far you are willing to travel from your preferred location.</p>
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
                    <Card className="bg-gray-900 border-none mb-6">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Suggested Spots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {suggestedSpots.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-center py-10"
                                >
                                    <h3 className="text-2xl font-bold mb-4">No spots suggested yet!</h3>
                                    <p className="text-gray-400 mb-6">Be the first to suggest an awesome spot for the event!</p>
                                </motion.div>
                            ) : (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                    <AnimatePresence>
                                        {suggestedSpots.map((spot) => (
                                            <motion.div
                                                key={spot.place_id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Card className="bg-gray-800 text-white overflow-hidden">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xl font-bold truncate">{spot.name}</CardTitle>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <div className="flex">{renderStars(spot.rating)}</div>
                                                            <span className="text-sm">({spot.user_ratings_total} reviews)</span>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm text-gray-300 mb-2 truncate">
                                                            {expandedCards[spot.place_id] ? spot.formatted_address : spot.formatted_address}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {spot.types.slice(0, 3).map((type, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    {type.replace('_', ' ')}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            {/* <span className="text-sm">{spot.distance.toFixed(2)} km away</span> */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleCard(spot.place_id)}
                                                                className="text-blue-400 hover:text-blue-300"
                                                            >
                                                                {expandedCards[spot.place_id] ? <ChevronUp className="mr-1" /> : <ChevronDown className="mr-1" />}
                                                                {expandedCards[spot.place_id] ? 'Less' : 'More'}
                                                            </Button>
                                                        </div>
                                                        <AnimatePresence>
                                                            {expandedCards[spot.place_id] && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="mt-4 space-y-2"
                                                                >
                                                                    <p className="text-sm text-gray-300 mb-2">{spot.formatted_address}</p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                                        <span className="text-sm">
                                                                            {spot.opening_hours ? spot.opening_hours.open_now ? 'Open now' : 'Closed' : 'Opening hours not available'}
                                                                        </span>
                                                                    </div>
                                                                    {spot.formatted_phone_number && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-sm">{spot.formatted_phone_number}</span>
                                                                        </div>
                                                                    )}
                                                                    {spot.website && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <Globe className="w-4 h-4 text-gray-400" />
                                                                            <a href={spot.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate">
                                                                                {spot.website}
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-sm">Price Level:</span>
                                                                        <div className="flex">{spot.price_level !== undefined && renderPriceLevel(spot.price_level)}</div>
                                                                    </div>
                                                                    {spot.opening_hours?.weekday_text && (
                                                                        <div className="mt-2">
                                                                            <h4 className="text-sm font-semibold mb-1">Opening Hours:</h4>
                                                                            <ul className="text-xs space-y-1">
                                                                                {spot.opening_hours.weekday_text.map((day, index) => (
                                                                                    <li key={index}>{day}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                </motion.div>
                                                            )}
                                                            <div className="mt-4 flex items-center justify-between">
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleVote(spot._id, 'up')}
                                                                        className={cn(
                                                                            "bg-gray-700 hover:bg-gray-600",
                                                                            userVotes[spot._id] === 'up' && "bg-green-600 hover:bg-green-700"
                                                                        )}
                                                                    >
                                                                        <ThumbsUp className="w-4 h-4 mr-1" />
                                                                        {spot.votes.filter(v => v.vote === 'up').length}
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleVote(spot._id, 'down')}
                                                                        className={cn(
                                                                            "bg-gray-700 hover:bg-gray-600",
                                                                            userVotes[spot._id] === 'down' && "bg-red-600 hover:bg-red-700"
                                                                        )}
                                                                    >
                                                                        <ThumbsDown className="w-4 h-4 mr-1" />
                                                                        {spot.votes.filter(v => v.vote === 'down').length}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-gray-400">
                                                                Suggested by: {spot.suggested_by.username}
                                                            </span>
                                                        </AnimatePresence>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
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
                                {searchError && (
                                    <p className="text-yellow-400 text-sm">
                                        {searchError}
                                    </p>
                                )}
                                {!canSuggestPlaces && (
                                    <p className="text-yellow-400 text-sm">
                                        Warning: Not all attendees&apos; flexibilities overlap. We may not be able to suggest optimal places.
                                    </p>
                                )}
                                {searchResults.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                                        <ResultComponent eventId={eventId} searchResults={searchResults} userEmail={email} callBack={fetchSuggestedSpots} />
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