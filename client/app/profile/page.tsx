'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, Camera, MapPin, Mail, User, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from "@/lib/utils"
import Navbar from '@/components/function/Nav'
import { useAuth } from '@/contexts/authContext'

interface Profile {
    username: string;
    email: string;
    bio: string;
    location: string;
    avatarUrl: string;
    friendCount: number;
}

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const { email } = useAuth()

    useEffect(() => {
        if (email) {
            fetchProfile()
        }
    }, [email])

    const fetchProfile = async () => {
        try {
            console.log('Fetching profile for email:', email) // Log 1
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            if (!response.ok) throw new Error('Failed to fetch profile')
            const data = await response.json()
            console.log('Fetched profile data:', data) // Log 2
            setProfile(data)
            setEditedProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const handleSaveProfile = async () => {
        if (!editedProfile) return;
        setIsSaving(true);
        
        try {
            console.log('Saving profile:', editedProfile) // Log 3
            const updatedProfile = { ...editedProfile };
            if (updatedProfile.location) {
                // Ensure location is in "longitude,latitude" format
                const [lat, lon] = updatedProfile.location.split(',').map(n => n.trim());
                updatedProfile.location = `${lon},${lat}`;
            }
    
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProfile)
            });
    
            if (!response.ok) throw new Error('Failed to update profile');
            
            const data = await response.json();
            console.log('Saved profile data:', data) // Log 4
            setProfile(data);
            setEditedProfile(data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !email) return;
    
        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('email', email);
    
        try {
            console.log('Uploading avatar for email:', email) // Log 5
            const response = await fetch('/api/profile', {
                method: 'POST',
                body: formData,
            });
    
            if (!response.ok) throw new Error('Failed to upload avatar');
    
            const data = await response.json();
            console.log('Uploaded avatar data:', data) // Log 6
            setProfile(prev => {
                const updated = prev ? { ...prev, avatarUrl: data.avatarUrl } : null;
                console.log('Updated profile after avatar upload:', updated) // Log 7
                return updated;
            });
            setEditedProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    useEffect(() => {
        console.log('Current profile state:', profile) // Log 8
    }, [profile])

    if (!profile) return null

    return (
        <>
            <Navbar notifications={[]} />
            <div className="relative min-h-screen pt-8 w-full overflow-hidden bg-gray-950 text-white">
                <div className="relative z-20 max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className={cn(
                                "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent",
                                "animate-text-gradient"
                            )}>
                                Your Profile
                            </span>
                        </h1>
                        <p className="text-gray-400">View and edit your profile information</p>
                    </header>

                    <Card className="border-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Profile Information</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => {
                                                console.log('Button clicked. isEditing:', isEditing) // Log 9
                                                isEditing ? handleSaveProfile() : setIsEditing(true)
                                            }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : isEditing ? (
                                                <Save className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Edit2 className="mr-2 h-4 w-4" />
                                            )}
                                            {isEditing ? 'Save Changes' : 'Edit Profile'}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{isEditing ? 'Save your changes' : 'Edit your profile'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative">
                                        <Avatar className="w-32 h-32">
                                            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                                            <AvatarFallback>{profile.username[0]}</AvatarFallback>
                                        </Avatar>
                                        {isEditing && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <label className="absolute bottom-0 right-0 p-2 bg-purple-500 rounded-full cursor-pointer hover:bg-purple-600 transition-colors">
                                                            {isUploading ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <Camera className="h-5 w-5" />
                                                            )}
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleUploadAvatar}
                                                                disabled={isUploading}
                                                            />
                                                        </label>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Upload new avatar</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold">{profile.username}</h2>
                                        <p className="text-gray-400">{profile.friendCount} Friends</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="username" className="text-sm font-medium">
                                            <User className="inline-block mr-2 h-4 w-4" />
                                            Username
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="username"
                                                value={editedProfile?.username}
                                                onChange={(e) => {
                                                    console.log('Username changed:', e.target.value) // Log 10
                                                    setEditedProfile(prev => prev ? {...prev, username: e.target.value} : null)
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-400">{profile.username}</p>
                                        )}
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            <Mail className="inline-block mr-2 h-4 w-4" />
                                            Email
                                        </Label>
                                        <p className="text-sm text-gray-400">{profile.email}</p>
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="bio" className="text-sm font-medium">
                                            About Me
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="bio"
                                                value={editedProfile?.bio}
                                                onChange={(e) => {
                                                    console.log('Bio changed:', e.target.value) // Log 11
                                                    setEditedProfile(prev => prev ? {...prev, bio: e.target.value} : null)
                                                }}
                                                className="min-h-[100px]"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-400">{profile.bio || 'No bio added yet'}</p>
                                        )}
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="location" className="text-sm font-medium">
                                            <MapPin className="inline-block mr-2 h-4 w-4" />
                                            Location
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="location"
                                                value={editedProfile?.location}
                                                onChange={(e) => {
                                                    console.log('Location changed:', e.target.value) // Log 12
                                                    setEditedProfile(prev => prev ? {...prev, location: e.target.value} : null)
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-400">{profile.location || 'No location added'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <BackgroundBeams className="opacity-100" />
            </div>
        </>
    )
}