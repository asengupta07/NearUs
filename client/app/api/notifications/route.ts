import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { Notification, User } from '@/app/_models/schema';

async function connectDB() {
    if (mongoose.connection.readyState !== 1) {
        try {
            console.log('Attempting to connect to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI as string);
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw new Error('Database connection failed');
        }
    } else {
        console.log('MongoDB connection is already established');
    }
}

// Add this GET handler
export async function GET(req: NextRequest) {
    console.log('GET request received:', req.url);

    await connectDB();

    const userEmail = req.nextUrl.searchParams.get('userId');
    console.log('User email from query params:', userEmail);

    if (!userEmail) {
        console.log('User email is missing in request');
        return NextResponse.json({ 
            message: 'User email is required' 
        }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email: userEmail });
        console.log('User fetched:', user);

        if (!user) {
            console.log('User not found');
            return NextResponse.json({ 
                message: 'User not found' 
            }, { status: 404 });
        }

        const notifications = await Notification.find({
            recipient: user._id 
        })
        .populate('sender', 'username')
        .populate('eventId', 'eventName')
        .sort({ createdAt: -1 })
        .limit(50);

        console.log('Notifications fetched for user:', notifications);

        return NextResponse.json(notifications, { status: 200 });

    } catch (error) {
        console.error('Fetch Notifications API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

// POST handler
export async function POST(req: NextRequest) {
    console.log('POST request received:', req.url);

    await connectDB();

    try {
        const { recipient, type, sender, eventId, message } = await req.json();
        console.log('Request body:', { recipient, type, sender, eventId, message });

        const recipientUser = await User.findOne({ email: recipient });
        console.log('Recipient user:', recipientUser);

        if (!recipientUser) {
            console.log('Recipient not found');
            return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
        }

        const senderUser = await User.findOne({ email: sender });
        console.log('Sender user:', senderUser);

        if (!senderUser) {
            console.log('Sender not found');
            return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
        }

        const newNotification = new Notification({
            recipient: recipientUser._id,
            type,
            sender: senderUser._id,
            eventId,
            message,
            status: 'SENT'
        });

        const savedNotification = await newNotification.save();
        console.log('Notification created successfully:', savedNotification);

        return NextResponse.json({ message: 'Notification created successfully' }, { status: 201 });

    } catch (error) {
        console.error('Create Notification API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}

// PUT handler
export async function PUT(req: NextRequest) {
    console.log('PUT request received:', req.url);

    await connectDB();

    try {
        const { notificationIds, action } = await req.json();
        console.log('Request body:', { notificationIds, action });

        if (action === 'markAsRead') {
            const result = await Notification.updateMany(
                { _id: { $in: notificationIds } },
                { $set: { read: true } }
            );

            console.log('Mark as read result:', result);
            return NextResponse.json({ message: 'Notifications marked as read successfully' }, { status: 200 });
        } else {
            console.log('Invalid action:', action);
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

// DELETE handler
export async function DELETE(req: NextRequest) {
    console.log('DELETE request received:', req.url);

    await connectDB();

    try {
        const { notificationIds } = await req.json();
        console.log('Request body:', { notificationIds });

        const result = await Notification.deleteMany({ _id: { $in: notificationIds } });
        console.log('Delete result:', result);

        return NextResponse.json({ message: 'Notifications deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Delete Notification API Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: (error as Error).message 
        }, { status: 500 });
    }
}
