'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { FaMapLocationDot } from "react-icons/fa6"
import { Bell, PlusCircle, Clock, Users, Menu, X } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Notification } from '@/types'

interface SignedInNavbarProps {
  notifications: Notification[]
}

export default function Navbar({ notifications }: SignedInNavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isGlass, setIsGlass] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            setIsGlass(window.scrollY > 10)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleProfileClick = () => {
        router.push('/profile')  // Add this function
    }

    const handleNotificationClick = () => {
        if (notifications.length === 0) {
            toast.info("No new notifications",
                {
                    duration: 2000,
                }
            )
            // setTimeout(() => toast.dismiss(), 2000)
        } else {
            toast(
                <div className="w-full">
                    <h3 className="font-bold text-lg mb-2">Notifications</h3>
                    <ul className="space-y-2">
                        {notifications.map((notification) => (
                            <li key={notification.id} className="text-sm">
                                {notification.message}
                            </li>
                        ))}
                    </ul>
                </div>,
                {
                    duration: 2000,
                }
            )
        }
    }

    return (
        <>
            <nav className={`fixed h-[10vh] top-0 left-0 right-0 z-50 px-6 py-2 transition-all duration-300 ease-in-out ${isGlass ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md' : 'bg-transparent'} shadow-md flex items-center`}>
                <div className="container flex items-center justify-between mx-auto">
                    <Link href="/dashboard" className="flex items-center space-x-4">
                        <FaMapLocationDot className="text-2xl text-purple-600" />
                        <span className="text-2xl font-bold text-gray-800 dark:text-white">
                            Near<span className="text-purple-600">Us</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/create">
                            <Button variant="ghost" className="flex items-center space-x-2">
                                <PlusCircle className="w-5 h-5" />
                                <span>New Plan</span>
                            </Button>
                        </Link>
                        <Link href="/events">
                            <Button variant="ghost" className="flex items-center space-x-2">
                                <Clock className="w-5 h-5" />
                                <span>Events</span>
                            </Button>
                        </Link>
                        <Link href="/friends">
                            <Button variant="ghost" className="flex items-center space-x-2">
                                <Users className="w-5 h-5" />
                                <span>Friends</span>
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            onClick={handleNotificationClick}
                        >
                            <Bell className="w-5 h-5" />
                        </Button>
                        <Button className="text-white bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600" onClick={handleProfileClick}>
                            Profile
                        </Button>
                    </div>
                    <div className="md:hidden">
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>
            </nav>
            <div 
                className={`fixed inset-0 z-40 bg-white dark:bg-gray-900 pt-[10vh] transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="container mx-auto px-6 py-8 space-y-6">
                    <Link href="/new-plan" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            New Plan
                        </Button>
                    </Link>
                    <Link href="/history" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                            <Clock className="w-5 h-5 mr-2" />
                            History
                        </Button>
                    </Link>
                    <Link href="/friends" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                            <Users className="w-5 h-5 mr-2" />
                            Friends
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            handleNotificationClick()
                            setIsMenuOpen(false)
                        }}
                        className="w-full justify-start"
                    >
                        <Bell className="w-5 h-5 mr-2" />
                        Notifications
                    </Button>
                    <Button 
                        className="w-full text-white bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600"
                        onClick={() => {
                            setIsMenuOpen(false)
                            handleProfileClick()  // Add this line
                        }}
                    >
                        Profile
                    </Button>
                </div>
            </div>
            <Toaster position="bottom-right" />
        </>
    )
}