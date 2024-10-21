'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Clock, UserPlus, MapPin, Plus, Sparkles, UserMinus, RefreshCcw, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from 'sonner'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import Link from 'next/link'
import { useAuth } from '@/contexts/authContext'
import type { Notification } from '@/types'
import LoadingState from '@/components/LoadingState/LoadingState'

interface Friend {
  username: string;
  avatarUrl?: string;
}

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  friends: (Friend | string)[];
}

type DashboardData = {
  upcomingEvents: Event[];
  pastEvents: Event[];
  friends: (Friend | string)[];
  notifications: Notification[];
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

export default function Component() {
  const { email } = useAuth();
  const [data, setData] = useState<Omit<DashboardData, 'notifications'>>({
    upcomingEvents: [],
    pastEvents: [],
    friends: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email) {
      console.error('Fetching dashboard data for email:', email);
      fetchDashboardData();
      fetchNotifications();
    }
  }, [email]);

  const fetchDashboardData = async () => {
    if (!email) {
      setError('No email available. Please log in.');
      setIsLoading(false);
      return;
    }

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

      const dashboardData = await response.json();
      console.error('Received dashboard data:', dashboardData);
      setData({
        upcomingEvents: dashboardData.upcomingEvents,
        pastEvents: dashboardData.pastEvents,
        friends: dashboardData.friends,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!email) return;
    console.error("Start fetching notification");
    try {
      const response = await fetch(`/api/notifications?userId=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notificationsData = await response.json();
      console.error('Received notifications data:', notificationsData);
      setNotifications(notificationsData);
      console.error("Finished fetching and processing notifications");
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications. Please try again later.');
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

      await fetchNotifications();
      toast.success('Notifications marked as read');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationIds,
          action: 'delete'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      const result = await response.json();
      await fetchNotifications();
      toast.success(`Successfully deleted ${result.deletedCount} notification(s)`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST_ACCEPTED':
      case 'NEW_FRIEND_REQUEST':
        return <UserPlus className="h-5 w-5" />;
      case 'FRIEND_REQUEST_REJECTED':
      case 'FRIEND_REMOVED':
        return <UserMinus className="h-5 w-5" />;
      case 'EVENT_CREATED':
      case 'EVENT_INVITATION_ACCEPTED':
      case 'EVENT_INVITATION_DECLINED':
        return <Calendar className="h-5 w-5" />;
      case 'EVENT_UPDATED':
        return <RefreshCcw className="h-5 w-5" />;
      case 'EVENT_CANCELLED':
        return <X className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'FRIEND_REMOVED':
      case 'FRIEND_REQUEST_REJECTED':
      case 'EVENT_CANCELLED':
        return 'border-l-4 border-red-500';
      case 'FRIEND_REQUEST_ACCEPTED':
      case 'EVENT_INVITATION_ACCEPTED':
        return 'border-l-4 border-green-500';
      case 'NEW_FRIEND_REQUEST':
      case 'EVENT_CREATED':
        return 'border-l-4 border-blue-500';
      case 'EVENT_UPDATED':
        return 'border-l-4 border-yellow-500';
      default:
        return '';
    }
  };

  const renderNotification = (notification: Notification) => (
    <motion.li
      key={notification.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-lg transition-colors hover:bg-opacity-80",
        notification.read ? 'bg-gray-800' : 'bg-gray-700',
        getNotificationStyle(notification.type)
      )}
    >
      <div className="mr-4 bg-gray-600 p-2 rounded-full mb-2 sm:mb-0">
        {notification.sender && notification.sender.avatarUrl ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.sender.avatarUrl} alt={notification.sender.username} />
            <AvatarFallback>{notification.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          renderNotificationIcon(notification.type)
        )}
      </div>
      <div className="flex-grow mb-2 sm:mb-0">
        <p className="text-sm text-white font-medium">{notification.message}</p>
        {notification.sender && (
          <p className="text-xs text-gray-400 mt-1">
            From: {notification.sender.username}
          </p>
        )}
        {notification.event && (
          <p className="text-xs text-gray-400 mt-1">
            Event: {notification.event.name} on {new Date(notification.event.date).toLocaleDateString()}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          <Clock className="inline mr-1 h-3 w-3" />
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex space-x-2 w-full sm:w-auto justify-end">
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markNotificationsAsRead([notification.id])}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Mark as read
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteNotifications([notification.id])}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Delete
        </Button>
      </div>
    </motion.li>
  );

  const NoEventsMessage: React.FC<{ type: 'upcoming' | 'past' }> = ({ type }) => (
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
  );

  const NoFriendsMessage: React.FC = () => (
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
  );

  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." submessage="Preparing your events, friends, and notifications" />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={fetchDashboardData}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    )
  }

  const { upcomingEvents, pastEvents, friends } = data;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Navbar notifications={notifications} />
      <div className="flex-grow overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-20 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8"
        >
          <main className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <div className="lg:flex-grow lg:w-3/4 flex flex-col space-y-8">
              {/* Welcome Message and Start Planning Button */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg">
                <CardContent className="pt-8 pb-6 px-6">
                  <h2 className="text-3xl sm:text-4xl font-bold  mb-4">
                    <span className={cn(
                      "bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                      "animate-text-gradient"
                    )}>
                      Welcome back, User!
                    </span>

                  </h2>
                  <p className="text-gray-300 mb-6 text-base sm:text-lg">Ready to plan your next exciting meetup?</p>
                  <Link href="/create">
                    <motion.button
                      className="group relative inline-flex h-12 sm:h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                      onHoverStart={() => setIsHovered(true)}
                      onHoverEnd={() => setIsHovered(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
                        animate={{
                          rotate: isHovered ? 360 : 0,
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 py-1 text-sm sm:text-base font-medium text-white backdrop-blur-3xl transition-all duration-300 ease-in-out group-hover:bg-slate-900/80">
                        Start Planning
                        <span className="ml-2 inline-block">
                          <Plus className="h-5 w-5" />
                        </span>
                      </span>
                    </motion.button>
                  </Link>
                </CardContent>
              </Card>

              {/* Notifications Section */}
              {notifications.length > 0 &&
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <CardTitle className="text-white flex items-center text-2xl mb-4 sm:mb-0">
                      <Bell className="mr-3 h-6 w-6" />
                      Notifications
                    </CardTitle>
                    {notifications.length > 0 && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationsAsRead(notifications.filter(n => !n.read).map(n => n.id))}
                          className="text-gray-400 hover:text-white transition-colors w-full sm:w-auto"
                        >
                          Mark all as read
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotifications(notifications.map(n => n.id))}
                          className="text-gray-400 hover:text-white transition-colors w-full sm:w-auto"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <motion.ul className="space-y-4">
                        {notifications.map((notification) => renderNotification(notification))}
                      </motion.ul>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg">No new notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              }

              {/* Upcoming Events Section */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg flex-grow">
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
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                        >
                          <div className="mb-2 sm:mb-0">
                            <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                            <p className="text-sm text-gray-300 mt-1">
                              <MapPin className="inline mr-2 h-4 w-4" /> {event.location}
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              <Calendar className="inline mr-2 h-4 w-4" /> {event.date}
                            </p>
                          </div>
                          <div className="flex -space-x-2 mt-2 sm:mt-0">
                            {event.friends.map((friend, i) => {
                              const username = typeof friend === 'string' ? friend : friend.username;
                              const avatarUrl = typeof friend === 'string' ? undefined : friend.avatarUrl;

                              return (
                                <Avatar key={i} className="border-2 border-gray-800">
                                  <AvatarImage
                                    src={avatarUrl}
                                    alt={username}
                                  />
                                  <AvatarFallback>
                                    {username ? username[0].toUpperCase() : '?'}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
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
            <div className="lg:w-1/4 space-y-8 flex flex-col">
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
                      {friends.map((friend, index) => {
                        const username = typeof friend === 'string' ? friend : friend.username;
                        const avatarUrl = typeof friend === 'string' ? undefined : friend.avatarUrl;

                        return (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <Avatar className="h-10 w-10 border-2 border-purple-500/20">
                              <AvatarImage
                                src={avatarUrl || ``}
                                alt={username}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gray-800 text-purple-400">
                                {username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-300 font-medium">
                              {username}
                            </span>
                          </motion.li>
                        );
                      })}
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
    </>
  )
}