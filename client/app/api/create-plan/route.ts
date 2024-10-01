"use server";

import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '../../_middleware/mongodb';
import mongoose from 'mongoose';
import { UserSchema, EventSchema, UserEventSchema } from '@/app/_models/schema';

interface PlanRequestBody {
  planName: string;
  selectedFriends: string[];
  selectedDate: string;
  selectedTime: string;
  selectedLocationPreference: string;
  creatorEmail: string;
}

async function posthandler(req: NextRequest) {
  if (req.method === 'POST') {
    const data: PlanRequestBody = await req.json();
    const { planName, selectedFriends, selectedDate, selectedTime, selectedLocationPreference, creatorEmail } = data;

    try {
      await connectToDatabase();
      const User = mongoose.models.User || mongoose.model('User', UserSchema);
      const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
      const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);

      // Validate input
      if (!planName || !selectedFriends || !selectedDate || !selectedTime || !selectedLocationPreference || !creatorEmail) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
      }

      // Find the creator user
      const creator = await User.findOne({ email: creatorEmail });
      if (!creator) {
        return NextResponse.json({ message: 'Creator not found' }, { status: 404 });
      }

      // Find selected friends
      const friends = await User.find({ _id: { $in: selectedFriends } });
      if (friends.length !== selectedFriends.length) {
        return NextResponse.json({ message: 'One or more selected friends not found' }, { status: 404 });
      }

      // Create the event
      const newEvent = new Event({
        eventName: planName,
        location: selectedLocationPreference,
        eventDate: new Date(`${selectedDate}T${selectedTime}`),
        attendees: [creator._id, ...friends.map(f => f._id)],
        type: 'Upcoming',
        creator: creator._id
      });

      const savedEvent = await newEvent.save();

      // Create UserEvent entries for all attendees
      const userEventPromises = [creator, ...friends].map(user => 
        new UserEvent({
          userId: user._id,
          eventId: savedEvent._id,
          status: user._id.equals(creator._id) ? 'Going' : 'Invited'
        }).save()
      );

      await Promise.all(userEventPromises);

      return NextResponse.json({ 
        message: 'Plan created successfully', 
        event: savedEvent 
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }
}

export { posthandler as POST }