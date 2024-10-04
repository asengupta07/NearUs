import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';
import connectToDatabase from '../../_middleware/mongodb';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        console.log('Connecting to database...');
        await connectToDatabase();
        console.log('Connected to database successfully');

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const contentType = request.headers.get('content-type') || '';
        console.log('Content-Type:', contentType);
        
        if (contentType.includes('application/json')) {
            const data = await request.json();
            console.log('Received JSON data:', data);

            const { email, location, ...updates } = data;

            if (!email) {
                console.log('Email not provided');
                return NextResponse.json({ message: 'Email not provided' }, { status: 400 });
            }

            const updateData: any = {};
            for (const [key, value] of Object.entries(updates)) {
                if (value !== undefined) {
                    updateData[key] = value;
                }
            }

            // Handle location update
            if (location) {
                const [longitude, latitude] = location.split(',').map(Number);
                updateData.location = {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                };
            }

            console.log('Updating user:', email);
            console.log('Update data:', updateData);

            // Debug: Log user before update
            console.log('User before update:', await User.findOne({ email }));

            // Try updateOne instead of findOneAndUpdate
            const updateResult = await User.updateOne(
                { email },
                { $set: updateData }
            );

            console.log('Update result:', updateResult);

            // Fetch the updated user
            let updatedUser = await User.findOne({ email }).select('-password');
            console.log('Updated user:', updatedUser);

            // If still not working, try this alternative approach
            if (!updatedUser || (updateData.bio && !updatedUser.bio)) {
                const user = await User.findOne({ email });
                if (user) {
                    Object.assign(user, updateData);
                    await user.save();
                    console.log('User after save:', user);
                    updatedUser = user;
                }
            }

            if (!updatedUser) {
                console.log('User not found:', email);
                return NextResponse.json({ message: 'User not found' }, { status: 400 });
            }

            const friendCount = updatedUser.friends ? updatedUser.friends.length : 0;

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
            console.log('User updated successfully:', response);
            return NextResponse.json(response, { status: 200 });
        } 
        else if (contentType.includes('multipart/form-data')) {
            console.log('Processing multipart form data');
            // Handle multipart form data (file uploads)
            const formData = await request.formData();
            const email = formData.get('email') as string;
            const avatarFile = formData.get('avatar') as File | null;

            if (!email) {
                console.log('Email not provided');
                return NextResponse.json({ message: 'Email not provided' }, { status: 400 });
            }

            if (!avatarFile) {
                console.log('No file provided');
                return NextResponse.json({ message: 'No file provided' }, { status: 400 });
            }

            // Convert File to base64
            const arrayBuffer = await avatarFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64String = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;

            console.log('Uploading to Cloudinary...');
            // Upload to Cloudinary
            const result = await cloudinary.v2.uploader.upload(base64String, {
                folder: 'avatars',
            });
            console.log('Uploaded to Cloudinary:', result.secure_url);

            console.log('Updating user with new avatar URL:', email);
            const user = await User.findOneAndUpdate(
                { email },
                { avatarUrl: result.secure_url },
                { new: true }
            );

            if (!user) {
                console.log('User not found:', email);
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            console.log('Avatar updated successfully');
            return NextResponse.json({ avatarUrl: result.secure_url }, { status: 200 });
        } else {
            console.log('Unsupported content type:', contentType);
            return NextResponse.json(
                { message: 'Unsupported content type' }, 
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}