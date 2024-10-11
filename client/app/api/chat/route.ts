// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/app/_models/schema';
import { dbConnect } from '@/lib/dbConnect';
import { verifyToken } from '@/app/_middleware/auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const authResult = verifyToken(token);
    
    if (authResult.error || !authResult.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const currentUserId = authResult.userId;
    const recipientId = req.nextUrl.searchParams.get('recipientId');

    if (!recipientId) {
      return NextResponse.json({ error: 'Missing recipientId parameter' }, { status: 400 });
    }

    await dbConnect();
    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
    .sort({ timestamp: 1 })
    .limit(50)
    .lean(); // Use lean() for better performance

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { recipientId, content } = await req.json();
    
    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    await dbConnect();
    
    const newMessage = new ChatMessage({
      sender: authResult.userId,
      recipient: recipientId,
      content,
      timestamp: new Date()
    });

    await newMessage.save();

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}