"use server";

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema,UserFriendSchema} from '@/app/_models/schema';

// Initialize the User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);

export async function POST(request: Request) {
    try {
        const data = await request.json();
        console.log('Received JSON data:', JSON.stringify(data, null, 2));

        const { email, location, avatarUrl, ...updates } = data;

        // Validate email input
        if (!email) {
            console.log('Email not provided');
            return NextResponse.json({ message: 'Email not provided' }, { status: 400 });
        }

        // Prepare update data
        const updateData: any = { ...updates };

        if (avatarUrl !== undefined) {
            updateData.avatarUrl = avatarUrl;
        } 

        // Handle location update
        if (location) {
            const [latitude, longitude] = location.split(',').map(Number);
            updateData.location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
        }

        // Remove any undefined values from the update data
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // Updating user with new data
        const updatedUser = await User.findOneAndUpdate(
            { email },  
            {
                $set: updateData 
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Check if the user was found and updated
        if (!updatedUser) {
            console.log('User not found:', email);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Prepare the response
        const friendCount = await UserFriend.countDocuments({
            userId: updatedUser._id,
            status: 'Accepted'
        });

        const response = {
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio || '',
            location: updatedUser.location?.coordinates 
                ? `${updatedUser.location.coordinates[1]}, ${updatedUser.location.coordinates[0]}` 
                : '',
            avatarUrl: updatedUser.avatarUrl || '',
            friendCount
        };

        console.log('User updated successfully:', JSON.stringify(response, null, 2));
        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
