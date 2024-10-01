"use server"

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';
import { ppid } from 'process';

const User = mongoose.models.User || mongoose.model('User', UserSchema);

interface SearchRequestBody {
    query: string;
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

    const { query }: SearchRequestBody = body;

    if (!query) {
        return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    try {
        const users = await User.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
        .select('_id username email')
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .lean();
        
        console.log(users);

        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: `/api/avatar/${user._id}`
        }));
        console.log(formattedUsers);
        return NextResponse.json(formattedUsers, { status: 200 });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export {
    handler as POST
}