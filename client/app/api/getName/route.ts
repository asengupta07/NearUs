import { UserSchema } from "@/app/_models/schema";
import connectToDatabase from "@/app/_middleware/mongodb";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    await connectToDatabase();
    const { email } = await request.json();
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const user = await User.findOne({ email });
    return NextResponse.json({ name: user?.username });
}