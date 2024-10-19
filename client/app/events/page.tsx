'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, UserPlus, Check, X, LogOut, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import Link from 'next/link'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'next/navigation'
import LoadingState from '@/components/LoadingState/LoadingState'

interface Event {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: Friend[];
}

interface Friend {
    username: string;
    avatarUrl: string;
}

interface Invitation extends Event {
    invitedBy: string;
    invitedFriends: string[];
}

interface EventsData {
    upcomingEvents: Event[];
    pastEvents: Event[];
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

const EventsPage: React.FC = () => {
    const router = useRouter();
    const { email } = useAuth();
    const [eventsData, setEventsData] = useState<EventsData>({ upcomingEvents: [], pastEvents: [] });
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (email) {
                setLoading(true);
                setError(null);
                try {
                    const [eventsResponse, invitationsResponse] = await Promise.all([
                        fetch('/api/events', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        }),
                        fetch('/api/invitations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        })
                    ]);

                    if (!eventsResponse.ok || !invitationsResponse.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const [eventsData, invitationsData] = await Promise.all([
                        eventsResponse.json(),
                        invitationsResponse.json()
                    ]);

                    setEventsData(eventsData);
                    setInvitations(invitationsData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setError('Failed to load events and invitations. Please try again later.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [email]);

    const handleInvitation = async (invitationId: string, accept: boolean) => {
        try {
            const response = await fetch('/api/handleInvitation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invitationId, accept, email }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to handle invitation');
            }
    
            const updatedInvitation = await response.json();
            
            setInvitations(prevInvitations =>
                prevInvitations.filter(inv => inv.id !== invitationId)
            );
    
            if (accept && updatedInvitation.id) {
                setEventsData(prevData => ({
                    ...prevData,
                    upcomingEvents: [...prevData.upcomingEvents, updatedInvitation]
                }));
            }
        } catch (err) {
            const error = err as Error; 
            console.error('Failed to handle invitation:', error);
            setError(error.message || 'Failed to process invitation. Please try again.');
        }
    };

    const InvitationList = ({ invitations }: { invitations: Invitation[] }) => (
        <motion.ul className="space-y-4">
            {invitations.map((invitation, index) => (
                <motion.li
                    key={invitation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800 rounded-lg"
                >
                    <div className="mb-4 sm:mb-0">
                        <h3 className="font-semibold text-white">{invitation.title}</h3>
                        <p className="text-sm text-gray-300">
                            <MapPin className="inline mr-1 h-4 w-4" /> {invitation.location}
                        </p>
                        <p className="text-sm text-gray-300">
                            <Calendar className="inline mr-1 h-4 w-4" /> {invitation.date}
                        </p>
                        <p className="text-sm text-gray-300">
                            <UserPlus className="inline mr-1 h-4 w-4" /> Invited by {invitation.invitedBy}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            size="sm"
                            onClick={() => handleInvitation(invitation.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="mr-2 h-4 w-4" /> Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvitation(invitation.id, false)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <X className="mr-2 h-4 w-4" /> Decline
                        </Button>
                    </div>
                </motion.li>
            ))}
        </motion.ul>
    );

    const handleRemoveFromEvent = async (eventId: string) => {
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'removeFromEvent', eventId })
            });

            if (!response.ok) {
                throw new Error('Failed to remove from event');
            }

            setEventsData(prevData => ({
                ...prevData,
                upcomingEvents: prevData.upcomingEvents.filter(event => event.id !== eventId)
            }));
        } catch (error) {
            console.error('Error removing from event:', error);
            setError('Failed to remove from event. Please try again later.');
        }
    };

    const handleDeletePastEvent = async (eventId: string) => {
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'deletePastEvent', eventId })
            });

            if (!response.ok) {
                throw new Error('Failed to delete past event');
            }

            setEventsData(prevData => ({
                ...prevData,
                pastEvents: prevData.pastEvents.filter(event => event.id !== eventId)
            }));
        } catch (error) {
            console.error('Error deleting past event:', error);
            setError('Failed to delete past event. Please try again later.');
        }
    };

    const EventList = ({ events, type }: { events: Event[], type: 'upcoming' | 'past' }) => (
        <motion.ul className="space-y-4">
            {events.map((event, index) => (
                <motion.li
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg transition-transform duration-60"
                >
                    <div className="flex-grow" onClick={() => router.push(`/event?id=${event.id}`)}>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-sm text-gray-300">
                            <MapPin className="inline mr-1 h-4 w-4" /> {event.location}
                        </p>
                        <p className="text-sm text-gray-300">
                            <Calendar className="inline mr-1 h-4 w-4" /> {event.date}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                            {event.friends.map((friend, i) => (
                                <Avatar key={i} className="border-2 border-gray-800">
                                    {friend.avatarUrl ? (
                                        <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                                    ) : (
                                        <AvatarFallback>{friend.username ? friend.username[0] : '?'}</AvatarFallback>
                                    )}
                                </Avatar>
                            ))}
                        </div>
                        {type === 'upcoming' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveFromEvent(event.id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Leave
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePastEvent(event.id)}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        )}
                    </div>
                </motion.li>
            ))}
        </motion.ul>
    );

    const NoEventsMessage = ({ type }: { type: 'upcoming' | 'past' | 'invitations' }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center p-6"
        >
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2">
                {type === 'invitations' ? 'No pending invitations' : `No ${type} events`}
            </h3>
            <p className="text-gray-400 mb-4">
                {type === 'invitations'
                    ? "You're all caught up!"
                    : type === 'upcoming'
                        ? "Time to create some exciting plans!"
                        : "Your adventure is just beginning!"}
            </p>
            {type === 'upcoming' && (
                <Link href="/create">
                    <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                            Create an Event
                        </span>
                    </button>
                </Link>
            )}
        </motion.div>
    );

    

    if (loading) {
        return <LoadingState message="Loading your events..." submessage="Preparing your upcoming and past events" />
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
                    <p className="text-gray-400">{error}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{scrollbarStyles}</style>
            <Navbar notifications={[]} />
            <div className="relative min-h-[90vh] pt-20 lg:pt-10 lg:max-h-[100vh] w-full bg-gray-950 text-white">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-20 max-w-7xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8"
                >
                    <h1 className={cn(
                        "text-4xl font-bold mb-8 text-center",
                        "bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-500 bg-clip-text text-transparent",
                        "animate-text-gradient"
                    )}>
                        Your Events
                    </h1>

                    {invitations.length > 0 && (
                        <Card className="bg-gray-900 border-none mb-8">
                            <CardHeader>
                                <CardTitle className="text-white">Event Invitations</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                                <InvitationList invitations={invitations} />
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="bg-gray-900 border-none">
                            <CardHeader>
                                <CardTitle className="text-white">Upcoming Events</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                                {eventsData.upcomingEvents.length > 0 ? (
                                    <EventList events={eventsData.upcomingEvents} type="upcoming" />
                                ) : (
                                    <NoEventsMessage type="upcoming" />
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-none">
                            <CardHeader>
                                <CardTitle className="text-white">Past Events</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                                {eventsData.pastEvents.length > 0 ? (
                                    <EventList events={eventsData.pastEvents} type="past" />
                                ) : (
                                    <NoEventsMessage type="past" />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
                <BackgroundBeams className="opacity-100" />
            </div>
        </div>
    )
}

export default EventsPage;