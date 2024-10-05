import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/dbConnect'; // Make sure you have this utility
import { UserSchema, EventSchema, UserEventSchema, NotificationSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { invitationId, accept, email } = await req.json();

        // Validate input
        if (!invitationId || typeof accept !== 'boolean' || !email) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Find the invitation and populate event details
        const invitation = await UserEvent.findById(invitationId);
        if (!invitation) {
            return NextResponse.json(
                { message: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Find the event with populated creator
        const event = await Event.findById(invitation.eventId).populate('creator');
        if (!event) {
            return NextResponse.json(
                { message: 'Event not found' },
                { status: 404 }
            );
        }

        // Update the invitation status
        invitation.status = accept ? 'Going' : 'Not Going';
        await invitation.save();

        try {
            const notification = new Notification({
                recipient: event.creator._id,
                type: accept ? 'EVENT_INVITATION_ACCEPTED' : 'EVENT_INVITATION_DECLINED',
                sender: user._id,
                eventId: event._id,
                message: `${user.username} has ${accept ? 'accepted' : 'declined'} the invitation to ${event.eventName}`,
                read: false,
                status: 'PENDING'
            });
          
            await notification.save();
        } catch (err) {
            const error = err as Error;  // Cast 'err' to 'Error' type
            console.error('Notification creation error:', error);
            return NextResponse.json(
                { message: 'Error creating notification', error: error.message },
                { status: 500 }
            );
        }        

        if (accept) {
            // Get attending friends if accepted
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

            return NextResponse.json(updatedEvent);
        }

        return NextResponse.json({ 
            message: 'Invitation handled successfully',
            status: invitation.status 
        });

    } catch (error) {
        console.error('Error handling invitation:', error);
        
        // Improved error handling with more detailed messages
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
            
        return NextResponse.json(
            { 
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
            },
            { status: 500 }
        );
    }
}