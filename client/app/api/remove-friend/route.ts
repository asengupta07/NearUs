"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

interface RemoveFriendBody {
    userEmail: string;
    friendId: string;
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

    const { userEmail, friendId }: RemoveFriendBody = body;

    if (!userEmail || !friendId) {
        return NextResponse.json({ message: 'User email and friend ID are required' }, { status: 400 });
    }

    try {
        // Find the user
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if the friend exists
        const friend = await User.findById(friendId);

        if (!friend) {
            return NextResponse.json({ message: 'Friend not found' }, { status: 404 });
        }

        // Remove the friend relationship
        const result = await UserFriend.deleteMany({
            $or: [
                { userId: user._id, friendId: friend._id },
                { userId: friend._id, friendId: user._id }
            ]
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: 'Friend relationship not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Friend removed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Remove Friend API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export {
    handler as POST
}