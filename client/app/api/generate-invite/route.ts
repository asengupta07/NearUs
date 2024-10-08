import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { dbConnect } from '@/lib/dbConnect'
import { User, Invite } from '@/app/_models/schema'
import { authMiddleware } from '@/app/_middleware/authMiddleware'

export async function POST(req: NextRequest) {
    const requestId = nanoid(8); // Generate a unique request ID
    console.log(`[${requestId}] Generate invite request received`);

    try {
        await dbConnect()
        console.log(`[${requestId}] Database connected`);

        const userId = await authMiddleware(req);
        if (typeof userId !== 'string') {
            console.log(`[${requestId}] Authentication failed`);
            return userId;
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error(`[${requestId}] User not found for ID: ${userId}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const inviteCode = nanoid(10)
        console.log(`[${requestId}] Generated invite code: ${inviteCode}`);

        const invite = new Invite({
            code: inviteCode,
            createdBy: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })

        try {
            await invite.save()
            console.log(`[${requestId}] Invite saved successfully: ${invite.code}`);

            // Read-after-write check
            const savedInvite = await Invite.findOne({ code: inviteCode });
            if (savedInvite) {
                console.log(`[${requestId}] Invite verified in database: ${savedInvite.code}`);
            } else {
                console.error(`[${requestId}] Invite not found in database after save`);
                return NextResponse.json({ error: 'Failed to verify invite after save' }, { status: 500 })
            }
        } catch (saveError) {
            console.error(`[${requestId}] Error saving invite:`, saveError);
            return NextResponse.json({ error: 'Failed to save invite' }, { status: 500 })
        }

        console.log(`[${requestId}] Invite generation successful`);
        return NextResponse.json({ inviteCode: invite.code, requestId })
    } catch (error) {
        console.error(`[${requestId}] Error generating invite:`, error)
        return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 })
    }
}