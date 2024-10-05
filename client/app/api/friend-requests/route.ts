import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema, NotificationSchema } from '@/app/_models/schema';

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

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Fetch Pending Friend Requests
export async function GET(req: NextRequest) {
    await connectDB();
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
        }).populate('userId', 'username email avatarUrl');

        const formattedRequests = pendingRequests.map(request => ({
            id: request._id.toString(),
            sender: {
                id: request.userId._id.toString(),
                name: request.userId.username,
                username: request.userId.username,
                avatarUrl: request.userId.avatarUrl || ''
            }
        }));

        return NextResponse.json(formattedRequests, { status: 200 });
    } catch (error) {
        console.error('Fetch Pending Requests API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
    }
}

// Handle Single Friend Request (Accept or Reject)
export async function POST(req: NextRequest) {
    await connectDB();
    const body = await req.json();
    const { email, requestId, action, senderEmail, receiverId } = body;

    // Handle accepting or rejecting a friend request
    if (email && requestId && action) {
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
            }).populate('userId');
            if (!friendRequest) {
                return NextResponse.json({ message: 'Friend request not found' }, { status: 404 });
            }
            if (action === 'accept') {
                friendRequest.status = 'Accepted';
                await friendRequest.save();
                // Create reverse friendship
                await UserFriend.create({
                    userId: user._id,
                    friendId: friendRequest.userId._id,
                    status: 'Accepted'
                });
                // Create notification for the friend request sender
                const notification = new Notification({
                    recipient: friendRequest.userId._id,
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    sender: user._id,
                    message: `${user.username} accepted your friend request`,
                    read: false,
                    status: 'PENDING'
                });
                await notification.save();
                return NextResponse.json({ message: 'Friend request accepted' }, { status: 200 })
            } else if (action === 'reject') {
                await friendRequest.deleteOne();
                // Create notification for the friend request sender
                const notification = new Notification({
                    recipient: friendRequest.userId._id,
                    type: 'FRIEND_REQUEST_REJECTED',
                    sender: user._id,
                    message: `${user.username} rejected your friend request`,
                    read: false,
                    status: 'PENDING'
                });
                await notification.save();
                return NextResponse.json({ message: 'Friend request rejected' }, { status: 200 });
            } else {
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
            }
        } catch (error) {
            console.error('Handle Friend Request API Error:', error);
            return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
        }
    } 
    // Handle sending a new friend request
    else if (senderEmail && receiverId) {
        if (!senderEmail || !receiverId) {
            return NextResponse.json({ message: 'Sender email and receiver ID are required' }, { status: 400 });
        }
        try {
            const sender = await User.findOne({ email: senderEmail });
            if (!sender) {
                return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
            }
            const receiver = await User.findById(receiverId);
            if (!receiver) {
                return NextResponse.json({ message: 'Receiver not found' }, { status: 404 });
            }
            const existingRequest = await UserFriend.findOne({
                $or: [
                    { userId: sender._id, friendId: receiver._id },
                    { userId: receiver._id, friendId: sender._id }
                ]
            });
            if (existingRequest) {
                if (existingRequest.status === "Pending") {
                    return NextResponse.json(
                        { success: false, error: 'RequestAlreadyPending', message: 'A friend request is already pending with this user. Please wait for a response.' },
                        { status: 409 }
                    );
                }
            }
            // Create a new friend request
            const newFriendRequest = new UserFriend({
                userId: sender._id,
                friendId: receiver._id,
                status: 'Pending'
            });
            await newFriendRequest.save();
            // Create a NEW_FRIEND_REQUEST notification
            const notification = new Notification({
                recipient: receiver._id,
                type: 'NEW_FRIEND_REQUEST',
                sender: sender._id,
                message: `${sender.username} sent you a friend request`,
                read: false,
                status: 'PENDING'
            });
            await notification.save();
            return NextResponse.json({ message: 'Friend request sent successfully' }, { status: 200 });
        } catch (error) {
            console.error('Send Friend Request API Error:', error);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: 'Invalid request parameters' }, { status: 400 });
    }
}

// Handle All Friend Requests (Accept or Reject)
export async function PUT(req: NextRequest) {
    await connectDB();
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
            }).populate('userId');

            for (const request of pendingRequests) {
                request.status = 'Accepted';
                await request.save();

                // Create reverse friendship
                await UserFriend.create({
                    userId: user._id,
                    friendId: request.userId._id,
                    status: 'Accepted'
                });

                // Create notification for each friend request sender
                const notification = new Notification({
                    recipient: request.userId._id,
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    sender: user._id,
                    message: `${user.username} accepted your friend request`,
                    read: false,
                    status: 'PENDING'
                });

                try {
                    await notification.save();
                    console.log('Accepted friend request notification created:', notification);
                } catch (notificationError) {
                    console.error('Error creating notification:', notificationError);
                }
            }

            return NextResponse.json({ message: 'All friend requests accepted' }, { status: 200 });
        } else if (action === 'rejectAll') {
            const pendingRequests = await UserFriend.find({
                friendId: user._id,
                status: 'Pending'
            }).populate('userId');

            for (const request of pendingRequests) {
                await request.deleteOne();

                // Create notification for each friend request sender
                const notification = new Notification({
                    recipient: request.userId._id,
                    type: 'FRIEND_REQUEST_REJECTED',
                    sender: user._id,
                    message: `${user.username} rejected your friend request`,
                    read: false,
                    status: 'PENDING'
                });

                try {
                    await notification.save();
                    console.log('Rejected friend request notification created:', notification);
                } catch (notificationError) {
                    console.error('Error creating notification:', notificationError);
                }
            }

            return NextResponse.json({ message: 'All friend requests rejected' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Handle All Friend Requests API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
    }
}