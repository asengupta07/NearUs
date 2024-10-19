'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, Phone, Globe, DollarSign, ChevronDown, ChevronUp, Search, PlusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

interface FormattedPlace {
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

interface ResultComponentProps {
  searchResults: FormattedPlace[];
  eventId: string | null;
  userEmail: string | null;
}

export default function ResultComponent({ searchResults, eventId, userEmail }: ResultComponentProps) {
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({})
  const [addingToEvent, setAddingToEvent] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()

  const toggleCard = (placeId: string) => {
    setExpandedCards(prev => ({ ...prev, [placeId]: !prev[placeId] }))
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
    ))
  }

  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return 'Price info not available'
    return Array(priceLevel).fill(0).map((_, i) => (
      <DollarSign key={i} className="w-4 h-4 text-green-500" />
    ))
  }

  const getGoogleSearchUrl = (place: FormattedPlace) => {
    const addressParts = place.formatted_address.split(', ')
    const lastParts = addressParts.slice(-2).join(', ')
    const searchQuery = encodeURIComponent(`${place.name} ${lastParts}`)
    return `https://www.google.com/search?q=${searchQuery}`
  }

  const addToEvent = async (place: FormattedPlace) => {
    setAddingToEvent(prev => ({ ...prev, [place.place_id]: true }))
    try {
        const response = await fetch('/api/add-to-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId,
              place: {
                name: place.name,
                place_id: place.place_id,
                formatted_address: place.formatted_address,
                coords: place.coords,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                types: place.types,
                website: place.website,
                formatted_phone_number: place.formatted_phone_number,
                price_level: place.price_level,
                opening_hours: place.opening_hours,
              },
              userEmail: userEmail,
            }),
          });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${place.name} has been added to your event.`,
          duration: 3000,
        })
      } else {
        throw new Error('Failed to add place to event')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add place to event. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setAddingToEvent(prev => ({ ...prev, [place.place_id]: false }))
    }
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <AnimatePresence>
        {searchResults.map((place) => (
          <motion.div
            key={place.place_id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gray-800 text-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold truncate">{place.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex">{renderStars(place.rating)}</div>
                  <span className="text-sm">({place.user_ratings_total} reviews)</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 mb-2 truncate">
                  {expandedCards[place.place_id] ? place.formatted_address : place.formatted_address}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {place.types.slice(0, 3).map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{place.distance.toFixed(2)} km away</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCard(place.place_id)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {expandedCards[place.place_id] ? <ChevronUp className="mr-1" /> : <ChevronDown className="mr-1" />}
                    {expandedCards[place.place_id] ? 'Less' : 'More'}
                  </Button>
                </div>
                <AnimatePresence>
                  {expandedCards[place.place_id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 space-y-2"
                    >
                      <p className="text-sm text-gray-300 mb-2">{place.formatted_address}</p>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {place.opening_hours?.open_now ? 'Open now' : 'Closed'}
                        </span>
                      </div>
                      {place.formatted_phone_number && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{place.formatted_phone_number}</span>
                        </div>
                      )}
                      {place.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate">
                            {place.website}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Price Level:</span>
                        <div className="flex">{renderPriceLevel(place.price_level)}</div>
                      </div>
                      {place.opening_hours?.weekday_text && (
                        <div className="mt-2">
                          <h4 className="text-sm font-semibold mb-1">Opening Hours:</h4>
                          <ul className="text-xs space-y-1">
                            {place.opening_hours.weekday_text.map((day, index) => (
                              <li key={index}>{day}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <a
                          href={getGoogleSearchUrl(place)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-400 hover:underline"
                        >
                          <Search className="w-4 h-4 mr-1" />
                          Search on Google
                        </a>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToEvent(place)}
                                disabled={addingToEvent[place.place_id]}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                {addingToEvent[place.place_id] ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <PlusCircle className="w-4 h-4 mr-1" />
                                  </motion.div>
                                ) : (
                                  <PlusCircle className="w-4 h-4 mr-1" />
                                )}
                                Add to Event
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add this place to your event</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}