"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { NotificationSchema, UserSchema } from '@/app/_models/schema';

// Ensure database connection
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

// PUT: Update notifications
export async function PUT(req: NextRequest) {
    console.log('PUT /api/notifications route hit');
    await connectDB();

    try {
        const body = await req.json();
        const { notificationIds, action } = body;

        if (!notificationIds || !action) {
            return NextResponse.json({ 
                message: 'Notification IDs and action are required' 
            }, { status: 400 });
        }

        let update = {};

        switch (action) {
            case 'markAsRead':
                update = { read: true };
                break;
            case 'markAsUnread':
                update = { read: false };
                break;
            case 'updateStatus':
                update = { status: 'SENT' };
                break;
            default:
                return NextResponse.json({ 
                    message: 'Invalid action' 
                }, { status: 400 });
        }

        const result = await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $set: update }
        );

        return NextResponse.json({ 
            message: 'Notifications updated successfully',
            modifiedCount: result.modifiedCount
        }, { status: 200 });

    } catch (error) {
        console.error('Notification Update API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

// GET: Fetch notifications
export async function GET(req: NextRequest) {
    await connectDB();

    const userEmail = req.nextUrl.searchParams.get('userId');

    if (!userEmail) {
        return NextResponse.json({ 
            message: 'User email is required' 
        }, { status: 400 });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return NextResponse.json({ 
                message: 'User not found' 
            }, { status: 404 });
        }

        // Fetch notifications for the user
        const notifications = await Notification.find({
            recipient: user._id 
        })
        .populate('sender', 'username')
        .populate('eventId', 'eventName')
        .sort({ createdAt: -1 })
        .limit(50);

        return NextResponse.json(notifications, { status: 200 });

    } catch (error) {
        console.error('Fetch Notifications API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

// DELETE: Delete notifications
export async function DELETE(req: NextRequest) {
    await connectDB();

    try {
        const body = await req.json();
        const { notificationIds } = body;

        if (!notificationIds) {
            return NextResponse.json({ 
                message: 'Notification IDs are required' 
            }, { status: 400 });
        }

        const result = await Notification.deleteMany({
            _id: { $in: notificationIds }
        });

        return NextResponse.json({ 
            message: 'Notifications deleted successfully',
            deletedCount: result.deletedCount
        }, { status: 200 });

    } catch (error) {
        console.error('Delete Notifications API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}
