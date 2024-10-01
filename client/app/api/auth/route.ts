"use server";

import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '../../_middleware/mongodb';
import mongoose from 'mongoose';
import { UserSchema } from '@/app/_models/schema';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET as string;

interface UserRequestBody {
  email?: string;
  password: string;
  username?: string;
  confirmPassword?: string;
  identifier?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

async function posthandler(req: NextRequest) {
  if (req.method === 'POST') {
    const data: UserRequestBody = await req.json();
    const { email, password, username, confirmPassword, identifier, location } = data;

    try {
      await connectToDatabase();
      const User = mongoose.models.User || mongoose.model('User', UserSchema);

      // Login
      if (identifier) {
        if (!password || !location) {
          return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const user = await User.findOne({
          $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const isMatch = await compare(password, user.password);
        if (!isMatch) {
          return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
        }

        // Update user's location
        user.location = {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        };
        await user.save();

        const token = jwt.sign({ userId: user._id }, secretKey);
        return NextResponse.json({ 
          token, 
          userId: user._id, 
          email: user.email, 
          username: user.username 
        }, { status: 200 });
      } 
      // Signup
      else {
        if (!email || !password || !username || !confirmPassword || !location) {
          return NextResponse.json({ message: 'Please fill all fields' }, { status: 400 });
        }
        
        if (password !== confirmPassword) {
          return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
          return NextResponse.json({ message: 'User with this email or username already exists' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);
        const newUser = new User({
          email,
          password: hashedPassword,
          username,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        });
        
        await newUser.save();
        
        const token = jwt.sign({ userId: newUser._id }, secretKey);
        return NextResponse.json({ 
          token, 
          userId: newUser._id, 
          email: newUser.email, 
          username: newUser.username 
        }, { status: 201 });
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }
}

export { posthandler as POST }