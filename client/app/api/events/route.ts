import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema, UserFriendSchema } from '@/app/_models/schema';

// Define the types for the events and response data
interface EventData {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: string[];
}

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Find all events the user is attending
        const userEvents = await UserEvent.find({ userId: user._id, status: 'Going' });
        const eventIds = userEvents.map(ue => ue.eventId);

        // Find all events
        const events = await Event.find({ _id: { $in: eventIds } }).sort({ eventDate: 1 });

        // Get user's friends
        const friendships = await UserFriend.find({ 
            $or: [{ userId: user._id }, { friendId: user._id }],
            status: 'Accepted'
        });
        const friendIds = friendships.map(f => 
            f.userId.equals(user._id) ? f.friendId : f.userId
        );

        // Prepare the response data with explicit types
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

            // Find friends attending this event
            const attendingFriends = await UserEvent.find({
                eventId: event._id,
                status: 'Going'
            }).populate('userId', 'username');

            eventData.friends = attendingFriends.map(ue => ue.userId.username);

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
