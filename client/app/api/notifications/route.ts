import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { Notification, User } from '@/app/_models/schema';

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

export async function POST(req: NextRequest) {
    await connectDB();

    try {
        const { recipient, type, sender, eventId, message } = await req.json();

        // Find the recipient user to get their _id
        const recipientUser = await User.findOne({ email: recipient });
        if (!recipientUser) {
            return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
        }

        // Find the sender user to get their _id
        const senderUser = await User.findOne({ email: sender });
        if (!senderUser) {
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