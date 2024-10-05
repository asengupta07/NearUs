'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Clock, UserPlus, MapPin, Plus } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from 'sonner'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import Link from 'next/link'
import { useAuth } from '@/contexts/authContext'
import { Notification, DashboardData } from '@/types'

interface Event {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: string[];
}

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

const Dashboard: React.FC = () => {
    const { email } = useAuth();
    const [data, setData] = useState<DashboardData>({ 
        upcomingEvents: [], 
        pastEvents: [], 
        friends: [],
        notifications: []
    });

    const fetchDashboardData = () => {
        if (email) {
            console.log('Fetching dashboard data for email:', email);
            fetch(`/api/dashboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })
            .then((res) => {
                console.log('Response status:', res.status);
                return res.json();
            })
            .then((dashboardData: DashboardData) => {
                console.log('Received dashboard data:', dashboardData);
                console.log('Notifications count:', dashboardData.notifications?.length);
                setData(dashboardData);
            })
            .catch((error) => {
                console.error('Failed to fetch user data', error);
            });
        } else {
            console.log('No email available');
        }
    };

    const markNotificationsAsRead = async (notificationIds: string[]) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationIds,
                    action: 'markAsRead'
                })
            });
            if (!response.ok) {
                throw new Error('Failed to update notifications');
            }
            fetchDashboardData();
        } catch (error) {
            console.error('Error updating notifications:', error);
            toast.error('Failed to update notifications');
        }
    };

    const deleteNotifications = async (notificationIds: string[]) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationIds
                })
            });
            if (!response.ok) {
                throw new Error('Failed to delete notifications');
            }
            fetchDashboardData();
        } catch (error) {
            console.error('Error deleting notifications:', error);
            toast.error('Failed to delete notifications');
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [email]);

    useEffect(() => {
        if (data.notifications && data.notifications.length > 0) {
            const unreadIds = data.notifications
                .filter(notif => !notif.read)
                .map(notif => notif.id);
                
            if (unreadIds.length > 0) {
                markNotificationsAsRead(unreadIds);
            }
        }
    }, [data.notifications]);

    const createTestNotification = () => {
        fetch('/api/test-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Test notification created:', data);
            toast.success('Test notification created');
            fetchDashboardData();
        })
        .catch(error => {
            console.error('Error creating test notification:', error);
            toast.error(`Failed to create test notification: ${error.message}`);
        });
    };

    const renderNotificationIcon = (type: string) => {
        switch (type) {
          case 'FRIEND_REQUEST_ACCEPTED':
          case 'FRIEND_REQUEST_REJECTED':
          case 'NEW_FRIEND_REQUEST':
            return <UserPlus className="h-5 w-5" />;
          case 'EVENT_CREATED':
          case 'EVENT_INVITATION':
          case 'EVENT_UPDATED':
          case 'EVENT_CANCELLED':
            return <Calendar className="h-5 w-5" />;
          default:
            return <Bell className="h-5 w-5" />;
        }
    };

    const { upcomingEvents, pastEvents, friends, notifications } = data;
    console.log('Current notifications:', notifications);

    const NoEventsMessage = ({ type }: { type: 'upcoming' | 'past' }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center p-6"
        >
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2">No {type} events yet</h3>
            <p className="text-gray-400 mb-4">
                {type === 'upcoming'
                    ? "Time to create some exciting plans!"
                    : "Your adventure is just beginning!"}
            </p>
            {type === 'upcoming' && (
                <Link href="/create">
                    <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                            Create an Event <Plus className="ml-2 h-5 w-5" />
                        </span>
                    </button>
                </Link>
            )}
        </motion.div>
    )

    const NoFriendsMessage = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center p-6"
        >
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">No friends added yet</h3>
            <p className="text-gray-400 mb-4">
                Start building your network and create amazing experiences together!
            </p>
            <Link href="/friends">
                <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                        Add Friends <UserPlus className="ml-2 h-5 w-5" />
                    </span>
                </button>
            </Link>
        </motion.div>
    )

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
                    <Button onClick={createTestNotification} className="mb-4">
                        Create Test Notification
                    </Button>
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

                            {/* Notifications Section */}
                            <Card className="flex-shrink-0 bg-gray-900 border-none">
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle className="text-white flex items-center">
                                        <Bell className="mr-2 h-5 w-5" />
                                        Notifications
                                    </CardTitle>
                                    {notifications && notifications.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteNotifications(notifications.map(n => n.id))}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {notifications && notifications.length > 0 ? (
                                        <motion.ul className="space-y-4">
                                            {notifications.map((notification, index) => (
                                                <motion.li
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                    className={`flex items-center p-3 rounded-lg ${
                                                        notification.read ? 'bg-gray-800' : 'bg-gray-700'
                                                    }`}
                                                >
                                                    <div className="mr-3">
                                                        {renderNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="text-sm text-white">{notification.message}</p>
                                                        <p className="text-xs text-gray-400">
                                                            <Clock className="inline mr-1 h-3 w-3" />
                                                            {new Date(notification.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteNotifications([notification.id])}
                                                        className="ml-2"
                                                    >
                                                        Delete
                                                    </Button>
                                                </motion.li>
                                            ))}
                                        </motion.ul>
                                    ) : (
                                        <div className="text-center text-gray-400 py-4">
                                            No new notifications
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
    
                            {/* Upcoming Events Section */}
                            <Card className="flex-grow bg-gray-900 border-none">
                                <CardHeader className='p-0 px-6 pt-6 pb-2'>
                                    <CardTitle className="text-white">Upcoming Events</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar p-0 pt-3 px-6 pb-3">
                                    {upcomingEvents.length > 0 ? (
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
                                    ) : (
                                        <NoEventsMessage type="upcoming" />
                                    )}
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
                                    {friends.length > 0 ? (
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
                                    ) : (
                                        <NoFriendsMessage />
                                    )}
                                </CardContent>
                            </Card>
                            {/* Past Events Section */}
                            <Card className="flex-shrink-0 bg-gray-900 border-none">
                                <CardHeader>
                                    <CardTitle className="text-white">Past Events</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-500px)] overflow-y-auto custom-scrollbar">
                                    {pastEvents.length > 0 ? (
                                        <ul className="space-y-2">
                                            {pastEvents.map((event) => (
                                                <li key={event.id} className="flex justify-between items-center">
                                                    <span className="text-gray-300">{event.title}</span>
                                                    <span className="text-sm text-gray-400">{event.date}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <NoEventsMessage type="past" />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </motion.div>
                <BackgroundBeams className="opacity-100" />
            </div>
            <Toaster />
        </div>
    )
}
export default Dashboard;