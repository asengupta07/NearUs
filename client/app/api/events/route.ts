import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema, UserFriendSchema } from '@/app/_models/schema';

interface Friend {
    username: string;
    avatarUrl: string;
}

interface EventData {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: Friend[];
}

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const userEvents = await UserEvent.find({ userId: user._id, status: 'Going' });
        const eventIds = userEvents.map(ue => ue.eventId);

        const events = await Event.find({ _id: { $in: eventIds } }).sort({ eventDate: 1 });

        const currentDate = new Date();
        const upcomingEvents: EventData[] = [];
        const pastEvents: EventData[] = [];

        for (const event of events) {
            const eventData: EventData = {
                id: event._id.toString(),
                title: event.eventName,
                location: event.location,
                date: event.eventDate.toISOString().split('T')[0],
                friends: []
            };

            const attendingFriends = await UserEvent.find({
                eventId: event._id,
                status: 'Going'
            }).populate('userId', 'username avatarUrl');

            eventData.friends = attendingFriends.map(ue => ({
                username: ue.userId.username,
                avatarUrl: ue.userId.avatarUrl || ''
            }));

            if (event.eventDate > currentDate) {
                upcomingEvents.push(eventData);
            } else {
                pastEvents.push(eventData);
            }
        }

        return NextResponse.json({ upcomingEvents, pastEvents }, { status: 200 });
    } catch (error) {
        console.error('Error fetching events data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}