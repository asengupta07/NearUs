"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

// Fetch Pending Friend Requests
export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const pendingRequests = await UserFriend.find({
            friendId: user._id,
            status: 'Pending'
        }).populate('userId', 'username email');

        const formattedRequests = pendingRequests.map(request => ({
            id: request._id.toString(),
            sender: {
                id: request.userId._id.toString(),
                name: request.userId.username,
                username: request.userId.username,
                avatarUrl: `/api/avatar/${request.userId._id}`
            }
        }));

        return NextResponse.json(formattedRequests, { status: 200 });
    } catch (error) {
        console.error('Fetch Pending Requests API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle Single Friend Request (Accept or Reject)
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { email, requestId, action } = body;

    if (!email || !requestId || !action) {
        return NextResponse.json({ message: 'Email, requestId, and action are required' }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const friendRequest = await UserFriend.findOne({
            _id: requestId,
            friendId: user._id,
            status: 'Pending'
        });

        if (!friendRequest) {
            return NextResponse.json({ message: 'Friend request not found' }, { status: 404 });
        }

        if (action === 'accept') {
            friendRequest.status = 'Accepted';
            await friendRequest.save();

            // Create reverse friendship
            await UserFriend.create({
                userId: user._id,
                friendId: friendRequest.userId,
                status: 'Accepted'
            });

            return NextResponse.json({ message: 'Friend request accepted' }, { status: 200 });
        } else if (action === 'reject') {
            await friendRequest.deleteOne();
            return NextResponse.json({ message: 'Friend request rejected' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Handle Friend Request API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle All Friend Requests (Accept or Reject)
export async function PUT(req: NextRequest) {
    const body = await req.json();
    const { email, action } = body;

    if (!email || !action) {
        return NextResponse.json({ message: 'Email and action are required' }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (action === 'acceptAll') {
            const pendingRequests = await UserFriend.find({
                friendId: user._id,
                status: 'Pending'
            });

            for (const request of pendingRequests) {
                request.status = 'Accepted';
                await request.save();

                // Create reverse friendship
                await UserFriend.create({
                    userId: user._id,
                    friendId: request.userId,
                    status: 'Accepted'
                });
            }

            return NextResponse.json({ message: 'All friend requests accepted' }, { status: 200 });
        } else if (action === 'rejectAll') {
            await UserFriend.deleteMany({
                friendId: user._id,
                status: 'Pending'
            });

            return NextResponse.json({ message: 'All friend requests rejected' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Handle All Friend Requests API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}