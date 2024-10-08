import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/dbConnect'
import { Invite } from '@/app/_models/schema'
import { nanoid } from 'nanoid'

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface InviteDocument {
    code: string;
    expiresAt?: Date;
    isUsed?: boolean;
    // Add other fields as necessary
}

function isInviteDocument(obj: any): obj is InviteDocument {
    return obj && typeof obj.code === 'string';
}

async function findInvite(code: string, requestId: string): Promise<{ status: string; invite?: InviteDocument } | null> {
    console.log(`[${requestId}] Searching for invite with code: ${code}`);
    const invite = await Invite.findOne({ code }).lean();

    if (invite && isInviteDocument(invite)) {
        console.log(`[${requestId}] Invite found:`, invite);
        
        // Check if the invite is expired
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            console.log(`[${requestId}] Invite is expired`);
            return { status: 'expired', invite };
        }
        
        // Check if the invite is already used (if you have an isUsed field)
        if (invite.isUsed) {
            console.log(`[${requestId}] Invite is already used`);
            return { status: 'used', invite };
        }
        
        return { status: 'valid', invite };
    } else {
        console.log(`[${requestId}] Invite not found`);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const requestId = nanoid(8);
    console.log(`[${requestId}] Verify invite API route hit`);
    
    try {
        await dbConnect()
        console.log(`[${requestId}] Database connected`);
        
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        
        console.log(`[${requestId}] Received code: ${code}`);

        if (!code) {
            console.log(`[${requestId}] No invite code provided`);
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
        }

        let inviteResult = null;
        let retries = 0;

        while (!inviteResult && retries < MAX_RETRIES) {
            inviteResult = await findInvite(code, requestId);
            if (!inviteResult) {
                console.log(`[${requestId}] Invite not found, retry ${retries + 1} of ${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                retries++;
            }
        }

        if (!inviteResult) {
            console.log(`[${requestId}] Invite not found after all retries. Performing direct database query.`);
            
            // Direct database query for debugging
            const allInvites = await Invite.find({}).lean();
            console.log(`[${requestId}] All invites in database:`, allInvites);

            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
        }

        switch (inviteResult.status) {
            case 'valid':
                console.log(`[${requestId}] Invite verification successful`);
                return NextResponse.json({ valid: true, invite: inviteResult.invite, requestId })
            case 'expired':
                console.log(`[${requestId}] Invite is expired`);
                return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 })
            case 'used':
                console.log(`[${requestId}] Invite is already used`);
                return NextResponse.json({ error: 'Invite code has already been used' }, { status: 409 })
            default:
                console.log(`[${requestId}] Unexpected invite status`);
                return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
        }
    } catch (error) {
        console.error(`[${requestId}] Error in verify-invite:`, error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}