"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { toast } from 'sonner'
import LoadingState from '@/components/LoadingState/LoadingState'
import { useAuth } from '@/contexts/authContext'
import Navbar from '@/components/function/Nav'

interface PageProps {
    params: {
        code: string
    }
}

export default function JoinPage({ params }: PageProps) {
    const [isVerifying, setIsVerifying] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const router = useRouter()
    const { token } = useAuth()

    useEffect(() => {
        const checkInvite = async () => {
            if (!params.code) {
                toast.error('Invalid invite link')
                router.push('/')
                return
            }

            try {
                console.log('Checking invite code:', params.code)
                const response = await fetch(`/api/verify-invite?code=${params.code}`)
                const data = await response.json()
                
                console.log('Verification response:', data)

                if (!response.ok) {
                    throw new Error(data.error || 'Invalid invite code')
                }

                setIsValid(true)

                // If invite is valid but user is not logged in, store the code and redirect to auth page
                if (!token) {
                    sessionStorage.setItem('pendingInviteCode', params.code)
                    router.push(`/auth?returnUrl=/join/${params.code}`)
                }
            } catch (error) {
                console.error('Error verifying invite:', error)
                toast.error('Invalid or expired invite link')
                router.push('/')
            } finally {
                setIsVerifying(false)
            }
        }

        checkInvite()
    }, [params.code, token, router])

    const handleJoin = async () => {
        if (!token) {
            sessionStorage.setItem('pendingInviteCode', params.code)
            router.push(`/auth?returnUrl=/join/${params.code}`)
            return
        }

        try {
            const response = await fetch('/api/accept-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: params.code })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join')
            }

            toast.success('Successfully joined!')
            router.push('/dashboard')
        } catch (error) {
            console.error('Error accepting invite:', error)
            toast.error('Failed to join. Please try again.')
        }
    }

    if (isVerifying) {
        return <LoadingState message="Verifying invite code..." submessage="Please wait while we verify your invitation" />
    }

    if (!token) {
        return <LoadingState message="Redirecting to login..." submessage="Please log in to accept the invitation" />
    }

    if (isValid && token) {
        return (
            <>
                <Navbar notifications={[]} />
                <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
                    <div className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8 pt-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="bg-gray-900 border-none">
                                <CardHeader>
                                    <CardTitle className="text-3xl font-bold text-center">
                                        <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                                            Join NearUs
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <p className="text-center text-gray-400">
                                        You've been invited to join NearUs! Click below to accept the invitation.
                                    </p>
                                    <Button 
                                        onClick={handleJoin} 
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                    >
                                        Accept Invitation
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                    <BackgroundBeams className="opacity-100" />
                </div>
            </>
        )
    }

    return <LoadingState message="Something went wrong..." submessage="Please try again later" />
}
