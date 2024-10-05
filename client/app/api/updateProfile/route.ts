import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '../../_middleware/mongodb';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const updatedProfile = await req.json();

        // Verify the user's token
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ message: 'No token provided' }, { status: 401 });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, secretKey) as { userId: string };
        } catch (error) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const user = await User.findById(decodedToken.userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Update allowed fields
        const allowedFields = ['name', 'bio', 'location', 'website', 'avatar', 'coverPhoto', 'interests'];
        allowedFields.forEach(field => {
            if (updatedProfile[field] !== undefined) {
                if (field === 'name') {
                    user.username = updatedProfile[field];
                } else if (field === 'location') {
                    const [latitude, longitude] = updatedProfile[field].split(',').map(Number);
                    user.location = {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    };
                } else {
                    user[field] = updatedProfile[field];
                }
            }
        });

        await user.save();

        const updatedProfileResponse = {
            id: user._id,
            name: user.username,
            email: user.email,
            avatar: user.avatar || '',
            coverPhoto: user.coverPhoto || '',
            bio: user.bio || '',
            location: user.location ? `${user.location.coordinates[1]}, ${user.location.coordinates[0]}` : '',
            website: user.website || '',
            joinDate: user.createdAt.toISOString().split('T')[0],
            friends: user.friends || [],
            interests: user.interests || []
        };

        return NextResponse.json(updatedProfileResponse, { status: 200 });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}