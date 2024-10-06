import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema, UserFriendSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Find all pending invitations for the user
        const pendingInvitations = await UserEvent.find({ 
            userId: user._id, 
            status: 'Invited'
        }).populate('eventId');

        // Prepare the response data
        const invitations = await Promise.all(pendingInvitations.map(async (invitation) => {
            const event = invitation.eventId;
            const creator = await User.findById(event.creator);
            const invitedFriends = await UserEvent.find({ 
                eventId: event._id, 
                status: 'Invited',
                userId: { $ne: user._id }
            }).populate('userId', 'username');

            return {
                id: invitation._id.toString(),
                title: event.eventName,
                location: event.location,
                date: event.eventDate.toISOString().split('T')[0],
                invitedBy: creator ? creator.username : 'Unknown',
                invitedFriends: invitedFriends.map(ue => ue.userId.username)
            };
        }));

        return NextResponse.json(invitations, { status: 200 });
    } catch (error) {
        console.error('Error fetching invitations data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}