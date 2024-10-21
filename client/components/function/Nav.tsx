'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { FaMapLocationDot } from "react-icons/fa6"
import { Bell, PlusCircle, Clock, Users, Menu, X } from 'lucide-react'
import { Toaster } from 'sonner'
import { Notification } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { IoChatbubblesOutline } from "react-icons/io5"
import NotificationsModal from '@/components/function/NotificationsModal'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SignedInNavbarProps {
    notifications?: Notification[]
}

export default function Navbar({
    notifications: initialNotifications = [],
}: SignedInNavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isGlass, setIsGlass] = useState(false)
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)
    const [notifications, setNotifications] = useState(initialNotifications)
    const router = useRouter()

    useEffect(() => {
        setNotifications(initialNotifications)
    }, [initialNotifications])

    useEffect(() => {
        const handleScroll = () => {
            setIsGlass(window.scrollY > 10)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleProfileClick = () => {
        router.push('/profile')
    }

    const handleNotificationClick = () => {
        setIsNotificationsModalOpen(true)
    }


    const unreadNotificationsCount = notifications.length

    const navItems = [
        { href: "/chat", icon: IoChatbubblesOutline, label: "Chat" },
        { href: "/create", icon: PlusCircle, label: "New Plan" },
        { href: "/events", icon: Clock, label: "Events" },
        { href: "/friends", icon: Users, label: "Friends" },
    ]

    return (
        <>
            <motion.nav
                className={`fixed h-[10vh] top-0 left-0 right-0 z-50 px-6 py-2 transition-all duration-300 ease-in-out ${isGlass ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md' : 'bg-transparent'
                    } shadow-md flex items-center`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className="container flex items-center justify-between mx-auto">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link href="/dashboard" className="flex items-center space-x-4">
                            <FaMapLocationDot className="text-2xl text-purple-600" />
                            <span className="text-2xl font-bold text-gray-800 dark:text-white">
                                Near<span className="text-purple-600">Us</span>
                            </span>
                        </Link>
                    </motion.div>
                    <div className="hidden md:flex items-center space-x-6">
                        {navItems.map((item) => (
                            <motion.div
                                key={item.href}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link href={item.href}>
                                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-transparent">
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Button>
                                </Link>
                            </motion.div>
                        ))}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                variant="ghost"
                                onClick={handleNotificationClick}
                                className="relative hover:bg-transparent"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                        {unreadNotificationsCount}
                                    </span>
                                )}

                            </Button>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                className="relative overflow-hidden group px-4 py-2"
                                onClick={handleProfileClick}
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 opacity-75 transition-all duration-300 ease-out group-hover:opacity-100" />
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 opacity-0 transition-all duration-300 ease-out group-hover:opacity-75" />
                                <span className="relative z-10 text-white text-sm font-semibold transition-all duration-300 ease-out group-hover:text-cyan-200">
                                    Profile
                                </span>
                                <span className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-shimmer" />
                            </Button>
                        </motion.div>
                    </div>
                    <div className="md:hidden">
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} className="hover:bg-transparent">
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>
            </motion.nav>
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-white dark:bg-gray-900 pt-10"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="container mx-auto px-4 py-8 space-y-6">
                            {navItems.map((item) => (
                                <motion.div
                                    key={item.href}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start hover:bg-transparent">
                                            <item.icon className="w-5 h-5 mr-2" />
                                            &nbsp;&nbsp;{item.label}
                                        </Button>
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleNotificationClick}
                                    className="relative hover:bg-transparent"
                                >
                                    <span className="relative inline-flex">
                                        <Bell className="w-5 h-5" />
                                        {unreadNotificationsCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                {unreadNotificationsCount}
                                            </span>
                                        )}
                                    </span>
                                    <span>&nbsp;&nbsp;&nbsp;&nbsp;Notifications</span>
                                </Button>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    className="w-full relative overflow-hidden group px-4 py-2"
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        handleProfileClick()
                                    }}
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 opacity-75 transition-all duration-300 ease-out group-hover:opacity-100" />
                                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900 opacity-0 transition-all duration-300 ease-out group-hover:opacity-75" />
                                    <span className="relative z-10 text-white text-sm font-semibold transition-all duration-300 ease-out group-hover:text-cyan-200">
                                        Profile
                                    </span>
                                    <span className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-shimmer" />
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <NotificationsModal
                isOpen={isNotificationsModalOpen}
                onClose={() => setIsNotificationsModalOpen(false)}
                notifications={notifications}
            />
            <Toaster position="bottom-right" />
        </>
    )
}