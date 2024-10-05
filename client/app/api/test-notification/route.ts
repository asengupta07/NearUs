import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, NotificationSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        // Ensure database connection
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            return NextResponse.json({ message: 'MongoDB URI is missing' }, { status: 500 });
        }

        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(mongoUri);
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Find or create an event (for testing purposes)
        let event = await Event.findOne({});
        if (!event) {
            event = await Event.create({
                eventName: 'Test Event',
                location: 'Test Location',
                eventDate: new Date(),
                creator: user._id,
                type: 'Upcoming',
            });
        }

        // Create a test notification
        const notification = await Notification.create({
            recipient: user._id,
            type: 'EVENT_INVITATION',
            sender: user._id, // Using the same user as sender for simplicity
            eventId: event._id,
            message: 'This is a test notification',
            read: false,
            status: 'PENDING',
        });

        return NextResponse.json({ message: 'Test notification created', notification }, { status: 201 });
    } catch (error) {
        console.error('Error creating test notification:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: (error as Error).message },
            { status: 500 }
        );
    }
}
