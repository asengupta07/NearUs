"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserEventSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, eventId, flexibility } = body;

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const userEvent = await UserEvent.findOneAndUpdate(
            { userId: user._id, eventId },
            { flexibility },
            { new: true }
        );

        if (!userEvent) {
            return NextResponse.json({ message: 'User event not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Flexibility updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating flexibility:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
