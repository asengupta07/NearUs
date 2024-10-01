"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const eventId = params.id;

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        const userEvents = await UserEvent.find({ eventId })
            .populate('userId', 'username email');

        const attendees = userEvents.map(ue => ({
            id: ue.userId._id.toString(),
            username: ue.userId.username,
            email: ue.userId.email,
            location: {
                latitude: ue.preferredLocation.coordinates[1],
                longitude: ue.preferredLocation.coordinates[0]
            },
            avatarUrl: `/api/avatar/${ue.userId.username}`, // Assuming you have an avatar API
            isAttending: ue.status === 'Going',
            flexibility: ue.flexibility
        }));

        return NextResponse.json({
            eventDetails: {
                name: event.eventName,
                date: event.eventDate,
                description: event.description
            },
            attendees
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching event data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';