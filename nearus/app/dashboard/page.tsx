'use client'

import { motion } from 'framer-motion'
import { Bell, Calendar, Clock, Home, MapPin, Plus, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from 'sonner'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import Link from 'next/link'

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

export default function Dashboard() {
    const upcomingEvents = [
        { id: 1, title: 'Coffee Meetup', location: 'Starbucks', date: '2023-06-15', friends: ['Alice', 'Bob'] },
        { id: 2, title: 'Movie Night', location: 'Cinema City', date: '2023-06-18', friends: ['Charlie', 'David', 'Eve'] },
        { id: 3, title: 'Dinner Party', location: 'Italian Restaurant', date: '2023-06-01', friends: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'] },
        { id: 4, title: 'Board Game Night', location: 'Game Cafe', date: '2023-05-25', friends: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'] },
        // Add more events here to test scrolling
    ]

    const pastEvents = [
        { id: 3, title: 'Dinner Party', location: 'Italian Restaurant', date: '2023-06-01' },
        { id: 4, title: 'Board Game Night', location: 'Game Cafe', date: '2023-05-25' },
        { id: 5, title: 'Hiking Trip', location: 'Mountain Trail', date: '2023-05-20' },
        { id: 6, title: 'Beach Day', location: 'Sunny Beach', date: '2023-05-15' },
        { id: 7, title: 'Picnic in the Park', location: 'Central Park', date: '2023-05-10' },
        { id: 8, title: 'Karaoke Night', location: 'Karaoke Bar', date: '2023-05-05' },
        // Add more past events here to test scrolling
    ]

    const friends = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Hannah', 'Isaac', 'Jack']

    const notifications = [
        { id: 1, message: "John invited you to a new plan" },
        { id: 2, message: "Your friend Sarah is nearby" },
        { id: 3, message: "New event happening in your area" }
    ]

    return (
        <div className='overflow-hidden'>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={notifications} />
            <div className="relative min-h-[90vh] pt-20 lg:pt-10 lg:max-h-[100vh] w-full overflow-hidden bg-gray-950 text-white">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-20 max-w-7xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8"
                >
                    {/* Main Content */}
                    <main className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6 flex flex-col">
                            {/* Welcome Message and Start Planning Button */}
                            <Card className="flex-shrink-0 bg-gray-900 border-none">
                                <CardContent className="pt-6">
                                    <h2 className="text-3xl font-bold mb-4">
                                        <span className={cn(
                                            "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                                            "animate-text-gradient"
                                        )}>
                                            Welcome back, User!
                                        </span>
                                    </h2>
                                    <p className="text-gray-300 mb-6">Ready to plan your next meetup?</p>
                                    <Link href="/create">
                                    <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                            Start Planning <Plus className="ml-2 h-5 w-5" />
                                        </span>
                                    </button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Upcoming Events Section */}
                            <Card className="flex-grow bg-gray-900 border-none">
                                <CardHeader className='p-0 px-6 pt-6 pb-2'>
                                    <CardTitle className="text-white">Upcoming Events</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar p-0 pt-3 px-6 pb-3">
                                    <motion.ul className="space-y-4">
                                        {upcomingEvents.map((event, index) => (
                                            <motion.li
                                                key={event.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-white">{event.title}</h3>
                                                    <p className="text-sm text-gray-300">
                                                        <MapPin className="inline mr-1 h-4 w-4" /> {event.location}
                                                    </p>
                                                    <p className="text-sm text-gray-300">
                                                        <Calendar className="inline mr-1 h-4 w-4" /> {event.date}
                                                    </p>
                                                </div>
                                                <div className="flex -space-x-2">
                                                    {event.friends.map((friend, i) => (
                                                        <Avatar key={i} className="border-2 border-gray-800">
                                                            <AvatarFallback>{friend[0]}</AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                </div>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6 flex flex-col">
                            {/* Friends List */}
                            <Card className="flex-grow bg-gray-900 border-none">
                                <CardHeader>
                                    <CardTitle className="text-white">Friends</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar">
                                    <ul className="space-y-2">
                                        {friends.map((friend, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="flex items-center space-x-2"
                                            >
                                                <Avatar>
                                                    <AvatarFallback>{friend[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-gray-300">{friend}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            {/* Past Events Section */}
                            <Card className="flex-shrink-0 bg-gray-900 border-none">
                                <CardHeader>
                                    <CardTitle className="text-white">Past Events</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-500px)] overflow-y-auto custom-scrollbar">
                                    <ul className="space-y-2">
                                        {pastEvents.map((event) => (
                                            <li key={event.id} className="flex justify-between items-center">
                                                <span className="text-gray-300">{event.title}</span>
                                                <span className="text-sm text-gray-400">{event.date}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </motion.div>
                <BackgroundBeams className="opacity-100" />
            </div>
        </div>
    )
}