"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { EventSchema, NotificationSchema, UserSchema } from '@/app/_models/schema';
import connectToDatabase from '@/app/_middleware/mongodb';

interface Location {
    name: string;
    place_id: string;
    formatted_address: string;
    coords: {
        lat: number;
        lng: number;
    };
    rating: number;
    user_ratings_total: number;
    types: string[];
    website?: string;
    formatted_phone_number?: string;
    price_level?: number;
    opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
    };
}

interface RequestBody {
    eventId: string;
    place: Location;
    userEmail: string;
}

async function posthandler(req: NextRequest) {
    await connectToDatabase();

    try {
        const { eventId, place, userEmail }: RequestBody = await req.json();
        
        const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Check if user is part of the event
        const isUserInEvent = event.attendees.some(
            (attendeeId: mongoose.Types.ObjectId) => attendeeId.equals(user._id)
        );
        if (!isUserInEvent) {
            return NextResponse.json({ message: 'User is not part of this event' }, { status: 403 });
        }

        // Check if this place is already suggested
        const isPlaceAlreadySuggested = event.suggestedLocations.some(
            (loc: any) => loc.place_id === place.place_id
        );

        if (isPlaceAlreadySuggested) {
            return NextResponse.json({ 
                message: 'This place has already been suggested for this event'
            }, { status: 400 });
        }

        // Structure the new suggested location according to the schema
        const newSuggestedLocation = {
            name: place.name,
            place_id: place.place_id,
            formatted_address: place.formatted_address,
            location: {
                type: 'Point',
                coordinates: [place.coords.lng, place.coords.lat]
            },
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            types: place.types,
            website: place.website,
            formatted_phone_number: place.formatted_phone_number,
            price_level: place.price_level,
            opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now,
                weekday_text: place.opening_hours.weekday_text
            } : undefined,
            suggested_by: user._id,
            votes: []
        };

        // Update the event with the new suggested location
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { 
                $push: { 
                    suggestedLocations: newSuggestedLocation 
                } 
            },
            { new: true }
        ).populate('attendees', 'email');

        // console.log('Updated event:', updatedEvent);

        // Create notifications for all attendees except the suggester
        const attendeeNotifications = event.attendees
            .filter((attendeeId: mongoose.Types.ObjectId) => 
                !attendeeId.equals(user._id))
            .map((attendeeId: mongoose.Types.ObjectId) => ({
                recipient: attendeeId,
                sender: user._id,
                eventId: event._id,
                message: `A new location "${place.name}" has been suggested for ${event.eventName}`,
                type: 'locationSuggestion' 
            }));

        if (attendeeNotifications.length > 0) {
            await Notification.insertMany(attendeeNotifications);
        }

        return NextResponse.json({ 
            message: 'Location successfully added to event',
            suggestedLocation: newSuggestedLocation
        }, { status: 200 });
    }
    catch (error) {
        console.error('Add to Event API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export {
    posthandler as POST
}