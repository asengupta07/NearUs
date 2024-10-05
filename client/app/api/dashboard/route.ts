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

async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    let body;
    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { email }: DashboardRequestBody = body;

    if (!email) {
        return NextResponse.json({ message: 'Please fill all fields' }, { status: 400 });
    }

    try {
        // Find the user
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Get user's friends
        const userFriends = await UserFriend.find({ userId: user._id, status: 'Accepted' }).populate('friendId', 'username');
        const friends = userFriends.map(uf => uf.friendId.username);

        // Get notifications
        const notifications = await Notification.find({
            recipient: user._id,
        })
        .populate('sender', 'username')
        .populate('eventId', 'eventName')
        .sort({ createdAt: -1 })
        .limit(10);

        console.log('Found notifications:', notifications); 

        const formattedNotifications = notifications.map(notification => ({
            id: notification._id.toString(),
            message: notification.message,
            type: notification.type,
            sender: notification.sender.username,
            eventName: notification.eventId?.eventName,
            createdAt: notification.createdAt,
            read: notification.read,
            status: notification.status
          }));

        console.log('Formatted notifications:', formattedNotifications);

        const currentDate = new Date();
        const userEvents = await UserEvent.find({ userId: user._id, status: 'Going' })
            .populate({
                path: 'eventId',
                populate: {
                    path: 'attendees',
                    model: 'User',
                    select: 'username'
                }
            });

        // Process events
        const upcomingEvents = [];
        const pastEvents = [];

        for (const userEvent of userEvents) {
            const event = userEvent.eventId;
            const eventData = {
                id: event._id.toString(),
                title: event.eventName,
                location: event.location,
                date: event.eventDate.toISOString().split('T')[0],
                friends: event.attendees.map((attendee: { username: any; }) => attendee.username)
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

        // Prepare response
        const dashboardData = {
            upcomingEvents,
            pastEvents,
            friends,
            notifications: formattedNotifications
        };

        console.log('Dashboard data:', dashboardData);

        return NextResponse.json(dashboardData, { status: 200 });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export {
    handler as POST
}