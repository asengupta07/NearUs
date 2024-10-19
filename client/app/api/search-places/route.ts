"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { EventSchema, UserEventSchema, UserSchema } from '@/app/_models/schema';
import connectToDatabase from '@/app/_middleware/mongodb';
import { findCentroid } from '@/helpers/algo';

interface Place {
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
    types: string[];
    distance_meters: number;
    place_id: string;
}

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

async function getPlaceDetails(placeId: string) {
    const response = await fetch(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${process.env.NEXT_PUBLIC_API_KEY}`);
    const data = await response.json();
    return data.result;
}

async function posthandler(req: NextRequest) {
    await connectToDatabase();

    try {
        const { placeType, eventId } = await req.json();
        
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
        const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

        const attendees = await UserEvent.find({ eventId, status: 'Going' }).populate('userId');

        const coords = attendees.map((attendee) => ({
            x: attendee.userId.location.coordinates[0],
            y: attendee.userId.location.coordinates[1],
            maxDistance: attendee.flexibility/100
        }));

        let centroid;
        try {
            centroid = findCentroid(coords);
        } catch (error) {
            if (error instanceof Error && error.message === "No overlapping area found. Users' travel ranges do not intersect.") {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            throw error;
        }
        
        const x = centroid.centroid.x;
        const y = centroid.centroid.y;
        const response = await fetch(`https://api.olamaps.io/places/v1/nearbysearch?layers=venue&types=${placeType}&location=${y},${x}&api_key=${process.env.NEXT_PUBLIC_API_KEY}`);
        const data = await response.json();

        const placesPromises = data.predictions.map(async (place: Place) => {
            const details = await getPlaceDetails(place.place_id);
            return {
                name: details.name,
                types: details.types,
                distance: place.distance_meters / 1000,
                place_id: place.place_id,
                coords: details.geometry.location,
                formatted_address: details.formatted_address,
                rating: details.rating || 0,
                user_ratings_total: details.user_ratings_total || 0,
                opening_hours: details.opening_hours ? {
                    open_now: details.opening_hours.open_now,
                    weekday_text: details.opening_hours.weekday_text || []
                } : undefined,
                formatted_phone_number: details.formatted_phone_number,
                website: details.website,
                price_level: details.price_level,
                photos: details.photos || []
            };
        });

        const places = await Promise.all(placesPromises);

        places.sort((a: FormattedPlace, b: FormattedPlace) => a.distance - b.distance);
        console.log(places);

        return NextResponse.json({ places }, { status: 200 });
    }
    catch (error) {
        console.error('Get Places API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export {
    posthandler as POST
}