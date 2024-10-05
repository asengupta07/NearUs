"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

interface SendRequestBody {
    senderEmail: string;
    receiverId: string;
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

    const { senderEmail, receiverId }: SendRequestBody = body;

    if (!senderEmail || !receiverId) {
        return NextResponse.json({ message: 'Sender email and receiver ID are required' }, { status: 400 });
    }

    try {
        // Find the sender
        const sender = await User.findOne({ email: senderEmail });

        if (!sender) {
            return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
        }

        // Check if the receiver exists
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return NextResponse.json({ message: 'Receiver not found' }, { status: 404 });
        }

        // Check if a friend request already exists
        const existingRequest = await UserFriend.findOne({
            $or: [
                { userId: sender._id, friendId: receiver._id },
                { userId: receiver._id, friendId: sender._id }
            ]
        });
        console.log("Checking for existing request...");

        if (existingRequest) {
            console.log("ExistingRequest found:", existingRequest);
            if (existingRequest.status === "Pending") {
                return NextResponse.json(
                    { 
                        success: false,
                        error: 'RequestAlreadyPending',
                        message: 'A friend request is already pending with this user. Please wait for a response.'
                    },
                    { status: 409 }
                );
            }
        } else {
            console.log("No existing request found.");
        }

        // Create a new friend request
        const newFriendRequest = new UserFriend({
            userId: sender._id,
            friendId: receiver._id,
            status: 'Pending'
        });

        await newFriendRequest.save();

        return NextResponse.json({ message: 'Friend request sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Send Friend Request API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export {
    handler as POST
}