"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserFriendSchema, UserEventSchema, NotificationSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

interface DashboardRequestBody {
    email: string;
}

interface EventData {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: string[];
}

interface NotificationData {
    id: string;
    message: string;
    type: string;
    sender: {
        id: string;
        username: string;
        email: string;
        avatarUrl: string;
    } | null;
    event: {
        id: string;
        name: string;
        date: string;
        location: string;
    } | null;
    createdAt: string;
    read: boolean;
    status: string;
}

interface FriendData {
    username: string;
    avatarUrl: string;
}

interface DashboardData {
    upcomingEvents: EventData[];
    pastEvents: EventData[];
    friends: FriendData[];  
    notifications: NotificationData[];
}

async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    let body: DashboardRequestBody;
    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { email } = body;

    if (!email) {
        return NextResponse.json({ message: 'Please provide an email address' }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email });
        console.log('Looking up user with email:', email);
        console.log('Found user:', user?._id);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Get user's active friends (only those with 'Accepted' status)
        const userFriends = await UserFriend.find({ 
            userId: user._id, 
            status: 'Accepted' 
        }).populate('friendId', 'username avatarUrl');
        
        const friends = userFriends.map(uf => ({
            username: uf.friendId.username,
            avatarUrl: uf.friendId.avatarUrl
        }));        
        console.log('Found friends:', friends.length);

        // Get notifications with enhanced query to include all notification types
        const notifications = await Notification.find({
            recipient: user._id,
            type: {
                $in: [
                    'FRIEND_REQUEST_ACCEPTED',
                    'FRIEND_REQUEST_REJECTED',
                    'NEW_FRIEND_REQUEST',
                    'FRIEND_REMOVED',
                    'EVENT_CREATED',
                    'EVENT_INVITATION_ACCEPTED',
                    'EVENT_INVITATION_DECLINED',
                    'EVENT_UPDATED',
                    'EVENT_CANCELLED'
                ]
            }
        })
        .populate('sender', 'username email avatarUrl')
        .populate('eventId', 'eventName eventDate location')
        .sort({ createdAt: -1 })
        .limit(10);

        console.log('Found notifications:', notifications.length);

        // Format notifications with consistent structure
        const formattedNotifications: NotificationData[] = notifications.map(notification => ({
            id: notification._id.toString(),
            message: notification.message,
            type: notification.type,
            sender: notification.sender ? {
                id: notification.sender._id.toString(),
                username: notification.sender.username,
                email: notification.sender.email,
                avatarUrl: notification.sender.avatarUrl
            } : null,
            event: notification.eventId ? {
                id: notification.eventId._id.toString(),
                name: notification.eventId.eventName,
                date: notification.eventId.eventDate.toISOString(),
                location: notification.eventId.location
            } : null,
            createdAt: notification.createdAt.toISOString(),
            read: notification.read,
            status: notification.status
        }));

        console.log('Formatted notifications:', formattedNotifications);

        // Get user's events
        const currentDate = new Date();
        const userEvents = await UserEvent.find({ 
            userId: user._id, 
            status: 'Going' 
        }).populate({
            path: 'eventId',
            populate: {
                path: 'attendees',
                model: 'User',
                select: 'username'
            }
        });

        console.log('Found user events:', userEvents.length);

        // Sort events into upcoming and past
        const upcomingEvents: EventData[] = [];
        const pastEvents: EventData[] = [];

        for (const userEvent of userEvents) {
            const event = userEvent.eventId;
            const eventData: EventData = {
                id: event._id.toString(),
                title: event.eventName,
                location: event.location,
                date: event.eventDate.toISOString().split('T')[0],
                friends: event.attendees.map((attendee: { username: string }) => attendee.username)
            };

            if (event.eventDate > currentDate) {
                upcomingEvents.push(eventData);
            } else {
                pastEvents.push(eventData);
            }
        }

        // Sort events by date
        upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Compile dashboard data
        const dashboardData: DashboardData = {
            upcomingEvents,
            pastEvents,
            friends,
            notifications: formattedNotifications
        };

        console.log('Returning dashboard data with:', {
            upcomingEventsCount: upcomingEvents.length,
            pastEventsCount: pastEvents.length,
            friendsCount: friends.length,
            notificationsCount: formattedNotifications.length
        });

        return NextResponse.json(dashboardData, { status: 200 });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error', 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }, { status: 500 });
    }
}

export { handler as POST }