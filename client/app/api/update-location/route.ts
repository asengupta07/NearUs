"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserEventSchema } from '@/app/_models/schema';
import connectToDatabase from '@/app/_middleware/mongodb';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

export async function POST(req: NextRequest) {
    await connectToDatabase();
    try {
        const body = await req.json();
        const { email, eventId, location } = body;

        // Here you would typically use a geocoding service to convert location string to coordinates
        // For this example, we'll use dummy coordinates
        const coordinates = [0, 0]; // Replace with actual geocoding logic

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const userEvent = await UserEvent.findOneAndUpdate(
            { userId: user._id, eventId },
            { 
                preferredLocation: {
                    type: 'Point',
                    coordinates: coordinates
                }
            },
            { new: true }
        );

        if (!userEvent) {
            return NextResponse.json({ message: 'User event not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Location updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
