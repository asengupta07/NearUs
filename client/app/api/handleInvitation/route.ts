import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

export async function POST(req: NextRequest) {
    try {
        const { invitationId, accept, email } = await req.json();

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Find the invitation
        const invitation = await UserEvent.findById(invitationId).populate('eventId');
        if (!invitation) {
            return NextResponse.json({ message: 'Invitation not found' }, { status: 404 });
        }

        // Update the invitation status
        invitation.status = accept ? 'Going' : 'Not Going';
        await invitation.save();

        if (accept) {
            // If accepting, return the event details
            const event = invitation.eventId;
            const attendingFriends = await UserEvent.find({
                eventId: event._id,
                status: 'Going',
                userId: { $ne: user._id }
            }).populate('userId', 'username');

            const updatedEvent = {
                id: event._id.toString(),
                title: event.eventName,
                location: event.location,
                date: event.eventDate.toISOString().split('T')[0],
                friends: attendingFriends.map(ue => ue.userId.username)
            };

            return NextResponse.json(updatedEvent, { status: 200 });
        } else {
            // If declining, just return a success message
            return NextResponse.json({ message: 'Invitation declined successfully' }, { status: 200 });
        }
    } catch (error) {
        console.error('Error handling invitation:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}