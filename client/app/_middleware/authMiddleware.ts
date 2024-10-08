// app/_middleware/authMiddleware.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const secretKey = process.env.JWT_SECRET as string

export async function authMiddleware(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1]

        // If no token is provided
        if (!token) {
            console.log('No token provided') // Debug log
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        // Verify the token
        try {
            const decoded = jwt.verify(token, secretKey) as { userId: string }
            console.log('Token verified, userId:', decoded.userId) // Debug log
            return decoded.userId
        } catch (error) {
            console.error('Token verification failed:', error) // Debug log
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }
    } catch (error) {
        console.error('Auth middleware error:', error) // Debug log
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
}

// Helper function to verify token without throwing
export function verifyToken(token: string): { valid: boolean; userId?: string } {
    try {
        const decoded = jwt.verify(token, secretKey) as { userId: string }
        return { valid: true, userId: decoded.userId }
    } catch {
        return { valid: false }
    }
}