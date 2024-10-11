"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';

const User = mongoose.models.User || mongoose.model('User', UserSchema);

interface SearchRequestBody {
    query: string;
    currentUserEmail: string;  // Added this field
}

async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    let body;
    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const { query, currentUserEmail }: SearchRequestBody = body;

    if (!query) {
        return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    if (!currentUserEmail) {
        return NextResponse.json({ message: 'Current user email is required' }, { status: 400 });
    }

    try {
        // Modified query to exclude the current user
        const users = await User.find({
            $and: [
                { $text: { $search: query } },
                { email: { $ne: currentUserEmail } }  // Exclude current user
            ]
        }, {
            score: { $meta: 'textScore' }
        })
        .select('_id username email avatarUrl')
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .lean();
        
        console.log('Found users:', users);

        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl || ''
        }));
        
        console.log('Formatted users:', formattedUsers);
        return NextResponse.json(formattedUsers, { status: 200 });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export {
    handler as POST
}