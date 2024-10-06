"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema, NotificationSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

interface RemoveFriendBody {
    userEmail: string;
    friendId: string;
}

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

async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ success: false, message: 'Method Not Allowed' }, { status: 405 });
    }

    await connectDB();

    let body;
    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const { userEmail, friendId }: RemoveFriendBody = body;

    if (!userEmail || !friendId) {
        return NextResponse.json({ success: false, message: 'User email and friend ID are required' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findOne({ email: userEmail }).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        const friend = await User.findById(friendId).session(session);
        if (!friend) {
            throw new Error('Friend not found');
        }

        const result = await UserFriend.deleteMany({
            $or: [
                { userId: user._id, friendId: friend._id },
                { userId: friend._id, friendId: user._id }
            ]
        }).session(session);

        if (result.deletedCount === 0) {
            throw new Error('Friend relationship not found');
        }

        const [notificationForUser, notificationForFriend] = await Promise.all([
            new Notification({
                recipient: user._id,
                type: 'FRIEND_REMOVED',
                sender: friend._id,
                message: `You are no longer friends with ${friend.username}`,
                read: false,
                status: 'SENT'
            }).save({ session }),
            new Notification({
                recipient: friend._id,
                type: 'FRIEND_REMOVED',
                sender: user._id,
                message: `You are no longer friends with ${user.username}`,
                read: false,
                status: 'SENT'
            }).save({ session })
        ]);

        await session.commitTransaction();
        session.endSession();

        console.log(`Friend removed successfully. User: ${userEmail}, Friend: ${friendId}`);
        return NextResponse.json({ success: true, message: 'Friend removed successfully' }, { status: 200 });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error('Remove Friend API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}

export {
    handler as POST
}