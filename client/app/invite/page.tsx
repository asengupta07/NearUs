'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import { toast } from 'sonner'
import LoadingState from '@/components/LoadingState/LoadingState'
import { useAuth } from '@/contexts/authContext'

export default function InvitePage() {
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isGeneratingLink, setIsGeneratingLink] = useState(false)
    const [inviteLink, setInviteLink] = useState('')
    const [isCopied, setIsCopied] = useState(false)
    const router = useRouter()
    const { token } = useAuth()

    useEffect(() => {
        if (!token) {
            toast.error('Please log in to access this page')
            router.push('/login')
        } else {
            setIsPageLoading(false)
        }
    }, [token, router])

    const generateInviteLink = async () => {
        setIsGeneratingLink(true)
        try {
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }
    
            const response = await fetch('/api/generate-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
    
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login')
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error('Failed to generate invite link');
            }
    
            const data = await response.json();
            setInviteLink(`${window.location.origin}/join/${data.inviteCode}`);
        } catch (error) {
            console.error('Error generating invite link:', error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        setIsCopied(true)
        toast.success('Invite link copied to clipboard!')
        setTimeout(() => setIsCopied(false), 3000)
    }

    const shareToWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join me on NearUs! Here's your invite link: ${inviteLink}`)}`
        window.open(whatsappUrl, '_blank')
    }

    if (isPageLoading) {
        return <LoadingState message="Loading invite page..." submessage="Preparing to connect you with friends" />
    }

    if (isGeneratingLink) {
        return <LoadingState message="Generating invite link..." submessage="Preparing a unique invitation for your friends" />
    }

    return (
        <>
            <Navbar notifications={[]} />
            <div className="relative min-h-screen pt-16 w-full overflow-hidden bg-gray-950 text-white">
                <div className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="bg-gray-900 border-none">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold text-center">
                                    <span className={cn(
                                        "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent",
                                        "animate-text-gradient"
                                    )}>
                                        Invite Your Friends
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-center text-gray-400">
                                    Generate a unique invite link and share it with your friends to join NearUs!
                                </p>
                                {!inviteLink ? (
                                    <Button 
                                        onClick={generateInviteLink} 
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Generate Invite Link
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Input 
                                                value={inviteLink} 
                                                readOnly 
                                                className="bg-gray-800 text-white border-gray-700"
                                            />
                                            <Button onClick={copyToClipboard} variant="outline">
                                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={shareToWhatsApp} 
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            Share on WhatsApp
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                <BackgroundBeams className="opacity-100" />
            </div>
        </>
    )
}