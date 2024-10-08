import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/dbConnect'
import { User, Invite } from '@/app/_models/schema'
import { authMiddleware } from '@/app/_middleware/authMiddleware'

export async function POST(req: NextRequest) {
    try {
        await dbConnect()
        const userId = await authMiddleware(req)
        if (typeof userId !== 'string') {
            return userId
        }
        const { code } = await req.json()

        if (!code) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
        }
        const invite = await Invite.findOne({
            code,
            expiresAt: { $gt: new Date() },
            isUsed: false
        })
        if (!invite) {
            return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
        }
        invite.isUsed = true
        invite.usedBy = userId
        invite.usedAt = new Date()
        await invite.save()
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error accepting invite:', error)
        return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
    }
}