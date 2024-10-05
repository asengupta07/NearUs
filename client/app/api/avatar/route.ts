import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/app/_middleware/mongodb';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryError {
    message: string;
    name: string;
    http_code?: number;
}

export async function POST(request: Request) {
    console.log('Received avatar upload request');
    try {
        // Connect to database
        await connectToDatabase();
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Process form data
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const avatarFile = formData.get('avatar') as File | null;

        console.log('Received form data:', { email, avatarFile: avatarFile ? avatarFile.name : 'No file' });

        // Validate inputs
        if (!email || !avatarFile) {
            console.log('Missing email or avatar file');
            return NextResponse.json(
                { message: 'Email and avatar file are required' }, 
                { status: 400 }
            );
        }

        // Check file size (5MB limit)
        if (avatarFile.size > 5 * 1024 * 1024) {
            console.log('File size exceeds limit');
            return NextResponse.json(
                { message: 'File size must be less than 5MB' }, 
                { status: 400 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64String = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;

        try {
            console.log('Uploading to Cloudinary...');
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(base64String, {
                folder: 'avatars',
                transformation: [
                    { width: 400, height: 400, crop: 'fill' },
                    { quality: 'auto:good' }
                ]
            });

            console.log('Cloudinary upload successful:', result.secure_url);

            // Update user in database
            console.log('Updating user in database...');
            const user = await User.findOneAndUpdate(
                { email },
                { 
                    $set: { 
                        avatarUrl: result.secure_url,
                        updatedAt: new Date() 
                    } 
                },
                { new: true }
            ).select('avatarUrl email username');

            if (!user) {
                console.log('User not found:', email);
                return NextResponse.json(
                    { message: 'User not found' }, 
                    { status: 404 }
                );
            }

            console.log('User updated successfully:', user);

            return NextResponse.json({
                success: true,
                avatarUrl: result.secure_url,
                message: 'Avatar updated successfully'
            });

        } catch (error) {
            const cloudinaryError = error as CloudinaryError;
            console.error('Cloudinary upload error:', cloudinaryError);
            return NextResponse.json({
                message: 'Failed to upload image',
                error: cloudinaryError.message
            }, { status: 500 });
        }

    } catch (error) {
        const serverError = error as Error;
        console.error('Server error:', serverError);
        return NextResponse.json({
            message: 'Internal server error',
            error: serverError.message
        }, { status: 500 });
    }
}