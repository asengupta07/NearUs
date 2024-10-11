// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/app/_models/schema';
import { dbConnect } from '@/lib/dbConnect';
import { verifyToken } from '@/app/_middleware/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const authResult = verifyToken(token);
    
    if (authResult.error || !authResult.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById(params.userId)
      .select('username avatarUrl')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in user API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}