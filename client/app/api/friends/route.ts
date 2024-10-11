import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, UserFriendSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    try {
        // Find the user
        const user = await User.findOne({ email }).select('username email location avatarUrl bio');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Get user's friends
        const userFriends = await UserFriend.find({
            userId: user._id,
            status: 'Accepted'
        }).populate('friendId', 'username email location avatarUrl bio');

        const friends = userFriends.map(uf => ({
            id: uf.friendId._id.toString(),
            username: uf.friendId.username,
            email: uf.friendId.email,
            avatarUrl: uf.friendId.avatarUrl || '',
            bio: uf.friendId.bio || '',
            location: {
                latitude: uf.friendId.location.coordinates[1],
                longitude: uf.friendId.location.coordinates[0],
                id: uf.friendId._id.toString()
            }
        }));

        const me = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl || '',
            bio: user.bio || '',
            location: {
                latitude: user.location.coordinates[1],
                longitude: user.location.coordinates[0],
            }
        }

        return NextResponse.json({friends, me}, { status: 200 });
    } catch (error) {
        console.error('Friends API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}