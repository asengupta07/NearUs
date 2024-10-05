'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Clock, UserPlus, MapPin, Plus, Sparkles } from 'lucide-react'
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
    display: block;
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [email]);

    const fetchDashboardData = async () => {
      if (email) {
          setIsLoading(true);
          setError(null);
          try {
              const response = await fetch('/api/dashboard', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ email })
              });
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const dashboardData: DashboardData = await response.json();
              setData(dashboardData);
              setIsLoading(false);
          } catch (error) {
              console.error('Failed to fetch dashboard data', error);
              setError('Failed to load dashboard data. Please try again later.');
              setIsLoading(false);
          }
      } else {
          setError('No email available. Please log in.');
          setIsLoading(false);
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

    const renderNotificationIcon = (type: string) => {
        switch (type) {
          case 'FRIEND_REQUEST_ACCEPTED':
          case 'FRIEND_REQUEST_REJECTED':
          case 'NEW_FRIEND_REQUEST':
            return <UserPlus className="h-5 w-5" />;
          case 'EVENT_CREATED':
          case 'EVENT_INVITATION_ACCEPTED':
          case 'EVENT_INVITATION_DECLINED':
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
        <div className='overflow-hidden h-screen flex flex-col'>
          <style>{scrollbarStyles}</style>
          <Navbar notifications={notifications} />
          <div className="flex-grow overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-16 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-20 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8"
            >
              <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-8">
                  {/* Welcome Message and Start Planning Button */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg">
                    <CardContent className="pt-8 pb-6 px-6">
                      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        <span className={cn(
                          "bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                          "animate-text-gradient"
                        )}>
                          Welcome back, User!
                        </span>
                      </h2>
                      <p className="text-gray-300 mb-6 text-base sm:text-lg">Ready to plan your next exciting meetup?</p>
                      <Link href="/create">
                        <button className="relative inline-flex h-12 sm:h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-gray-950 px-4 py-1 text-sm sm:text-base font-medium text-white backdrop-blur-3xl transition-all hover:bg-gray-900">
                            Start Planning <Plus className="ml-2 h-5 w-5" />
                          </span>
                        </button>
                      </Link>
                    </CardContent>
                  </Card>
      
                  {/* Notifications Section */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="text-white flex items-center text-2xl">
                        <Bell className="mr-3 h-6 w-6" />
                        Notifications
                      </CardTitle>
                      {notifications && notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotifications(notifications.map(n => n.id))}
                          className="text-gray-400 hover:text-white transition-colors"
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
                              className={`flex items-center p-4 rounded-lg ${
                                notification.read ? 'bg-gray-800' : 'bg-gray-700'
                              } transition-colors hover:bg-opacity-80`}
                            >
                              <div className="mr-4 bg-gray-600 p-2 rounded-full">
                                {renderNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm text-white font-medium">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  <Clock className="inline mr-1 h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotifications([notification.id])}
                                className="ml-2 text-gray-400 hover:text-white transition-colors"
                              >
                                Delete
                              </Button>
                            </motion.li>
                          ))}
                        </motion.ul>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg">No new notifications</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
      
                  {/* Upcoming Events Section */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg">
                    <CardHeader className='px-6 pt-6 pb-2'>
                      <CardTitle className="text-white text-2xl flex items-center">
                        <Calendar className="mr-3 h-6 w-6" />
                        Upcoming Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-3">
                      {upcomingEvents.length > 0 ? (
                        <motion.ul className="space-y-4">
                          {upcomingEvents.map((event, index) => (
                            <motion.li
                              key={event.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                            >
                              <div>
                                <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                                <p className="text-sm text-gray-300 mt-1">
                                  <MapPin className="inline mr-2 h-4 w-4" /> {event.location}
                                </p>
                                <p className="text-sm text-gray-300 mt-1">
                                  <Calendar className="inline mr-2 h-4 w-4" /> {event.date}
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
                <div className="space-y-8 lg:h-full flex flex-col">
                  {/* Friends List */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg flex-grow">
                    <CardHeader>
                      <CardTitle className="text-white text-2xl flex items-center">
                        <UserPlus className="mr-3 h-6 w-6" />
                        Friends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(50vh-200px)] lg:h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
                      {friends.length > 0 ? (
                        <ul className="space-y-3">
                          {friends.map((friend, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <Avatar>
                                <AvatarFallback>{friend[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-gray-300 font-medium">{friend}</span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <NoFriendsMessage />
                      )}
                    </CardContent>
                  </Card>
                  {/* Past Events Section */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg flex-grow">
                    <CardHeader>
                      <CardTitle className="text-white text-2xl flex items-center">
                        <Sparkles className="mr-3 h-6 w-6" />
                        Past Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(50vh-200px)] lg:h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
                      {pastEvents.length > 0 ? (
                        <ul className="space-y-3">
                          {pastEvents.map((event) => (
                            <li key={event.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800 transition-colors">
                              <span className="text-gray-300 font-medium">{event.title}</span>
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