import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { EventSchema, UserSchema } from '@/app/_models/schema';
import connectToDatabase from '@/app/_middleware/mongodb';

export async function POST(req: NextRequest) {
    await connectToDatabase();

    try {
        const { eventId, spotId, voteType, userEmail } = await req.json();

        if (!eventId || !spotId || !voteType || !userEmail) {
            console.log('Missing required fields:', { eventId, spotId, voteType, userEmail });
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (!['up', 'down'].includes(voteType)) {
            console.log('Invalid vote type:', voteType);
            return NextResponse.json({ message: 'Invalid vote type' }, { status: 400 });
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            console.log('Invalid event ID:', eventId);
            return NextResponse.json({ message: 'Invalid event or spot ID' }, { status: 400 });
        }

        const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        // Find the suggested location within the event
        const suggestedLocation = event.suggestedLocations.find((location: any) => location.place_id === spotId);
        if (!suggestedLocation) {
            return NextResponse.json({ message: 'Suggested location not found' }, { status: 404 });
        }

        // Check if user has already voted
        const existingVoteIndex = suggestedLocation.votes.findIndex(
            (vote: any) => vote.user.toString() === user._id.toString()
        );

        if (existingVoteIndex > -1) {
            // User has already voted, update their vote
            if (suggestedLocation.votes[existingVoteIndex].vote === voteType) {
                // User is trying to vote the same way, remove their vote
                suggestedLocation.votes.splice(existingVoteIndex, 1);
            } else {
                // User is changing their vote
                suggestedLocation.votes[existingVoteIndex].vote = voteType;
            }
        } else {
            // User hasn't voted yet, add their vote
            suggestedLocation.votes.push({ user: user._id, vote: voteType });
        }

        await event.save();

        // Fetch the updated suggested location
        const updatedEvent = await Event.findById(eventId)
            .populate('suggestedLocations.suggested_by', 'username email');
        
        const updatedSpot = updatedEvent.suggestedLocations.find((location: any) => location.place_id === spotId);

        // Transform the updated spot to match the frontend format
        const transformedSpot = {
            _id: updatedSpot.place_id,
            name: updatedSpot.name,
            place_id: updatedSpot.place_id,
            formatted_address: updatedSpot.formatted_address,
            coords: {
                lat: updatedSpot.location.coordinates[1],
                lng: updatedSpot.location.coordinates[0]
            },
            rating: updatedSpot.rating,
            user_ratings_total: updatedSpot.user_ratings_total,
            types: updatedSpot.types,
            website: updatedSpot.website,
            formatted_phone_number: updatedSpot.formatted_phone_number,
            price_level: updatedSpot.price_level,
            opening_hours: updatedSpot.opening_hours,
            suggested_by: {
                username: updatedSpot.suggested_by.username,
                email: updatedSpot.suggested_by.email
            },
            votes: updatedSpot.votes
        };

        return NextResponse.json({ 
            message: 'Vote recorded successfully',
            updatedSpot: transformedSpot
        }, { status: 200 });
    } catch (error) {
        console.error('Handle Vote API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}