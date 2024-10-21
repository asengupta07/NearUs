"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NotificationSchema, UserSchema } from '@/app/_models/schema';

async function connectDB() {
    if (mongoose.connection.readyState !== 1) {
        try {
            await mongoose.connect(process.env.MONGODB_URI as string);
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw new Error('Database connection failed');
        }
    }
}

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

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

export async function GET(req: NextRequest) {
    console.log('Notification GET request received');
    await connectDB();
    const userEmail = req.nextUrl.searchParams.get('userId');

    if (!userEmail) {
        console.log('User email missing in request');
        return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    try {
        console.log(`Fetching user with email: ${userEmail}`);
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.log('User not found');
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        console.log(`Fetching notifications for user: ${user._id}`);
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
        .limit(50);

        console.log(`Fetched ${notifications.length} notifications`);

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

        return NextResponse.json(formattedNotifications, { status: 200 });
    } catch (error) {
        console.error('Fetch Notifications API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await connectDB();

    try {
        const { recipient, type, sender, eventId, message } = await req.json();
        
        const [recipientUser, senderUser] = await Promise.all([
            User.findOne({ email: recipient }),
            User.findOne({ email: sender })
        ]);

        if (!recipientUser || !senderUser) {
            return NextResponse.json({ 
                message: 'Recipient or sender not found' 
            }, { status: 404 });
        }

        const newNotification = new Notification({
            recipient: recipientUser._id,
            type,
            sender: senderUser._id,
            eventId,
            message,
            status: 'SENT'
        });

        await newNotification.save();
        return NextResponse.json({ message: 'Notification created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Create Notification API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    await connectDB();

    try {
        const { notificationIds, action } = await req.json();

        console.log('Received request:', { notificationIds, action });
        
        if (!notificationIds || !action) {
            return NextResponse.json({ 
                message: 'Notification IDs and action are required' 
            }, { status: 400 });
        }

        let result;
        switch (action) {
            case 'markAsRead':
                result = await Notification.updateMany(
                    { _id: { $in: notificationIds } },
                    { $set: { read: true } }
                );
                console.log('Mark as read result:', result);
                return NextResponse.json({ 
                    message: 'Notifications marked as read successfully',
                    modifiedCount: result.modifiedCount
                }, { status: 200 });
            case 'delete':
                result = await Notification.deleteMany({ _id: { $in: notificationIds } });
                console.log('Delete result:', result);
                return NextResponse.json({ 
                    message: 'Notifications deleted successfully',
                    deletedCount: result.deletedCount 
                }, { status: 200 });
            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Update Notification API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await connectDB();

    try {
        const { notificationIds } = await req.json();
        
        if (!notificationIds) {
            return NextResponse.json({ 
                message: 'Notification IDs are required' 
            }, { status: 400 });
        }

        const deleteResult = await Notification.deleteMany({ 
            _id: { $in: notificationIds } 
        });

        return NextResponse.json({ 
            message: 'Notifications deleted successfully',
            deletedCount: deleteResult.deletedCount 
        }, { status: 200 });
    } catch (error) {
        console.error('Delete Notifications API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}