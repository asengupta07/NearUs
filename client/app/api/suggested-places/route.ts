import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { EventSchema } from '@/app/_models/schema';
import connectToDatabase from '@/app/_middleware/mongodb';

export async function POST(req: NextRequest) {
    await connectToDatabase();

    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
        }

        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
        }

        const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

        const event = await Event.findById(eventId)
            .populate('suggestedLocations.suggested_by', 'username email')
            .select('suggestedLocations');

        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Transform the suggestedLocations to match the format used in the frontend
        console.log('Event:', event);
        console.log('Suggested Locations:', event.suggestedLocations);
        const suggestedSpots = event.suggestedLocations.map((location: any) => ({
            _id: location.place_id,
            name: location.name,
            place_id: location.place_id,
            formatted_address: location.formatted_address,
            coords: {
                lat: location.location.coordinates[1],
                lng: location.location.coordinates[0]
            },
            rating: location.rating,
            user_ratings_total: location.user_ratings_total,
            types: location.types,
            website: location.website,
            formatted_phone_number: location.formatted_phone_number,
            price_level: location.price_level,
            opening_hours: location.opening_hours,
            suggested_by: {
                username: location.suggested_by.username,
                email: location.suggested_by.email
            },
            votes: location.votes
        }));
        console.log('Suggested Spots:', suggestedSpots);
        return NextResponse.json({ suggestedSpots }, { status: 200 });
    } catch (error) {
        console.error('Get Suggested Places API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}